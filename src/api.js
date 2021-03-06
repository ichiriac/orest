
const Entity = require('./entity');
const Endpoint = require('./endpoint');
const Response = require('./response');
const utils = require('./utils');
const Error = require('./error');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');

const DICO = 'ABCDEFGHIJKLMNOPQRTUVWXYZabcdefhijklmnopqrstuvwxyz0123456789-_~%$!';
const DICO_SIZE = DICO.length;

function randomString(size) {
    let buffer = crypto.randomBytes(size);
    let result = '';
    for(let i = 0; i < size; i++) {
        result += DICO[buffer[i] % DICO_SIZE];
    }
    return result;
}

/**
 * The API instance
 */
class Api {

    /**
     * Initialize
     */
    constructor(secret, redis) {
        this._entities = {};
        this._endpoints = {};
        this._redis = redis;
        this._secret = secret;
        this.error = Error;
    }

    /**
     * Gets an entity
     * @param {*} model 
     */
    entity(model) {
        let name = utils.plural(model).toLowerCase();
        if (!this._entities[name]) {
            this._entities[name] = new Entity(this, model, name);
        }
        return this._entities[name];
    }


    /**
     * Generating an help entry
     * @param {*} meta 
     * @param {*} version 
     */
    help(meta, version = 1) {
        let structure = {
            entities: {},
            actions: {}
        };
        // express entities
        for(let k in this._entities) {
            let entity = this._entities[k];
            let name = entity.name;
            structure.entities[name] = {
                description: null,
                model: {},
                entity: {}
            };
            let list = entity.endpoints.list();
            if (list.has('get', version)) {
                structure.entities[name].model['get'] = {
                    method: 'GET',
                    path: '/v' + version + '/' + list.name,
                    description: 'Retrieves a list of ' + entity.model.name,
                    protected: list._auth,
                    query: {
                        limit: 'Size of resulset (Default: 10, Maximum: 200)',
                        offset: 'Position from where to start (Default: 0, Maximum: 1000)',
                    }
                };
            }
            // @todo
            let details = entity.endpoints.entity();
        }
        
        structure = utils.deepMerge(structure, meta);
        return this.endpoint('help').get((req, res) => {
            Response.send(req, res, structure);
        }, version);
    }

    /**
     * Generates the client
     */
    client(structure, version = 1) {
        if (!structure) {
            structure = {};
        }
        structure.version = version;
        if (!structure.url) {
            throw new Error('The `url` must be defined in order to route requests to the API');
        }
        if (!structure.name) {
            throw new Error('The `name` of the API must be defined');
        }

        const path = __dirname + '/../client/';
        let script = fs.readFileSync(path + 'api.js').toString();
        script = script.replace('{ /* @options */ }', JSON.stringify(structure, null, 2));
        let includes = [];
        ['error.js', 'endpoint.js', 'router.js', 'model.js', 'entity.js'].forEach(function(filename) {
            includes.push(
                fs.readFileSync(path + filename).toString()
            );
        });
        script = script.replace('/* @files */', includes.join("\n"));
        return this.endpoint('client.js').get((req, res) => {
            res.header('content-type', 'application/javascript');
            res.send(script);
        }, version);
    }

    /**
     * Gets an endpoint
     * @param {*} name 
     */
    endpoint(name) {
        if (name[0] === '/') {
            name = name.substring(1);
        }
        if (!this._endpoints[name]) {
            this._endpoints[name] = new Endpoint(this, name);
        }
        return this._endpoints[name];
    }

    /**
     * Registers as a server
     * @param {*} server 
     */
    register(server) {
        for(let k in this._endpoints) {
            this._endpoints[k].register(server);
        }
        // endpoint not found
        server.use(function(req, res, next) {
            Response.send(req, res, new Error.BadFormat(
                'Bad route - no endpoint found', 7420
            ));
        });
        // endpoint error
        server.use(function(err, req, res, next) {
            console.error(err);
            Response.send(req, res, new Error.Internal(
                'Internal server error', 7520, err
            ));
        });
        return this;
    }

    /**
     * Sens the response
     * @param {*} req 
     * @param {*} res 
     * @param {*} data 
     */
    respond(req, res, data) {
        return Response.send(req, res, data);
    }

    /**
     * Grants the specified data as a JWT
     * @param {*} data 
     * @param {*} req 
     * @param {*} res 
     */
    token(data, req, res) {
        const tokenId = randomString(12);
        jwt.sign(
            data, 
            this._secret,
            {
                algorithm: 'HS512',
                expiresIn: '1h',
                issuer: req.hostname,
                jwtid: tokenId
            },
            (err, token) => {
                if (err) {
                    console.error('JWT Error', err);
                    return Response.send(req, res, new Error.Internal('JWT Error', 7500, err));
                }
                console.log(tokenId + ' => ' + token);
                client.set(tokenId, JSON.stringify({
                    ip: req.ip,
                    browser: req.headers['user-agent'],
                    data: data
                }), 'EX', 3600, (err, ok) => {
                    if (err) {
                        console.error('Redis error', err);
                    }
                    Response.send(req, res, { token });    
                });
            }
        );
    }

    /**
     * Check the auth state
     * @param {*} req 
     * @param {*} res 
     */
    auth(req, res) {
        if (req.jwt) {
            return Promise.resolve(req.jwt);
        }
        if (!req.headers.authorization) {
            throw new Error.Forbidden(
                'Missing authorization header', 7410
            );
        }
        if (req.headers.authorization.substring(0, 7) != 'Bearer ') {
            throw new Error.BadFormat(
                'Bad authorization header, expecting a "Bearer" token', 7411
            );
        }
        // reading the token
        let token = null;
        try {
            token = jwt.verify(
                req.headers.authorization.substring(7),
                this._secret,
                {
                    algorithm: 'HS512',
                    issuer: req.hostname,
                    algorithms: ['HS512']
                }
            );
        } catch(err) {
            throw new Error.Unauthorized(
                'Bad authorization token', 7411, err
            );
        }
        return new Promise((done, reject) => {
            // getting its informations
            this._redis.get(token.jti, (err, json) => {
                if (err) {
                    token.checked = false;
                } else if (json === null) {
                    return reject(
                        new Error.Unauthorized(
                            'Authorization token no longer valid', 7412
                        )
                    );
                } else {
                    // checking the token source
                    let session = JSON.parse(json);
                    if (session.ip && session.ip !== req.ip) {
                        return reject(
                            new Error.Unauthorized(
                                'Authorization token no longer valid', 7413
                            )
                        );
                    }
                    // checking the token browser
                    if (session.browser && session.browser !== req.headers['user-agent']) {
                        return reject(
                            new Error.Unauthorized(
                                'Authorization token no longer valid', 7414
                            )
                        );
                    }
                    if (session.data) {
                        token = Object.assign(token, session.data);
                    }
                    token.checked = true;
                }

                // assign token values
                req.jwt = token;
                
                // define a destroy helper
                req.jwt.destroy = () => {
                    return new Promise((done, reject) => {
                        this._redis.del(token.jti, (err, ok) => {
                            if (err) {
                                return reject(err);
                            }
                            done(ok);
                        });
                    });
                };

                done(req.jwt);
            });
        });
    }
}

module.exports = Api;

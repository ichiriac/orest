
const Entity = require('./entity');
const Endpoint = require('./endpoint');
const Response = require('./response');
const utils = require('./utils');
const Error = require('./error');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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
            this._redis.get(
                token.jti,
                function(err, json) {
                    if (err) {
                        console.error('Redis Error', err);
                    } else if (json === null) {
                        return reject(
                            new Error.Unauthorized(
                                'Authorization token no longer valid', 7412
                            )
                        );
                    }
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

                    // assign token values
                    req.jwt = token;
                    if (session.data) {
                        Object.assign(req.jwt, session.data);
                    }
                    
                    done(token);
                }
            );
        });
    }
}

module.exports = Api;

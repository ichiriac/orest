
const Entity = require('./entity');
const Endpoint = require('./endpoint');
const Response = require('./response');
const utils = require('./utils');

/**
 * The API instance
 */
class Api {

    /**
     * Initialize
     */
    constructor() {
        this._entities = {};
        this._endpoints = {};
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
     * Decorate function with auth
     * @param {*} cb 
     */
    requireAuth(cb) {
        return function(req, res) {
            cb(req, res);
        };
    }
}

module.exports = Api;

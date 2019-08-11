const Router = require('./router');
const Response = require('./response');

/**
 * Entity glue layer
 */
class Entity {

    /**
     * Entity manager
     * @param {*} api 
     * @param {*} model 
     * @param {*} name 
     */
    constructor(api, model, name) {
        this.api = api;
        this.model = model;
        if (!name) {
            name = model.name;
            if (name.substring(name.length - 1) != 's') {
                name += 's';
            }
        }
        this.name = name;
        this.endpoints = new Router(api, name);
        this._version = 1;
        this._filters = [];
    }

    /**
     * Defines a named filter, it can be used to pre-filter on specific search
     * or used on a route
     * 
     * Example :
     * 
     * actors.filter('by-category-:category', ...);
     * 
     * Can be used directly on a route :
     * /v1/actors/by-category-drama
     * 
     * Or can be used with filters :
     * /v1/actors?filters=by-categoy-drama&$name=like:%john%
     * 
     * @param {*} name 
     * @param {*} cb 
     */
    filter(name, cb) {
        // @todo : implement it
        this._filters[name] = cb;
        return this;
    }

    /**
     * Defines the working version, use it before defining routes.
     * 
     * Example :
     * 
     * actors.version(1);
     * actors.create(...);
     * actors.update(...);
     * 
     * actors.version(2);
     * actors.create(...);
     * actors.update(...);
     * 
     * @param {*} version 
     */
    version(version) {
        this._version = version;
        return this;
    }

    /**
     * Requires a listing
     * @param {*} cb 
     */
    list(cb) {
        this.endpoints.list().get(() => {

        }, this.version);
    }

    /**
     * Requires a create statement
     */
    create() {

    }

    /**
     * Handles the reading of a single entity.
     * 
     * Examples :
     * 
     * // enables the default behavior
     * actors.read(true);
     * 
     * // disables the reading of the entity
     * actors.read(false);
     * 
     * // customise entity retrieval or informations
     * actors.read(function(req, res, entity) {
     *   // ...
     *   return entity;
     * });
     * 
     * // defines a relation listing
     * actors.read('/films', function(req, res, entity, filter) {
     *   // ... url : /v1/actors/123/films
     *   return filter.list();
     * });
     * 
     * @param {*} relation 
     * @param {*} cb 
     */
    read(relation, cb) {
        if (typeof relation === 'function') {
            cb = relation;
            cb = null;
        }
        let route;
        if (relation) {
            route = this.endpoints.relation(relation);
        } else {
            route = this.endpoints.entity();
        }
        if (cb === false) {
            // disable this
            route.get(false, this.version);
        } else {
            // retrieve informations
            return route.get((req, res) => {
                let filter = Filter.entity(this.model, req, res);
                filter.read().then((entity) => {
                    if (!entity) {
                        
                    }
                });
                let entityId = req.params.id;
                this.model.findByPk()
                Response.send(req, res, entity);
            }, this.version);    
        }
        return this;
    }
    /**
     * 
     */
    update() {

    }
    /**
     * Handles a delete action
     */
    delete() {

    }

    /**
     * Handles a bulk update
     */
    bulkUpdate() {

    }

    /**
     * Handles a bulk delete
     */
    bulkDelete() {

    }
}

module.exports = Entity;
const Router = require('./router');
const Response = require('./response');
const Filter = require('./filter');
const Error = require('./error');

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
        this._search = null;
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
        this._filters[name] = this.endpoints.list('/' + name).get(() => {
            // @todo
        }, this._version);
        return this._filters[name];
    }

    /**
     * Enabling the search function
     * @param {*} columns 
     */
    search(columns) {
        this._search = columns;
        return this.endpoints.list('/search').get(() => {
            // @todo
        }, this._version);
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
        let route = this.endpoints.list();
        if (cb === false) {
            return route.get(false, this._version);
        }
        return route.get((req, res) => {
            let filter = Filter.list(this.model, req, res);
            filter.find().then(function(records) {
                // pre-hook
                if (typeof cb === 'function') {
                    let result = cb(req, res, records);
                    if (result) {
                        records = result;
                    }    
                }
                Response.send(req, res, records);
            }).catch(function(err) {
                if (!(err instanceof Error)) {
                    // unwrapped error, show it on console as a warning
                    console.error(err);
                    // wrap the error into an http message
                    err = new Error.Internal("Unable to list entities", 3520, err);
                }
                // respond the error
                Response.send(req, res, err);
            });
        }, this._version);
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
        if (arguments.length === 1) {
            cb = relation;
            relation = null;
        }
        let route;
        if (relation) {
            route = this.endpoints.relation(relation);
        } else {
            route = this.endpoints.entity();
        }
        if (cb === false) {
            // disable the route
            return route.get(false, this.version);
        }
        // retrieve entity informations
        return route.get((req, res) => {
            let filter = Filter.entity(this.model, req, res);
            filter.read().then((entity) => {
                if (!entity) {
                    // 404 : not found
                    throw new Error.NotFound(
                        'Entity not found', 3410
                    );
                }
                // pre-hook
                if (typeof cb === 'function') {
                    let result = cb(req, res, entity);
                    if (result) {
                        entity = result;
                    }    
                }
                Response.send(req, res, entity);
            }).catch(function(err) {
                if (!(err instanceof Error)) {
                    // unwrapped error, show it on console as a warning
                    console.error(err);
                    // wrap the error into an http message
                    err = new Error.Internal("Unable to retrieve entity", 3510, err);
                }
                // respond the error
                Response.send(req, res, err);
            });
        }, this._version);
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
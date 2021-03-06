const Error = require('./error');
const Response = require('./response');

/**
 * Endpoint abstraction layer (routing)
 */
class Endpoint {

    /**
     * Defines an endpoint with multiple versions and verbs
     * @param {*} api 
     * @param {*} name 
     */
    constructor(api, name) {
        this.api = api;
        this.name = name;
        this._method = {};
        this._auth = false;
    }

    /**
     * Sets the default auth flag
     * @param {*} flag 
     */
    auth(flag = true) {
        this._auth = flag;
        return this;
    }

    /**
     * Check if the specified verb is defined
     * @param {*} verb 
     */
    has(verb, version = 1) {
        if (this._method.hasOwnProperty(verb)) {
            return this._method[verb].hasOwnProperty(version);
        }
        return false;
    }

    /**
     * Helper for GET - used to read informations
     */
    get(cb, version = 1) {
        return this.method('get', cb, version);
    }
    /**
     * Helper for POST - used to create entities, or process an action
     */
    post(cb, version = 1) {
        return this.method('post', cb, version);
    }
    /**
     * Helper for PUT - used to update an entity (or many in bulk actions)
     */
    put(cb, version = 1) {
        return this.method('put', cb, version);
    }
    /**
     * Helper for DELETE - used to delete an entity (or many in bulk actions)
     */
    delete(cb, version = 1) {
        return this.method('delete', cb, version);
    }

    /**
     * Registers a route with the specified verb method
     * @param {*} verb 
     * @param {*} cb 
     * @param {*} version 
     * @returns Action
     */
    method(verb, cb, version = 1) {
        if (!this._method[verb]) {
            this._method[verb] = {};
        }
        if (typeof version !== 'number') { 
            throw new Error(
                'Bad version number'
            );
        }
        if (cb === false) {
            delete this._method[verb][version];
            return null;
        }
        let action = new Action(this, this._auth, verb, version, cb);
        this._method[verb][version] = action;
        return action;
    }

    /**
     * Registers each route on the server
     * @param {*} server 
     * @returns Endpoint
     */
    register(server) {
        for(let verb in this._method) {
            let entries = this._method[verb];
            for(let version in entries) {
                entries[version].register(server);
            }
        }
        return this;
    }
}

const emailRegex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
const validators = {
    string: function(value) {
        return typeof value === 'string';
    },
    email: function(value) {
        return emailRegex.test(value);
    },
    number: function(value) {
        if (typeof value === 'string') {
            value = Number.parseInt(value, 10);
        }
        return typeof value === 'number' && !isNaN(value);
    }
}

/**
 * Action class
 */
class Action {
    /**
     * Constructs an action class
     * @param {*} endpoint 
     * @param {*} auth 
     * @param {*} method 
     * @param {*} version 
     * @param {*} cb 
     */
    constructor(endpoint, auth, method, version, cb) {
        this.endpoint = endpoint;
        this.auth = auth;
        this.method = method;
        this.version = version;
        this.cb = cb;
        this.description = null;
        this.params = {};
    }
    /**
     * Sets a description
     * @param {*} details 
     */
    describe(details)  {
        this.description = details;
        return this;
    }
    /**
     * Describe a parameter
     * @param {*} name 
     * @param {*} type 
     * @param {*} description 
     * @param {*} mandatory 
     */
    param(options) {
        this.params[options.name] = options;
        return this;
    }
    /**
     * Retrieves the routing callback
     */    
    callback() {
        // process the action
        let process = (req, res) => {
            // checking parameters
            if (this.params) {
                for(let n in this.params) {
                    let option = this.params[n];
                    if (req.body.hasOwnProperty(n)) {
                        let value = req.body[n];
                        if (validators[option.type]) {
                            if (!validators[options.type](value)) {
                                throw new api.error.BadArgument(
                                    'Bad "' + n + '" format, expecting ' + options.type
                                );
                            }
                        }
                        if (typeof option.validate === 'function') {
                            try {
                                if (options.validate(value, n) === false) {
                                    throw new Error('Bad validation format');
                                }
                            } catch(e) {
                                throw new api.error.BadArgument(
                                    'Bad "' + n + '" format', e
                                );
                            }
                        }
                    } else if (option.required) {
                        throw new api.error.BadArgument(
                            'Missing "' + n + '"' + (option.description ? ': ' + option.description : '')
                        );
                    }

                }
            }
            // processing callback
            if (typeof this.cb === 'function') {
                try {
                    return this.cb(req, res);
                } catch(err) {
                    if (!(err instanceof Error)) {
                        // unwrapped error, show it on console as a warning
                        console.error(err);
                        // wrap the error into an http message
                        err = new Error.Internal(err.message, 4500, err);
                    }
                    return err;
                }
            }
        }
        // wrapper
        return (req, res) => {
            let job;
            try {
                if (this.auth) {
                    job = this.endpoint.api.auth(req, res).then(() => {
                        return process(req, res);
                    });
                } else {
                    job = process(req, res);
                }    
            } catch(err) {
                if (!(err instanceof Error)) {
                    // unwrapped error, show it on console as a warning
                    console.error(err);
                    // wrap the error into an http message
                    err = new Error.Internal(err.message, 4500, err);
                }
                job = err;
            }
            // request not finished, process the result
            if (!res.finished) {
                if (job === undefined) {
                    // awaits to respond
                    setTimeout(() => {
                        // response timeout
                        if (!res.finished) {
                            console.error(
                                'Response timeout - ' + req.url
                            );
                            Response.send(req, res, null);
                        }
                    }, 2000);
                    return;
                }
                // resolves a promise
                if (typeof job.then === 'function') {
                    return job.then(function(data) {
                        Response.send(req, res, data);
                    }).catch(function(err) {
                        if (!(err instanceof Error)) {
                            // unwrapped error, show it on console as a warning
                            console.error(err);
                            // wrap the error into an http message
                            err = new Error.Internal(err.message, 4500, err);
                        }
                        Response.send(req, res, err);
                    });
                }
                // sends more data
                Response.send(req, res, job);
            }            
        }
    }
    /**
     * Registers the route
     * @param {*} server 
     */
    register(server) {
        let path = '/v' + this.version + '/' + this.endpoint.name;
        let cb = this.callback();
        let route = server[this.method].bind(server);
        if (typeof route !== 'function') {
            throw new Error('Bad routing method "' + this.method + '"');
        }
        route.apply(server, [path + '.:format', cb]);
        route.apply(server, [path, cb]);
    }
}

module.exports = Endpoint;
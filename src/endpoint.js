/**
 * Endpoint abstraction layer (routing)
 */
class Endpoint {
    constructor(api, name) {
        this.api = api;
        this.name = name;
        this._method = {};
        this._auth = false;
    }
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
    get(cb, version = 1) {
        return this.method('get', cb, version);
    }
    post(cb, version = 1) {
        return this.method('post', cb, version);
    }
    put(cb, version = 1) {
        return this.method('put', cb, version);
    }
    delete(cb, version = 1) {
        return this.method('delete', cb, version);
    }
    method(verb, cb, version = 1) {
        if (!this._method[verb]) {
            this._method[verb] = {};
        }
        if (Array.isArray(version)) { 
            version.forEach((v) => {
                this._method[verb][v] = cb;
            });
        } else {
            this._method[verb][version] = cb;
        }
        return this;
    }
    register(server) {
        for(let verb in this._method) {
            let entries = this._method[verb];
            for(let version in entries) {
                let path = '/v' + version + '/' + this.name;
                let cb = entries[version];
                if (this._auth) {
                    cb = this.api.requireAuth(cb);
                }
                server[verb](path, cb);
                server[verb](path + '.:format', cb);
            }
        }
        return this;
    }
}

module.exports = Endpoint;
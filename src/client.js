(function(w, o) {
    /**
     * Defines the token
     * @param {*} url 
     * @param {*} token 
     */
    var api = function(token) {
        let url = o.url;
        if (!url) {
            url = document.location.origin;
        }
        url += '/v' + o.version + '/';
        // defines the main communication 
        api.fetch = function(endpoint, opt)  {
            let uri = url + endpoint;
            if (!opt) {
                opt = {};
            }
            if (!opt.method) {
                opt.method = 'GET';
            }
            if (!opt.method) {
                opt.method = 'GET';
            }
            if (opt.auth) {
                if (!opt.headers) {
                    opt.headers = new Headers();
                }
                opt.headers.append('Authorization', 'Bearer ' + token);
                delete opt.auth;
            }
            if (opt.body) {
                if (opt.method === 'GET') {
                    opt.query = Object.assign(opt.query, opt.body);
                    delete opt.body;
                } else {
                    opt.body = JSON.stringify(opt.body);
                    if (!opt.headers) {
                        opt.headers = new Headers();
                    }
                    opt.headers.set('Content-type', 'application/json');
                }
            }
            if (opt.query) {
                uri += '?';
                for(let k in opt.query) {
                    uri += encodeURIComponent(k) + '=' + encodeURIComponent(opt.query[k]) + '&';
                }
                delete opt.query;
            }
            return new Promise(function(done, reject) {
                fetch(uri, opt).then(function(response) {
                    response.json().then(function(result)  {
                        if (response.ok) {
                            done(result.data);
                        } else {
                            reject(result.error);
                        }
                    });
                }).catch(reject);
            });            
        };
    };

    api.prototype.model = function(name) {
        if (!this._models[name]) {
            this._models[name] = new model(this, name);
        }
        return this._models[name];
    };
    
    /**
     * Defines a model
     * @param {*} api 
     * @param {*} name 
     * @param {*} endpoints 
     */
    var model = function(api, name) {
        this.api = api;
        this.name = name;
    };
    model.prototype.list = function(filter) {
        this.api.fetch(this.name, {
            auth: trie
        })
    };

    /**
     * 
     * @param {*} model 
     * @param {*} data 
     */
    var entity = function(model, data) {

    };

    entity.prototype.save = function() {

    };

    entity.prototype.delete = function() {

    };

    w[o.name] = api;
})(window, {
    name: '<name>',
    url: '<name>',
    version: '<version>',
    auth: {
        login: '<login>',
        logout: '<logout>',
        refresh: '<refresh>'
    },
    models: {},
    endpoints: {}
});

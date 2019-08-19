(function(w, o) {
    /**
     * Defines the token
     * @param {*} url 
     * @param {*} token 
     */
    var api = function(token) {
        var url = o.url;
        if (!url) {
            url = document.location.origin;
        }
        url += '/v' + o.version;
        var token = null;
        /**
         * Defines the request endpoint
         */
        this.fetch = function(endpoint, opt)  {
            var uri;
            if (endpoint[0] != '/') {
                uri = url + '/' + endpoint;
            } else {
                uri = url + endpoint;
            }
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
        /**
         * Defines the login helper
         */
        this.login = function(username, password) {
            if (!o.login) {
                return Promise.reject(
                    new Error('Login action is not supported')
                );
            }
            return this.fetch(o.login, {
                method: 'POST',
                body: {
                    username: username,
                    password: password
                }
            }).then(function(auth) {
                this.setAuth(auth);
                return auth;
            }.bind(this));
        };

        /**
         * Sets the authentification token
         */
        this.setAuth = function(auth) {
            token = auth.token;
            console.log(auth);
        };

        /**
         * Checks if the authentification is defined
         */
        this.isAuth = function() {
            return token != null;
        };

        /**
         * Kills current session
         */
        this.logout = function() {
            if (!o.logout) {
                return Promise.reject(
                    new Error('Logout action is not supported')
                );
            }
            return this.fetch(o.logout, {
                method: 'DELETE',
                auth: true
            }).then(function(auth) {
                this.setAuth(null);
            }.bind(this));
        };

        /**
         * Renews the current token
         */
        this.refreshToken = function() {
            if (!o.refresh) {
                return Promise.reject(
                    new Error('Refresh action is not supported')
                );
            }

        };
    };

    api.prototype.model = function(name) {
        if (!this._models[name]) {
            this._models[name] = new model(this, name);
        }
        return this._models[name];
    };
    

    /* @files */

    w[o.name] = api;
})(window, { /* @options */ });

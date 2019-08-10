const Router = require('./router');
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
    }

    list(cb, version = 1) {
        this.endpoints.list().get(() => {

        });
    }

}

module.exports = Entity;
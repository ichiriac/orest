
/**
 * 
 */
class Router {
    constructor(api, name) {
        this.api = api;
        this.name = name;
    }
    list() {
        return this.api.endpoint(this.name);
    }
    entity() {
        return this.api.endpoint(this.name + '/:id');
    }
    relation(field) {
        return this.api.endpoint(this.name + '/:id/' + field);
    }
}

module.exports = Router;

/**
 * Defines the way an entity can route its URLS
 */
class Router {
    constructor(api, name) {
        this.api = api;
        this.name = name;
    }
    list(folder) {
        if (!folder) {
            folder = this.name;
        } else {
            folder = this.name + folder;
        }
        return this.api.endpoint(folder);
    }
    entity() {
        return this.list('/:id');
    }
    relation(field) {
        return this.list('/:id/' + field);
    }
}

module.exports = Router;

/**
 * Defines the way an entity can route its URLS
 */
class Router {
    constructor(entity, name) {
        this._entity = entity;
        this.api = entity.api;
        this.name = name;
    }
    list(folder) {
        if (!folder) {
            folder = this.name;
        } else {
            folder = this.name + folder;
        }
        let ep = this.api.endpoint(folder);
        ep.auth(this._entity._auth);
        return ep;
    }
    entity() {
        return this.list('/:id');
    }
    relation(field) {
        return this.list('/:id/' + field);
    }
}

module.exports = Router;
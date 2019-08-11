module.exports = function(api, db) {
    const model = db.model('Actor');
    const films = db.model('Film');
    const actors = api.entity(model);

    // handles the listing
    actors.list(function(req, res, filter) {
        return model.findAll(filter);
    });
    // or for default : actors.list(true);

    // enables the search options
    actors.search(['first_name', 'last_name']);

    /**
     * Most films
     */
    actors.filter('most-films', function() {

    }).describe('Authors ordered by count of films');

    /**
     * Filter by films categories
     */
    actors.filter('with-category-:category', function() {

    }).describe('Authors that played on the specified film category');

    /**
     * List authors by sales
     */
    actors.filter('bankable', function() {

    }).describe('Authors ordered by number of generated rentals');

    // crud actions
    actors.create(true);
    actors.read(true);
    actors.update(true);
    actors.delete(true);
    // alias : actors.crud(true);

    actors.bulkUpdate(true);
    actors.bulkDelete(function(req, res, filter) {
        return model.deleteAll(filter);
    });
    // alias : actors.bulk(true);

    // relations
    actors.read('/films', function(req, res, item) {
        return films.findAll(filter);
    });

};
module.exports = function(api, db) {
  const model = db.model('Film');
  const films = api.entity(model);
  films.auth();
  films.list(true);
  films.crud(true);
  films.bulk(true);
};
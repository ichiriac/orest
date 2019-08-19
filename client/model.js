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


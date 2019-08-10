const express = require('express');
const Api = require('../index');
const Sakila = require('./sakila/index');
const fs = require('fs');

// initialize the database
Sakila().then(function(db) {

    // init the server
    const app = express();
    const api = new Api();

    // Register controllers
    const path = __dirname + '/sakila/controllers';
    fs.readdirSync(path).forEach(function(file) {
        require(path + '/' + file)(api, db);
    });

    // Provides some help
    api.help({
        info: {
            title: 'OREST demo API based on Sakila dataset',
            version: '1.0.0',
            contact: {
                name: 'Support',
                url: 'https://help.domain.com/',
                email: 'support@domain.com'
            }
        },
        servers: [{
            url: 'https://api.domain.com/v1',
            description: 'Production Server'
        }]
    });

    // binds API routes to Express
    api.register(app);

    // starts the server
    app.listen(3000, function () {
        console.log('The api is listening on port 3000 !');
    });
  
});
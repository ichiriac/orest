const express = require('express');
const bodyParser = require('body-parser');
const Api = require('../index');
const Sakila = require('./sakila/index');
const fs = require('fs');
const redis = require('redis');

// initialize the database
Sakila().then(function(db) {

    // init the server
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded());
    
    const api = new Api(
        'CHANGE ME : this is a long secret for signing JWT',
        client = redis.createClient({
            enable_offline_queue: false,
            retry_strategy: function(state) {
                console.log('Redis is offline, retry #'+state.attempt+'...');
                return 5000;
            }
        })
    );

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
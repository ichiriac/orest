const Sequelize = require('sequelize');
const fs = require('fs');

module.exports = function() {
    return new Promise(function(resolve, reject) {

        // remove old database if already exists
        const database = __dirname + '/database.sqlite';
        const initialized = fs.existsSync(database);
        
        //if (initialized) {
        //    fs.unlinkSync(database);
        //    initialized = false;
        //}

        // initialize the database connector
        const db = new Sequelize({
            dialect: 'sqlite',
            storage: database,
            logging: false
        });

        // loading models
        const path = __dirname + '/model';
        fs.readdirSync(path).forEach(function(file) {
            require(path + '/' + file)(db, Sequelize);
        });

        // create the database structure
        db.sync().then(function() {
            console.log('database structure is ready');
            // loading the data
            const data = __dirname + '/data';
            const jobs = [];
            if (!initialized) {
                fs.readdirSync(data).forEach(function(file) {
                    let entries = JSON.parse(
                        fs.readFileSync(data + '/' + file)
                    );
                    let model = db.model(file.substring(0, file.length - 5));
                    jobs.push(model.bulkCreate(entries));
                });                
            }
            Promise.all(jobs).then(function() {
                console.log('datasets are loaded');
                resolve(db);
            }).catch(reject);
        }).catch(reject);
    });
};
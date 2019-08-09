# OREST

Opinionated REST library for NodeJS using a cool stack & specification

## Install

```sh
npm install orest --save
```

## Usage

```js
// init framework components
const express = require('express');
const app = express();
// db is from sequelize ...

const Api = require('orest');
let api = new Api();
let account = api.entity(db.model('account'));
// Lists every account
account.list(function(req, res, filter) {
  return this.model.find(filter);
});
// Provides some help
api.help({
    info: {
        title: 'Your REST API',
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
api.register(app);

```
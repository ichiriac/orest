# OREST

Opinionated REST library for NodeJS using a cool stack & specification


## Design choices

Will work with these frameworks :

- ExpressJS 
- Sequalize
- OAuth 2.0
- Redis for Sessions

Will follow :

- JSON API Responses https://jsonapi.org
- Route example : /v1/products
- Route with extension : /v1/products.json
- Other extensions (with automated conversion) : xml or yaml
- Describing the API automatically with https://www.openapis.org/

Will handle :

- Multiple versions
- Partial responses
- Paginations
- Relations over entities
- HTTP Error Codes with a Message body
- HTTP Verbs for CRUD

Will do out of the box :

- Generate documentation
- Generate a JS client

---

# W.I.P

Still working on it

# Getting started

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

## The api

You can deal with 2 concepts :
- The entity
- The endpoint

An entity is a sequelize model structure, and you can configure 
how and what you want to expose.

The endpoint is a routing concept in order to expose either an 
entity (they are generating endpoints out of the box), or a 
generic action.

Once you defined the API, you can document it with the help api.
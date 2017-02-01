# alexa-verifier-middleware

[![NPM](https://nodei.co/npm/alexa-verifier-middleware.png)](https://www.npmjs.com/package/alexa-verifier-middleware/)

[![Build Status](https://travis-ci.org/alexa-js/alexa-verifier-middleware.svg?branch=master)](https://travis-ci.org/alexa-js/alexa-verifier-middleware)
[![dependencies Status](https://david-dm.org/alexa-js/alexa-verifier-middleware/status.svg)](https://david-dm.org/tejashah88/alexa-verifier-middleware)
![NPM Version](https://img.shields.io/npm/v/alexa-verifier-middleware.svg)

An [express](https://www.npmjs.com/package/express) middleware that verifies HTTP requests sent to an Alexa skill are sent from Amazon.


### Usage

It is recommended that you attach all Alexa routes to an express Router.
```javascript
var express  = require('express')
var verifier = require('alexa-verifier-middleware')


var app = express()

// create a router and attach to express before doing anything else
var alexaRouter = express.Router()
app.use('/alexa', alexaRouter)

// attach the verifier middleware first because it needs the entire
// request body, and express doesn't expose this on the request object
alexaRouter.use(verifier)

// Routes that handle alexa traffic are now attached here.
// Since this is attached to a router mounted at /alexa,
// this endpoint will be accessible at /alexa/weather_info
alexaRouter.get('/weather_info', function(req, res) { ... })

app.listen(3000)
```


### Mentions
* [mreinstein](https://github.com/mreinstein) for his [alexa-verifier](https://github.com/alexa-js/alexa-verifier) module, which allows you to verify any Amazon requests from any web service

### License
Copyright (c) 2016-2017 Tejas Shah

MIT License, see [LICENSE](https://tejashah88.mit-license.org/2016-2017) for details.

import httpMocks from 'node-mocks-http'
import sinon     from 'sinon'
import tap       from 'tap'
import verifier  from '../index.js'


const { test } = tap


function invokeMiddleware (data, next, after) {
  var callbacks = { }

  data['method'] = data['method'] || 'POST'
  data['on'] = function (eventName, callback) {
    callbacks[eventName] = callback
  }

  var mockReq = httpMocks.createRequest(data)
  var mockRes = httpMocks.createResponse()

  next = next || function () {}

  // verifier is an express middleware (i.e., function (req, res, next) { ... )
  verifier(mockReq, mockRes, next)

  if (callbacks['data']) {
    callbacks['data'](data['body'])
  }

  if (callbacks['end']) {
    callbacks['end']()
  }

  process.nextTick(after, mockRes)
}

test('enforce strict headerCheck always', function (t) {
  var nextInvocationCount = 0
  var mockNext = function () { nextInvocationCount++ }
  var mockRes = invokeMiddleware({}, mockNext, function (mockRes) {
    t.equal(mockRes.statusCode, 400)
    t.same(JSON.parse(mockRes._getData()), {
      reason: 'missing certificate url',
      status: 'failure'
    })
    t.equal(nextInvocationCount, 0)
    t.end()
  })
})

test('fail if request body is already parsed', function (t) {
  var mockRes = invokeMiddleware({
    headers: {},
    _body: true,
    rawBody: {}
  }, null, function (mockRes) {
    t.equal(mockRes.statusCode, 400)
    t.same(JSON.parse(mockRes._getData()), {
      reason: 'The raw request body has already been parsed.',
      status: 'failure'
    })

    t.end()
  })
})

test('fail invalid signaturecertchainurl header', function (t) {
  var mockRes = invokeMiddleware({
    headers: {
      signature: 'aGVsbG8NCg==',
      signaturecertchainurl: 'https://invalid'
    },
    body: JSON.stringify({
      hello: 'world',
      request: {
        timestamp: new Date().getTime()
      }
    }),
  }, null, function (mockRes) {
    t.equal(mockRes.statusCode, 400)
    t.same(JSON.parse(mockRes._getData()), {
      reason: 'Certificate URI hostname must be s3.amazonaws.com: invalid',
      status: 'failure'
    })

    t.end()
  })
})

test('fail invalid JSON body', function (t) {
  var mockRes = invokeMiddleware({
    headers: {
      signature: 'aGVsbG8NCg==',
      signaturecertchainurl: 'https://invalid'
    },
    body: 'invalid'
  }, null, function (mockRes) {
    t.equal(mockRes.statusCode, 400)
    t.same(JSON.parse(mockRes._getData()), {
      reason: 'request body invalid json',
      status: 'failure'
    })

    t.end()
  })
})

test('fail invalid signature', function (t) {
  var mockRes = invokeMiddleware({
    headers: {
      signature: 'aGVsbG8NCg==',
      signaturecertchainurl: 'https://s3.amazonaws.com/echo.api/echo-api-cert-4.pem'
    },
    body: JSON.stringify({
      request: {
        timestamp: new Date().getTime()
      }
    })
  }, function () {
    calledNext = true
  }, function (mockRes) {
    var calledNext = false
    setTimeout(function () {
      t.equal(calledNext, false)
      t.equal(mockRes.statusCode, 400)
      t.same(JSON.parse(mockRes._getData()), {
        reason: 'invalid certificate validity (past expired date)',
        status: 'failure'
      })
      t.end()
    }, 2000)
  })
})

test('pass with correct signature', function (t) {
  var timeout = global.setTimeout // see https://github.com/sinonjs/sinon/issues/269
  var ts = '2017-02-10T07:27:59Z'
  var now = new Date(ts)
  var clock = sinon.useFakeTimers(now.getTime())
  var calledNext = false
  var mockRes = invokeMiddleware({
    headers: {
      signature: 'Qc8OuaGEHWeL/39XTEDYFbOCufYWpwi45rqmM2R4WaSEYcSXq+hUko/88wv48+6SPUiEddWSEEINJFAFV5auYZsnBzqCK+SO8mGNOGHmLYpcFuSEHI3eA3nDIEARrXTivqqbH/LCPJHc0tqNYr3yPZRIR2mYFndJOxgDNSOooZX+tp2GafHHsjjShCjmePaLxJiGG1DmrL6fyOJoLrzc0olUxLmnJviS6Q5wBir899TMEZ/zX+aiBTt/khVvwIh+hI/PZsRq/pQw4WAvQz1bcnGNamvMA/TKSJtR0elJP+TgCqbVoYisDgQXkhi8/wonkLhs68pN+TurbR7GyC1vxw==',
      signaturecertchainurl: 'https://s3.amazonaws.com/echo.api/echo-api-cert-4.pem'
    },
    body: JSON.stringify({
      "version": "1.0",
      "session": {
        "new": true,
        "sessionId": "SessionId.7745e45d-3042-45eb-8e86-cab2cf285daf",
        "application": {
          "applicationId": "amzn1.ask.skill.75c997b8-610f-4eb4-bf2e-95810e15fba2"
        },
        "attributes": {},
        "user": {
          "userId": "amzn1.ask.account.AF6Z7574YHBQCNNTJK45QROUSCUJEHIYAHZRP35FVU673VDGDKV4PH2M52PX4XWGCSYDM66B6SKEEFJN6RYWN7EME3FKASDIG7DPNGFFFNTN4ZT6B64IIZKSNTXQXEMVBXMA7J3FN3ERT2A4EDYFUYMGM4NSQU4RTAQOZWDD2J7JH6P2ROP2A6QEGLNLZDXNZU2DL7BKGCVLMNA"
        }
      },
      "request": {
        "type": "IntentRequest",
        "requestId": "EdwRequestId.fa7428b7-75d0-44c8-aebb-4c222ed48ebe",
        "timestamp": ts,
        "locale": "en-US",
        "intent": {
          "name": "HelloWorld"
        },
        "inDialog": false
      }
    })
  }, function () {
    calledNext = true
  }, function (mockRes) {
    t.equal(mockRes.statusCode, 200)
    timeout(function () {
      t.equal(calledNext, true)
      clock.restore()
      t.end()
    }, 2000)
  })
})

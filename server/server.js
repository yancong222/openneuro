/*eslint no-console: ["error", { allow: ["log"] }] */
/* eslint-disable no-unused-vars*/

// dependencies ----------------------------------------------------

import express from 'express'
import async from 'async'
import config from './config'
import routes from './routes'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import mongo from './libs/mongo'
import redis from './libs/redis'
import queue from './libs/queue'
import notifications from './libs/notifications'
import aws from './libs/aws'
// import events lib to instantiate CRN Emitter
import events from './libs/events'

// configuration ---------------------------------------------------

mongo.connect()
redis.connect(config.redis, () => {
  queue.connect(() => {
    console.log('Resque connected')
  })
})

let app = express()

app.use((req, res, next) => {
  res.set(config.headers)
  res.type('application/json')
  next()
})
app.use(morgan('short'))
app.use(bodyParser.json())

// routing ---------------------------------------------------------

app.use(config.apiPrefix, routes)

// error handling --------------------------------------------------

app.use(function(err, req, res, next) {
  res.header('Content-Type', 'application/json')
  var send = { error: '' }
  var http_code = typeof err.http_code === 'undefined' ? 500 : err.http_code
  if (typeof err.message !== 'undefined' && err.message !== '') {
    send.error = err.message
  } else {
    if (err.http_code == 400) {
      send.error = 'there was something wrong with that request'
    } else if (err.http_code == 401) {
      send.error = 'you are not authorized to do that'
    } else if (err.http_code == 404) {
      send.error = 'that resource was not found'
    } else {
      send.error = 'there was a problem'
    }
  }
  res.status(http_code).send(send)
})

// start background tasks
notifications.initCron()
aws.batch.initCron()

// start server ----------------------------------------------------

app.listen(config.port, () => {
  console.log('Server is listening on port ' + config.port)
})

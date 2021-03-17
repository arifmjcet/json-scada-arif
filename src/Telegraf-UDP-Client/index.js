'use strict'

/*
 * A process that watches for raw data updates from protocols using a MongoDB change stream.
 * Convert raw values and update realtime values and statuses.
 * {json:scada} - Copyright (c) 2020-2021 - Ricardo L. Olsen
 * This file is part of the JSON-SCADA distribution (https://github.com/riclolsen/json-scada).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

const APP_NAME = 'TELEGRAF-UDP-JSON'
const APP_MSG = '{json:scada} - Telegraf UDP JSON Client Driver'
const VERSION = '0.1.1'
let ProcessActive = false // for redundancy control
let jsConfigFile = '../../conf/json-scada.json'

const fs = require('fs')
const mongo = require('mongodb')
const MongoClient = require('mongodb').MongoClient
const Queue = require('queue-fifo')
const { setInterval } = require('timers')
const dgram = require('dgram')
const server = dgram.createSocket('udp4')
const grpSep = '~'
const port = 51920

const LogLevelMin = 0,
  LogLevelNormal = 1,
  LogLevelDetailed = 2,
  LogLevelDebug = 3

let ListCreatedTags = []
let ValuesQueue = new Queue() // queue of values to update

const args = process.argv.slice(2)
var inst = null
if (args.length > 0) inst = parseInt(args[0])
const Instance = inst || process.env.JS_TELEGRAFUDPCLIENT_INSTANCE || 1
let ConnectionNumber = 0
const AutoKeyMultiplier = 1000000
let AutoKeyId = 0

var logLevel = null
if (args.length > 1) logLevel = parseInt(args[1])
const LogLevel = logLevel || process.env.JS_TELEGRAFUDPCLIENT_LOGLEVEL || 1

var confFile = null
if (args.length > 2) confFile = args[2]
jsConfigFile = confFile || process.env.JS_CONFIG_FILE || jsConfigFile

console.log(APP_MSG + ' Version ' + VERSION)
console.log('Instance: ' + Instance)
console.log('Log level: ' + LogLevel)
console.log('Config File: ' + jsConfigFile)

if (!fs.existsSync(jsConfigFile)) {
  console.log('Error: config file not found!')
  process.exit()
}

const RealtimeDataCollectionName = 'realtimeData'
const ProtocolDriverInstancesCollectionName = 'protocolDriverInstances'
const ProtocolConnectionsCollectionName = 'protocolConnections'

const notEmpty = function (obj) {
  if (typeof obj === 'string' && obj.trim().length > 0) return true
  return false
}

const addGrpIfNotEmpty = function (obj) {
  if (notEmpty(obj)) return obj + grpSep
  return ''
}

server.on('error', err => {
  console.log(`server error:\n${err.stack}`)
  server.close()
  process.exit(1)
})

server.on('listening', () => {
  const address = server.address()
  console.log(`server listening ${address.address}:${address.port}`)
})

server.on('message', (msg, rinfo) => {
  if (LogLevel >= LogLevelDebug)
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`)
  let data = {}

  try {
    data = JSON.parse(msg)
    processMessageJSON(data)
  } catch (e) {
    console.log(e)
  }
})

const processMessageJSON = function (data) {
  let grouping = '',
    group1 = '',
    group2 = '',
    group3 = '',
    ungroupedDescription = ''

  // add group1 or measurement name
  if (notEmpty(data.tags?.group1)) {
    grouping += addGrpIfNotEmpty(data.tags.group1)
    group1 = data.tags.group1
  } else {
    grouping += addGrpIfNotEmpty(data?.name)
    group1 = data?.name
  }

  // add group2 or object name and host
  if (notEmpty(data.tags?.group2)) {
    grouping += addGrpIfNotEmpty(data.tags?.group2)
    group2 = data.tags.group2
  } else {
    // grouping += addGrpIfNotEmpty(data.tags?.objectname)
    grouping += addGrpIfNotEmpty(data.tags?.host)
    group2 = data.tags?.host
  }

  if (notEmpty(data.tags?.group3)) {
    group3 = data.tags.group3
  }

  // add group3 if exists
  grouping += addGrpIfNotEmpty(data.tags?.group3)

  // add other tags to grouping
  for (var [key, value] of Object.entries(data.tags)) {
    if (
      ![
        'instance',
        // 'objectname',
        'host',
        'group1',
        'group2',
        'group3'
      ].includes(key)
    )
      if (value !== '') { 
        grouping += `${value}${grpSep}` 
        ungroupedDescription += `${value}${grpSep}` 
      }
  }

  // add instance if exists
  if (data.tags?.instance != '') {
    grouping += addGrpIfNotEmpty(data.tags?.instance)
  }

  let tags = []
  for (var [key, value] of Object.entries(data.fields)) {
    let tag
    if (key === 'value') {
      // remove the ~ at the end
      tag = grouping.replace(/~\s*$/, '')
    } else {
      tag = `${grouping}${key}`
      ungroupedDescription = key
    }

    tags[tag] = value

    ValuesQueue.enqueue({
      tag: tag,
      value: value,
      group1: group1,
      group2: group2,
      group3: group3,
      description: tag,
      ungroupedDescription: ungroupedDescription
    })
  }

  if (LogLevel >= LogLevelDetailed) {
    console.log(new Date(1000 * data.timestamp))
    console.log(tags)
  }
}

const rtData = function (measurement) {
  if (AutoKeyId === 0) {
    AutoKeyId = ConnectionNumber * AutoKeyMultiplier + 1
  } else {
    AutoKeyId++
  }

  return {
    _id: new mongo.Double(AutoKeyId),
    protocolSourceASDU: '',
    protocolSourceCommonAddress: '',
    protocolSourceConnectionNumber: new mongo.Double(ConnectionNumber),
    protocolSourceObjectAddress: measurement?.tag,
    alarmState: new mongo.Double(-1.0),
    description: measurement?.description,
    ungroupedDescription: measurement?.ungroupedDescription,
    group1: measurement?.group1,
    group2: measurement?.group2,
    group3: measurement?.group3,
    stateTextFalse: '',
    stateTextTrue: '',
    eventTextFalse: '',
    eventTextTrue: '',
    origin: 'supervised',
    tag: measurement.tag,
    type: 'analog',
    value: new mongo.Double(measurement.value),
    valueString: measurement.value.toString(),
    alarmDisabled: false,
    alerted: false,
    alarmed: false,
    alertedState: '',
    annotation: '',
    commandBlocked: false,
    commandOfSupervised: new mongo.Double(0.0),
    commissioningRemarks: 'Auto created by Telegraf Client Driver',
    formula: new mongo.Double(0.0),
    frozen: false,
    frozenDetectTimeout: new mongo.Double(0.0),
    hiLimit: new mongo.Double(Number.MAX_VALUE),
    hihiLimit: new mongo.Double(Number.MAX_VALUE),
    hihihiLimit: new mongo.Double(Number.MAX_VALUE),
    historianDeadBand: new mongo.Double(0.0),
    historianPeriod: new mongo.Double(0.0),
    hysteresis: new mongo.Double(0.0),
    invalid: true,
    invalidDetectTimeout: new mongo.Double(60000.0),
    isEvent: false,
    kconv1: new mongo.Double(1.0),
    kconv2: new mongo.Double(0.0),
    location: null,
    loLimit: new mongo.Double(-Number.MAX_VALUE),
    loloLimit: new mongo.Double(-Number.MAX_VALUE),
    lololoLimit: new mongo.Double(-Number.MAX_VALUE),
    notes: '',
    overflow: false,
    parcels: null,
    priority: new mongo.Double(0.0),
    protocolDestinations: null,
    sourceDataUpdate: null,
    supervisedOfCommand: new mongo.Double(0.0),
    timeTag: null,
    timeTagAlarm: null,
    timeTagAtSource: null,
    timeTagAtSourceOk: false,
    transient: false,
    unit: '',
    updatesCnt: new mongo.Double(0.0),
    valueDefault: new mongo.Double(0.0),
    zeroDeadband: new mongo.Double(0.0)
  }
}

let rawFileContents = fs.readFileSync(jsConfigFile)
let jsConfig = JSON.parse(rawFileContents)
if (
  typeof jsConfig.mongoConnectionString != 'string' ||
  jsConfig.mongoConnectionString === ''
) {
  console.log('Error reading config file.')
  process.exit()
}

server.bind(port)

console.log('Connecting to MongoDB server...')
;(async () => {
  let collection = null

  setInterval(async function () {
    let cnt = 0
    if (clientMongo && collection)
      while (!ValuesQueue.isEmpty()) {
        let data = ValuesQueue.peek()
        console.log(data)

        // const db = clientMongo.db(jsConfig.mongoDatabaseName)

        // if not sure taf is created, try to find, if not found create it
        if (!ListCreatedTags.includes(data.tag)) {
          let res = await collection
            .find({
              protocolSourceConnectionNumber: ConnectionNumber,
              protocolSourceObjectAddress: data.tag
            })
            .toArray()

          if (res.length === 0) {
            // not found, then create

            let newTag = rtData(data)

            console.log(newTag)

            // create
            // collection.insertOne(newTag)

            ListCreatedTags.push(data.tag)
          } else {
            // found
            ListCreatedTags.push(data.tag)
          }
        }

        /*
        let upd = ValuesQueue.peek()
        let where = { _id: upd._id }
        delete upd._id // remove _id for update
        collection.updateOne(where, {
          $set: upd
        })
*/

        ValuesQueue.dequeue()
        cnt++
      }
    if (cnt) console.log('Mongo Updates ' + cnt)
  }, 500)

  let connOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    appname: APP_NAME + ' Version:' + VERSION + ' Instance:' + Instance,
    poolSize: 20,
    readPreference: MongoClient.READ_PRIMARY
  }

  if (
    typeof jsConfig.tlsCaPemFile === 'string' &&
    jsConfig.tlsCaPemFile.trim() !== ''
  ) {
    jsConfig.tlsClientKeyPassword = jsConfig.tlsClientKeyPassword || ''
    jsConfig.tlsAllowInvalidHostnames =
      jsConfig.tlsAllowInvalidHostnames || false
    jsConfig.tlsAllowChainErrors = jsConfig.tlsAllowChainErrors || false
    jsConfig.tlsInsecure = jsConfig.tlsInsecure || false

    connOptions.tls = true
    connOptions.tlsCAFile = jsConfig.tlsCaPemFile
    connOptions.tlsCertificateKeyFile = jsConfig.tlsClientPemFile
    connOptions.tlsCertificateKeyFilePassword = jsConfig.tlsClientKeyPassword
    connOptions.tlsAllowInvalidHostnames = jsConfig.tlsAllowInvalidHostnames
    connOptions.tlsInsecure = jsConfig.tlsInsecure
  }

  let clientMongo = null
  let redundancyIntervalHandle = null
  while (true) {
    if (clientMongo === null)
      await MongoClient.connect(
        jsConfig.mongoConnectionString,
        connOptions
      ).then(async client => {
        clientMongo = client
        console.log('Connected correctly to MongoDB server')

        // specify db and collections
        const db = client.db(jsConfig.mongoDatabaseName)
        collection = db.collection(RealtimeDataCollectionName)

        // find the connection number, if not found abort (only one connection per instance is allowed for this protocol)
        db.collection(ProtocolConnectionsCollectionName)
          .find({
            protocolDriver: APP_NAME,
            protocolDriverInstanceNumber: Instance
          })
          .toArray(function (err, results) {
            if (err) console.log(err)
            else if (results) {
              if (results.length == 0) {
                console.log('No protocol connection found!')
                process.exit(1)
              } else {
                if (!('protocolConnectionNumber' in results[0])) {
                  console.log('No protocol connection found on record!')
                  process.exit(2)
                }
                ConnectionNumber = results[0]?.protocolConnectionNumber
                console.log('Connection - ' + ConnectionNumber)
              }
            }
          })

        let lastActiveNodeKeepAliveTimeTag = null
        let countKeepAliveNotUpdated = 0
        let countKeepAliveUpdatesLimit = 4
        async function ProcessRedundancy () {
          if (!clientMongo) return

          if (LogLevel >= LogLevelNormal)
            console.log('Redundancy - Process Active: ' + ProcessActive)

          // look for process instance entry, if not found create a new entry
          db.collection(ProtocolDriverInstancesCollectionName)
            .find({
              protocolDriver: APP_NAME,
              protocolDriverInstanceNumber: Instance
            })
            .toArray(function (err, results) {
              if (err) console.log(err)
              else if (results) {
                if (results.length == 0) {
                  // not found, then create
                  ProcessActive = true
                  console.log('Instance config not found, creating one...')
                  db.collection(
                    ProtocolDriverInstancesCollectionName
                  ).insertOne({
                    protocolDriver: APP_NAME,
                    protocolDriverInstanceNumber: new mongo.Double(1),
                    enabled: true,
                    logLevel: new mongo.Double(1),
                    nodeNames: [],
                    activeNodeName: jsConfig.nodeName,
                    activeNodeKeepAliveTimeTag: new Date()
                  })
                } else {
                  // check for disabled or node not allowed
                  let instance = results[0]
                  if (instance?.enabled === false) {
                    console.log('Instance disabled, exiting...')
                    process.exit()
                  }
                  if (
                    instance?.nodeNames !== null &&
                    instance.nodeNames.length > 0
                  ) {
                    if (!instance.nodeNames.includes(jsConfig.nodeName)) {
                      console.log('Node name not allowed, exiting...')
                      process.exit()
                    }
                  }
                  if (instance?.activeNodeName === jsConfig.nodeName) {
                    if (!ProcessActive) console.log('Node activated!')
                    countKeepAliveNotUpdated = 0
                    ProcessActive = true
                  } else {
                    // other node active
                    if (ProcessActive) {
                      console.log('Node deactivated!')
                      countKeepAliveNotUpdated = 0
                    }
                    ProcessActive = false
                    if (
                      lastActiveNodeKeepAliveTimeTag ===
                      instance.activeNodeKeepAliveTimeTag.toISOString()
                    ) {
                      countKeepAliveNotUpdated++
                      console.log(
                        'Keep-alive from active node not updated. ' +
                          countKeepAliveNotUpdated
                      )
                    } else {
                      countKeepAliveNotUpdated = 0
                      console.log(
                        'Keep-alive updated by active node. Staying inactive.'
                      )
                    }
                    lastActiveNodeKeepAliveTimeTag = instance.activeNodeKeepAliveTimeTag.toISOString()
                    if (countKeepAliveNotUpdated > countKeepAliveUpdatesLimit) {
                      // cnt exceeded, be active
                      countKeepAliveNotUpdated = 0
                      console.log('Node activated!')
                      ProcessActive = true
                    }
                  }

                  if (ProcessActive) {
                    // process active, then update keep alive
                    db.collection(
                      ProtocolDriverInstancesCollectionName
                    ).updateOne(
                      {
                        protocolDriver: APP_NAME,
                        protocolDriverInstanceNumber: new mongo.Double(Instance)
                      },
                      {
                        $set: {
                          activeNodeName: jsConfig.nodeName,
                          activeNodeKeepAliveTimeTag: new Date(),
                          softwareVersion: VERSION,
                          stats: {}
                        }
                      }
                    )
                  }
                }
              }
            })
        }

        // check and update redundancy control
        ProcessRedundancy()
        clearInterval(redundancyIntervalHandle)
        redundancyIntervalHandle = setInterval(ProcessRedundancy, 5000)
      })

    // wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000))

    // detect connection problems, if error will null the client to later reconnect
    if (clientMongo === undefined) {
      console.log('Disconnected Mongodb!')
      clientMongo = null
    }
    if (clientMongo)
      if (!clientMongo.isConnected()) {
        // not anymore connected, will retry
        console.log('Disconnected Mongodb!')
        clientMongo.close()
        clientMongo = null
      }
  }
})()
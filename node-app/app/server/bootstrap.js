'use strict';

/**
 * Dashboard for Labour
 *
 * @file bootstrap.js
 * @description
 * @module System
 * @author Coders for Labour
 *
 */

const os = require('os');
const cluster = require('cluster');
const Helpers = require('./helpers');
const Config = require('./config');
const Logging = require('./logging');
const Rhizome = require('rhizome-api-js');
const Auth = require('./auth');
// const Cache = require('./cache');
const Twibbyn = require('./twibbyn');
const Thunderclap = require('./thunderclap');
const Queue = require('./api-queue');
const Uploads = require('./uploads');
// const Constituency = require('./constituency');

const express = require('express');
const session = require('express-session');
// const redis = require('redis');
const RedisStore = require('connect-redis')(session);
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const passport = require('passport');

// const redisClient = redis.createClient(Config.redis);
// const redisClient = redis.createClient(Config.redis.port, Config.redis.host);

// redisClient.on('error', err => console.log(err));

/* ********************************************************************************
 *
 *
 *
 **********************************************************************************/
const processes = os.cpus().length;
const _workers = [];

/* ********************************************************************************
 *
 * WORKERS
 *
 **********************************************************************************/
const __spawnWorkers = () => {
  Logging.log(`Spawning ${processes} REST Workers`);

  const __spawn = idx => {
    _workers[idx] = cluster.fork();
  };

  for (let x = 0; x < processes; x++) {
    __spawn(x);
  }
};

/* ********************************************************************************
 *
 * WORKER
 *
 **********************************************************************************/
const __initWorker = () => {
  let app = express();
  app.enable('trust proxy', 1);
  app.use(morgan('short'));
  app.use(bodyParser.json({limit: '5mb'}));
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(methodOverride());
  app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: Config.auth.sessionSecret,
    store: new RedisStore({
      logErrors: true
    })
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.listen(Config.listenPort);

  Auth.init(app);
  Twibbyn.init(app);
  Thunderclap.init(app);
  // Queue.Manager.init(app);
  // Cache.Manager.create(Cache.Constants.Type.CONSTITUENCY);
  // Constituency.init(app);
  Uploads.init(app);

  const tasks = [
    Helpers.AppData.createFolder('/image_cache'),
    Helpers.AppData.createFolder('/uploads')
  ];

  return Promise.all(tasks);
};

/* ********************************************************************************
 *
 * MASTER
 *
 **********************************************************************************/
const __initMaster = () => {
  const isPrimary = Config.cluster.app === 'primary';
  Queue.Manager.init(isPrimary);

  __spawnWorkers();

  return Promise.resolve();
};

/* ************************************************************
 *
 * BOOTSTRAP
 *
 **************************************************************/
const _installApp = app => {
  let p = null;

  const url = `http://${Config.auth.rhizome.url}`;
  Logging.logDebug(`Attempting to connect to Rhizome using: ${url}`);

  Rhizome.init({
    rhizomeUrl: url,
    appToken: Config.auth.rhizome.appToken
  });

  if (cluster.isMaster) {
    p = __initMaster();
  } else {
    p = __initWorker();
  }

  return p.then(() => cluster.isMaster);
};

module.exports = {
  app: _installApp
};


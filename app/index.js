'use strict';
//http://stackoverflow.com/questions/25532692/how-to-share-sessions-with-socket-io-1-x-and-express-4-x
const express       = require('express');
const fs            = require('fs');
const path          = require('path');
const hbs           = require('express-hbs');
const cookieParser  = require('cookie-parser')();
const bodyParser    = require('body-parser');
const passport      = require('passport');
const flash         = require('connect-flash');
const session       = require('express-session');
const MySQL         = require('mysql');
const MySQLStore    = require('express-mysql-session')(session);
const config        = require('../config');
const authorization = require('./authorization');
const app           = express();
const server        = require('http').createServer(app);
const io            = require('socket.io')(server);

// Start MySQL
const db = MySQL.createConnection(config.db);

// Configure Passport (Local Strategy)
require('./authentication').init(passport, db);
const passportInit    = passport.initialize();
const passportSession = passport.session();

// Init the Role Base Authorization
authorization.init({app: app, db: db});

// Setup Express
app.use(express.static('public'));
app.use(cookieParser); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({extended: true}));

// Setup the HBS view engine
app.engine('hbs', hbs.express4({
                                   defaultLayout: 'app/layout',
                                   partialsDir: path.join(__dirname),
                                   layoutsDir: path.join(__dirname)
                               }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname));

// Set up the session storage and link to Express
const sessionStore = new MySQLStore({
    checkExpirationInterval: config.app.session_clean,
    expiration: config.app.session_expiration
}, db);

const sessionMiddleware = session({
                                      key: config.app.session_key,
                                      secret: config.app.session_secret,
                                      store: sessionStore,
                                      resave: true,
                                      httpOnly: true,
                                      ephemeral: true,
                                      saveUninitialized: true,
                                      cookie: {},
                                      secure: true
                                  });
app.use(sessionMiddleware);


// Move passport and flash into Express
app.use(passportInit);
app.use(passportSession); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// Socket stuff

io.use(function (socket, next)
       {
           socket.client.request.originalUrl = socket.client.request.url;
           cookieParser(socket.client.request, socket.client.request.res, next);
       });

io.use(function (socket, next)
       {
           socket.client.request.originalUrl = socket.client.request.url;
           sessionMiddleware(socket.client.request, socket.client.request.res, next);
       });

io.use(function (socket, next)
       {
           passportInit(socket.client.request, socket.client.request.res, next);
       });

io.use(function (socket, next)
       {
           passportSession(socket.client.request, socket.client.request.res, next);
       });

// Routes
require('./main').init(app, passport, db, authorization);
require('./admin').init(app, passport, db, authorization);
require('./user').init(app, passport, db, authorization);

// Socket init
require('./sockets').init(app, passport, db, authorization, io);

module.exports = server;
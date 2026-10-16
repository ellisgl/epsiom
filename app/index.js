'use strict';

const http          = require('node:http');
const path          = require('node:path');
const express       = require('express');
const hbs           = require('express-hbs');
const passport      = require('passport');
const session       = require('express-session');
const MySQLStore    = require('express-mysql-session')(session);
const { Server }    = require('socket.io');
const createPool    = require('./db');
const flash         = require('./flash');
const authorization = require('./authorization');

function createApp(config)
{
    const app    = express();
    const server = http.createServer(app);
    const io     = new Server(server);

    // Start MySQL
    const db = createPool(config.db);

    // Configure Passport (Local Strategy)
    require('./authentication').init(passport, db);

    // Init the Role Base Authorization
    authorization.init({ db });

    // Setup Express
    app.use(express.static(path.join(__dirname, '..', 'public')));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Setup the HBS view engine
    app.engine('hbs', hbs.express4({
        defaultLayout: path.join(__dirname, 'layout'),
        partialsDir: __dirname,
        layoutsDir: __dirname
    }));
    app.set('view engine', 'hbs');
    app.set('views', __dirname);

    // Set up the session storage and link to Express
    const sessionStore = new MySQLStore({
        checkExpirationInterval: config.app.session_clean,
        expiration: config.app.session_expiration
    }, db);

    const sessionMiddleware = session({
        name: config.app.session_key,
        secret: config.app.session_secret,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: config.app.production,
            maxAge: config.app.session_expiration
        }
    });

    if (config.app.production)
    {
        // Needed for secure cookies behind a reverse proxy
        app.set('trust proxy', 1);
    }

    app.use(sessionMiddleware);
    app.use(passport.session()); // persistent login sessions
    app.use(flash()); // one-time messages stored in the session

    // Share the Express session and Passport user with Socket.io.
    // Only run on the handshake request, not on every HTTP long-polling request.
    // https://socket.io/how-to/use-with-passport
    function onlyForHandshake(middleware)
    {
        return function (req, res, next)
        {
            if (req._query.sid === undefined)
            {
                middleware(req, res, next);
            }
            else
            {
                next();
            }
        };
    }

    io.engine.use(onlyForHandshake(sessionMiddleware));
    io.engine.use(onlyForHandshake(passport.session()));
    io.engine.use(onlyForHandshake(function (req, res, next)
    {
        if (req.user)
        {
            next();
        }
        else
        {
            res.writeHead(401);
            res.end();
        }
    }));

    // Routes
    require('./main').init(app, passport, db, authorization);
    require('./admin').init(app, passport, db, authorization);
    require('./user').init(app, passport, db, authorization);

    // Socket init
    require('./sockets').init(app, passport, db, authorization, io);

    // 404
    app.use(function (req, res)
    {
        res.status(404).send('Not Found');
    });

    // Errors (Express 5 also forwards rejected promises from async handlers here)
    app.use(function (err, req, res, next)
    {
        console.error(err);
        res.status(err.status || 500).send('Internal Server Error');
    });

    async function close()
    {
        // io.close() also closes the HTTP server
        await new Promise((resolve) => io.close(() => resolve()));
        await sessionStore.close();
        await db.end();
    }

    return { app, server, io, db, close };
}

module.exports = createApp;

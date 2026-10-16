'use strict';

const express = require('express');

// Placeholder until the admin interface is built (see README Todo)
function notImplemented(req, res)
{
    res.sendStatus(501);
}

function initAdmin(app, passport, db, authorization)
{
    const router = express.Router();

    // Everything under /admin requires a logged in Admin (or a role above it)
    router.use(passport.authenticationMiddleware(), authorization.hasRole('Admin'));

    router.get('/', notImplemented);

    // Users
    router.get('/users', notImplemented);
    router.get('/change_password/:user_id', notImplemented);
    router.post('/change_password', notImplemented);
    router.get('/delete_user/:user_id', notImplemented);
    router.post('/delete_user', notImplemented);
    router.get('/edit_user/:user_id', notImplemented);
    router.post('/edit_user', notImplemented);
    router.get('/create_user', notImplemented);
    router.post('/create_user', notImplemented);

    // Roles
    router.get('/roles', notImplemented);
    router.get('/edit_role/:role_id', notImplemented);
    router.post('/edit_role', notImplemented);
    router.get('/create_role', notImplemented);
    router.post('/create_role', notImplemented);
    router.get('/delete_role/:role_id', notImplemented);
    router.post('/delete_role', notImplemented);

    app.use('/admin', router);
}

module.exports = initAdmin;

'use strict';

function initAdmin(app, passport, db, authorization)
{
    app.get('/admin', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {
        // Do stuff!
    });

    app.get('/admin/users', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {
        // Do stuff!
    });

    app.get('/admin/change_password/:user_id', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {
        // Do stuff!
    });

    app.post('/admin/change_password', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {
        // Do stuff!
    });

    app.get('/admin/delete_user/:user_id', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {
        // Do stuff!
    });

    app.post('/admin/delete_user', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {
        // Do stuff!
    });

    app.get('/admin/edit_user/:user_id', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {
        // Do stuff!
    });

    app.post('/admin/edit_user', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {
        // Do stuff!
    });

    app.get('/admin/create_user', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {
        // Do stuff!
    });

    app.post('/admin/create_user', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {
        // Do stuff!
    });

    app.get('/admin/roles', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {

    });

    app.get('/admin/edit_role/:role_id', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {

    });

    app.post('/admin/edit_role', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {

    });

    app.get('/admin/create_role', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {

    });

    app.post('/admin/create_role', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {

    });

    app.get('/admin/delete_role/:role_id', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {
        // Do stuff!
    });

    app.post('/admin/delete_role', passport.authenticationMiddleware(), authorization.hasRole('Admin'), function(req, res)
    {
        // Do stuff!
    });
}

module.exports = initAdmin;
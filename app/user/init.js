'use strict';

const qry    = {
    user: require('./queries')
};
const bcrypt = require('bcryptjs');

function initUser(app, passport, db, authorization)
{
    app.get('/login', function (req, res)
    {
        res.render('user/login', {err: req.flash('err')});
    });

    app.post('/login', passport.authenticate('local',
                                             {
                                                 successRedirect: '/',
                                                 failureRedirect: '/login',
                                                 failureFlash: true
                                             }));

    app.get('/logout', function (req, res)
    {
        req.logout();
        res.redirect('/login');
    });

    /**
     app.get('/genpass/:plaintext', function (req, res)
     {
         var hash = bcrypt.hashSync(req.params.plaintext, 10);
         res.render('single', {xxx: hash});
     });
     **/

    app.get('/user/change_password', passport.authenticationMiddleware(), function (req, res)
    {

    });

    app.post('/user/change_password', passport.authenticationMiddleware(), function (req, res)
    {

    });

}

module.exports = initUser;
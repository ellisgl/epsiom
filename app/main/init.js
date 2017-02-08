'use strict';

function initMain(app, passport, db, mdl, rbac)
{
    app.get('/', passport.authenticationMiddleware(), function (req, res)
    {
        res.render('main/main.hbs', {ssid_ex: req.session.id, userid_ex: req.session.passport.user});
    });
}

module.exports = initMain;
'use strict';

function initMain(app, passport, db, authorization)
{
    app.get('/', passport.authenticationMiddleware(), function (req, res)
    {
        res.render('main/main', { ssid_ex: req.sessionID, userid_ex: req.user.user_id });
    });
}

module.exports = initMain;

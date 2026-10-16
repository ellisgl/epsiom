'use strict';

function initUser(app, passport, db, authorization)
{
    app.get('/login', function (req, res)
    {
        res.render('user/login', { err: req.flash('err') });
    });

    app.post('/login', passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }));

    app.post('/logout', function (req, res, next)
    {
        req.logout(function (err)
        {
            if (err)
            {
                return next(err);
            }

            res.redirect('/login');
        });
    });

    /**
     // Generate a password hash for seeding users (requires bcryptjs)
     app.get('/genpass/:plaintext', async function (req, res)
     {
         const hash = await bcrypt.hash(req.params.plaintext, 10);
         res.render('single', {xxx: hash});
     });
     **/

    app.get('/user/change_password', passport.authenticationMiddleware(), function (req, res)
    {
        res.sendStatus(501);
    });

    app.post('/user/change_password', passport.authenticationMiddleware(), function (req, res)
    {
        res.sendStatus(501);
    });
}

module.exports = initUser;

'use strict';

const qry                      = {
    user: require('../user/queries')
};
const LocalStrategy            = require('passport-local').Strategy;
const bcrypt                   = require('bcryptjs');
const authenticationMiddleware = require('./middleware');

function initPassport(passport, db)
{
    passport.serializeUser(function (user, done)
                           {
                               done(null, user.user_id);
                           });

    passport.deserializeUser(function (user_id, done)
                             {
                                 db.query(qry.user.getUserById(user_id), function (err, rows)
                                 {
                                     if (err)
                                     {
                                         return done(err);
                                     }

                                     if (!rows.length)
                                     {
                                         return done('ID Not found');
                                     }

                                     return done(null, rows[0]);
                                 });
                             });
    // Local Login
    passport.use('local', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, username, password, done)
        {
            db.query(qry.user.getUserByUsername(username), function (err, rows)
            {
                if (err)
                {
                    return done(err);
                }

                if (!rows.length)
                {
                    return done(null, false, req.flash('err', 'Incorrect username and/or password'));
                }

                // Use bcrypt with 10 rounds.
                if (!bcrypt.compareSync(password, rows[0].password))
                {
                    return done(null, false, req.flash('err', 'Incorrect username and/or password'));
                }

                // Good login
                return done(null, rows[0]);
            });
        }));

    passport.authenticationMiddleware = authenticationMiddleware;
}

module.exports = initPassport;
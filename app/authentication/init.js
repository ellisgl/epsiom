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

    passport.deserializeUser(async function (user_id, done)
    {
        try
        {
            const [rows] = await db.query(qry.user.getUserById(user_id));

            // A missing user (e.g. deleted) just ends the login session
            return done(null, rows[0] || false);
        }
        catch (err)
        {
            return done(err);
        }
    });

    // Local Login
    passport.use('local', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password'
        },
        async function (username, password, done)
        {
            try
            {
                const [rows] = await db.query(qry.user.getUserByUsername(username));

                if (!rows.length || !(await bcrypt.compare(password, rows[0].password)))
                {
                    // Stored by passport.authenticate's failureFlash option
                    return done(null, false, { type: 'err', message: 'Incorrect username and/or password' });
                }

                // Good login
                return done(null, rows[0]);
            }
            catch (err)
            {
                return done(err);
            }
        }));

    passport.authenticationMiddleware = authenticationMiddleware;
}

module.exports = initPassport;

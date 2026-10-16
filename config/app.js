'use strict';

const production = process.env.NODE_ENV === 'production';

if (production && !process.env.SESSION_SECRET)
{
    throw new Error('SESSION_SECRET must be set in production');
}

module.exports = {
    production,
    port: Number(process.env.PORT) || 8080,
    session_key: process.env.SESSION_KEY || 'epsiom',
    session_secret: process.env.SESSION_SECRET || 'SomeSillyLongKeyWithNumbersLike12&3!',
    // Session lifetime in ms (default: 1 hour)
    session_expiration: Number(process.env.SESSION_EXPIRATION) || 3600000,
    // How often expired sessions are purged from the database in ms
    session_clean: Number(process.env.SESSION_CLEAN) || 900000
};

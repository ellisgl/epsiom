'use strict';

const qry = {
    roles: require('./queries')
};

let db;

module.exports = {
    init: function (conf)
    {
        // Import of variable instances
        db = conf.db;
    },
    hasRole: function (role)
    {
        // Does the user's role match the role, or a role above it in the hierarchy?
        // Express 5 forwards a rejected promise to the error handler.
        return async function (req, res, next)
        {
            const [rows] = await db.query(qry.roles.userHasRole(role, req.user.role_id));

            if (rows.length)
            {
                return next();
            }

            res.sendStatus(403);
        };
    }
};

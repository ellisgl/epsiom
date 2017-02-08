'use strict';

const qry = {
    roles: require('./queries')
};

var app;
var db;

// Make indexOf case insensitive. Stolen from: http://stackoverflow.com/questions/24718349/how-do-i-make-array-indexof-case-insensitive
Array.prototype.customIndexOf = function (searchElement, fromIndex)
{
    return this.map(function (value)
                    {
                        return value.toLowerCase();
                    }).indexOf(searchElement.toLowerCase(), fromIndex);
};

module.exports = {
    init: function (conf)
    {
        // Import of variable instances
        app = conf.app;
        db  = conf.db;
    },
    hasRole: function (role)
    {
        // Does the user's role match the hierarchy of role accesses?
        return function (req, res, next)
        {
            var roles = [role];

            // Get the role hierarchy based on the role name
            db.query(qry.roles.getRoleHierarchy(role), function (err, rows)
            {
                if (err)
                {
                    res.send(err);
                }
                else
                {
                    // Merge roles array with MySQL output.
                    Array.prototype.push.apply(roles, rows[0].rname.split(','));

                    // Get the user role and check it against the list of roles that can access the resource.
                    db.query(qry.roles.getRoleNameById(req.user.role_id), function (err, rows)
                    {
                        if (err)
                        {
                            res.send(err);
                        }
                        else
                        {
                            if(roles.customIndexOf(rows[0].name) > -1)
                            {
                                next();
                            }
                            else
                            {
                                res.sendStatus(403);
                            }
                        }
                    });
                }
            });
        };
    }
};
'use strict';

// Minimal replacement for connect-flash: one-time messages stored in the session.
//   req.flash(type, msg) adds a message, req.flash(type) reads and clears them.
function flash()
{
    return function (req, res, next)
    {
        req.flash = function (type, msg)
        {
            const messages = req.session.flash || (req.session.flash = {});

            if (msg !== undefined)
            {
                (messages[type] || (messages[type] = [])).push(...[].concat(msg));
                return messages[type].length;
            }

            const out = messages[type] || [];
            delete messages[type];

            return out;
        };

        next();
    };
}

module.exports = flash;

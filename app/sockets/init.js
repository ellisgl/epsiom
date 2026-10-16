'use strict';

function initSocket(app, passport, db, authorization, io)
{
    // Only authenticated handshakes get this far (see app/index.js)
    io.on('connection', function (socket)
    {
        const req = socket.request;

        socket.emit('set_stuff', {
            ssid: req.sessionID,
            uid: req.user.user_id
        });
    });
}

module.exports = initSocket;

'use strict';

function initSocket(app, passport, db, authorization, io)
{
    io.on('connection', function (socket)
    {
        //console.log('User connected');

        if(socket.conn.request.hasOwnProperty('sessionID') &&socket.conn.request.session.hasOwnProperty('passport'))
        {
            socket.emit('set_stuff', {
                ssid: socket.conn.request.sessionID,
                uid: socket.conn.request.session.passport.user
            });
        }
        else
        {
            console.log('Invalid Session!');
        }
    });
}

module.exports = initSocket;
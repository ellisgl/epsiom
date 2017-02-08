'use strict';

const config = require('./config');
const server = require('./app');

const port = process.env.PORT || config.app.port;

server.listen(port, function (err)
{
    if (err)
    {
        throw err;
    }

    console.log('server is listening on: ' + port);
});
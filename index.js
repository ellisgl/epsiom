'use strict';

const config    = require('./config');
const createApp = require('./app');

const { server, close } = createApp(config);

server.on('error', function (err)
{
    console.error(err);
    process.exit(1);
});

server.listen(config.app.port, function ()
{
    console.log('server is listening on: ' + config.app.port);
});

async function shutdown(signal)
{
    console.log(signal + ' received, shutting down');

    try
    {
        await close();
        process.exit(0);
    }
    catch (err)
    {
        console.error(err);
        process.exit(1);
    }
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

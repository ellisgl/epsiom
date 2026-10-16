'use strict';

const mysql = require('mysql2/promise');

// One shared pool for the app queries and the session store.
function createPool(config)
{
    return mysql.createPool({
        ...config,
        waitForConnections: true,
        enableKeepAlive: true
    });
}

module.exports = createPool;

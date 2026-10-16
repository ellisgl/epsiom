'use strict';

module.exports = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'epsiom',
    password: process.env.DB_PASSWORD ?? 'epsiom',
    database: process.env.DB_NAME || 'epsiom',
    connectionLimit: Number(process.env.DB_POOL_SIZE) || 10
};

'use strict';

const fs                 = require('node:fs/promises');
const path               = require('node:path');
const mysql              = require('mysql2/promise');
const bcrypt             = require('bcryptjs');
const { MySqlContainer } = require('@testcontainers/mysql');
const createApp          = require('../app');

const MYSQL_IMAGE = process.env.TEST_MYSQL_IMAGE || 'mysql:8.4';

// Starts a throwaway MySQL container loaded with epsiom.sql, plus the app on a random port.
async function startStack()
{
    const container = await new MySqlContainer(MYSQL_IMAGE)
        .withDatabase('epsiom')
        .withUsername('epsiom')
        .withUserPassword('epsiom')
        .start();

    const dbConfig = {
        host: container.getHost(),
        port: container.getPort(),
        user: 'epsiom',
        password: 'epsiom',
        database: 'epsiom'
    };

    await seed({ ...dbConfig, user: 'root', password: container.getRootPassword() });

    const stack = createApp({
        app: {
            production: false,
            session_key: 'epsiom',
            session_secret: 'test-secret',
            session_expiration: 3600000,
            session_clean: 900000
        },
        db: dbConfig
    });

    await new Promise((resolve) => stack.server.listen(0, '127.0.0.1', resolve));

    return {
        baseUrl: `http://127.0.0.1:${stack.server.address().port}`,
        db: stack.db,
        async stop()
        {
            await stack.close();
            await container.stop();
        }
    };
}

async function seed(config)
{
    const conn = await mysql.createConnection({ ...config, multipleStatements: true });

    try
    {
        await conn.query(await fs.readFile(path.join(__dirname, '..', 'epsiom.sql'), 'utf8'));

        // A plain User-role account for authorization checks (admin/password is in epsiom.sql)
        await conn.query(
            'INSERT INTO `epsiom`.`users` (`username`, `password`, `role_id`) VALUES (?, ?, 3)',
            ['user', await bcrypt.hash('password', 10)]
        );
    }
    finally
    {
        await conn.end();
    }
}

module.exports = { startStack };

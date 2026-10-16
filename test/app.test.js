'use strict';

const { describe, it, before, after } = require('node:test');
const assert                          = require('node:assert/strict');
const request                         = require('supertest');
const { io }                          = require('socket.io-client');
const authorization                   = require('../app/authorization');
const { startStack }                  = require('./helpers');

describe('epsiom', { timeout: 180000 }, () =>
{
    let stack;

    before(async () =>
    {
        stack = await startStack();
    });

    after(async () =>
    {
        await stack?.stop();
    });

    async function login(username, password)
    {
        const agent = request.agent(stack.baseUrl);
        const res   = await agent.post('/login').type('form').send({ username, password });

        return { agent, res };
    }

    function connectSocket(cookie)
    {
        return io(stack.baseUrl, {
            transports: ['polling', 'websocket'],
            extraHeaders: cookie ? { cookie } : {},
            reconnection: false,
            forceNew: true
        });
    }

    describe('authentication', () =>
    {
        it('redirects anonymous users to /login', async () =>
        {
            const res = await request(stack.baseUrl).get('/');

            assert.equal(res.status, 302);
            assert.equal(res.headers.location, '/login');
        });

        it('renders the login page', async () =>
        {
            const res = await request(stack.baseUrl).get('/login');

            assert.equal(res.status, 200);
            assert.match(res.text, /<form action="\/login" method="post">/);
        });

        it('rejects a bad password with a flash message', async () =>
        {
            const { agent, res } = await login('admin', 'wrong');

            assert.equal(res.status, 302);
            assert.equal(res.headers.location, '/login');

            const page = await agent.get('/login');
            assert.match(page.text, /Incorrect username and\/or password/);
        });

        it('rejects an unknown user', async () =>
        {
            const { res } = await login('nobody', 'password');

            assert.equal(res.headers.location, '/login');
        });

        it('logs in and shows the session and user id', async () =>
        {
            const { agent, res } = await login('admin', 'password');

            assert.equal(res.status, 302);
            assert.equal(res.headers.location, '/');

            const page = await agent.get('/');
            assert.equal(page.status, 200);
            assert.match(page.text, /User ID from Express: 1/);
            assert.match(page.text, /Session ID from Express: [\w-]+/);
        });

        it('stores the session in MySQL', async () =>
        {
            await login('admin', 'password');

            const [rows] = await stack.db.query('SELECT `data` FROM `sessions`');
            assert.ok(rows.some((row) => JSON.parse(row.data).passport?.user === 1));
        });

        it('logs out via POST /logout', async () =>
        {
            const { agent } = await login('admin', 'password');

            const res = await agent.post('/logout');
            assert.equal(res.status, 302);
            assert.equal(res.headers.location, '/login');

            const page = await agent.get('/');
            assert.equal(page.headers.location, '/login');
        });

        it('returns 404 for unknown routes', async () =>
        {
            const res = await request(stack.baseUrl).get('/nope');

            assert.equal(res.status, 404);
        });
    });

    describe('authorization', () =>
    {
        it('lets an Admin through to /admin', async () =>
        {
            const { agent } = await login('admin', 'password');

            const res = await agent.get('/admin/users');
            assert.equal(res.status, 501); // passes the role check, handler not built yet
        });

        it('forbids a User from /admin', async () =>
        {
            const { agent } = await login('user', 'password');

            const res = await agent.get('/admin/users');
            assert.equal(res.status, 403);
        });

        it('lets a Developer (above Admin in role_roles) through to /admin', async () =>
        {
            await stack.db.query('UPDATE `users` SET `role_id` = 1 WHERE `username` = ?', ['user']);

            try
            {
                const { agent } = await login('user', 'password');

                const res = await agent.get('/admin');
                assert.equal(res.status, 501);
            }
            finally
            {
                await stack.db.query('UPDATE `users` SET `role_id` = 3 WHERE `username` = ?', ['user']);
            }
        });

        it('redirects anonymous users away from /admin', async () =>
        {
            const res = await request(stack.baseUrl).get('/admin');

            assert.equal(res.status, 302);
            assert.equal(res.headers.location, '/login');
        });

        // Runs hasRole() for a user with the given role_id; resolves to true if next() was called
        async function allowed(role, role_id)
        {
            let passed = false;

            await authorization.hasRole(role)({ user: { role_id } }, { sendStatus() {} }, () => { passed = true; });

            return passed;
        }

        it('follows the hierarchy through every level', async () =>
        {
            // Developer (1) > Admin (2) > Moderator (4) > User (3)
            const roles = { Developer: 1, Admin: 2, Moderator: 4, User: 3 };
            const order = Object.keys(roles);

            for (const [i, userRole] of order.entries())
            {
                for (const [j, required] of order.entries())
                {
                    assert.equal(
                        await allowed(required, roles[userRole]),
                        j >= i,
                        `${userRole} accessing ${required}`
                    );
                }
            }
        });

        it('matches role names case insensitively', async () =>
        {
            assert.equal(await allowed('admin', 1), true);
        });

        it('stops on a cycle in role_roles', async () =>
        {
            // User > Developer closes the loop, so User can now reach every role
            await stack.db.query('INSERT INTO `role_roles` (`role_id1`, `role_id2`) VALUES (3, 1)');

            try
            {
                assert.equal(await allowed('Moderator', 3), true);
            }
            finally
            {
                await stack.db.query('DELETE FROM `role_roles` WHERE `role_id1` = 3 AND `role_id2` = 1');
            }
        });
    });

    describe('socket.io', () =>
    {
        it('shares the Express session with the socket', async () =>
        {
            const { agent } = await login('admin', 'password');
            const page      = await agent.get('/');
            const ssid      = page.text.match(/Session ID from Express: ([\w-]+)/)[1];
            const cookie    = agent.jar.getCookies({ domain: '127.0.0.1', path: '/', secure: false, script: false })
                .map((c) => c.toValueString())
                .join('; ');

            const socket = connectSocket(cookie);

            try
            {
                const data = await new Promise((resolve, reject) =>
                {
                    socket.on('set_stuff', resolve);
                    socket.on('connect_error', reject);
                });

                assert.deepEqual(data, { ssid, uid: 1 });
            }
            finally
            {
                socket.close();
            }
        });

        it('refuses sockets without a login session', async () =>
        {
            const socket = connectSocket();

            try
            {
                const err = await new Promise((resolve, reject) =>
                {
                    socket.on('connect', () => reject(new Error('should not connect')));
                    socket.on('connect_error', resolve);
                });

                assert.ok(err);
            }
            finally
            {
                socket.close();
            }
        });
    });
});

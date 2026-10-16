epsiom
===
**E**xpress, **P**assport, **S**ocket.**io** and **M**ySQL: a boilerplate for Node.js apps that need users to log in,
real-time features that know who the user is, and role-based access control.

It is a starting point to clone and build on, not a library to install. You get:

* **Login** with Passport's local strategy and bcrypt password hashes
* **Sessions stored in MySQL**, so they survive restarts and work across multiple app instances
* **Socket.io that shares the login session**: every socket knows which user it belongs to, and anonymous sockets are refused
* **Role-based authorization** with a simple hierarchy (e.g. a Developer can do anything an Admin can)
* **Handlebars views**, configuration from environment variables, and graceful shutdown
* **A test suite** that runs against a real, throwaway MySQL in Docker

Contents: [Quick start](#quick-start) · [How it works](#how-it-works) · [Project layout](#project-layout) ·
[Building on it](#building-on-it) · [Configuration](#configuration) · [Tests](#tests) · [Production](#production) ·
[Troubleshooting](#troubleshooting)

Quick start
---
Requirements: Node.js 22.22+, and Docker (or your own MySQL 8.0+ / MariaDB 10.2+).

```sh
git clone https://github.com/ellisgl/epsiom.git
cd epsiom
npm install
cp .env.example .env   # optional, the defaults match the dev database
npm run db:up          # MySQL 8.4 in Docker, loaded with epsiom.sql
npm run dev            # restarts on file changes; `npm start` for a plain run
```

Open http://localhost:8080 and log in as `admin` / `password`. The page shows your session ID and user ID twice: once
rendered by Express and once sent over Socket.io. They match, which shows the session is shared.

`npm run db:down` stops the dev database. `docker compose down -v` also deletes its data, so `epsiom.sql` is loaded
fresh on the next `db:up`.

To use your own database instead, import `epsiom.sql` and set the `DB_*` variables (see [Configuration](#configuration)).

How it works
---
### Requests

```
request → express-session (loads the session from MySQL) → passport.session() (loads req.user) → your route
```

`POST /login` checks the username and bcrypt hash in the `users` table. On success, Passport stores the user's ID in the
session and the session is saved to the `sessions` table. On later requests, the ID is turned back into the full user
row as `req.user`. `POST /logout` ends the session.

### Sockets

The Socket.io handshake is an HTTP request, so it runs through the same session and Passport middleware
(see `app/index.js`). That means inside a socket handler:

* `socket.request.user` is the logged-in user's row from `users`
* `socket.request.session` and `socket.request.sessionID` are the Express session

Handshakes without a logged-in session get a 401 and never reach your `connection` handler.

### Roles

Each user has one role (`users.role_id` → `roles`). The `role_roles` table says which roles can access which other
roles: a row `(role_id1, role_id2)` means "**role_id1 can access anything that requires role_id2**".

Access is inherited through any number of levels. `epsiom.sql` ships with a four-level chain, where each role is linked
only to the one directly below it:

```
Developer ──▶ Admin ──▶ Moderator ──▶ User
```

| `role_roles` row       | Meaning                               |
|------------------------|---------------------------------------|
| `(Developer, Admin)`   | Developer can access Admin routes     |
| `(Admin, Moderator)`   | Admin can access Moderator routes     |
| `(Moderator, User)`    | Moderator can access User routes      |

Those three rows are enough for each role to reach everything below it:

| Route requires           | Allowed roles                      |
|--------------------------|------------------------------------|
| `hasRole('User')`        | User, Moderator, Admin, Developer  |
| `hasRole('Moderator')`   | Moderator, Admin, Developer        |
| `hasRole('Admin')`       | Admin, Developer                   |
| `hasRole('Developer')`   | Developer                          |

The hierarchy doesn't have to be a single chain: a role can have several rows, to inherit from more than one branch.
A loop in `role_roles` won't hang the check, but it does give every role in the loop the same access. Role names are
matched case-insensitively.

The check is a recursive SQL query (`WITH RECURSIVE`), so it needs MySQL 8.0+ or MariaDB 10.2+.

Project layout
---
```
index.js                  Entry point: starts the server, handles shutdown
config/                   Settings, read from environment variables
app/
  index.js                createApp(): Express, sessions, Passport, Socket.io, routes
  db.js                   The shared mysql2 connection pool
  flash.js                One-time messages stored in the session
  layout.hbs              Page layout used by every view
  authentication/         Passport setup and the "must be logged in" middleware
  authorization/          hasRole() and its query
  main/                   The home page
  user/                   Login, logout, change password
  admin/                  Admin area (placeholder routes, see Status)
  sockets/                Socket.io event handlers
test/                     Tests and the Testcontainers setup
epsiom.sql                Database schema and seed data
compose.yaml              Dev database
```

Each feature folder follows the same pattern:

* `index.js` exports `{ init: require('./init') }`
* `init.js` exports `function (app, passport, db, authorization)` that registers the routes
* `queries.js` holds the SQL for that feature
* `*.hbs` files are its views

Building on it
---
### Add a page

Create `app/reports/index.js`:

```js
'use strict';

module.exports = {
    init: require('./init')
};
```

`app/reports/queries.js`. Use `?` placeholders and `values`, never string concatenation:

```js
'use strict';

module.exports = {
    getReportsByUser: function (user_id)
    {
        return {
            sql: 'SELECT * FROM `reports` WHERE `user_id` = ?',
            values: [user_id]
        };
    }
};
```

`app/reports/init.js`:

```js
'use strict';

const qry = {
    reports: require('./queries')
};

function initReports(app, passport, db, authorization)
{
    app.get('/reports', passport.authenticationMiddleware(), async function (req, res)
    {
        const [rows] = await db.query(qry.reports.getReportsByUser(req.user.user_id));

        res.render('reports/list', { reports: rows });
    });
}

module.exports = initReports;
```

`app/reports/list.hbs`. It is rendered inside `app/layout.hbs`:

```hbs
<ul>
    {{#each reports}}<li>{{this.title}}</li>{{/each}}
</ul>
```

Then register it in `app/index.js` with the other routes. It must be above the 404 handler:

```js
require('./reports').init(app, passport, db, authorization);
```

`db` is a [mysql2](https://sidorares.github.io/node-mysql2/docs) promise pool, so `db.query()` resolves to
`[rows, fields]`. You don't need try/catch in route handlers: Express 5 sends a rejected promise to the error handler,
which logs it and returns a 500.

### Protect routes

* `passport.authenticationMiddleware()` requires a logged-in user. Anyone else is redirected to `/login`.
* `authorization.hasRole('Admin')` also requires the user's role to be Admin, or a role that can access Admin.
  Others get a 403. Always put it after `authenticationMiddleware()`, since it needs `req.user`.

```js
app.get('/reports/all', passport.authenticationMiddleware(), authorization.hasRole('Admin'), async function (req, res)
{
    // ...
});
```

To protect a whole section at once, use a router, as `app/admin/init.js` does:

```js
const router = express.Router();

router.use(passport.authenticationMiddleware(), authorization.hasRole('Admin'));
router.get('/', /* ... */);

app.use('/reports/admin', router);
```

### Use the user in sockets

Add handlers in `app/sockets/init.js`. The browser side connects with `io()`, since `layout.hbs` already loads the
Socket.io client.

```js
io.on('connection', function (socket)
{
    const user = socket.request.user;

    // e.g. a private room per user, so you can io.to('user:1').emit(...) from anywhere
    socket.join('user:' + user.user_id);

    socket.on('chat', function (text)
    {
        io.emit('chat', { from: user.username, text });
    });
});
```

`socket.request.user` is loaded when the socket connects. If a user logs out or is changed, that isn't reflected until
they reconnect.

### Show one-time messages

`req.flash(type, message)` stores a message in the session. `req.flash(type)` returns the messages of that type as an
array and clears them. This is how the login page shows "Incorrect username and/or password":

```js
req.flash('info', 'Report saved');
res.redirect('/reports');

// then, in the /reports route:
res.render('reports/list', { info: req.flash('info') });
```

### Add users and roles

There's no admin interface yet (see [Status](#status)), so add users and roles in SQL. First hash a password:

```sh
node -e "console.log(require('bcryptjs').hashSync('their-password', 10))"
```

```sql
-- A user with the User role (role_id 3)
INSERT INTO users (username, password, role_id) VALUES ('alice', '<hash from above>', 3);

-- A new Editor role that can access everything a User can
INSERT INTO roles (name) VALUES ('Editor');
INSERT INTO role_roles (role_id1, role_id2)
    SELECT e.role_id, u.role_id FROM roles e, roles u WHERE e.name = 'Editor' AND u.name = 'User';

-- Let Admins access Editor routes too (Developers get it through Admin)
INSERT INTO role_roles (role_id1, role_id2)
    SELECT a.role_id, e.role_id FROM roles a, roles e WHERE a.name = 'Admin' AND e.name = 'Editor';
```

The hierarchy now branches below Admin:

```
Developer ──▶ Admin ──┬──▶ Moderator ──▶ User
                      └──▶ Editor ─────▶ User
```

Moderator and Editor can't access each other's routes, and both can access User routes.

Configuration
---
Settings are read from environment variables. `npm start` and `npm run dev` also load them from a `.env` file if there
is one (see `.env.example`).

| Variable             | Default                 | Description                                                 |
|----------------------|-------------------------|-------------------------------------------------------------|
| `NODE_ENV`           |                         | Set to `production` in production (see below)               |
| `PORT`               | `8080`                  | HTTP port                                                   |
| `DB_HOST`            | `localhost`             | MySQL host                                                  |
| `DB_PORT`            | `3306`                  | MySQL port                                                  |
| `DB_USER`            | `epsiom`                | MySQL user                                                  |
| `DB_PASSWORD`        | `epsiom`                | MySQL password                                              |
| `DB_NAME`            | `epsiom`                | Database name                                               |
| `DB_POOL_SIZE`       | `10`                    | Maximum number of database connections                      |
| `SESSION_SECRET`     | a development value     | Secret for signing session cookies. Required in production  |
| `SESSION_KEY`        | `epsiom`                | Session cookie name                                         |
| `SESSION_EXPIRATION` | `3600000` (1 hour)      | Session lifetime in ms                                      |
| `SESSION_CLEAN`      | `900000` (15 minutes)   | How often expired sessions are deleted from MySQL, in ms    |

Tests
---
```sh
npm test
```

The tests start a throwaway MySQL container with [Testcontainers](https://node.testcontainers.org/), load
`epsiom.sql`, and run the app on a random port. They cover login, sessions, the role hierarchy, and session sharing with
Socket.io. Docker must be running, and the first run takes longer while the image downloads.

Set `TEST_MYSQL_IMAGE` to test against another image, such as `TEST_MYSQL_IMAGE=mariadb:11 npm test`.

Tests live in `test/*.test.js` and use Node's built-in `node:test` with [supertest](https://github.com/ladjs/supertest).
`startStack()` in `test/helpers.js` gives you a `baseUrl` and a `db` pool for your own tests.

Production
---
* Set `NODE_ENV=production` and a long random `SESSION_SECRET`. The app won't start without the secret.
* Serve it over HTTPS. In production the session cookie is `secure`, so browsers only send it over HTTPS.
  Behind a reverse proxy (nginx, a load balancer), forward `X-Forwarded-Proto`. The app trusts one proxy hop.
* Change the `admin` password or delete that user. The seed password is public.
* Use a database user with access to only the epsiom database. The `sessions` table is created automatically if it is
  missing.

Troubleshooting
---
* **`npm run db:up` can't connect to Docker.** Docker Compose uses your active Docker context. If that is a rootless
  daemon that isn't running, run `docker context use default` (or start the rootless daemon).
* **Port 3306 is already in use.** Set `DB_PORT` to another port in `.env`. Both the dev database and the app use it.
* **Logged in, but sockets don't connect.** Make sure the page and the socket use the same host. The session cookie is
  only sent to the host that set it.

Status
---
The `/admin` routes and `/user/change_password` are in place and protected, but return `501 Not Implemented` until they
are built. Todo: a simple admin interface to add users and roles and grant role permissions.

Credits
---
Code based on:
* https://blog.risingstack.com/node-hero-node-js-authentication-passport-js/
* https://socket.io/how-to/use-with-passport

License
---
[BSD 3-Clause](LICENSE)

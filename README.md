Express, Passport, Socket.io and MySQL Boilerplate (epsiom)
===
The name says it all.

Code based on:
* https://blog.risingstack.com/node-hero-node-js-authentication-passport-js/
* https://socket.io/how-to/use-with-passport

Requirements
---
* Node.js 22.22+
* Docker (for the dev database and the test suite), or your own MySQL / MariaDB

Install
---
```sh
npm install
cp .env.example .env   # optional, defaults match the dev database
npm run db:up          # MySQL 8.4 in Docker, loaded with epsiom.sql
npm start              # or `npm run dev` to restart on file changes
```

Then open http://localhost:8080. Default user/pass: `admin` / `password`

To use your own database, import `epsiom.sql` and set the `DB_*` variables (see `.env.example`).
In production, set `NODE_ENV=production` and `SESSION_SECRET`.

`npm run db:down` stops the dev database. `docker compose down -v` also deletes its data.

Tests
---
```sh
npm test
```

The tests start a throwaway MySQL container with [Testcontainers](https://node.testcontainers.org/), load `epsiom.sql` and
run against the app on a random port, so Docker must be running. Set `TEST_MYSQL_IMAGE` to test against another
image, such as `mariadb:11`.

Role Based Authorization
---
users table: role_id connects to the roles table.<br>
roles table: role_id (auto inc) and a name.<br>
role_roles table: role_id1 is for the role, role_id2 is the id of the role you want role_id1 to be able to access. Simplistic hierarchy.<br>

Protect a route with `authorization.hasRole('Admin')`. Users whose role has access to `Admin` in role_roles get in as well.

Todo
---
Simple admin interface to add users, role and grant role permissions. The `/admin` routes are in place and return `501 Not Implemented` for now.

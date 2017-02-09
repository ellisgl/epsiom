Express, Passport, Socket.io and MySQL Boilerplate (epsiom)
===
The name says it all.

Code based on:
* https://blog.risingstack.com/node-hero-node-js-authentication-passport-js/
* http://stackoverflow.com/questions/25532692/how-to-share-sessions-with-socket-io-1-x-and-express-4-x

Install
---
Download, extract and run `npm isntall`

Default user/pass: admin password

Role Based Authorization
---
users table: role_id connects to the roles table.<br>
roles table: role_id (auto inc) and a name.<br>
role_roles table: role_id1 is for the role, role_id2 is the id of the role you want role_id1 to be able to access. Simplistic hierarchy.<br>  

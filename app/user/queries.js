module.exports = {
    getUserByUsername : function(username)
    {
        return {
            sql: 'SELECT * FROM `users` WHERE `username` = ?',
            values: [username]
        };
    },

    getUserById: function(user_id)
    {
        return {
            sql: 'SELECT * FROM `users` WHERE `user_id` = ?',
            values: [user_id]
        }
    }
};
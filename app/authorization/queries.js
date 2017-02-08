module.exports = {
    getRoleHierarchy: function (roleName)
    {
        return {
            sql: '\
                SELECT GROUP_CONCAT(r.name) AS rname ' + 'FROM `role_roles` rr \
                LEFT JOIN `roles` AS r ON r.role_id = rr.role_id1 \
                WHERE rr.role_id2  = ( \
                SELECT `role_id` \
                FROM `roles` \
                WHERE `name` = ? \
                LIMIT 1);',
            values: [roleName]
        }
    },
    getRoleNameById: function(role_id)
    {
        return {
            sql: '\
                SELECT `name` \
                FROM `roles` \
                WHERE `role_id` = ?;',
            values: [role_id]
        }
    }
};
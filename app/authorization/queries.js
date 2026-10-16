'use strict';

module.exports = {
    // Matches when the user's role is the requested role, or a role that can access it (role_roles).
    // Role names are compared case insensitively by the column's collation.
    userHasRole: function (roleName, userRoleId)
    {
        return {
            sql: `
                SELECT 1
                FROM \`roles\` AS r
                WHERE r.\`name\` = ?
                  AND (r.\`role_id\` = ?
                    OR EXISTS (SELECT 1
                               FROM \`role_roles\` AS rr
                               WHERE rr.\`role_id1\` = ?
                                 AND rr.\`role_id2\` = r.\`role_id\`))
                LIMIT 1`,
            values: [roleName, userRoleId, userRoleId]
        };
    }
};

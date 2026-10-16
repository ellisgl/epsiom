'use strict';

module.exports = {
    // Matches when the user's role is the requested role, or can reach it through role_roles.
    // The hierarchy is followed through any number of levels (UNION also stops on cycles).
    // Role names are compared case insensitively by the column's collation.
    userHasRole: function (roleName, userRoleId)
    {
        return {
            sql: `
                WITH RECURSIVE reachable (role_id) AS (
                    SELECT CAST(? AS UNSIGNED)
                    UNION
                    SELECT rr.\`role_id2\`
                    FROM \`role_roles\` AS rr
                    JOIN reachable ON rr.\`role_id1\` = reachable.role_id
                )
                SELECT 1
                FROM reachable
                JOIN \`roles\` AS r ON r.\`role_id\` = reachable.role_id
                WHERE r.\`name\` = ?
                LIMIT 1`,
            values: [userRoleId, roleName]
        };
    }
};

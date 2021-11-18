/**
 * @typedef {object} User
 * @property {number} _id
 * @property {object} name
 * @property {string} name.first
 * @property {string} name.last
 * @property {string[]} roleIds
 */

/**
 * @typedef {object} Role
 * @property {string} _id
 * @property {string} display
 * @property {string[]} permissions 
 * @property {string[]} inherits Array of role _id(s)   
 * @property {boolean} assignable
 * @property {boolean} default
 */

/**
 * @typedef {object} AuthorizationOptions
 * @property {string} [targetId] The ID of the target user of the permission
 * @property {Object.<string, string>} [static] The static replacements to fill in the template
 * @property {Object.<string, string[]>} [all] The array replacements to fill in the template. Usage creates multiple permission matches.
 */

const authorization = {

    /** @type {Role[]} */
    roles: [],

    /** @type {Object.<string, Role>} */
    roleMap: {},

    /**
     * Loads an array of roles to be used for authorization checks
     * @param {Role[]} roles An array of roles
     */
    loadRoles(roles) {
        for (const role of roles) {
            authorization.roleMap[role._id] = role;
            authorization.roles.push(role);
        }
    },

    /**
     * Retrieves a role object given a role Id
     * Returns null of no role is found.
     * @param {string} roleId 
     * @returns {object}
     */
    getRole(roleId) {
        return roleId in authorization.roleMap ? authorization.roleMap[roleId] : null;
    },

    /**
     * Retrieves the display string for a role
     * Returns null if no role is found
     * @param {string} roleId 
     * @returns {string}
     */
    getDisplay(roleId) {
        const role = authorization.getRole(roleId);
        return role === null ? null : role.display;
    },

    /**
     * Retrieves an array of display strings given an array of role IDs
     * @param {string[]} roleIds
     * @returns {string[]}
     */
    getDisplays(roleIds) {
        return roleIds.map(authorization.getDisplay);
    },

    /**
     * Determines if two permissions match
     * @param {string} permissionA 
     * @param {string} permissionB 
     * @returns {boolean}
     */
    isPermissionMatch(permissionA, permissionB) {
        const piecesA = permissionA.toLowerCase().split('.');
        const piecesB = permissionB.toLowerCase().split('.');
        for (let i = 0; i < Math.min(piecesA.length, piecesB.length); i++) {
            if (piecesA[i] !== piecesB[i] && piecesA[i] !== '*' && piecesB[i] !== '*') return false;
        }
        return true;
    },

    /**
     * @param {User|string} userOrRoleId 
     * @param {string} permission 
     * @returns True if 'userOrRoleId' has 'permission', false otherwise
     */
    hasPermission(userOrRoleId, permission) {
        if (!userOrRoleId) return false;
        if (typeof (userOrRoleId) === 'string') {
            const role = authorization.roleMap[userOrRoleId];
            if (!role) return false;
            for (const rolePermission of role.permissions) {
                if (authorization.isPermissionMatch(permission, rolePermission)) return true;
            }
            for (const childRoleId of role.inherits) {
                if (authorization.hasPermission(childRoleId, permission)) return true;
            }
        } else {
            for (const roleId of userOrRoleId.roleIds) {
                if (authorization.hasPermission(roleId, permission)) return true;
            }
        }
        return false;
    },

    /**
     * Fills a permission template with values based on 'options'
     * @param {string} template The template permission with placeholders (<target>, <role>, <key>, etc...)
     * @param {AuthorizationOptions} [options] The authorization options
     * @returns An array of permissions
     */
    fillPermissionTemplate(userId, template, options = {}) {
        let permissions = [template];
        if ('targetId' in options) {
            const self = userId === options.targetId;
            permissions = permissions.map(permission => permission.replace('<target>', self ? 'self' : 'others'));
        }
        if ('static' in options) {
            for (const key in options.static) {
                permissions = permissions.map(permission => permission.replace(`<${key}>`, options.static[key]));
            }
        }
        if ('all' in options) {
            for (const key in options.all) {
                permissions = permissions.flatMap(permission => options.all[key].map(value => permission.replace(`<${key}>`, value)));
            }
        }
        return permissions;
    },

    /**
     * Used to ensure that a user is authorized to make a certain request.
     * @param {User} user The user invoking the permission.
     * @param {string} template The permission template.
     * @param {AuthorizationOptions} [options] The authorization options
     * @returns True if the request is authroized, false otherwise
     */
    isAuthorized(user, template, options = {}) {
        const requiredPermissions = authorization.fillPermissionTemplate(user._id, template, options);
        for (const permission of requiredPermissions) {
            if (!authorization.hasPermission(user, permission)) return false;
        }
        return true;
    }

};

module.exports = authorization;
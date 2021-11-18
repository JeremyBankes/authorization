# authorization
A Node module for verifying client authorization

## Getting Started
 - Add as submodule to your project
   - ```git submodule add https://github.com/JeremyBankes/authorization.git modules/authorization```
 - Start using the library!

```js
const authorization = require('./modules/authorization/authorization.js');

authorization.loadRoles(require('./roles.json'));

const user = { _id: 5, roleIds: ['driver'] };

// Will check that 'user' has the permissions 'users.update.self.driver' and 'users.update.self.supervisor'
authorization.isAuthorized(user, 'users.<action>.<target>.<role>', {
    targetId: 5,
    static: { action: 'update' },
    all: { role: ['driver', 'supervisor'] }
});
```
# Sanity third party authentication example

This application will log an external user into a Sanity project via a [Passport.js](http://www.passportjs.org/) provider:

1) The user logs into the Passport.js provider via ``/login/:providerName``.
2) After logging in, it is redirected to ``/callback/:providerName`` which reads their credentials and posts them to the Sanity API.
3) The Sanity API returns an one time, short expiring claim URL for the posted credentials which the user can obtain a  Sanity session from.
4) The user is redirected to the claim URL and obtains the session. It is then redirected back to the Studio (origin).<sup>*</sup>

    <sup>* The user would of course not have the ability to do anything yet, unless you on beforehand created [access rules for them](#whatisnext).</sup>


## Prerequisite

You will need the ``thirdPartyLogin`` feature bit on your Sanity project for this to actually work.

This is only availbe for enterprise customers for now.

Read more about this [here](https://www.sanity.io/help/third-party-login).

## Development

The application uses Redis for storing the temporary Passport.js session when running the server.

Configure the Redis connection in ``./config/index`` if you need some special configuration.

Should work out of the box if your Redis server is running locally and default configured.

If you are just doing TDD, it will fallback to a memory store, and Redis will not be required.


```bash
  yarn install
  yarn test
  yarn dev // Start development server
```

## Configuration

### Passport

The application supports several Passport.js providers simultaneously.

You can find passport [strategies here](http://www.passportjs.org).

Add the modules with i.e. ``yarn add passport-google-oauth20``

They are configured in ``./config/passport-providers.js``.

See ``./config/passport-providers.example.js`` for an example.

### Application

See ``./config/index.js`` for related config variables for this example application.

### Sanity Studio configuration

The Sanity Studio should automatically provide the ``origin`` to the login endpoint when the studio is configured like this in the file ``./config/@sanity/default-login.json``:

```json
{
  "providers": {
    "mode": "replace",
    "redirectOnSingle": true,
    "entries": [
      {
        "name": "facebook",
        "title": "Vandelay Industries",
        "url": "http://localhost:3334/login/facebook"
      }
    ]
  }
}

```

## Routes

### ``GET /login/:providerName``

Logs the user in with a Passport provider. Requires param ``origin`` (full url) which is where the user came from. This is usually provided with Sanity Studio's default-login component.

### ``GET /callback/:providerName``

Callback from a Passport authentication. If the authentication was sucessfull, the credentials will be posted to the Sanity API. See ``./src/services/sanitySession.js``


## <a name="whatisnext">What is next?</a>

When you have a working authentication server, you should take your local usernames, hash them the same way as done in ``./src/services/sanitySession``. You are free to hash them the way you prefer, but it's a good measure to keep them anonymous and non-identifiable.

Then it is just a matter of creating the desired access levels for your users in Sanity. The access levels are defined by a special document in your dataset with the id ``_.groups.[key]`` (where the key is the id for the group. i.e. 'admins', 'editors', etc.)

Example:

```js

const hashUserId = require('./src/util/hashUserId')

const admins = {
  key: 'admins',
  members: [
    hashUserId('george.costanza@vandelay.com'),
  ]
}

const editors =  {
  key: 'editors',
  members: [
    hashUserId('kramer@vandelay.com'),
    hashUserId('elaine@vandelay.com'),
  ]
}

function createGroupDoc(group, admin) {
  let filter = "(_type == 'article')"
  if (admin) {
    filter = 'true'
  }
  return {
    _id: `_.groups.${group.key}`,
    _type: 'system.group',
    grants: [
      {
        filter: filter,
        permissions: [
          'create',
          'update',
          'read'
        ]
      }
    ],
    members: group.members
  }
}

const client = sanityClient(config.sanityClient)

function createOrReplaceGroup(groupDoc) {
  client.createOrReplace(groupDoc).then(res => {
    console.log(`Created or replaced system group ${res._id}`)
  })
}

// Create admins
createOrReplaceGroup(createGroupDoc(admins, true))

// Create editors
createOrReplaceGroup(createGroupDoc(editors, false))

```

This is of course just a basic example. Typically you would read users from a database and sync them, react to webooks etc.

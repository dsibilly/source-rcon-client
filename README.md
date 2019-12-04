# source-rcon-client [![npm version](https://badge.fury.io/js/source-rcon-client.svg)](https://badge.fury.io/js/source-rcon-client) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Code of Conduct](https://img.shields.io/badge/%E2%9D%A4-code%20of%20conduct-blue.svg?style=flat)](https://github.com/dsibilly/source-rcon-client/blob/master/CODE_OF_CONDUCT.md) ![semver](https://img.shields.io/badge/semver-2.0.0-blue.svg?maxAge=2592000)
A simple RCON client written in ES2018 with the [isotropic](https://github.com/ibigroup/isotropic) utilities library.

## API

#### new SourceRCONClient(hostname, port = 27015, password, timeout = 5000, logEnabled = false)

Returns a fresh client instance for the given server and credentials.

__Arguments__

* `hostname` - The hostname or IP of the RCON server.
* `port` - The TCP port of the RCON server. Defaults to port 27015.
* `password` - The admin password for the RCON server.
* `timeout` - The timeout for command responses. Defaults to 5000 ms (5 seconds.)
* `logEnabled` - Whether logging (via [pino](https://github.com/pinojs/pino)) is enabled. Defaults to false.

__Example__

```javascript
import SourceRCONClient from 'source-rcon-client';

const client = new SourceRCONClient('hostname', 27015, 'password');
```

**NOTE:** source-rcon-client is a ES2015+ module. If you're using CommonJS on Node.js < 12 or are not using Babel to transpile, you're going to want to `require` source-rcon-client by the `default` property:

```javascript
const SourceRCONClient = require('source-rcon-client').default,
    client = new SourceRCONClient('hostname', 27015, 'password');
```

---------------------------------------

#### connect()

Connects with the credentials provided at instantiation time.
Returns a Promise that is resolved if the connection is successful and
rejects if it fails.

__Example__

```javascript
import SourceRCONClient from 'source-rcon-client';

const client = new SourceRCONClient('hostname', 27015, 'password');

client.connect().then(() => {
    console.log('Connected!');
}).catch(error => {
    console.error(error);
});
```

---------------------------------------

### disconnect()

Disconnects from the RCON server and resets the client, making it ready
for a new connection.
Returns a Promise that is resolved if the client disconnects cleanly or
rejects if it does not.

__Example__

```javascript
import SourceRCONClient from 'source-rcon-client';

const client = new SourceRCONClient('hostname', 27015, 'password');

client.connect().then(() => {
    console.log('Connected!');
    return client.disconnect();
}).then(() => {
    console.log('Disconnected!');
}).catch(error => {
    console.error(error);
});
```

---------------------------------------

### send(command[, packetType])

Sends the provided command to the connected server for execution.
Returns a Promise that resolves with the server response on successful
execution, or rejects with an error if there is a failure.

__Arguments__

* `command` - The command sent to the server.
* `packetType` - An optional PacketType definition. Defaults to `PacketType.SERVERDATA_EXECCOMMAND`.

__Example__

```javascript
import SourceRCONClient from 'source-rcon-client';

const client = new SourceRCONClient('hostname', 27015, 'password');

client.connect().then(() => {
    console.log('Connected!');
    return client.send('listplayers'); // Assuming an ARK/ATLAS server...
}).then(response => {
    console.log(response); // Print the server response to console
    return client.disconnect();
}).then(() => {
    console.log('Disconnected!');
}).catch(error => {
    console.error(error);
});
```

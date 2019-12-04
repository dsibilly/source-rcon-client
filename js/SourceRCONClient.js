import _Error from 'isotropic-error';
import _later from 'isotropic-later';
import _make from 'isotropic-make';
import MersenneTwister from '@dsibilly/mersenne-twister';
import net from 'net';
import PacketType from './PacketType';
import pino from 'pino';

const SourceRCONClient = _make({
    connect () {
        return new Promise((resolve, reject) => {
            if (this.hasAuthed) {
                reject(new _Error({
                    message: 'authentication has already occurred'
                }));
                return;
            }

            this._tcpSocket = net.createConnection(this.port, this.host);

            this._tcpSocket.on('connect', () => {
                this.isReady = true;
                this._log.info(`Connected to ${this.host}:${this.port}`);
                this.send(this.password, PacketType.SERVERDATA_AUTH).then(() => {
                    this.hasAuthed = true;
                    this._log.info('Authentication successful');
                    resolve();
                }).catch(error => {
                    reject(new _Error({
                        error,
                        message: 'authentication failure'
                    }));
                });
            });

            this._tcpSocket.on('data', this._handleResponse.bind(this));
            this._tcpSocket.on('error', error => {
                reject(new _Error({
                    error,
                    message: `${error.message}`
                }));
            });
            this._tcpSocket.on('end', () => {
                this._reset();
            });
        });
    },

    disconnect () {
        return new Promise((resolve, reject) => {
            if (!this._tcpSocket) {
                reject(new _Error({
                    message: 'adapter is already disconnected'
                }));
                return;
            }

            if (!this.hasAuthed) {
                reject(new _Error({
                    message: 'this connection is not authenticated'
                }));
                return;
            }

            this._tcpSocket.once('error', error => {
                reject(new _Error({
                    error,
                    message: 'TCP socket disconnect error'
                }));
            });

            this._tcpSocket.unref();
            this._tcpSocket.end(null, () => {
                this._reset();
                this._log.info('Disconnect successful');
                resolve();
            });
        });
    },

    send (command, packetType) {
        packetType = packetType || PacketType.SERVERDATA_EXECCOMMAND;

        return new Promise((resolve, reject) => {
            if (!this.isReady) {
                // The socket isn't ready yet...
                throw new _Error({
                    message: 'TCP socket is not ready yet'
                });
            }

            if (!this.hasAuthed && packetType !== PacketType.SERVERDATA_AUTH) {
                throw new _Error({
                    message: 'this connection is not authenticated'
                });
            }

            const length = Buffer.byteLength(command),
                id = Math.trunc(this._rng.random() * (0x98967F - 0xF4240) + 0xF4240);

            let buffer,
                requestTimeout;

            if (packetType === PacketType.SERVERDATA_AUTH) {
                this._authPacketId = id;
            }

            buffer = Buffer.allocUnsafe(length + 14);

            buffer.writeInt32LE(length + 10, 0);
            buffer.writeInt32LE(id, 4);
            buffer.writeInt32LE(packetType, 8);
            buffer.write(command, 12);
            buffer.fill(0x00, length + 12);

            this._log.info(`Sending command '${command}'`);
            this._tcpSocket.write(buffer.toString('binary'), 'binary');

            requestTimeout = _later(this.timeout, () => {
                this._timedOutRequests.push(id);

                this._callbacks.delete(id);
                if (packetType === PacketType.SERVERDATA_AUTH) {
                    this._authPacketId = null;
                }

                return reject(new _Error({
                    message: 'request timeout'
                }));
            });

            this._callbacks.set(id, (data, error) => {
                requestTimeout.cancel();
                this._callbacks.delete(id);
                if (packetType === PacketType.SERVERDATA_AUTH) {
                    this._authPacketId = null;
                }

                if (error) {
                    reject(new _Error({
                        error,
                        message: 'response callback error'
                    }));
                    return;
                }

                this._log.info({
                    commandId: id,
                    data
                });
                resolve(data);
            });
        });
    },

    _handleResponse (data) {
        const length = data.readInt32LE(0),
            id = data.readInt32LE(4),
            type = data.readInt32LE(8);

        let dataString;

        if (!length) {
            throw new _Error({
                message: 'received empty response packet'
            });
        }

        if (this._timedOutRequests.includes(id)) {
            this._timedOutRequests.splice(this._timedOutRequests.indexOf(id), 1);
            return;
        }

        if (type === PacketType.SERVERDATA_AUTH_RESPONSE && id === -1) {
            this._callbacks.get(this._authPacketId)(null, new _Error({
                message: 'authentication failure'
            }));
        } else if (this._callbacks.has(id)) {
            dataString = data.toString('ascii', 12, length + 2);

            if (dataString.charAt(dataString.length - 1) === '\n') {
                dataString = dataString.substring(0, dataString.length - 1);
            }

            this._callbacks.get(id)(dataString);
        } else if (id === 0 && type === PacketType.SERVERDATA_RESPONSE_VALUE) {
            this._log.info({
                id,
                length,
                payload: data.toString('ascii', 12, length + 2)
            }, 'Suspected keep-alive packet');
        } else {
            this._log.warn({
                id,
                length,
                type
            }, `Response id ${id} did not match any known request id`);
        }
    },

    _init (host, port, password, timeout, logEnabled = false) {
        if (!host || !host.trim()) {
            throw new _Error({
                message: 'host argument must not be empty'
            });
        }

        if (typeof port === 'string') {
            [
                port,
                password,
                timeout
            ] = [
                null,
                port,
                password
            ];
        }

        if (!password || !password.trim()) {
            throw new _Error({
                message: 'password argument must not be empty'
            });
        }

        this.hasAuthed = false;
        this.host = host;
        this.isReady = false;
        this.password = password;
        this.port = port || 27015;
        this.timeout = timeout || 5000;
        this._authPacketId = null;
        this._callbacks = new Map();
        this._log = pino({
            enabled: logEnabled,
            name: 'source-rcon-client',
            prettyPrint: true
        });
        this._rng = new MersenneTwister();
        this._tcpSocket = null;
        this._timedOutRequests = [];

        return this;
    },

    _reset () {
        return new Promise(resolve => {
            this.hasAuthed = false;
            this.isReady = false;
            this._tcpSocket = null;
            this._callbacks.clear();
            resolve();
        });
    }
});

export default SourceRCONClient;

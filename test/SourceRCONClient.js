import {
    describe,
    it
} from 'mocha';

import SourceRCONClient from '../js/SourceRCONClient';

import {
    expect
} from 'chai';

describe('Rcon', () => {
    it('constructor throws if required arguments are missing', () => {
        expect(() => new SourceRCONClient()).to.throw('host argument must not be empty');
        expect(() => new SourceRCONClient('some-random-host')).to.throw('password argument must not be empty');
    });

    describe('connect', () => {
        it('throws if host is not reachable', () => {
            const rcon = new SourceRCONClient('some-random-host', 'some password');

            return rcon.connect().catch(error => {
                expect(error).to.be.an.instanceOf(Error);
                expect(error.toString()).to.eql('Error: getaddrinfo ENOTFOUND some-random-host some-random-host:27015');
            });
        });

        it('throws if the connection if refused', () => {
            const rcon = new SourceRCONClient('localhost', 12345, 'some password');

            return rcon.connect().catch(error => {
                expect(error).to.be.an.instanceOf(Error);
                expect(error.toString()).to.eql('Error: connect ECONNREFUSED 127.0.0.1:12345');
            });
        });
    });
});

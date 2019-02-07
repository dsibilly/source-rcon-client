import {
    describe,
    it
} from 'mocha';

import {
    expect
} from 'chai';

import MersenneTwister from '../js/MersenneTwister';

describe('MersenneTwister', () => {
    it('should repeat random sequence on a given seed', () => {
        const generator = new MersenneTwister(),
            seed = 123;

        let first1,
            first2,
            second1,
            second2;

        generator._initWithSeed(seed);
        first1 = generator.random();
        first2 = generator.random();

        generator._initWithSeed(seed);
        second1 = generator.random();
        second2 = generator.random();

        expect(first1).to.eql(second1);
        expect(first2).to.eql(second2);
    });

    it('should allow seeding via constructor', () => {
        const seed = 325,
            generator1 = new MersenneTwister(seed),
            generator2 = new MersenneTwister(seed);

        for (let i = 0; i < 5; i += 1) {
            expect(generator1.random()).to.eql(generator2.random());
        }
    });

    it('should closely match Python when seeded by array', () => {
        const seed1 = 0,
            seed2 = 42,
            generator1 = new MersenneTwister([
                seed1
            ]),
            generator2 = new MersenneTwister([
                seed2
            ]),
            values1 = [
                0.84442,
                0.34535,
                0.25570,
                0.32368,
                0.89075
            ],
            values2 = [
                0.63942,
                0.55564,
                0.55519,
                0.81948,
                0.94333
            ];

        for (let i = 0; i < 5000000; i += 1) {
            const rVal1 = generator1.randomLong(),
                rVal2 = generator2.randomLong();

            if (i % 1000000 === 0) {
                const index = i / 1000000;

                expect(rVal1).to.be.closeTo(values1[index], 0.00001);
                expect(rVal2).to.be.closeTo(values2[index], 0.00001);
            }
        }
    }).timeout(10000);

    describe('random generator methods', () => {
        const _seed = 1701,
            generator = new MersenneTwister(_seed);

        beforeEach(() => {
            generator._initWithSeed(_seed);
        });

        it('should generate random 32-bit integers', () => {
            const result = generator.randomInt();

            expect(result).to.eql(384112814);
        });

        it('should generate random 31-bit integers', () => {
            const result = generator.randomInt31();

            expect(result).to.eql(192056407);
        });

        it('should generate random number, 0 < n < 1', () => {
            const result = generator.randomExclusive();

            expect(result).to.eql(0.08943323383573443);
        });

        it('should generate random number, 0 <= n < 1', () => {
            const result = generator.random();

            expect(result).to.eql(0.0894332337193191);
        });

        it('should generate random number, 0 <= n <= 1', () => {
            const result = generator.randomInclusive();

            expect(result).to.eql(0.08943323374014191);
        });

        it('should generate random 53-bit number, 0 <= n <= 1', () => {
            const result = generator.randomLong();

            expect(result).to.eql(0.0894332343245976);
        });

        it('should properly handle large seed Arrays', () => {
            const seed = Array.from({
                    length: 630
                }, () => 0.5),
                generator2 = new MersenneTwister(seed),
                result = generator2.randomInt();

            expect(result).to.eql(3829086746);
        });
    });
});

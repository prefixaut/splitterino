import { Configuration } from '../../src/utils/configuration';
import { expect } from 'chai';

describe('utils/configuration.ts', () => {
    describe('Configuration', () => {
        it('should instantiate with an empty object and get it', () => {
            const conf = new Configuration();
            expect(conf.getAll()).to.eql({});
        });

        it('should instantiate with given object and get it', () => {
            const conf = new Configuration({ foo: 'bar' });
            expect(conf.getAll()).to.eql({ foo: 'bar' });
        });

        it('should clear the content object', () => {
            const conf = new Configuration({ foo: 'bar' });
            expect(conf.getAll()).to.eql({ foo: 'bar' });
            conf.clear();
            expect(conf.getAll()).to.eql({});
        });

        it('should get a simple value', () => {
            const conf = new Configuration({ foo: 'bar' });
            expect(conf.get('foo')).to.equal('bar');
        });

        it('should get a deeply nested value', () => {
            const conf = new Configuration({ foo: { bar: { baz: 'foobar' } } });
            expect(conf.get('foo.bar.baz')).to.equal('foobar');
        });

        it(`should return null if the path is invalid
            and no default value was given`, () => {
            const conf = new Configuration({ foo: { bar: { baz: 'foobar' } } });
            expect(conf.get('baz.bar.foo')).to.equal(null);
        });

        it(`should return default value if the path is invalid
            and a default value was given`, () => {
            const conf = new Configuration({ foo: { bar: { baz: 'foobar' } } });
            expect(conf.get('baz.bar.foo', 'whatever')).to.equal('whatever');
        });

        it('should set an existing value', () => {
            const conf = new Configuration({ foo: { bar: { baz: 'foobar' } } });
            expect(conf.get('foo.bar.baz')).to.equal('foobar');
            conf.set('foo.bar.baz', 'test');
            expect(conf.get('foo.bar.baz')).to.equal('test');
        });

        it('should check value with given typeguards', () => {
            const conf = new Configuration({ foo: { bar: { baz: 'foobar' } } });
            const isStringTypeguard = (value: any) => typeof value === 'string';
            const isFoobarTypeguard = (value: any) => value === 'foobar';
            expect(
                conf.get(
                    'foo.bar.baz',
                    'whatever',
                    [isStringTypeguard, isFoobarTypeguard]
                )
            ).to.equal('foobar');
            conf.set('foo.bar.baz', 'test');
            expect(
                conf.get(
                    'foo.bar.baz',
                    'whatever',
                    [isStringTypeguard]
                )
            ).to.equal('test');
            expect(
                conf.get(
                    'foo.bar.baz',
                    'whatever',
                    [isStringTypeguard, isFoobarTypeguard]
                )
            ).to.equal('whatever');
        });

        it('should check if object has a value', () => {
            const conf = new Configuration({ foo: { bar: { baz: 'foobar' } } });
            const isStringTypeguard = (value: any) => typeof value === 'string';
            const isFoobarTypeguard = (value: any) => value === 'foobar';
            expect(conf.has('foo.bar.baz')).to.equal(true);
            expect(conf.has('baz.bar.foo')).to.equal(false);
        });

        it('should check if object has a value and satisfies typeguard', () => {
            const conf = new Configuration({ foo: { bar: { baz: 'foobar' } } });
            const isStringTypeguard = (value: any) => typeof value === 'string';
            const isFoobarTypeguard = (value: any) => value === 'foobar';
            expect(
                conf.has(
                    'foo.bar.baz',
                    [isStringTypeguard, isFoobarTypeguard]
                )
            ).to.equal(true);
            conf.set('foo.bar.baz', 'test');
            expect(
                conf.has(
                    'foo.bar.baz',
                    [isStringTypeguard]
                )
            ).to.equal(true);
            expect(
                conf.has(
                    'foo.bar.baz',
                    [isStringTypeguard, isFoobarTypeguard]
                )
            ).to.equal(false);
        });
    });
});

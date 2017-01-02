describe("Namespace tests", function() {
    var storage = require('../index');

    it("store and remove", function() {
        // store
        const namespace = storage.localNamespace('jenkins_instance');
        namespace.set('a', 'aval');
        expect(namespace.get('a')).toBe('aval');
        expect(storage.getLocal('jenkins_instance:a')).toBe('aval');

        // remove
        namespace.remove('a');
        expect(namespace.get('a')).not.toBeDefined();
        expect(storage.getLocal('jenkins_instance:a')).not.toBeDefined();
    });

    it("subspace", function() {
        const x = storage.localNamespace('x');
        const y = x.subspace('y');

        // Storing different values under the same key should be fine.
        x.set('a', 'avalx');
        y.set('a', 'avaly');
        expect(x.get('a')).toBe('avalx');
        expect(y.get('a')).toBe('avaly');

        // Lets check that the keys are as expected too.
        expect(storage.getLocal('x:a')).toBe('avalx');
        expect(storage.getLocal('x/y:a')).toBe('avaly');

        // deleting from one namespace should not screw up the other.
        x.remove('a');
        expect(x.get('a')).not.toBeDefined();
        expect(y.get('a')).toBe('avaly');
        y.remove('a');
        expect(y.get('a')).not.toBeDefined();
    });
});
describe("Namespace tests", function() {
    var index = require('../index');
    var storage = require('../storage');

    it("store and remove", function() {
        // store
        const namespace = index.localNamespace('jenkins');
        namespace.set('a', 'aval');
        expect(namespace.get('a')).toBe('aval');
        expect(storage.getLocal('jenkins:a')).toBe('aval');

        // remove
        namespace.remove('a');
        expect(namespace.get('a')).not.toBeDefined();
        expect(storage.getLocal('jenkins:a')).not.toBeDefined();
    });

    it("subspace", function() {
        const x = index.localNamespace('x');
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

    it("clear", function() {
        const x = index.localNamespace('x');
        const y = x.subspace('y');

        // Storing values in both namespaces.
        x.set('a', 'avalx');
        x.set('b', 'bvalx');
        y.set('a', 'avaly');
        y.set('b', 'bvaly');
        expect(x.get('a')).toBe('avalx');
        expect(x.get('b')).toBe('bvalx');
        expect(y.get('a')).toBe('avaly');
        expect(y.get('b')).toBe('bvaly');

        // Clear from one of the namespaces only.
        x.clear();
        expect(x.get('a')).not.toBeDefined();
        expect(x.get('b')).not.toBeDefined();
        expect(y.get('a')).toBe('avaly');
        expect(y.get('b')).toBe('bvaly');
        y.clear();
        expect(y.get('a')).not.toBeDefined();
        expect(y.get('b')).not.toBeDefined();
    });

    it("jenkinsInstanceNamespace", function() {
        // store
        const jenkins = index.jenkinsNamespace();
        jenkins.set('a', 'aval');
        expect(jenkins.get('a')).toBe('aval');
        expect(storage.getLocal('jenkins-instance:a')).toBe('aval');
        jenkins.set('b', 'bval');
        expect(jenkins.get('b')).toBe('bval');
        expect(storage.getLocal('jenkins-instance:b')).toBe('bval');
        jenkins.set('c', 'cval');

        // remove
        jenkins.remove('a');
        expect(jenkins.get('a')).not.toBeDefined();
        expect(storage.getLocal('jenkins-instance:a')).not.toBeDefined();
        expect(jenkins.get('b')).toBe('bval');
        expect(jenkins.get('c')).toBe('cval');

        // clear
        jenkins.clear();
        expect(jenkins.get('b')).not.toBeDefined();
        expect(jenkins.get('c')).not.toBeDefined();
    });
});
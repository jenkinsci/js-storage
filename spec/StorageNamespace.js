describe("Namespace tests", function() {
    var index = require('../index');
    var storage = require('../storage');

    beforeEach(function() {
        storage.local.clear();
    });

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

    it("iterate", function() {
        const jenkinsNS = index.jenkinsNamespace();
        const x = jenkinsNS.subspace('x');
        const y = jenkinsNS.subspace('y');
        const z = y.subspace('y');

        x.set('a', 'val');
        x.set('b', 'val');
        x.set('c', 'val');
        y.set('a', 'val');
        y.set('b', 'val');
        z.set('a', 'val');
        z.set('b', 'val');

        expect(x.count()).toBe(3);
        expect(y.count()).toBe(4); // y + z (because z is a subspace of y)
        expect(jenkinsNS.count()).toBe(7); // x + y + z (because x and y are subspaces of jenkinsNS and z is a subspace of y)
    });

    it("clear", function() {
        const jenkinsNS = index.jenkinsNamespace();
        const x = jenkinsNS.subspace('x');
        const y = jenkinsNS.subspace('y');
        const z = y.subspace('z');

        // Storing values in all namespaces.
        x.set('a', 'avalx');
        x.set('b', 'bvalx');
        y.set('a', 'avaly');
        y.set('b', 'bvaly');
        z.set('a', 'avaly');
        z.set('b', 'bvaly');
        expect(x.count()).toBe(2);
        expect(y.count()).toBe(4); // y nested inside
        expect(y.count(false)).toBe(2); // don't include subspaces
        expect(z.count()).toBe(2);

        // Clear from one of the namespaces only.
        x.clear();
        expect(x.get('a')).not.toBeDefined();
        expect(x.get('b')).not.toBeDefined();
        expect(x.count()).toBe(0);
        expect(y.get('a')).toBe('avaly');
        expect(y.get('b')).toBe('bvaly');
        expect(y.count()).toBe(4);
        expect(z.count()).toBe(2);
        y.clear();
        expect(y.count()).toBe(0);
        expect(z.count()).toBe(0); // is nested inside y, so should be clearer too
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
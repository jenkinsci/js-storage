describe("Namespace tests", function() {
    var storage = require('../index');

    it("store and remove", function() {
        // store
        const namespace = storage.localNamespace('jenkins_instance');
        namespace.set('a', 'aval');
        expect(namespace.get('a')).toBe('aval');
        expect(storage.getLocal('jenkins_instance.a')).toBe('aval');

        // remove
        namespace.remove('a');
        expect(namespace.get('a')).not.toBeDefined();
        expect(storage.getLocal('jenkins_instance.a')).not.toBeDefined();
    });
});
describe("Basic tests", function() {
    var storage = require('../storage');

    it("store and remove", function() {
        // store
        storage.setLocal('a', 'aval');
        expect(storage.getLocal('a')).toBe('aval');

        // remove
        storage.removeLocal('a');
        expect(storage.getLocal('a')).not.toBeDefined();
    });
});
describe("Storage of different types", function() {
    var storage = require('../index');

    it("string", function() {
        storage.setLocal('a', 'aval');
        expect(storage.getLocal('a')).toBe('aval');
    });

    it("object", function() {
        storage.setLocal('a', {a: 'aval'});
        expect(storage.getLocal('a')['a']).toBe('aval');
    });

    it("array", function() {
        storage.setLocal('a', ['aval']);
        expect(storage.getLocal('a')[0]).toBe('aval');
    });

    it("number", function() {
        storage.setLocal('a', 1234);
        expect(storage.getLocal('a')).toBe(1234);
        storage.setLocal('a', 1234.12);
        expect(storage.getLocal('a')).toBe(1234.12);
    });

    it("unsupported", function() {
        try {
            storage.setLocal('a', function(){});
        } catch(e) {
            expect(e.message).toBe('Unexpected call to store type "function". Name: a');
        }
    });
});
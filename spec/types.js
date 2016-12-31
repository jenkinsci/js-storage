describe("Storage of different types", function() {
    var storage = require('../index');

    it("string", function() {
        storage.set('a', 'aval');
        expect(storage.get('a')).toBe('aval');
    });

    it("object", function() {
        storage.set('a', {a: 'aval'});
        expect(storage.get('a')['a']).toBe('aval');
    });

    it("array", function() {
        storage.set('a', ['aval']);
        expect(storage.get('a')[0]).toBe('aval');
    });

    it("number", function() {
        storage.set('a', 1234);
        expect(storage.get('a')).toBe(1234);
        storage.set('a', 1234.12);
        expect(storage.get('a')).toBe(1234.12);
    });

    it("unsupported", function() {
        try {
            storage.set('a', function(){});
        } catch(e) {
            expect(e.message).toBe('Unexpected call to store type "function". Name: a');
        }
    });
});
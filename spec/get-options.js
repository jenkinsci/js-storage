describe("StorageNamespace get function options tests", function() {
    var jenkinsNS = require('../index').jenkinsNamespace();

    it("checkDotParent", function() {
        jenkinsNS.set('a', 'aaaa');
        jenkinsNS.set('a.b', 'bbbb');

        expect(jenkinsNS.get('a')).toBe('aaaa');
        expect(jenkinsNS.get('a.b')).toBe('bbbb');

        expect(jenkinsNS.get('a.b.c')).not.toBeDefined();
        expect(jenkinsNS.get('a.b.c', {checkDotParent: true})).toBe('bbbb'); // from a.b

        expect(jenkinsNS.get('a.d')).not.toBeDefined();
        expect(jenkinsNS.get('a.d', {checkDotParent: true})).toBe('aaaa'); // from a
        expect(jenkinsNS.get('a.d.e', {checkDotParent: true})).toBe('aaaa'); // from a

        expect(jenkinsNS.get('x')).not.toBeDefined();
        expect(jenkinsNS.get('x', {checkDotParent: true})).not.toBeDefined();
    });

    it("checkDotParent - permitted values", function() {
        // Set a series of values along a "dot parent" graph
        jenkinsNS.set('a', 'a');
        jenkinsNS.set('a.b', 'b');
        jenkinsNS.set('a.b.c', 'c');
        jenkinsNS.set('a.b.c.d', 'd');

        // Just yes/no first
        expect(jenkinsNS.get('a.b.c.d', {checkDotParent: true})).toBe('d');

        // Constrain the permitted value to values that don't match
        // what's set, or any of the parent.
        expect(jenkinsNS.get('a.b.c.d', {checkDotParent: []})).not.toBeDefined();
        expect(jenkinsNS.get('a.b.c.d', {checkDotParent: ['x']})).not.toBeDefined();
        expect(jenkinsNS.get('a.b.c.d', {checkDotParent: ['x', 'y']})).not.toBeDefined();

        // Constrain the permitted value to values that do match
        // what's set, or any of the parent.
        expect(jenkinsNS.get('a.b.c.d', {checkDotParent: ['a', 'b', 'c', 'd']})).toBe('d');
        expect(jenkinsNS.get('a.b.c.d', {checkDotParent: ['a', 'b', 'c']})).toBe('c');
        expect(jenkinsNS.get('a.b.c.d', {checkDotParent: ['a', 'b']})).toBe('b');
        expect(jenkinsNS.get('a.b.c.d', {checkDotParent: ['a']})).toBe('a');
    });
});
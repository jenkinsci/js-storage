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
});
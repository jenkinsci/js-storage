describe("window", function() {
    var storage = require('../storage');

    it("does not mock window as object literal", function() {
        expect(typeof global.window).not.toEqual('object');
    });
});
const test = require('node:test');
const assert = require('assert');
var sinon = require("sinon");
const util = require('./util.protected.js');

test('foo', (t) => {
    var context = sinon.fake();
    context.DOMAIN_NAME = "dialer-6443-dev.twil.io";
    environment = util.getEnvironment(context);
    assert.strictEqual(environment, "dev");
});

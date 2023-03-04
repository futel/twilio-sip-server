const test = require('node:test');
const assert = require('assert');
var sinon = require("sinon");
const futelUtil = require('./futel-util.protected.js');

test('getEnvironment', (t) => {
    var context = sinon.fake();
    context.DOMAIN_NAME = "dialer-6443-dev.twil.io";
    environment = futelUtil.getEnvironment(context);
    assert.strictEqual(environment, "dev");
});

test('sipToExtension', async (t) => {
    await t.test('E164 URL', (t) => {
        let url = "sip:+19713512383@direct-futel-stage.sip.twilio.com";
        assert.strictEqual(futelUtil.sipToExtension(url), "+19713512383");
    });
    await t.test('non-E164 URL', (t) => {
        let url = "sip:test@direct-futel-stage.sip.twilio.com";
        assert.strictEqual(futelUtil.sipToExtension(url), "test");
    });
});

test('e164ToExtension', async (t) => {
    const extensionMap = {
        "foo": {
            "outgoing": "outgoing_safe",
            "callerId": "+15035551212"
        },
        "test": {
            "outgoing": "outgoing_safe",
            "callerId": "+15035551213"
        }
    };
    await t.test('existing', (t) => {
        assert.strictEqual(futelUtil.e164ToExtension('+15035551212', extensionMap), "foo");
    });
    await t.test('nonexisting', (t) => {
        assert.strictEqual(futelUtil.e164ToExtension('xyzzy', extensionMap), null);
    });
});

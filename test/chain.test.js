var chain = require('../chain'),
    assert = require('assert');
    
module.exports = {
    'test run() 1': function () {
        chain.run(function() {
            assert.ok(true);
        });
        var i = 0;
        chain.run(function () {
            i++;
            return true;
        }).thenRun(function () {
            i++;
            return true;
        });
        setTimeout(function() {
            assert.equal(2, i);
        }, 50);
    },
    'test run() 2': function () {
        var i = 0;
        chain.run(function () {
            i++;
            return true;
        }, function () {
            i++;
            return true;
        });
        setTimeout(function() {
            assert.equal(2, i);
        }, 50);
    },
    'test then()': function () {
        var i = 0;
        chain.run(function () {
            i++;
            return true;
        }).then(function () {
            i++;
            return true;
        });
        setTimeout(function() {
            assert.equal(2, i);
        }, 50);
    },
}
var chain = require('../chain'), assert = require('assert');

/* Tests run with expresso (https://github.com/visionmedia/expresso) */

var defer = function (func, time) {
    setTimeout(func, time || 10);
}
    
module.exports = {
   
   'test chain.run()': function () {
        chain.run(function() { assert.ok(true); });
    
        var i = j = k = 0;
        
        chain.run(function () { return i++; },         function () { return i++; });
        chain.run(function () { return j++; }).then(   function () { return j++; });
        chain.run(function () { return k++; }).thenRun(function () { return k++; });
        
        assert.equal(2, i); 
        assert.equal(2, j); 
        assert.equal(2, k);
        
        var str = '';
        
        chain.run(function (next) {
            defer(function () {
                str += 'a';
                next();
            });
        }, function () { 
            return str += 'b'; 
        }).then(function (next) {
            defer(function () {
                str += 'c';
                next();
            });
        }, function () { 
            return str += 'd'; 
        });
        
        setTimeout(function() { 
            assert.equal('badc', str); 
        }, 50);
    },
    
    'test chain.chain()': function () {
        chain.chain(function() { assert.ok(true); });
        
        var x = y = z = 0;
        
        chain.chain(function () { return x=1; },           function () { return x=5; });
        chain.chain(function () { return y=1; }).then(     function () { return y=5; });
        chain.chain(function () { return z=1; }).thenChain(function () { return z=5; });
        
        assert.equal(5, x); 
        assert.equal(5, y); 
        assert.equal(5, z); 
        
        var str = '';
        
        chain.chain(function (next) {
            defer(function () {
                str += 'a';
                next();
            });
        }, function () { 
            return str += 'b'; 
        }).then(function (next) {
            defer(function () {
                str += 'c';
                next();
            });
        }, function () { 
            return str += 'd'; 
        });
        
        setTimeout(function() { 
            assert.equal('abcd', str); 
        }, 50);
    },
    
    'test chain.onError() with chain()': function () {        
        var a = b = c = err1 = err2 = 0;
        
        chain.chain(function (next, error) {
            try {
                error();
                c = 0;
            } catch (e) {
                c = 1;
            }
        });
        
        assert.equal(1, c);
        
        chain.onError(function () {
            err1 = 1;
        }).chain(function () { 
            return a=1;
        }, function (next, error) {
            error();
            return true;
        }, function () { 
            return a=5;
        });
        
        assert.equal(1, a); 
        assert.equal(1, err1); 
        
        chain.onError(function () {
            err2 = 1;
        }).chain(function () { 
            return b=1;
        }).then(function (next, error) { 
            error();
            return true;            
        }).then(function () { 
            return b=5; 
        });
        
        assert.equal(1, b); 
        assert.equal(1, err2);
        
    },
    
    'test chain.onError() with run()': function () {        
        var d = e = err3 = 0;
        
        chain.run(function (next, error) {
            try {
                error();
                d = 0;
            } catch (e) {
                d = 1;
            }
        });
        
        assert.equal(1, d);
        
        chain.onError(function () {
            err3 = 1;
        }).run(function () { 
            return e=1;
        }, function (next, error) {
            error();
            return true;
        }, function () { 
            return e=5;
        });
        
        assert.equal(1, e); 
        assert.equal(1, err3); 
    },
    
    'test chain.addMethod()': function () {
        var num = 0;
        chain.addMethod('add', function (args, len) {
            while(len--) num += args[len];
            this.next(true);
        });
        
        chain.add(1, 2, 3);
        
        assert.equal(6, num);
        
        chain.add(5).thenAdd(5, 2);
        
        assert.equal(18, num);
        
        chain.add(1, 2).then(3, 4);
        
        assert.equal(28, num);
    },
    
    'test chain.defer()': function () {
        var num = 0;
        chain.defer(50).thenRun(function () {
            num = 1;
        });
        
        setTimeout(function() { 
            assert.equal(0, num); 
        }, 10);
        
        setTimeout(function() { 
            assert.equal(1, num); 
        }, 80);
    },
}
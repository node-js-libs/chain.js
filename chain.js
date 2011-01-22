/*
 * Copyright (c) 2010 Chris O'Hara <cohara87@gmail.com>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
(function(exports) {
    
    exports = exports || {};
    
    var handlers = {}, createChain, add, nop = function(){};
    
    createChain = function (context, stack, lastMethod) {
    
        var inHandler = context.halt = false;
        
        context.error = function () {
            context.halt = true;
        }
        
        context.next = function (exit) {
            if (exit) {
                inHandler = false;
            }
            if (!context.halt && stack && stack.length) {
                var args = stack.shift(), method = args.shift();
                inHandler = true;
                try {
                    handlers[method].apply(context, [args, args.length, method]);
                } catch (e) {
                    context.error(e);
                }
            }
            return context;
        }
        
        for (var alias in handlers) {
            if (typeof context[alias] === 'function') {
                continue;
            }
            (function (alias) {
                context[alias] = function () {
                    var uc, args = Array.prototype.slice.call(arguments);
                    args.unshift(alias);
                    if (!stack) {
                        return createChain({}, [args], alias);
                    }
                    context.then = context[alias];
                    stack.push(args);
                    return inHandler ? context : context.next();
                }
            }(alias));
        }
        
        //'then' is an alias for the last method that was called
        if (lastMethod) {
            context.then = context[lastMethod];
        }
        
        context.callMethod = function (method, args) {
            args.unshift(method);
            stack.unshift(args);
            context.next(true);
        }
        
        return context.next();
    }
    
    add = exports.addMethod = function (method) {
        var args = Array.prototype.slice.call(arguments), 
            handler = args.pop();
        for (var i = 0, len = args.length; i < len; i++) {
            if (typeof args[i] === 'string') {
                handlers[args[i]] = handler;
            }
        }
        if (!--len) {
            //e.g. adding 'run' also adds 'thenRun' as a method
            handlers['then' + method[0].toUpperCase() + method.substr(1)] = handler;
        }
        createChain(exports);
    }
        
    //Run each function sequentially
    add('chain', function (args) {
        var self = this, next = function () {
            if (self.halt) {
                return;
            } else if (!args.length) {
                return self.next(true);
            }
            try {
                if (null != args.shift().call(this, next, self.error)) {
                    next();
                }
            } catch (e) {
                self.error(e);
            }
        }
        next();
    });
    
    //Run each function in parallel and progress once all functions are complete
    add('run', function (args, arg_len) {
        var self = this, chain = function () {
            if (self.halt) {
                return;
            } else if (!--arg_len) {
                self.next(true);
            }
        }
        for (var i = 0, len = arg_len; !this.halt && i < len; i++) {
            if (null != args[i].call(this, chain, this.error)) {
                chain();
            }
        }
    });

    //Run each function in parallel and progress when any function completes
    add('first', function (args, arg_len) {
        var self = this, next = function () {
            self.next(true);
        }
        for (var i = 0; !this.halt && i < arg_len; i++) {
            if (null != args.shift().call(this, next, this.error)) {
                this.next(true);
            }
        }
    });
    
    //Run each function in parallel but don't wait for any to finish
    add('all', function (args, arg_len) {
        for (var i = 0; !this.halt && i < arg_len; i++) {
            args.shift().call(this, nop, this.error);
        }
        this.next(true);
    });
    
    //Attach error handler(s)
    add('onError', false, function (args, arg_len) {
        var lastError = this.error;
        this.error = function (err) {
            lastError();
            for (var i = 0; i < arg_len; i++) {
                args[i].call(this, err);
            }
        }
    });
    
}(this));
/* Copyright (c) 2010 Chris O'Hara <cohara87@gmail.com>. MIT Licensed (https://github.com/chriso/chain.js/blob/master/LICENSE) */
 
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
                    var args = Array.prototype.slice.call(arguments);
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
        
        context.call = function (method, args) {
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
                if (null != args.shift().call(self, next, self.error)) {
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
        for (var i = 0, len = arg_len; !self.halt && i < len; i++) {
            if (null != args[i].call(self, chain, self.error)) {
                chain();
            }
        }
    });

    //Attach error handler(s)
    add('onError', function (args, arg_len) {
        var lastError = this.error;
        this.error = function (err) {
            lastError();
            for (var i = 0; i < arg_len; i++) {
                args[i].call(this, err);
            }
        }
    });
    
}(this));
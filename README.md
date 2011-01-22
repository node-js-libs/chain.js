**chain.js is a microframework for handling asynchronous JavaScript** - *699 bytes gzipped*

It comes with built-in methods for running functions sequentially or in parallel, and lets you define your own methods to handle complex logic (e.g [load.js](https://github.com/chriso/load.js)).

### run()

Run each argument in parallel and then progress to the next method in the chain once all are complete

    run(func1, func2).then(func3, func4);
    
### chain()

Run each function sequentially

    chain(func1, func2, func3).then(func4); // => equivalent to run(func1).then(func2).then(func3).then(func4);

### defer()

Defer execution of the next method in the chain

    defer(500).thenRun(func1); //Delay execution for 0.5s
    
We can combine built-ins to handle more complicated logic

    run(func1, func2).then(func3, func4).thenChain(func5, func6).thenRun(func7);

**Some things to note:**
    
- `then()` is an alias for the previous method in the chain
- all methods have their own *then<Method>* alias - e.g. `run() === thenRun()`
- separate chains run in their own context

## Adding your own methods

[load.js](https://github.com/chriso/load.js) ([this code](https://github.com/chriso/load.js/blob/master/load.js) in particular) is an example of what you can do with chain.js - it allows you to lazy load scripts in the browser and easily handle complex dependency chains

    //Load script1 and script2 in parallel - when they're complete, load script3
    
    load('script1.js', 'script2.js').then('script3.js').thenRun(function () {
        console.log('Done.');
    });

Or maybe we need to defer loading a script

    defer(500).thenLoad('myscript.js');

Another example

    var num = 0;
    addMethod('add', function (args, argc) {
        while(argc--) num += args[argc];
        this.next(true); //Call the next method in the chain
    });
    
    add(1, 2, 3).then(4, 5, 6); //num === 21
    
## But wait. How do we know when a function is complete?

Synchronous functions are complete when they return something other than `null`

Asynchronous functions are complete when they call `next()` - next is passed as the first argument to each function in the chain

    run(function (next) {
        setTimeout(function () {
            //Do something..
            next();
        }, 100);
    });

## Passing state along the chain

All functions are called in the same context so variables can be shared using `this`

    run(function () {
        this.foo = 'bar';
        return true;
    }).then(function () {
        console.log(this.foo); //'bar'
    });

## Error handling

Use the `onError` method for adding an error handler. All methods in the chain are passed an error callback as the second argument and wrapped in a try..catch

    onError(function (err) {
        //Handle the error
    }).thenRun(function (next, error) {
        error('Something went wrong');
    });

With async functions, it's ok to define the error handler at the end of the chain

    run(async1, async2).then(async3).onError(my_handler);
    
## Installation

Bundle [chain-min.js](https://github.com/chriso/chain.js/blob/master/chain-min.js) or run `npm install chain`

## License

(MIT License)

Copyright (c) 2010 Chris O'Hara <cohara87@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
/* Javascript Async Framework         */
/* Author: notmasteryet; License: MIT */
var $async = {
    stack: [],

    newItems: [],
    operation: null,

    push: function(f, obj, context, returnValue) {
        this.newItems.push({ f: f, obj: obj, context: context, returnValue: returnValue });
        return this;
    },

    pop: function() { return this.stack.pop(); },

    isEmpty: function() { return this.stack.length == 0; },

    commit: function(callback) {
        this.operation(callback);
        while (this.newItems.length > 0)
            this.stack.push(this.newItems.pop());
    },

    lastNewObject: function() {
        return this.newItems[this.newItems.length - 1].obj;
    },

    invoke: function invokeAsync(result, callback) {
        var currentStack = $async.stack;
        if (result == $async) {
            $async.commit($callback);
            return false;
        } else {
            if (callback != undefined) callback(result);
            return true;
        }
        $async.stack = [];

        function $callback(result) {
            var savedStack = $async.stack;
            $async.stack = currentStack;

            var ar = result;
            while (ar != $async && !$async.isEmpty()) {
                var frame = $async.pop();
                var context = frame.context;
                if (frame.returnValue != undefined)
                    context[frame.returnValue] = ar;
                ar = frame.f.apply(frame.obj, [context]);
            }
            if (ar == $async) {
                $async.commit($callback);
            }
            else if (callback != undefined)
                callback(ar);

            $async.stack = savedStack;
        }
    }
};

function sleep(delay) {
    // HACK shortcuts: no arguments during callback, async frame is not inserted
    $async.operation = function(callback) {
        window.setTimeout(callback, delay);
    };
    return $async;
}


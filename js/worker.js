"use strict";

importScripts('plugins/vendor.js');

self.addEventListener('message', function (e) {
    var func = e.data.func,
        opts = e.data.opts,
        args = e.data.args;
    self.postMessage({
        func: func,
        opts: opts,
        resp: {
            init: function (opts, args) {
                var plugin = opts.plugin;
                importScripts('plugins/'+plugin.toLowerCase()+'.js');
                self.vendor = new (Function.prototype.bind.apply(self[plugin], [null].concat(args)));
                self.vendor.init();
                return {
                    sender: self.vendor.sender
                };
            },

            load: function(opts, args) {
                return {
                    message: self.vendor.load.apply(self.vendor, args)
                };
            }
        }[func](opts, args)
    });
}, false);

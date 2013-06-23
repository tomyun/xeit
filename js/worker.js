"use strict";

importScripts('plugins/vendor.js');

//HACK: 진짜 Web Worker인가, FakeWorker인가~
var worker = (typeof window === 'undefined') ? self : self.worker;
worker.addEventListener('message', function (e) {
    var func = e.data.func,
        opts = e.data.opts,
        args = e.data.args;
    worker.postMessage({
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

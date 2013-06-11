"use strict";

importScripts('deps/crypto-js/build/rollups/pbkdf1.js',
              'deps/crypto-js/build/rollups/pbkdf2.js',
              'deps/crypto-js/build/rollups/tripledes.js',
              'deps/crypto-js/build/rollups/rc4.js',
              'deps/crypto-js/build/rollups/seed.js',
              'deps/crypto-js/build/components/enc-cp949.js',
              'deps/crypto-js/build/components/pad-nopadding-min.js');

importScripts('deps/asn1js/asn1.js',
              'deps/asn1js/base64.js',
              'deps/asn1js/oids.js');

importScripts('plugins/vendor.js',
              'plugins/softforum.js',
              'plugins/initech.js',
              'plugins/soft25.js',
              'plugins/natingtel.js');

self.addEventListener('message', function (e) {
    var cmd = e.data.cmd;
    var args = e.data.args;
    switch (cmd) {
        case 'SoftForum':
        case 'IniTech':
        case 'Soft25':
        case 'Natingtel':
        case 'Vendor':
            self.vendor = new (Function.prototype.bind.apply(self[cmd], [null].concat(args)));
            self.vendor.init();
            var res = {
                sender: self.vendor.sender
            };
            break;

        case 'load':
            var res = {
                message: self.vendor.load.apply(self.vendor, args)
            };
            break;
    };
    self.postMessage({
        cmd: cmd,
        res: res
    });
}, false);

"use strict";

importScripts('deps/crypto-js/build/rollups/seed.js',
              'deps/crypto-js/build/components/enc-cp949.js');

var Vendor = function (product) {
    this.product = product || '';
    this.sender = { name: '?', support: false, hint: '-' };
    this.fixer = {};
};

Vendor.prototype = {
    init: function () {},

    peel: function (param, decode) {
        param = (param) ? param.replace(/\n/g, '') : '';
        return (decode) ? CryptoJS.enc.CP949.stringify(CryptoJS.enc.Base64.parse(param)) : param;
    },

    blob: function (contents) {
        return {
            src: CryptoJS.enc.Base64.parse(contents).toString(CryptoJS.enc.Latin1),
            offset: 0,

            read: function (length, trim) {
                var trim = trim || false;
                var start = this.offset,
                    end = this.offset + length,
                    value = this.src.slice(start, end);
                this.offset = end;
                return (trim) ? value.split('\0')[0].trim() : value;
            }
        };
    },

    recognize: function (sign, shim) {
        this.sender = this.supported_senders[sign] || ((sign) ? extend({}, this.sender, shim) : this.sender);
        this.fixer = this.supported_fixers[sign] || this.fixer;
    },

    supported_senders: {},

    supported_fixers: {},

    load: function (password) {
        return this.render(this.decrypt(password));
    },

    decrypt: function (password) {
        return '';
    },

    encode: function (content) {
        // 메일 본문 인코딩 변환.
        var message = CryptoJS.enc.Latin1.stringify(content);
        if (message.match(/utf-8/i)) {
            return CryptoJS.enc.Utf8.stringify(content);
        } else {
            message = CryptoJS.enc.CP949.stringify(content);
            return message.replace(/euc-kr/ig, 'utf-8');
        }
    },

    render: function (content) {
        var message = this.render_message(this.encode(content));
        var frame = this.render_frame(this.html);
        return this.render_framed_message(frame, message);
    },

    render_message: function (message) {
        return (this.fixer.fix_message) ? this.fixer.fix_message(message) : message;
    },

    render_frame: function (frame) {
        return (this.fixer.fix_frame) ? this.fixer.fix_frame(frame) : frame;
    },

    render_framed_message: function (frame, message) {
        return message;
    }
};

function extend() {
    for (var i = 1; i < arguments.length; i++) {
        for (var key in arguments[i]) {
            if (arguments[i].hasOwnProperty(key)) {
                arguments[0][key] = arguments[i][key];
            }
        }
    }
    return arguments[0];
}

"use strict";

var Vendor = function (product) {
    this.product = product || '';
    this.sender = { name: '?', support: false, hint: '-' };
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
        return this.encode(content);
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

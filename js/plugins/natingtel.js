"use strict";

importScripts('deps/crypto-js/build/components/pad-nopadding-min.js');

var Natingtel = function (html, document_mail) {
    this.html = html || '';
    this.document_mail = this.peel(document_mail);
};

Natingtel.prototype = new Vendor('MailDec');
extend(Natingtel.prototype, {
    init: function () {
        this.sender = {
            name: '대신증권',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }]
        };
    },

    keygen: function (password) {
        var message = CryptoJS.enc.Latin1.parse('cybos family ...'),
            key = CryptoJS.enc.Latin1.parse(('11111111111' + password).substring(0, 16));
        return {
            next: function () {
                message = CryptoJS.SEED.encrypt(
                    message,
                    key,
                    {
                        padding: CryptoJS.pad.NoPadding,
                        mode: CryptoJS.mode.CBC,
                        iv: CryptoJS.enc.Hex.parse("0")
                    }
                ).ciphertext;
                return message;
            }
        };
    },

    decrypt: function (password) {
        var that = this;
        var keyword = (function (password) {
            var keygen = that.keygen(password),
                key = keygen.next(),
                i = 0;
            return {
                next: function () {
                    var keyword = key.words[i++];
                    if (i == key.words.length) {
                        key = keygen.next();
                        i = 0;
                    }
                    return keyword;
                }
            }
        })(password);

        var content = CryptoJS.enc.Base64.parse(this.document_mail),
            length = content.words.length;
        for (var i = 0; i < length; i++) {
            content.words[i] ^= keyword.next();
        }

        this.verify(content, password);

        //HACK: 뒷부분의 비밀번호 비교용 문자열 제거.
        content.sigBytes -= password.length;
        return content;
    },

    verify: function (content, password) {
        //HACK: encode()의 stringify()와 중복.
        if (CryptoJS.enc.CP949.stringify(content).slice(-password.length) != password) {
            throw Error('비밀번호가 틀린 것 같은데 다시 한번 입력해주시겠어요?');
        }
    }
});

"use strict";

importScripts('deps/crypto-js/build/rollups/rc4.js');

var Soft25 = function (html, contents) {
    this.html = html || '';
    this.contents = this.peel(contents);
};

Soft25.prototype = new Vendor('JX-Mail Enterprise');
extend(Soft25.prototype, {
    init: function () {
        var S = this.unpack();
        extend(this, S);

        this.recognize(this.normalize(S.Sender), S.HintKey, {
            name: S.Sender,
            hint: S.ContentEncryptionAlgorithm
        });
    },

    normalize: function (name) {
        if (name.search(/(kt|olleh.com|show.co.kr|ktfreetel.com)/i) > -1) {
            return 'KT';
        } else {
            return name;
        }
    },

    supported_senders: {
        '병무청(동원담당)': {
            name: '병무청',
            support: false,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }]
        },

        'KT': {
            name: 'KT',
            support: true,
            rule: [{
                hint: '생년월일',
                size: 6
            }, {
                hint: '주민등록번호 뒤',
                size: 7
            }]
        }
    },

    unpack: function () {
        function ord(string, reverse) {
            var reverse = reverse || false,
                string = (reverse) ? string.split('').reverse().join('') : string;

            var value = 0;
            for (var i = 0; i < string.length; i++) {
                value <<= 8
                value += string.charCodeAt(i)
            }
            return value;
        }

        var blob = this.blob(this.contents);
        var headerLength = ord(blob.read(2), true),
            encryptedHeader = blob.read(headerLength),
            decryptedHeader = '';
        for (var i = 0; i < headerLength; i++) {
            decryptedHeader += String.fromCharCode(encryptedHeader.charCodeAt(i) ^ 0x6b);
        }

        var struct = {},
            params = decryptedHeader.split('\n');
        for (var i in params) {
            var values = params[i].split(': ');
            if (values[0]) {
                struct[values[0]] = values[1];
            }
        }
        for (var key in struct) {
            var value = struct[key];
            if (key.match(/Count|Offset|Size|Use$/)) {
                struct[key] = (value.length > 0) ? parseInt(value) : '';
            } else if (key.match(/HintKey|MailSubject|Sender$/)) {
                value = value.trim();
                var buffer = new ArrayBuffer(value.length),
                    bufferView = new Uint8Array(buffer);
                for (var i = 0; i < value.length; i++) {
                    bufferView[i] = value.charCodeAt(i);
                }

                //HACK: couldn't import lib-typedarray.js from CryptoJS
                //var wordArray = CryptoJS.lib.WordArray.create(bufferView);
                var words = [];
                for (var i = 0; i < bufferView.byteLength; i++) {
                    words[i >>> 2] |= bufferView[i] << (24 - (i % 4) * 8);
                }
                var wordArray = CryptoJS.lib.WordArray.create(words, bufferView.byteLength);
                struct[key] = CryptoJS.enc.CP949.stringify(wordArray);
            }
        }
        if (struct.SenderCertUse) {
            struct.SenderCertData = CryptoJS.enc.Latin1.parse(blob.read(struct.SenderCertSize));
        }
        struct.OriginalFileData = CryptoJS.enc.Latin1.parse(blob.read(struct.OriginalFileSize));
        return struct;
    },

    keygen: function (password) {
        return CryptoJS.enc.Latin1.parse(password);
    },

    decrypt: function (password) {
        var key = this.keygen(password);
        this.verify('JXBLOCKMAIL!@#', key);

        return CryptoJS.RC4.decrypt(
            {
                ciphertext: this.OriginalFileData
            },
            key
        );
    },

    verify: function (secret, key) {
        // HashKey, HeaderEncKey, ReceiverVid 중 가장 간단한 것으로 비교.
        var hash = CryptoJS.MD5(key).toString(CryptoJS.enc.Hex);
        if (hash != this.HashKey) {
            throw Error('비밀번호가 틀린 것 같은데 다시 한번 입력해주시겠어요?');
        }
    }
});

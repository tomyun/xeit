"use strict";

importScripts('deps/crypto-js/build/rollups/tripledes.js',
              'deps/crypto-js/build/rollups/pbkdf1.js',
              'deps/crypto-js/build/rollups/pbkdf2.js');

var IniTech = function (html, contents, question, attachedFile, optData) {
    this.html = html || '';
    this.contents = this.peel(contents);
    this.question = this.peel(question, true);
    this.attachedFile = attachedFile || '';
    this.optData = this.peel(optData);
};

IniTech.prototype = new Vendor('INISAFE Mail');
extend(IniTech.prototype, {
    init: function () {
        var S = this.unpack();

        this.recognize(S.company, this.question, {
            name: S.company,
            rule: [{
                hint: S.keygen
            }],
            salt: ''
        });

        this.checkArea = S.checkArea;
        this.dataArea = S.dataArea;

        this.hasher = {
            MD5: { helper: CryptoJS.MD5, algorithm: CryptoJS.algo.MD5 },
            SHA1: { helper: CryptoJS.SHA1, algorithm: CryptoJS.algo.SHA1 }
        }[S.hash];

        this.cipher = {
            DES: { helper: CryptoJS.DES, algorithm: CryptoJS.algo.DES },
            SEED: { helper: CryptoJS.SEED, algorithm: CryptoJS.algo.SEED }
        }[S.crypto[0]];

        this.mode = {
            CBC: CryptoJS.mode.CBC
        }[S.crypto[1]];

        this.padding = {
            PKCS5Padding: CryptoJS.pad.Pkcs7
        }[S.crypto[2]];

        if (S.keygen == 'INITECH') {
            this.iv = CryptoJS.enc.Latin1.parse(S.iv);
            this.salt = this.sender.salt;
            this.keygen = this.keygenINITECH;
        } else {
            if (S.version >= 'J 1.0.3') {
                this.iv = CryptoJS.enc.Base64.parse(S.iv);
                this.salt = this.iv.clone();
            } else {
                this.iv = CryptoJS.enc.Latin1.parse(S.iv);
                this.salt = CryptoJS.enc.Latin1.parse(this.sender.salt);
            }

            if (S.keygen == 'PBKDF1') {
                this.keygen = this.keygenPBKDF1;
            } else if (S.keygen == 'PBKDF2') {
                this.keygen = this.keygenPBKDF2;
            }
        }
    },

    supported_senders: {
        BA: {
            name: '한국씨티은행',
            support: true,
            experimental: true,
            rule: [{
                hint: ['주민등록번호 뒤', '사업자등록번호 뒤'],
                size: 7
            }],
            salt: 'goodbank'
        },

        BC: {
            name: 'NH농협카드',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }, {
                hint: '사업자등록번호',
                size: 10
            }],
            salt: 'nonghyup'
        },

        BK: {
            name: '산업은행',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }],
            salt: 'kdb'
        },

        BO: {
            name: '신한은행',
            support: true,
            rule: [{
                hint: '보안메일 비밀번호',
                size: '6~8\\w'
            }],
            salt: 'shinhanbank'
        },

        CC: {
            name: 'BC카드',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }, {
                hint: '사업자등록번호',
                size: 10
            }],
            salt: 'bccard'
        },

        DI: {
            name: '하나SK카드',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }, {
                hint: '사업자등록번호',
                size: 10
            }],
            salt: 'defaultmailid'
        },

        IA: {
            name: '신한생명',
            support: true,
            experimental: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }, {
                hint: '사업자등록번호',
                size: 10
            }],
            salt: 'shinhanlife'
        },        

        IB: {
            name: '한화생명',
            support: true,
            experimental: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }],
            salt: 'korealife'
        },

        IC: {
            name: '푸르덴셜생명',
            support: true,
            experimental: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }],
            salt: 'prudentiallife'
        },

        ID: {
            name: 'The-K손해보험',
            support: true,
            experimental: true,
            rule: [{
                hint: '확인코드'
            }],
            salt: 'kyowonnara'
        },

        IE: {
            name: '교보생명',
            support: true,
            experimental: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }, {
                hint: '사업자등록번호 뒤',
                size: 5
            }],
            salt: 'kyobolife'
        },

        IF: {
            name: 'MG손해보험',
            support: true,
            experimental: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }, {
                hint: '사업자등록번호 뒤',
                size: 4
            }],
            salt: 'greenfire'
        },

        IG: {
            name: '동부화재',
            support: true,
            experimental: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }, {
                hint: '사업자등록번호',
                size: 10
            }],
            salt: 'dongbufire'
        },

        IH: {
            name: '현대해상',
            support: true,
            experimental: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }, {
                hint: '사업자등록번호 뒤',
                size: 5
            }],
            salt: 'hicokr'
        },

        IK: {
            name: '한화생명',
            support: true,
            experimental: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }, {
                hint: '사업자등록번호',
                size: 10
            }],
            salt: 'korealife2'
        },

        KA: {
            name: 'Initech',
            support: true,
            rule: [{
                hint: '확인코드'
            }],
            salt: 'consulting'
        },

        MC: {
            name: 'CJ헬로모바일',
            support: true,
            experimental: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }, {
                hint: '사업자등록번호',
                size: 10
            }],
            salt: 'cjhello'
        },

        TC: {
            name: 'SKT',
            support: true,
            rule: [{
                hint: '생년월일',
                size: 6
            }, {
                hint: '주민등록번호 뒤',
                size: 7
            }, {
                hint: '법인등록번호 뒤',
                size: 7
            }, {
                hint: '사업자등록번호',
                size: 10
            }],
            salt: 'SKT'
        },

        TH: {
            name: 'KT',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }, {
                hint: '법인등록번호 뒤',
                size: 7
            }],
            salt: 'ktbill'
        }
    },

    supported_fixers: function (fixer) {
        return {
            common: fixer,

            CC: {
                fix_frame: function (frame) {
                    return frame.replace('id="objHeader"', '$& style="display:none"');
                }
            },

            DI: {
                fix_message: function (message) {
                    return message.replace(/href="#"/g, '').replace(".getElementById('tab_img').", '.');
                },

                ignore_replacer: true
            },

            TC: {
                ignore_replacer: true
            },
        };
    }({
        weave: function (frame, message) {
            if (this.ignore_replacer) {
                var offset = /(<!DOCTYPE|<html|<head|<body)/i.exec(message);
                if (offset) {
                    //HACK: 일부 메일 앞쪽의 알 수 없는 (암호화 관련?) 문자열 제거.
                    return message.slice(offset.index);
                } else {
                    return message;
                }
            } else {
                return frame.replace(
                    /id=['"]InitechSMMsgToReplace['"]>/,
                    '>' + message.replace(/\$/g, '$$$$')
                );
            }
        },

        ignore_replacer: false
    }),

    unpack: function () {
        var blob = this.blob(this.contents);
        var struct = {
            version: blob.read(9, true),
            count: parseInt(blob.read(1), 10),
            company: blob.read(2),
            crypto: blob.read(25, true).split('/'),
            hash: blob.read(20, true),
            iv: blob.read(30),
            keygen: blob.read(20, true),
            checkAreaLength: parseInt(blob.read(10), 10),
            dataAreaLength: parseInt(blob.read(10), 10)
        };
        struct.checkArea = CryptoJS.enc.Latin1.parse(blob.read(struct.checkAreaLength));
        struct.dataArea = CryptoJS.enc.Latin1.parse(blob.read(struct.dataAreaLength));
        return struct;
    },

    keygenINITECH: function (password) {
        var saltedKey1 = this.salt + '|' + password,
            hashedKey = CryptoJS.SHA1(CryptoJS.SHA1(CryptoJS.SHA1(saltedKey1))),
            saltedKey2 = this.salt + password + hashedKey.toString(CryptoJS.enc.Latin1);
        return this.hasher.helper(CryptoJS.enc.Latin1.parse(saltedKey2));
    },

    keygenPBKDF1: function (password) {
        return CryptoJS.PBKDF1(password, this.salt, {
            keySize: this.cipher.algorithm.keySize,
            hasher: this.hasher.algorithm,
            iterations: 5139
        });
    },

    keygenPBKDF2: function (password) {
        return CryptoJS.PBKDF2(password, this.salt, {
            keySize: this.cipher.algorithm.keySize,
            iterations: 5139
        });
    },

    decrypt: function (password) {
        var key = this.keygen(password);
        this.verify('Initech', key);

        return this.cipher.helper.decrypt(
            {
                ciphertext: this.dataArea
            },
            key,
            {
                iv: this.iv,
                mode: this.mode,
                padding: this.padding
            }
        );
    },

    verify: function (secret, key) {
        if (this.cipher.helper.decrypt(
            {
                ciphertext: this.checkArea
            },
            key,
            {
                iv: this.iv,
                mode: this.mode,
                padding: this.padding
            }
        ).toString(CryptoJS.enc.Latin1) != secret) {
            throw Error('비밀번호가 틀린 것 같은데 다시 한번 입력해주시겠어요?');
        }
    }
});

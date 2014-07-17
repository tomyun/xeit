"use strict";

importScripts('deps/crypto-js/build/rollups/tripledes.js',
              'deps/crypto-js/build/rollups/rc2.js',
              'deps/crypto-js/build/rollups/pbkdf2.js',
              'deps/crypto-js/build/components/sha1.js',
              'deps/asn1js/asn1.js',
              'deps/asn1js/base64.js',
              'deps/asn1js/oids.js');

var SoftForum = function (html, smime_header, smime_body, info_msg, ui_option, ui_desc) {
    this.html = html || '';
    this.smime_header = this.peel(smime_header, true);
    this.smime_body = this.peel(smime_body);
    this.info_msg = this.peel(info_msg, true);
    this.ui_option = ui_option || '';
    this.ui_desc = ui_desc || '';
};

SoftForum.prototype = new Vendor('XecureExpress');
extend(SoftForum.prototype, {
    init: function () {
        var contentType = this.smime_header.match(/Content-Type: \s*([\w-\/]+);*/i)[1];
        if (contentType === 'application/pkcs7-mime') {
            this.decrypt = function (password) {
                return this.decryptSMIME(this.smime_body, password);
            };
        } else if (contentType === 'application/x-pwd') {
            var match = this.smime_header.match(/X-XE_KEY: \s*([\d]+): \s*([\w+\/=]+);*/i),
                kind = parseInt(match[1]),
                key = match[2];
            this.decrypt = function (password) {
                return this.decryptPWD(kind, key, this.smime_body, password);
            };
        }

        //HACK: 구분자가 '보안메일'로 동일한 발송기관 강제 구분.
        var company = this.ui_desc;
        if (company === '보안메일' || company === 'ｺｸｾﾈｸﾞﾀﾏ' || company === '���ȸ���') {
            if (this.smime_header.indexOf('esero.go.kr') > -1) {
                company = 'Xeit.esero';
            } else if (this.info_msg.indexOf('hanabank') > -1) {
                company = 'Xeit.hanabank';
            } else if (this.html.indexOf('kbcard') > -1) {
                company = 'Xeit.kbcard';
            } else if (/(?=.*lottecard)(?=.*point)/.test(this.smime_header)) {
                company = 'Xeit.lottepoint';
            } else if (this.smime_header.indexOf('samsungcard.co.kr') > -1) {
                company = 'Xeit.samsungcard';
            } else if (this.html.indexOf('uplus.co.kr') > -1) {
                company = 'Xeit.uplus';
            } else if (this.info_msg.indexOf('KEB') > -1) {
                company = 'Xeit.yescard';
            } else if (this.info_msg.indexOf('LIG') > -1) {
                company = 'Xeit.lig';
            } else if (this.info_msg.indexOf('miraeassetlife.com') > -1) {
                company = 'Xeit.miraeassetlife';
            } else {
                company = '보안메일';
            }
        } else if (company === 'ｱｹｹﾎｿｬｱﾝ ｺｸｾﾈｸﾞﾀﾏ') {
            company = '국민연금 보안메일';
        } else if (company === '悼剧积疙 焊救皋老') {
            company = '동양생명 보안메일';
        } else if (company === '') {
            if (this.smime_header.indexOf('keb.co.kr') > -1) {
                company = 'Xeit.yescard';
            } else {
                company = '?';
            }
        }

        var notice = this.smime_header.match(/X-XEI_PWD_MSG: \s*(.+)/i)[1].replace(/0x0(A|D)/gi, '');

        this.recognize(company, notice, {
            name: company,
            support: true,
            experimental: true
        });
    },

    supported_senders: {
        'HyundaiCard': {
            name: '현대카드',
            support: true,
            rule: [{
                hint: ['주민등록번호 뒤', '사업자등록번호 뒤'],
                size: 7
            }]
        },

        'LG카드 보안메일': {
            name: '신한카드 (구 LG카드)',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }]
        },

        'SAMSUNG LIFE': {
            name: '삼성생명',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }]
        },

        'TRUEFRIEND': {
            name: '한국투자증권',
            support: true,
            rule: [{
                hint: ['주민등록번호 뒤', '사업자등록번호 뒤'],
                size: 7
            }]
        },

        'Xeit.esero': {
            name: '국세청',
            support: true,
            rule: [{
                hint: '사업자등록번호',
                size: 10
            }, {
                hint: '주민등록번호 뒤',
                size: 7
            }]
        },

        'Xeit.hanabank': {
            name: '하나은행',
            support: true,
            rule: [{
                hint: '생년월일',
                size: 6
            }, {
                hint: ['주민등록번호 뒤', '사업자등록번호 뒤'],
                size: 7
            }]
        },

        'Xeit.kbcard': {
            name: 'KB국민카드',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }, {
                hint: '사업자등록번호',
                size: 10
            }, {
                hint: 'SMS인증번호',
                size: 6
            }]
        },

        'Xeit.lig': {
            name: 'LIG손해보험',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }, {
                hint: '사업자등록번호',
                size: 10
            }, {
                hint: '보유자코드',
                size: 8
            }]
        },

        'Xeit.lottepoint': {
            name: '롯데포인트카드',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }]
        },

        'Xeit.miraeassetlife': {
            name: '미래에셋생명',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }]
        },

        'Xeit.samsungcard': {
            name: '삼성카드',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }]
        },

        'Xeit.uplus': {
            name: 'LG유플러스',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }]
        },

        'Xeit.yescard': {
            name: '외환은행',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }, {
                hint: '사업자등록번호',
                size: 10
            }]
        },

        '국민연금 보안메일': {
            name: '국민연금',
            support: true,
            rule: [{
                hint: ['주민등록번호 뒤', '사업자등록번호 뒤'],
                size: 7
            }]
        },

        '동양생명 보안메일': {
            name: '동양생명',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }]
        },

        '신한카드 보안메일': {
            name: '신한카드',
            support: true,
            rule: [{
                hint: '주민등록번호 뒤',
                size: 7
            }, {
                hint: '사업자등록번호',
                size: 10
            }]
        },

        '우리은행 보안메일': {
            name: '우리은행',
            support: true,
            experimental: true,
            rule: [{
                hint: '보안메일 비밀번호',
                size: '4~8\\w',
            }]
        }
    },

    supported_fixers: function (fixer) {
        return {
            common: fixer,

            'Xeit.yescard': {
                fix_message: function (message) {
                    return fixer.fix_message(message).replace(/href="#topmove"/g, '');
                }
            },

            'Xeit.samsungcard': {
                fix_message: function (message) {
                    // 외부연결 필요한 신용카드 vs. 자체열람 가능한 체크카드 명세서 구분.
                    if (message.indexOf('encfrm') > -1) {
                        var host = message.match(/form\s+.*name=['"]encfrm['"]\s+.*action=['"](.*)['"]/i)[1];
                        var pvalue = message.match(/input\s+.*name=['"]?pvalue['"]?\s+value=['"]?(\w+)['"]?\s*/i)[1];
                        var _command = message.match(/input\s+.*name=['"]?_command['"]?\s+value=['"]?(\w+)['"]?\s*/i)[1];
                        var url = host+'?pvalue='+pvalue+'&_command='+_command;
                        //HACK: 4px 만큼 줄여주지 않으면 내부 frameset에 의해 스크롤바 겹침.
                        var style = 'width: 100%; height: calc(100% - 4px); height: -webkit-calc(100% - 4px); border: 0;'
                        return '<iframe id="xeit-samsungcard" style="'+style+'" src="'+url+'"></iframe>';
                    } else {
                        return fixer.fix_message(message);
                    }
                },

                weave: function (frame, message) {
                    if (message.indexOf('xeit-samsungcard') > -1) {
                        var style = 'width: 100%; height: 100%; margin: 0;';
                        return '<html><head><body style="'+style+'">'+message+'</body></head></html>';
                    } else {
                        return message;
                    }
                }
            }
        };
    }({
        fix_message: function (message) {
            //HACK: 남아 있는 email header 제거하여 HTML 시작 직전까지 잘라냄.
            var offset = /(<!DOCTYPE|<html|<head|<meta|<body)/i.exec(message);
            if (offset) {
                message = message.slice(offset.index);
            }
            //HACK: 뒷 부분의 multipart 메일 본문도 잘라냄.
            return message.replace(/(<\/html>)(?![\s\S]*<\/html>)[\s\S]*/i, '$1');
        }
    }),

    decryptSMIME: function (envelope, password) {
        var ciphers = {
            desCBC: CryptoJS.DES,   // 1.3.14.3.2.7,
            seedCBC: CryptoJS.SEED, // 1.2.410.200004.1.4
            rc2CBC: CryptoJS.RC2    // 1.2.840.113549.3.2
        };

        var options = {
            desCBC: {},
            seedCBC: {},
            rc2CBC: {
                effectiveKeyBits: 0
            }
        };

        function decipher(algorithm, ciphertext, key, iv) {
            return ciphers[algorithm].decrypt(
                {
                    ciphertext: ciphertext,
                },
                key,
                extend({
                    iv: iv
                }, options[algorithm])
            );
        }

        function keygenASN1(algorithm, params, password) {
            if (algorithm === 'pkcs5PBKDF2') {
                var salt = CryptoJS.enc.Latin1.parse(params.sub[0].contentRaw()),
                    iterationCount = params.sub[1].content();
                return CryptoJS.PBKDF2(password, salt, {
                    iterations: iterationCount
                });
            } else {
                throw Error('새로운 유형의 키 유도 과정이 필요합니다.');
            }
        }

        function decryptASN1(algorithm, params, ciphertext, password) {
            if (algorithm === 'pkcs-5') {
                return decryptASN1(
                    oids[params.sub[0].content()].d,
                    params.sub[1],
                    ciphertext,
                    password
                );
            } else if (algorithm === 'pkcs5PBES2') {
                var kdf = params.sub[0],
                    scheme = params.sub[1];
                var key = keygenASN1(
                    oids[kdf.sub[0].content()].d,
                    kdf.sub[1],
                    password
                );
                var cipher = oids[scheme.sub[0].content()].d,
                    iv = CryptoJS.enc.Latin1.parse(scheme.sub[1].contentRaw());
                return decipher(cipher, ciphertext, key, iv);
            } else if (ciphers.hasOwnProperty(algorithm)) {
                var iv = CryptoJS.enc.Latin1.parse(params.contentRaw());
                return decipher(algorithm, ciphertext, password, iv);
            } else {
                throw Error('새로운 유형의 암호 해석 과정이 필요합니다.');
            }
        }

        ASN1.prototype.contentRaw = function () {
            var offset = this.posContent(),
                length = this.length;
            return this.stream.parseStringISO(offset, offset + length);
        };

        var der = Base64.unarmor(envelope),
            asn1 = ASN1.decode(der),
            envelopedData = asn1.sub[1].sub[0];

        // 주민등록번호로 암호화된 대칭키 복호화.
        var recipientInfos = envelopedData.sub[1],
            keyTransportRecipientInfo = recipientInfos.sub[0],
            keyEncryptionAlgorithm = oids[keyTransportRecipientInfo.sub[2].sub[0].content()].d,
            keyEncryptionParameters = keyTransportRecipientInfo.sub[2].sub[1];
        var encryptedKey = CryptoJS.enc.Latin1.parse(keyTransportRecipientInfo.sub[3].contentRaw()),
            passwordHash = CryptoJS.SHA1(password);
        var decryptedKey = decryptASN1(keyEncryptionAlgorithm, keyEncryptionParameters, encryptedKey, passwordHash);
        this.verify(decryptedKey);

        // 대칭키로 암호화된 메일 본문 복호화.
        var encryptedContentInfo = envelopedData.sub[2],
            contentEncryptionAlgorithm = oids[encryptedContentInfo.sub[1].sub[0].content()].d,
            contentEncryptionParameters = encryptedContentInfo.sub[1].sub[1];
        var encryptedContent = CryptoJS.enc.Latin1.parse(encryptedContentInfo.sub[2].contentRaw());
        var decryptedContent = decryptASN1(contentEncryptionAlgorithm, contentEncryptionParameters, encryptedContent, decryptedKey);
        this.verify(decryptedContent);
        return decryptedContent;
    },

    decryptPWD: function (kind, key, content, password) {
        var ciphers = {
            0: CryptoJS.DES,
            10: CryptoJS.SEED
        };

        var encryptedKey = CryptoJS.enc.Base64.parse(key),
            passwordKey = CryptoJS.SHA1(password),
            iv = CryptoJS.enc.Hex.parse("0");
        var decryptedKey = ciphers[kind].decrypt(
            { ciphertext: encryptedKey },
            passwordKey,
            { iv: iv }
        );
        this.verify(decryptedKey);

        var encryptedContent = CryptoJS.enc.Base64.parse(content);
        var decryptedContent = ciphers[kind].decrypt(
            { ciphertext: encryptedContent },
            decryptedKey,
            { iv: iv }
        );
        this.verify(decryptedContent);
        return decryptedContent;
    },

    verify: function (content) {
        function value(index) {
            return content.words[index >>> 2] >>> ((3 - index % 4) * 8) & 0xff;
        }

        var last = content.words.length * 4 - 1;
        if (last > 0) {
            var length = value(last);
            if (0x01 <= length && length <= 0x10) {
                var pads = [];
                for (var i = 0; i < length; i++) {
                    pads.push(value(last - i));
                }
                if (pads.every(function (element, index, array) {
                    return (element == length);
                })) {
                    return;
                }
            }
        }

        // PKCS#5/#7 padding이 잘못 되어 있으면 비밀번호 오류로 간주.
        throw Error('비밀번호가 틀린 것 같은데 다시 한번 입력해주시겠어요?');
    }
});

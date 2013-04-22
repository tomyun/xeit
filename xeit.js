var xeit = (function () {
    "use strict";

    /**********
     * Vendor *
     **********/

    var Vendor = function (product) {
        this.product = product || '';
        this.sender = { name: '?', support: false, hint: '-', keylen: 0 };
    };

    Vendor.prototype = {
        init: function () {},

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

    /***************************
     * SoftForum XecureExpress *
     ***************************/

    var SoftForum = function (html, smime_header, smime_body, ui_desc) {
        this.html = html || '';
        this.smime_header = smime_header || '';
        this.smime_body = smime_body || '';
        this.ui_desc = ui_desc || '';
    };

    SoftForum.prototype = new Vendor('XecureExpress');
    $.extend(SoftForum.prototype, {
        init: function () {
            var headerWords = CryptoJS.enc.Base64.parse(this.smime_header),
                header = CryptoJS.enc.CP949.stringify(headerWords),
                contentType = header.match(/Content-Type: \s*([\w-\/]+);*/i)[1];
            if (contentType === 'application/pkcs7-mime') {
                this.decrypt = function (password) {
                    return this.decryptSMIME(this.smime_body, password);
                };
            } else if (contentType === 'application/x-pwd') {
                var match = header.match(/X-XE_KEY: \s*([\d]+): \s*([\w+\/=]+);*/i);
                var kind = parseInt(match[1]);
                var key = match[2];
                this.decrypt = function (password) {
                    return this.decryptPWD(kind, key, this.smime_body, password);
                };
            }

            //HACK: 구분자가 '보안메일'로 동일한 발송기관 강제 구분.
            var company = this.ui_desc;
            if (company === '보안메일') {
                if (this.html.indexOf('kbcard.kbstar.com') > -1) {
                    company = 'Xeit.kbcard';
                }
            }

            this.sender = {
                'HyundaiCard': { name: '현대카드', support: true, hint: '주민등록번호 뒤', keylen: 7 },
                'TRUEFRIEND': { name: '한국투자증권', support: true, hint: '주민등록번호 뒤', keylen: 7 },
                'Xeit.kbcard': { name: 'KB국민카드', support: true, hint: '주민등록번호 뒤', keylen: 7 },
                '신한카드 보안메일': { name: '신한카드', support: true, hint: '주민등록번호 뒤', keylen: 7 }
            }[company] || ((company) ? $.extend({}, this.sender, { name: company }) : this.sender);
        },

        decryptSMIME: function (envelope, password) {
            var ciphers = {
                desCBC: CryptoJS.DES,   // 1.3.14.3.2.7,
                seedCBC: CryptoJS.SEED  // 1.2.410.200004.1.4
            };

            ASN1.prototype.contentRaw = function () {
                var offset = this.posContent();
                var length = this.length;
                return this.stream.parseStringISO(offset, offset + length);
            };

            var der = Base64.unarmor(envelope),
                asn1 = ASN1.decode(der),
                envelopedData = asn1.sub[1].sub[0];

            // 주민등록번호로 암호화된 대칭키 복호화.
            var recipientInfos = envelopedData.sub[1],
                keyTransportRecipientInfo = recipientInfos.sub[0],
                keyEncryptionAlgorithm = oids[keyTransportRecipientInfo.sub[2].sub[0].content()].d,
                encryptedKey = CryptoJS.enc.Latin1.parse(keyTransportRecipientInfo.sub[3].contentRaw());
            var passwordKey = CryptoJS.SHA1(password);
            var iv = CryptoJS.enc.Hex.parse("0");
            var decryptedKey = ciphers[keyEncryptionAlgorithm].decrypt(
                { ciphertext: encryptedKey },
                passwordKey,
                { iv: iv }
            );

            this.verify(decryptedKey);

            // 대칭키로 암호화된 메일 본문 복호화.
            var encryptedContentInfo = envelopedData.sub[2],
                contentEncryptionAlgorithm = oids[encryptedContentInfo.sub[1].sub[0].content()].d,
                encryptedContent = CryptoJS.enc.Latin1.parse(encryptedContentInfo.sub[2].contentRaw());
            var decryptedContent = ciphers[contentEncryptionAlgorithm].decrypt(
                { ciphertext: encryptedContent },
                decryptedKey,
                { iv: iv }
            );
            return decryptedContent;
        },

        decryptPWD: function (kind, key, content, password) {
            var ciphers = {
                0: CryptoJS.DES,
                10: CryptoJS.SEED
            };

            var encryptedKey = CryptoJS.enc.Base64.parse(key);
            var passwordKey = CryptoJS.SHA1(password);
            var iv = CryptoJS.enc.Hex.parse("0");
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
            throw Error('다시 입력해보세요!');
        },

        render: function (content) {
            var message = this.encode(content);

            //HACK: 남아 있는 email header 제거하여 HTML 시작 직전까지 잘라냄.
            var offset = /(<!DOCTYPE|<html|<head|<body)/i.exec(message);
            return offset ? message.slice(offset.index) : message;
        }
    });

    /************************
     * IniTech INISAFE Mail *
     ************************/

    var IniTech = function (html, contents, attachedFile, optData) {
        this.html = html || '';
        this.contents = contents || '';
        this.attachedFile = attachedFile || '';
        this.optData = optData || '';
    };

    IniTech.prototype = new Vendor('INISAFE Mail');
    $.extend(IniTech.prototype, {
        init: function () {
            var S = this.unpack();

            this.checkArea = S.checkArea;
            this.dataArea = S.dataArea;

            this.hasher = {
                MD5: CryptoJS.MD5,
                SHA1: CryptoJS.SHA1
            }[S.hash];

            this.cipher = {
                DES: CryptoJS.DES,
                SEED: CryptoJS.SEED
            }[S.crypto[0]];

            this.mode = {
                CBC: CryptoJS.mode.CBC
            }[S.crypto[1]];

            this.padding = {
                PKCS5Padding: CryptoJS.pad.Pkcs7
            }[S.crypto[2]];

            this.sender = {
                BO: { name: '신한은행', support: true, hint: '보안메일 비밀번호', keylen: '6,8', salt: 'shinhanbank' },
                CC: { name: '우리은행 (BC카드)', support: true, hint: '주민등록번호 뒤', keylen: 7, salt: 'bccard', ignore_replacer: true },
                TC: { name: 'SKT', support: true, hint: '주민등록번호 앞 또는 뒤', keylen: '6,7', salt: 'SKT' },
                TH: { name: 'KT', support: true, hint: '주민등록번호 뒤', keylen: 7, salt: 'ktbill' }
            }[S.company] || ((S.company) ? $.extend({}, this.sender, { name: S.company, hint: S.keygen })
                                         : this.sender);

            if (S.keygen == 'INITECH') {
                this.iv = CryptoJS.enc.Latin1.parse(S.iv);
                this.keygen = this.keygenINITECH;
            } else if (S.keygen == 'PBKDF2') {
                this.iv = CryptoJS.enc.Base64.parse(S.iv);
                this.keygen = this.keygenPBKDF2;
            }
        },

        unpack: function () {
            var blob = {
                src: CryptoJS.enc.Base64.parse(this.contents).toString(CryptoJS.enc.Latin1),
                offset: 0,

                read: function (length, trim) {
                    var trim = trim || false;
                    var start = this.offset;
                    var end = this.offset + length;
                    var value = this.src.slice(start, end);
                    this.offset = end;
                    return trim ? $.trim(value.split('\0')[0]) : value;
                }
            };
            var struct = {
                version: blob.read(9),
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
            var saltedKey1 = this.sender.salt + '|' + password;
            var hashedKey = CryptoJS.SHA1(CryptoJS.SHA1(CryptoJS.SHA1(saltedKey1)));
            var saltedKey2 = this.sender.salt + password + hashedKey.toString(CryptoJS.enc.Latin1);
            return this.hasher(CryptoJS.enc.Latin1.parse(saltedKey2));
        },

        keygenPBKDF2: function (password) {
            return CryptoJS.PBKDF2(password, this.iv, { keySize: 128/32, iterations: 5139 });
        },

        decrypt: function (password) {
            var key = this.keygen(password);
            this.verify('Initech', key);

            return this.cipher.decrypt(
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
            if (this.cipher.decrypt(
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
                throw Error('다시 입력해보세요!');
            }
        },

        render: function (content) {
            var message = this.encode(content);
            var rendered = this.html.replace(
                /<object [\s\S]*<\/object>/ig,
                ''
            ).replace(
                /activeControl\([\s\S]*\);?/,
                ''
            );

            var offset = /(<!DOCTYPE|<html|<head|<body)/i.exec(message);
            if (offset) {
                //HACK: 온전한 HTML 문서이면 그대로 표출.
                return message.slice(offset.index);
            } else {
                if (this.sender.ignore_replacer) {
                    return rendered.replace(
                        /<body[\s\S]*?<\/body>/i,
                        '<body>' + message + '</body>'
                    );
                } else {
                    return rendered.replace(
                        /id="InitechSMMsgToReplace">/,
                        '>' + message
                    );
                }
            }
        }
    });

    return {
        init: function (html) {
            var $doc = $.parseHTML(html);
            if ($('#XEIViewer', $doc).length) {
                this.vendor = new SoftForum(
                    html,
                    $('param[name="smime_header"]', $doc).val().replace(/\n/g, ''),
                    $('param[name="smime_body"]', $doc).val().replace(/\n/g, ''),
                    $('param[name="ui_desc"]', $doc).val()
                );
            } else if (html.indexOf('IniMasPlugin') > -1) {
                //HACK: IE에서만 동작하는 activeControl() (function.js) 이슈 회피.
                var body = html.replace(
                    /activeControl\(([\s]*['"])/,
                    "var activeControl = function (a, b, c) {" +
                        "var d = document.createElement('div');" +
                        "d.innerHTML = \"<OBJECT ID='IniMasPluginObj'>\" + a;" +
                        "d.firstChild.innerHTML = b + c;" +
                        "document.getElementById('embedControl').appendChild(d);" +
                    "}($1"
                ).replace(
                    /^[\s\S]*<body.*?>|<\/body>[\s\S]*$/ig,
                    ''
                );
                $doc = $('<div>', { id: 'temp' }).hide().appendTo($('body')).append($.parseHTML(body, document, true));
                this.vendor = new IniTech(
                    html,
                    $('param[name="IniSMContents"]', $doc).val().replace(/\n/g, ''),
                    $('param[name="AttachedFile"]', $doc).val()
                );
                $doc.remove();
            } else if (html.indexOf('IniCrossMailObj') > -1) {
                this.vendor = new IniTech(
                    html,
                    $('param[name="IniSMContents"]', $doc).val().replace(/\n/g, ''),
                    $('param[name="AttachedFile"]', $doc).val(),
                    $('param[name="OptData"]', $doc).val()
                );
            } else {
                this.vendor = new Vendor();
            }
            this.vendor.init();
        },

        load: function (password) {
            return this.vendor.load(password);
        }
    };
})();

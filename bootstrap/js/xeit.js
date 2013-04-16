var xeit = (function () {
    "use strict";

    /**********
     * Vendor *
     **********/

    var Vendor = function (product) {
        this.product = product || '';
        this.sender = { name: '?', support: false };
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

    var SoftForum = function (smime_header, smime_body, ui_desc) {
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
                var key = header.match(/X-XE_KEY: \s*([\d]+): \s*([\w+\/=]+);*/i)[2];
                this.decrypt = function (password) {
                    return this.decryptPWD(key, this.smime_body, password);
                };
            }

            var senders = {
                'TRUEFRIEND': { name: '한국투자증권', support: true },
                '보안메일': { name: 'KB카드', support: true },
                'HyundaiCard': { name: '현대카드', support: true }
            };
            this.sender = senders[this.ui_desc] || this.sender;
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

        decryptPWD: function (key, content, password) {
            var encryptedKey = CryptoJS.enc.Base64.parse(key);
            var passwordKey = CryptoJS.SHA1(password);
            var iv = CryptoJS.enc.Hex.parse("0");
            var decryptedKey = CryptoJS.SEED.decrypt(
                { ciphertext: encryptedKey },
                passwordKey,
                { iv: iv }
            );

            this.verify(decryptedKey);

            var encryptedContent = CryptoJS.enc.Base64.parse(content);
            var decryptedContent = CryptoJS.SEED.decrypt(
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
            throw Error('다시 입력해주세요!');
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

    var IniTech = function (html, contents, attachedFile) {
        this.html = html || '';
        this.contents = contents || '';
        this.attachedFile = attachedFile || '';
    };

    IniTech.prototype = new Vendor('INISAFE Mail');
    $.extend(IniTech.prototype, {
        init: function () {
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

            this.header = {
                version: blob.read(9),
                count: parseInt(blob.read(1), 10),
                company: blob.read(2),
                cipher: blob.read(25, true).split('/'),
                hasher: blob.read(20, true),
                iv: blob.read(30),
                vendor: blob.read(20),
                checkAreaLength: parseInt(blob.read(10), 10),
                dataAreaLength: parseInt(blob.read(10), 10)
            };

            this.checkArea = blob.read(this.header.checkAreaLength);
            this.dataArea = blob.read(this.header.dataAreaLength);

            var senders = {
                CC: { name: '우리은행 BC카드', support: true, salt: 'bccard', ignore_replacer: true },
                TH: { name: 'KT', support: true, salt: 'ktbill' }
            };
            this.sender = senders[this.header.company] || this.sender;
        },

        decrypt: function (password) {
            var hashers = {
                MD5: CryptoJS.MD5
            };
            var saltedKey1 = this.sender.salt + '|' + password;
            var hashedKey = CryptoJS.SHA1(CryptoJS.SHA1(CryptoJS.SHA1(saltedKey1)));
            var saltedKey2 = this.sender.salt + password + hashedKey.toString(CryptoJS.enc.Latin1);
            var key = hashers[this.header.hasher](CryptoJS.enc.Latin1.parse(saltedKey2));

            var ciphers = {
                SEED: CryptoJS.SEED
            };

            var modes = {
                CBC: CryptoJS.mode.CBC
            };

            var paddings = {
                PKCS5Padding: CryptoJS.pad.Pkcs7
            };

            this.verify('Initech');

            return ciphers[this.header.cipher[0]].decrypt(
                {
                    ciphertext: CryptoJS.enc.Latin1.parse(this.dataArea)
                },
                key,
                {
                    iv: CryptoJS.enc.Latin1.parse(this.header.iv),
                    mode: modes[this.header.cipher[1]],
                    padding: paddings[this.header.cipher[2]]
                }
            );
        },

        verify: function (secret) {
            if (ciphers[this.header.cipher[0]].decrypt(
                {
                    ciphertext: CryptoJS.enc.Latin1.parse(this.checkArea)
                },
                key,
                {
                    iv: CryptoJS.enc.Latin1.parse(this.header.iv),
                    mode: modes[this.header.cipher[1]],
                    padding: paddings[this.header.cipher[2]]
                }
            ).toString(CryptoJS.enc.Latin1) != secret) {
                throw Error('다시 입력해주세요!');
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
    });

    return {
        init: function (html) {
            var $doc = $.parseHTML(html);
            if ($('#XEIViewer', $doc).length) {
                this.vendor = new SoftForum(
                    $('param[name="smime_header"]', $doc).val().replace(/\n/g, ''),
                    $('param[name="smime_body"]', $doc).val().replace(/\n/g, ''),
                    $('param[name="ui_desc"]', $doc).val()
                );
            } else if (html.indexOf('IniMasPlugin') > 0) {
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

                //HACK: IE에서만 동작하는 function.js 이슈 회피.
                if (!$('#IniMasPluginObj', $doc).length) {
                    $doc = $('<div>', { id: 'temp' }).hide().appendTo($('body')).append($.parseHTML(body, document, true));
                }

                this.vendor = new IniTech(
                    html,
                    $('param[name="IniSMContents"]', $doc).val().replace(/\n/g, ''),
                    $('param[name="AttachedFile"]', $doc).val()
                );              
            } else {
                this.vendor = new Vendor();
                parent.postMessage('fallback', '*');
            }
            $($doc).remove();
            this.vendor.init();
        },

        load: function (password) {
            return this.vendor.load(password);
        }
    };
})();

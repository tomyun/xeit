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
                    var start = this.offset;
                    var end = this.offset + length;
                    var value = this.src.slice(start, end);
                    this.offset = end;
                    return (trim) ? $.trim(value.split('\0')[0]) : value;
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

    /***************************
     * SoftForum XecureExpress *
     ***************************/

    var SoftForum = function (html, smime_header, smime_body, info_msg, ui_option, ui_desc) {
        this.html = html || '';
        this.smime_header = this.peel(smime_header);
        this.smime_body = this.peel(smime_body);
        this.info_msg = this.peel(info_msg, true);
        this.ui_option = ui_option || '';
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
                if (this.html.indexOf('kbcard') > -1) {
                    company = 'Xeit.kbcard';
                } else if (/(?=.*lottecard)(?=.*point)/.test(header)) {
                    company = 'Xeit.lottepoint';
                } else if (this.html.indexOf('samsungcard.co.kr') > -1) {
                    company = 'Xeit.samsungcard';
                } else if (this.html.indexOf('uplus.co.kr') > -1) {
                    company = 'Xeit.uplus';
                } else if (this.info_msg.indexOf('KEB') > -1) {
                    company = 'Xeit.yescard';
                }
            }

            this.sender = {
                'HyundaiCard': {
                    name: '현대카드',
                    support: true,
                    hint: '주민등록번호 뒤',
                    keylen: 7
                },

                'LG카드 보안메일': {
                    name: '신한카드 (구 LG카드)',
                    support: true,
                    hint: '주민등록번호 뒤',
                    keylen: 7
                },

                'TRUEFRIEND': {
                    name: '한국투자증권',
                    support: true,
                    hint: '주민등록번호 뒤',
                    keylen: 7
                },

                'Xeit.kbcard': {
                    name: 'KB국민카드',
                    support: true,
                    hint: '주민등록번호 뒤',
                    keylen: 7
                },

                'Xeit.lottepoint': {
                    name: '롯데포인트카드',
                    support: true,
                    hint: '주민등록번호 뒤',
                    keylen: 7
                },

                'Xeit.samsungcard': {
                    name: '삼성카드',
                    support: false,
                    hint: '-',
                    keylen: 0
                },

                'Xeit.uplus': {
                    name: 'LG유플러스',
                    support: true,
                    hint: '주민등록번호 뒤',
                    keylen: 7
                },

                'Xeit.yescard': {
                    name: '외환카드',
                    support: true,
                    hint: '주민등록번호 뒤',
                    keylen: 7,
                    render_hack: function (f, m) {
                        return {
                            'frame': f,
                            'message': m.replace(/href="#topmove"/g, '')
                        };
                    }
                },

                '신한카드 보안메일': {
                    name: '신한카드',
                    support: true,
                    hint: '주민등록번호 뒤',
                    keylen: 7
                }
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
            var frame = this.html;

            //HACK: 남아 있는 email header 제거하여 HTML 시작 직전까지 잘라냄.
            var offset = /(<!DOCTYPE|<html|<head|<body)/i.exec(message);
            message = (offset) ? message.slice(offset.index) : message;

            //HACK: 제대로 표시하려면 HTML 조작이 필요한 일부를 위해.
            if (this.sender.render_hack) {
                var fm = this.sender.render_hack(frame, message);
                frame = fm['frame'];
                message = fm['message'];
            }

            return message;
        }
    });

    /************************
     * IniTech INISAFE Mail *
     ************************/

    var IniTech = function (html, contents, attachedFile, optData) {
        this.html = html || '';
        this.contents = this.peel(contents);
        this.attachedFile = attachedFile || '';
        this.optData = this.peel(optData);
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
                BO: {
                    name: '신한은행',
                    support: true,
                    hint: '보안메일 비밀번호',
                    keylen: '6,8',
                    salt: 'shinhanbank'
                },

                CC: {
                    name: '우리은행 (BC카드)',
                    support: true,
                    hint: '주민등록번호 뒤',
                    keylen: 7,
                    salt: 'bccard',
                    render_hack: function (f, m) {
                        return {
                            'frame': f.replace('id="objHeader"', '$& style="display:none"'),
                            'message': m
                        };
                    }
                },

                TC: {
                    name: 'SKT',
                    support: true,
                    hint: '주민등록번호 앞 또는 뒤',
                    keylen: '6,7',
                    salt: 'SKT',
                    ignore_replacer: true
                },

                TH: {
                    name: 'KT',
                    support: true,
                    hint: '주민등록번호 뒤',
                    keylen: 7,
                    salt: 'ktbill'
                }
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
            var blob = this.blob(this.contents);
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
            var frame = this.html.replace(
                /<object [\s\S]*<\/object>/ig,
                ''
            ).replace(
                /activeControl\([\s\S]*\);?/,
                ''
            );

            //HACK: 제대로 표시하려면 HTML 조작이 필요한 일부를 위해.
            if (this.sender.render_hack) {
                var fm = this.sender.render_hack(frame, message);
                frame = fm['frame'];
                message = fm['message'];
            }

            if (this.sender.ignore_replacer) {
                var offset = /(<!DOCTYPE|<html|<head|<body)/i.exec(message);
                if (offset) {
                    //HACK: 일부 메일 앞쪽의 알 수 없는 (암호화 관련?) 문자열 제거.
                    return message.slice(offset.index);
                } else {
                    return message;
                }
            } else {
                return frame.replace(
                    /id="InitechSMMsgToReplace">/,
                    '>' + message.replace(/\$/g, '$$$$')
                );
            }
        }
    });

    /*************************
     * Soft25 JX-Mail Secure *
     *************************/

    var Soft25 = function (html, contents) {
        this.html = html || '';
        this.contents = this.peel(contents);
    };

    Soft25.prototype = new Vendor('JX-Mail Secure');
    $.extend(Soft25.prototype, {
        init: function () {
            var S = this.unpack();
            $.extend(this, S);

            this.sender = {
                '병무청(동원담당)': {
                    name: '병무청',
                    support: false,
                    hint: '-',
                    keylen: 0
                }
            }[S.Sender] || ((S.Sender) ? $.extend({}, this.sender, { name: S.Sender, hint: S.ContentEncryptionAlgorithm })
                                         : this.sender);
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
            $.each(params, function(i, param) {
                var values = param.split(': ');
                if (values[0]) {
                    struct[values[0]] = values[1];
                }
            });
            $.each(struct, function(key, value) {
                if (key.match(/Count|Offset|Size|Use$/)) {
                    struct[key] = (value.length > 0) ? parseInt(value) : '';
                } else if (key.match(/HintKey|MailSubject|Sender$/)) {
                    value = $.trim(value);
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
            });
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
                throw Error('다시 입력해보세요!');
            }
        },

        render: function (content) {
            return this.encode(content);
        }
    });

    return {
        init: function (html) {
            //HACK: <object> 태그의 상위 노드로써 DOM에 임시로 추가하여 query 수행.
            var $doc = $('<div>', { id: 'Xeit-temp' }).hide().appendTo($('body')).append($.parseHTML(html));
            if ($('#XEIViewer').length) {
                this.vendor = new SoftForum(
                    html,
                    $('param[name="smime_header"]').val(),
                    $('param[name="smime_body"]').val(),
                    $('param[name="info_msg"]').val(),
                    $('param[name="ui_option"]').val(),
                    $('param[name="ui_desc"]').val()
                );
            } else if (/prtObj\(([\s\S])*\);/.test(html)) {
                //TODO: LGU+ 인식용으로 기존 로직과 병합 가능성 확인 필요. (by RyanYoon)
                var data = html.match(/prtObj\(([\s\S])*\);/)[0].match(/[^']+(?!,)/g);
                this.vendor = new SoftForum(
                    html,
                    data[5],
                    data[7],
                    data[9],
                    data[11],
                    data[13]
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
                $doc.empty().append($.parseHTML(body, document, true));
                this.vendor = new IniTech(
                    html,
                    $('param[name="IniSMContents"]').val(),
                    $('param[name="AttachedFile"]').val()
                );
            } else if (html.indexOf('IniCrossMailObj') > -1) {
                this.vendor = new IniTech(
                    html,
                    $('param[name="IniSMContents"]').val(),
                    $('param[name="AttachedFile"]').val(),
                    $('param[name="OptData"]').val()
                );
            } else if ($('#JXCEAL').length) {
                this.vendor = new Soft25(
                    html,
                    $('#JSEncContents').val()
                );
            } else {
                this.vendor = new Vendor();
            }
            $doc.remove();
            this.vendor.init();
        },

        load: function (password) {
            return this.vendor.load(password);
        }
    };
})();

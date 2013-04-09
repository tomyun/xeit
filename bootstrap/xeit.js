var xeit = (function () {
	"use strict";

	/**********
	 * Vendor *
	 **********/

	var Vendor = function (name) {
		this.name = name || '';
		this.sender = { name: '?', support: false };
	};

	Vendor.prototype = {
		init: function () {},

		encode: function (content) {
			var message = CryptoJS.enc.Latin1.stringify(content);
			if (message.match(/utf-8/i)) {
				message = CryptoJS.enc.Utf8.stringify(content);
			} else {
				message = CryptoJS.enc.CP949.stringify(content);
	        	message = message.replace(/euc-kr/ig, 'utf-8');
			}

			//HACK: DOCTYPE 없는 메일도 있으니 헤더와 본문 사이의 줄바꿈으로 인식.
			// message = message.replace(/[\s\S]*(<!DOCTYPE)/i, "$1")
			var offset = /[\n\r]{3,}/.exec(message);
			if (offset) {
				message = message.slice(offset.index);
			}
			return message;
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

	SoftForum.prototype = new Vendor('SoftForum');
	$.extend(SoftForum.prototype, {
		init: function () {
			var senders = {
				'TRUEFRIEND': { name: '한국투자증권', support: true },
				'보안메일': { name: 'KB카드', support: true },
				'HyundaiCard': { name: '현대카드', support: true }
			};
			this.sender = senders[this.ui_desc] || this.sender;
		},

		decrypt: function (password) {
			var headerWords = CryptoJS.enc.Base64.parse(this.smime_header);
			var header = CryptoJS.enc.CP949.stringify(headerWords);

			var contentType = header.match(/Content-Type: \s*([\w-\/]+);*/i)[1];
			if (contentType == 'application/pkcs7-mime') {
				var content = this.decryptSMIME(this.smime_body, password);
			} else if (contentType == 'application/x-pwd') {
				var key = header.match(/X-XE_KEY: \s*([\d]+): \s*([\w+\/=]+);*/i)[2];
				var content = this.decryptPWD(key, this.smime_body, password);
			}

			// 메일 본문 인코딩 변환.
			return this.encode(content);
		},

		decryptSMIME: function (envelope, password) {
			var ciphers = {
				desCBC: CryptoJS.DES,	// 1.3.14.3.2.7,
				seedCBC: CryptoJS.SEED	// 1.2.410.200004.1.4
			};

			ASN1.prototype.contentRaw = function () {
				var offset = this.posContent();
				var length = this.length;
				return this.stream.parseStringISO(offset, offset + length);
			};

			var der = Base64.unarmor(envelope);
			var asn1 = ASN1.decode(der);
			var envelopedData = asn1.sub[1].sub[0];

			// 주민등록번호로 암호화된 대칭키 복호화.
			var recipientInfos = envelopedData.sub[1];
			var keyTransportRecipientInfo = recipientInfos.sub[0];
			var keyEncryptionAlgorithm = oids[keyTransportRecipientInfo.sub[2].sub[0].content()].d;
			var encryptedKey = CryptoJS.enc.Latin1.parse(keyTransportRecipientInfo.sub[3].contentRaw());
			var passwordKey = CryptoJS.SHA1(password);
			var iv = CryptoJS.enc.Hex.parse("0");
			var decryptedKey = ciphers[keyEncryptionAlgorithm].decrypt(
				{ ciphertext: encryptedKey },
				passwordKey,
				{ iv: iv }
			);

			// 대칭키로 암호화된 메일 본문 복호화.
			var encryptedContentInfo = envelopedData.sub[2];
			var contentEncryptionAlgorithm = oids[encryptedContentInfo.sub[1].sub[0].content()].d;
			var encryptedContent = CryptoJS.enc.Latin1.parse(encryptedContentInfo.sub[2].contentRaw());
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

			var encryptedContent = CryptoJS.enc.Base64.parse(content);
			var decryptedContent = CryptoJS.SEED.decrypt(
				{ ciphertext: encryptedContent },
				decryptedKey,
				{ iv: iv }
			);
			return decryptedContent;
		}
	});

	/************************
	 * IniTech INISAFE Mail *
	 ************************/

	var IniTech = function (contents, attachedFile) {
		this.contents = contents || '';
		this.attachedFile = attachedFile || '';
	};

	IniTech.prototype = new Vendor('IniTech');
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
				count: parseInt(blob.read(1)),
				company: blob.read(2),
				cipher: blob.read(25, true).split('/'),
				hasher: blob.read(20, true),
				iv: blob.read(30),
				vendor: blob.read(20),
				checkAreaLength: parseInt(blob.read(10)),
				dataAreaLength: parseInt(blob.read(10))
			};

			this.checkArea = blob.read(this.header.checkAreaLength);
			this.dataArea = blob.read(this.header.dataAreaLength);

			var senders = {
				TH: { name: 'KT', support: true, salt: 'ktbill' }
			};
			this.sender = senders[this.header.company] || this.sender;
		},

		decrypt: function (password) {
			var hashers = {
				MD5: CryptoJS.MD5,
			};
			var saltedKey1 = this.sender.salt + '|' + password;
			var hashedKey = CryptoJS.SHA1(CryptoJS.SHA1(CryptoJS.SHA1(saltedKey1)));
			var saltedKey2 = this.sender.salt + password + hashedKey.toString(CryptoJS.enc.Latin1);
			var key = hashers[this.header.hasher](CryptoJS.enc.Latin1.parse(saltedKey2));

			var ciphers = {
				SEED: CryptoJS.SEED,
			};

			var modes = {
				CBC: CryptoJS.mode.CBC,
			};

			var paddings = {
				PKCS5Padding: CryptoJS.pad.Pkcs7,
			}

			var decryptedContent = ciphers[this.header.cipher[0]].decrypt(
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

			// 메일 본문 인코딩 변환.
			return this.encode(decryptedContent);
		}
	});

	return {
		init: function (html) {
			var $doc = $.parseHTML(html)
			if ($('#XEIViewer', $doc).length) {
				this.vendor = new SoftForum(
					$('param[name="smime_header"]', $doc).val().replace(/\n/g, ''),
					$('param[name="smime_body"]', $doc).val().replace(/\n/g, ''),
					$('param[name="ui_desc"]', $doc).val()
				);
			} else if (html.indexOf('IniMasPlugin') > 0) {
				html = html.replace(
					'activeControl(',
					"var activeControl = function (a, b, c) {" +
						"var d = document.createElement('div');" +
						"d.innerHTML = \"<OBJECT ID='IniMasPluginObj'>\" + a;" +
						"d.firstChild.innerHTML = b + c;" +
						"document.getElementById('embedControl').appendChild(d);" +
					"}("
				);
				//HACK: IE에서만 동작하는 function.js 이슈 회피.
				if (!$('#IniMasPluginObj', $doc).length) {
					$doc = $('<div>', { id: 'temp' }).hide().appendTo($('body')).append($.parseHTML(html, document, true));
				}

				//TODO: use '#InitechSMMsgToReplace'?
				this.vendor = new IniTech(
					$('param[name="IniSMContents"]', $doc).val().replace(/\n/g, ''),
					$('param[name="AttachedFile"]', $doc).val()
				);				
			} else {
				this.vendor = new Vendor();
				parent.postMessage('fallback', '*');
			}
			$doc.remove();
			this.vendor.init();
		},

		decrypt: function (password) {
			return this.vendor.decrypt(password);
		}
	};
})();

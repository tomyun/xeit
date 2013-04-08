var Xeit = (function () {
	var cls = function (attachment) {
		this.init = function (attachment) {
			this.attachment = attachment || '';

			if ($('#XEIViewer').length !== -1) {
				this.blob = {
					vendor: 'xe',
					smime_header: attachment.find('param[name="smime_header"]').val(),
					smime_body: attachment.find('param[name="smime_body"]').val(),
					ui_desc: attachment.find('param[name="ui_desc"]').val()
				};
			} else if ($('#IniMasPluginObj').length !== -1) {
				//TODO: use '#InitechSMMsgToReplace'?
				this.blob = {
					vendor: 'it',
					IniSMContents: attachment.find('param[name="IniSMContents"]').val(),
					AttachedFile: attachment.find('param[name="AttachedFile"]').val()
				};
			} else {
				this.blob = {
					vendor: 'none'
				};
				parent.postMessage('fallback', '*');
			}

			//TODO: updateBlob(blob)
		};

		this.updateAuthDialog = function () {
			var senders = {
				TRUEFRIEND: { name: '한국투자증권', support: true },
				'보안메일': { name: 'KB카드', support: true },
				'HyundaiCard': { name: '현대카드', support: true }
			};
			var sender = senders[this.blob.ui_desc];
			var name = sender ? sender['name'] : '?';
			var support = sender ? sender['support'] : false;

			$('#auth-sender-name').val(name);
			if (support) {
				$('#auth-sender-support').addClass('label-success').text('지원');
			} else {
				$('#auth-sender-support').addClass('label-important').text('미지원');
				$('#auth-password').prop('disabled', true);
				$('#auth-submit').addClass('disabled');
			}
		};

		this.decrypt = function (password) {
			if (this.blob.vendor == 'xe') {
				var headerBase64 = this.blob.smime_header.replace(/\n/g, '');
				var headerWords = CryptoJS.enc.Base64.parse(headerBase64);
				var header = CryptoJS.enc.CP949.stringify(headerWords);

				var contentType = header.match(/Content-Type: \s*([a-zA-Z/-]*);*/i)[1];
				if (contentType == 'application/pkcs') {
					return this.decrypt_XE_PKCS(password);
				} else if (contentType == 'application/x-pwd') {
					alert("TODO: x-pwd");
				}
			}
		};

		this.decrypt_XE_PKCS = function (password) {
			var ciphers = {
				desCBC: CryptoJS.DES,	// 1.3.14.3.2.7,
				seedCBC: CryptoJS.SEED	// 1.2.410.200004.1.4
			};

			ASN1.prototype.contentRaw = function () {
				var offset = this.posContent();
				var length = this.length;
				return this.stream.parseStringISO(offset, offset + length);
			};

			var der = Base64.unarmor(this.blob.smime_body);
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

			// 메일 본문 인코딩 변환.
			var message = CryptoJS.enc.Latin1.stringify(decryptedContent);
			if (message.match(/utf-8/i)) {
				message = CryptoJS.enc.Utf8.stringify(decryptedContent);
			} else {
				message = CryptoJS.enc.CP949.stringify(decryptedContent);
	        	message = message.replace(/euc-kr/ig, 'utf-8');
			}

			//HACK: DOCTYPE 없는 메일도 있으니 헤더와 본문 사이의 줄바꿈으로 인식.
			// message = message.replace(/[\s\S]*(<!DOCTYPE)/i, "$1")
			var offset = /[\n\r]{3,}/.exec(message);
			if (offset) {
				message = message.slice(offset.index);
			}
			return message;
		};

		this.init(attachment);
	};

	return cls;
})();

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
			var der = Base64.unarmor(this.blob.smime_body);
			var asn1 = ASN1.decode(der);

			/*
			var p = document.createElement('P')
			p.appendChild(asn1.toDOM())
			document.body.appendChild(p)
			*/

			// pkcs7-envelopedData = 1.2.840.113549.1.7.3
			var envelopedDataContentType = asn1.sub[0].content();
	console.log(oids[envelopedDataContentType].d); //== 'envelopedData'
			var envelopedData = asn1.sub[1].sub[0];
			var recipientInfos = envelopedData.sub[1];
			var keyTransportRecipientInfo = recipientInfos.sub[0];
			// des-cbc = 1.3.14.3.2.7
			var keyEncryptionAlgorithm = keyTransportRecipientInfo.sub[2].sub[0].content();
	console.log(oids[keyEncryptionAlgorithm].d); //== 'desCBC'
			var encryptedKey = keyTransportRecipientInfo.sub[3].content();

			var c = keyTransportRecipientInfo.sub[3].posContent();
			var l = keyTransportRecipientInfo.sub[3].length;
			var w = keyTransportRecipientInfo.sub[3].stream.parseStringISO(c, c+l);
			var W = CryptoJS.enc.Latin1.parse(w);

			//var m = /\([\w\s]*\) (\w*)/.exec(encryptedKey);
			//var w = CryptoJS.enc.Hex.parse(m[1]);

			var ciphers = {
				desCBC: CryptoJS.DES,
				seedCBC: CryptoJS.SEED
			}

			var P = CryptoJS.SHA1(password);
			var IV = CryptoJS.enc.Hex.parse("0");
			//var K = CryptoJS.DES.decrypt({ciphertext: W}, P, {iv: IV});
			//var K = CryptoJS.SEED.decrypt({ciphertext: W}, P, {iv: IV});
			var K = ciphers[oids[keyEncryptionAlgorithm].d].decrypt({ciphertext: W}, P, {iv: IV});

			console.log(K);
			console.log(K.words);

			var encryptedContentInfo = envelopedData.sub[2];
			// pkcs7-data = 1.2.840.113549.1.7.1
			var dataContentType = encryptedContentInfo.sub[0].content();
	console.log(oids[dataContentType].d); //== 'data'
			var contentEncryptionAlgorithm = encryptedContentInfo.sub[1].sub[0].content();
	console.log(oids[contentEncryptionAlgorithm].d);
			var encryptedContent = encryptedContentInfo.sub[2];

			var c = encryptedContent.posContent();
			var l = encryptedContent.length;
			var s = encryptedContent.stream.parseStringISO(c, c+l);
			var S = CryptoJS.enc.Latin1.parse(s);

			//var R = CryptoJS.DES.decrypt({ciphertext: S}, K, {iv: IV});
			//var R = CryptoJS.SEED.decrypt({ciphertext: S}, K, {iv: IV});
			var R = ciphers[oids[contentEncryptionAlgorithm].d].decrypt({ciphertext: S}, K, {iv: IV});

			var message = CryptoJS.enc.Latin1.stringify(R);
			if (message.match(/utf-8/i)) {
				message = CryptoJS.enc.Utf8.stringify(R);
			} else {
				message = CryptoJS.enc.CP949.stringify(R);
	        	message = message.replace(/euc-kr/ig, 'utf-8');
			}

			//HACK: DOCTYPE 없는 메일도 있으니 헤더와 본문 사이의 줄바꿈으로 인식.
			//var message = M.replace(/[\s\S]*(<!DOCTYPE)/i, "$1")
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
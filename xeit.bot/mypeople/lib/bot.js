var req = require('request'),
	fs = require('fs');

(function () {
	'use strict';

	var apiHost, apiKey;
	var apiUrl = Array();

	var Bot = module.exports = function (apiHost, apiKey) {
		this.apiHost = apiHost;
		this.apiKey = apiKey;

		console.log('MyPeople BOT: ', this.apiHost, ',', this.apiKey);

		apiUrl = {
			buddyProfile: apiHost + "/mypeople/profile/buddy.json?apikey=" + apiKey,
			sendBuddy: apiHost + "/mypeople/buddy/send.json?apikey=" + apiKey,
			sendGroup: apiHost + "/mypeople/group/send.json?apikey=" + apiKey,
			members: apiHost + "/mypeople/group/members.json?apikey=" + apiKey,
			exitGroup: apiHost + "/mypeople/group/exit.json?apikey=" + apiKey,
			downloadFile: apiHost + "/mypeople/file/download.json?apikey=" + apiKey
		}
	};

	Bot.prototype = {

		/**
		* 1:1 대화 메시지 보내기
		*      http://dna.daum.net/apis/mypeople/ref#send1on1message
		*/
		sendMessageToBuddy: function (buddyId, content, attach, callback) {
			if(attach != null) {

				req.post({
					url: apiUrl.sendBuddy,
					headers: {
						'content-type': 'multipart/form-data'
					},
					method: 'POST',
					multipart: [{
						'Content-Disposition': 'form-data; name="attach"; filename="image.jpg"',
						'Content-Type': 'image/jpg',
						body: fs.readFileSync("mypeople/bot_data/" + attach + ".jpg")
					}, {
						'Content-Disposition': 'form-data; name="buddyId"',
						body: buddyId
					}]
				}, this.createResponseHandler(callback));

			} else {

				req.get({
					uri: apiUrl.sendBuddy + "&buddyId=" + buddyId + "&content=" + encodeURIComponent(content)
				}, this.createResponseHandler(callback));

			}
		},

		/**
		* 친구 프로필 정보 보기
		*      http://dna.daum.net/apis/mypeople/ref#getfriendsinfo
		*/
		buddyProfile: function (buddyId, callback) {
			req.get({
				uri: apiUrl.buddyProfile + "&buddyId=" + buddyId
			}, this.createResponseHandler(callback));
		},

		/**
		* 그룹 대화방 친구 목록 보기
		*      http://dna.daum.net/apis/mypeople/ref#groupuserlist
		*/
		getMembers: function (groupId, callback) {
			req.get({
				uri: apiUrl.members + "&groupId=" + groupId
			}, this.createResponseHandler(callback));
		},

		/**
		* 그룹 대화방에 메시지 보내기
		*      http://dna.daum.net/apis/mypeople/ref#sendgroupmessage
		*/
		sendMessageToGroup: function (groupId, content, attach, callback) {

			if(attach != null) {

				req.post({
					url: apiUrl.sendGroup,
					headers: {
						'content-type': 'multipart/form-data'
					},
					method: 'POST',
					multipart: [{
						'Content-Disposition': 'form-data; name="attach"; filename="image.jpg"',
						'Content-Type': 'image/jpg',
						body: fs.readFileSync("mypeople/bot_data/" + attach + ".jpg")
					}, {
						'Content-Disposition': 'form-data; name="groupId"',
						body: groupId
					}]
				}, this.createResponseHandler(callback));

			} else {

				req.get({
					uri: apiUrl.sendGroup + "&groupId=" + groupId + "&content=" + encodeURIComponent(content)
				}, this.createResponseHandler(callback));

			}
		},

		/**
		* 그룹 대화방 나가기
		*      http://dna.daum.net/apis/mypeople/ref#leavegroup
		*/
		exitFromGroup: function (groupId, callback) {

			req.get({
				uri: apiUrl.exitGroup + "&groupId=" + groupId
			}, this.createResponseHandler(callback));

		},

		/**
		 * 파일 및 사진 받기
		 *      http://dna.daum.net/apis/mypeople/ref#filedownload      
		 */
		downloadFile: function (fileId, fileName) {

			req.get({
				uri: apiUrl.downloadFile + "&fileId=" + fileId,
			}).pipe(fs.createWriteStream('mypeople/bot_data/download/' + fileName + '.jpg'));
			
		},

		createResponseHandler: function (callback) {
			return function (error, resp, data) {
				console.log(resp.request.uri.href);
				if (error) {
					callback(error);
				} else {
					var result;
					try {
						result = JSON.parse(data);
					} catch (ex) {
						callback("JSON PARSING ERROR", null);
					}

					if (result === "null" && parseInt(result.code, 10) >= 400) {
						callback("ERROR CODE: " + result.code + " " + data);
					} else {
						callback(null, result);
					}
				}
			};

		}
	};

})();
var Bot = require("./lib/bot");
var bot = new Bot( "https://apis.daum.net", "MYPEOPLE_BOT_API_KEY");

var xeit = require('./lib/xeit.js');
var state = 'URL대기';

exports.addBuddy = function(buddyId) {

	bot.buddyProfile(buddyId, function(error, data) {
		var reply = data.buddys[0].name + '님 반갑습니다.';
		bot.sendMessageToBuddy(buddyId, reply, null, function(error, data) {
			if(!error){
				console.log(data);
			}else{
				console.log(error);
			}
		});
	});

};

exports.buddyTest = function(buddyId, content) {

	bot.buddyProfile(buddyId, function(error, data) {
		var reply = data.buddys[0].name + ': ' + content;
		bot.sendMessageToBuddy(buddyId, reply, null, function(error, data) {
			if(!error){
				console.log(data);
			}else{
				console.log(error);
			}
		});
 		
	});

};

exports.groupTest = function(groupId, content) {

	bot.getMembers(groupId, function(error, data) {
		console.log('data:', data);

		var reply = data.buddys[0].name + ': ' + content;

		bot.sendMessageToGroup(groupId, reply, null, function(error, data) {
			if(!error){
				console.log(data);
			}else{
				console.log(error);
			}
		});

	});
};

exports.sendFromImage = function(buddyId) {

	bot.sendMessageToBuddy(buddyId, null, "test", function(error, data) {
		if(!error){
			console.log(data);
		}else{
			console.log(error);
		}
	});

};

exports.profileDownload = function(buddyId) {

	bot.buddyProfile(buddyId, function(error, data) {
		bot.downloadFile(data.buddys[0].photoId, data.buddys[0].buddyId, function(error, data) {
			if(!error){
				console.log(data);
			}else{
				console.log(error);
			}
		});
	});

};

exports.sendFromMessage = function(buddyId, content) {

	var message = '안녕하세요! Xeit입니다.';
	function reply(message) {
		bot.sendMessageToBuddy(buddyId, message, null, function(error, data) {
			if (!error) {
				console.log(data);
			} else {
				console.log(error);
			}
		});
	}

	if (state == 'URL대기') {
		message = '보안메일 URL을 입력해주세요!';

		if (/^https?:\/\//.test(content)) {
			var request = require('request');
			request({
				url: content,
				encoding: null
			}, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var html = body.toString();
					if (html.search(/euc-kr/i) != -1) {
						var iconv = new require('iconv').Iconv('EUC-KR', 'UTF-8');
						html = iconv.convert(body).toString();
					}
					xeit.init(html);

					var sender = xeit.vendor.sender;
					if (sender['support']) {
						state = '비밀번호대기';
						message = sender['name'] + '이군요. 이제 비밀번호를 알려주세요~';
					} else {
						message = '보안메일이 아니거나 아직 지원하지 않는 형식인 것 같아요.';
					}
				} else {
					message = 'URL이 잘못된 것 같아요.';
				}
				reply(message);
			});
			return;
		}
	} else if (state == '비밀번호대기') {
		try {
			var mail = xeit.load(content);
			//TODO: 배열 저장?

			state = '열람대기';
			message = '그럼 뭐든지 물어보세요.';
		} catch (err) {
			message = err.message;
		}
	} else if (state == '열람대기') {
		//TODO: 선범씨!
	}
	reply(message);

};

exports.exitFromGroup = function(groupId, buddyId) {

	bot.buddyProfile(buddyId, function(error, data) {
		var reply = data.buddys[0].name + '님 잘가요~ ㅠ';
		bot.sendMessageToGroup(groupId, reply, null, function(error, data) {
			if(!error){
				console.log(data);
			}else{
				console.log(error);
			}
		});
	});

};

exports.sendFromGroup = function(groupId, content, attache) {

	bot.sendMessageToGroup(groupId, content, null, function(error, data) {
		if(!error){
			console.log(data);
		}else{
			console.log(error);
		}
	});

};

exports.createGroup = function(groupId, buddyId) {
	bot.buddyProfile(buddyId, function(error, data) {
		var reply = data.buddys[0].name + '님 반갑습니다.';
		bot.sendMessageToGroup(groupId, reply, null, function(error, data) {
			if(!error){
				console.log(data);
			}else{
				console.log(error);
			}
		});
	});
};

exports.inviteToGroup = function(groupId, buddyId, invitee) {
	var msg = "초대했습니다.";
	bot.sendMessageToGroup(groupId, msg, null, function(error, data) {
		console.log(data);
	});
};


exports.exit = function(groupId, buddyId) {

	bot.exitFromGroup(groupId, function(error, data) {
		if(!error){
			console.log(data);
		}else{
			console.log(error);
		}
	});

};

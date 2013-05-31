var Bot = require("./lib/bot");
var bot = new Bot( "https://apis.daum.net", "MYPEOPLE_BOT_API_KEY");

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

	bot.sendMessageToBuddy(buddyId, content, null, function(error, data) {
		if(!error){
			console.log(data);
		}else{
			console.log(error);
		}
	});

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

var receiver = require("../mypeople/receiver");

// 알림 콜백 예제

//  대화
// { content: '메세지',
//  buddyId: 'BU_iOYEwdlbrLsZqM14QZaXVw00',
//  groupId: '',
//  action: 'sendFromMessage' }

//  대화(이미지)
// { content: 'myp_pci:51A488B20545D3001C',
//  buddyId: 'BU_iOYEwdlbrLsZqM14QZaXVw00',
//  groupId: '',
//  action: 'sendFromMessage' }

// 친구 추가
// { content: '[{"buddyId":"BU__BFOct2CNgszbvBC-NGy9g00","isBot":"N","name":"사용자","photoId":"myp_pub:51A31B8407666B0009"}]',
//  buddyId: 'BU__BFOct2CNgszbvBC-NGy9g00',
//  groupId: '',
//  action: 'addBuddy' }

// ----------------------------------------------------------
//  그 룹
// ----------------------------------------------------------
// 
// 그룹 : 봇 입장
// { content: '[{"buddyId":"BU_vy8zKcwnpj5UPJ6HXnSF9w00","isBot":"Y","name":"똑똑박사","photoId":"myp_pub:519F261E070D890002"}]',
//  buddyId: 'BU_iOYEwdlbrLsZqM14QZaXVw00',
//  groupId: 'GID_ihTl1',
//  action: 'inviteToGroup' }

// 그룹 : 대화
//  { content: '메세지',
//   buddyId: 'BU_iOYEwdlbrLsZqM14QZaXVw00',
//   groupId: 'GID_ihTl1',
//   action: 'sendFromGroup' }

// 그룹 : 대화(이미지)
//  { content: 'myp_pci:51A48697032B550009',
//   buddyId: 'BU_iOYEwdlbrLsZqM14QZaXVw00',
//   groupId: 'GID_ihTl1',
//   action: 'sendFromGroup' }

// 그룹 : 초대(봇)
//  { content: '[{"buddyId":"BU_vy8zKcwnpj5UPJ6HXnSF9w00","isBot":"Y","name":"봇이름","photoId":"myp_pub:519F261E070D890002"}]',
//   buddyId: 'BU_iOYEwdlbrLsZqM14QZaXVw00',
//   groupId: 'GID_n3dl1',
//   action: 'inviteToGroup' }

// 그룹 : 초대
//  { content: '[{"buddyId":"BU_1M9qHDITjlU0","isBot":"N","name":"초대자","photoId":"myp_pub:4FE5829B04234E0031"}]',
//   buddyId: 'BU_iOYEwdlbrLsZqM14QZaXVw00',
//   groupId: 'GID_n3dl1',
//   action: 'inviteToGroup' }

// 그룹 : 퇴장
//  { content: '',
//   buddyId: 'BU_1M9qHDITjlU0',
//   groupId: 'GID_ihTl1',
//   action: 'exitFromGroup' }

// 공통 명령어(권장)
// 시작	 start	: 중지 상태인 봇을 재개 합니다.
// 끝	stop	: 봇을 잠시 중지 시킵니다.
// 퇴장	exit	: 그룹대화에서 봇을 퇴장 시킵니다. 단 1:1 대화에서 동작하지 않습니다.
// 도움말	help :	봇 사용 방법을 보여줍니다.


exports.receive = function(req, res){
	var params = eval(req.body);

	console.log('\nPOST /receive\n',params,'\n');

	// 그룹방
	if(params["groupId"]){

		if(params["content"] === "퇴장" || params["content"] === "exit") {
			receiver.exit(params["groupId"]);
		}else if(params["content"] === "테스트") {
			receiver.groupTest(params["groupId"], params["content"]);
		}else if(params["action"] === "addBuddy") {
			receiver.addBuddy(params["buddyId"]);
		}else if(params["action"] === "sendFromMessage") {
			receiver.sendFromMessage(params["buddyId"], params["content"]);
		}else if(params["action"] === "sendFromGroup") {
			receiver.sendFromGroup(params["groupId"], params["content"]);
		}else if(params["action"] === "createGroup") {
			receiver.createGroup(params["groupId"], params["buddyId"]);
		}else if(params["action"] === "inviteToGroup") {
			receiver.inviteToGroup(params["groupId"], params["buddyId"], params["content"]);
		}else if(params["action"] === "exitFromGroup") {
			receiver.exitFromGroup(params["groupId"], params["buddyId"]);
		}
			
	}

	// 개인방
	if(!params["groupId"]){

		if(params["content"] === "테스트") {
			receiver.buddyTest(params["buddyId"], params["content"]);
		}else if(params["content"] === "이미지") {
			receiver.sendFromImage(params["buddyId"]);
		}else if(params["content"] === "프로필이미지") {
			receiver.profileDownload(params["buddyId"]);
		}else if(params["action"] === "addBuddy") {
			receiver.addBuddy(params["buddyId"]);
		}else if(params["action"] === "sendFromMessage") {
			receiver.sendFromMessage(params["buddyId"], params["content"]);
		}

	}

	res.end();
};
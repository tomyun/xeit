exports.index = function(req, res){
	console.log('receive');
 	res.render('index', { title: '마이피플 봇 예제' });
};
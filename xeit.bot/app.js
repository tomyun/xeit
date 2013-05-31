
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , mypeople = require('./routes/mypeople')
  , http = require('http')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// 이미지 저장 폴더
app.use("mypeople/bot_data", express.static(__dirname + '/bot_data'));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

// POST /receive - 마이피플 콜백 주소
app.post("/receive", mypeople.receive);

app.use("/styles", express.static(__dirname + '/public/styles'));
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var io = require('socket.io').listen(5050);

// create shared game object
var gamejs = new require('./public/common/game.js');
var Game = gamejs.Game;
var game = new Game();

var level = new require('./public/level.js');
var gen = new level.Generator({
    width: Game.WIDTH,
    height: Game.HEIGHT,
    maxSpeed: 0.1,
    maxRadius: 15,
    blobCount: 10
});

game.load(gen.generate());
console.log(game.state.objects);

game.updateEvery(Game.UPDATE_INTERVAL);
var observerCount = 0;

io.sockets.on('connection', function(socket) {
    observerCount++;
    console.log("# of users connected: " + observerCount);

    socket.emit('start', {
        state: game.save()
    });

    socket.on('disconnect', function(data) {
        console.log('recv disconnect', data);
        observerCount--;
    });

    socket.on('state', function  (data) {
        socket.emit('state', {
            state: game.save()
        });
    });

    var timeSyncTimer = setInterval(function  () {
        socket.emit('time', {
            timeStamp: (new Date()).valueOf(),
            lastUpdate: game.state.timeStamp,
            updateCount: game.updateCount,
            observerCount: observerCount
        });
    }, 2000);
});


var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('nodeHackathon2013#1'));
app.use(express.session());
app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

/**
 * Module dependencies
 */

var express 	= require('express'),
  routes 		= require('./routes'),
  http 			= require('http').createServer(express).listen(8000),
  path 			= require('path'),
  mysql      	= require('mysql'),
  SerialPort 	= require('serialport').SerialPort,
  io 			= require('socket.io').listen(http);

var app = module.exports = express();

/** MYSQL Configuration */
var pool = mysql.createPool({
  host     : 'localhost',
  user     : 'website',
  password : 'WebsiteMYSQL'
});


/**
 * Configuration
 */

// all environments
//app.set('port', process.env.PORT || 8000);
app.set('views', __dirname + '/views');
app.engine('.html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('view options', {
        layout: false
});
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

// production only
if (app.get('env') === 'production') {
  // TODO
};



/* EXPORTS SECTION */

exports.index = function(req, res){
  res.render('index');
};



/**
 * Routes
 */

app.get('/', exports.index);


// redirect all others to the index (HTML5 history)
app.get('*', exports.index);





/**
 * Start Server
 

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});*/

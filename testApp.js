var express = require("express");
var app = express();
var port = 80;
var serialport = require("serialport");
var SerialPort  = serialport.SerialPort;
var _mysql = require('mysql');
var BASE_URL = "192.168.1.102";
var currentBBQ = 0;


var HOST = 'localhost';
var PORT = 3306;
var MYSQL_USER = 'website';
var MYSQL_PASS = 'WebsiteMYSQL';
var DATABASE = 'BBQpi';

var mysql = _mysql.createConnection({
    host: HOST,
    port: PORT,
    user: MYSQL_USER,
    password: MYSQL_PASS,
    multipleStatements: true
});

var POLLING_INTERVAL=10000;
var pollingTimer;
var connectionsArray=[];

mysql.query('use ' + DATABASE);

mysql.query('select * from BBQpi.meatTemp;',
function(err, result, fields) {
    if (err) throw err;
    else {
       
        for (var i in result) {
            var point = result[i];
            
        }
        meatTempData = result;
    }
});
 
app.engine('.html', require('ejs').renderFile);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.get("/newBBQ", function(req, res){
	var meatArray = [];
	
	mysql.query('select * from BBQpi.meatTable;',
		function(err, result, fields) {
		    if (err) throw err;
		    else {
		        for (var i in result) {
		        	var meatBuffer =[];
		            var row = result[i];
		            
		            meatBuffer[0] = row.meatid;
		            meatBuffer[1] = row.meatName;
		            meatBuffer[2] = row.specificHeat;
		            
		           	meatArray[i] = meatBuffer;
		           	      
		        }
		        res.render("newBBQ", {meat:meatArray, BASE_URL: BASE_URL});
		    }
		}); 
});


app.get("/oldBBQ", function(req, res){
	var bbqArray = [];
	
	mysql.query('SELECT BBQid,name,startTime,meat1Table.meatName as meat1name,meat1targetTemp,meat2Table.meatName as meat2name,meat2targetTemp ' +
							'FROM BBQpi.BBQs '+
							'INNER JOIN BBQpi.meatTable meat1Table ON (meat1Table.meatid = BBQs.meat1id) '+
							'INNER JOIN BBQpi.meatTable meat2Table ON (meat2Table.meatid = BBQs.meat2id); ',
		function(err, result, fields) {
		    if (err) throw err;
		    else {
		        for (var i in result) {
		        	var bbqBuffer =[];
		            var row = result[i];
		            
		            bbqBuffer[0] = row.BBQid;
		            bbqBuffer[1] = row.name;
		            bbqBuffer[2] = row.startTime;
		            bbqBuffer[3] = row.meat1name;
		            bbqBuffer[4] = row.meat2name;
		            
		            
		           	bbqArray[i] = bbqBuffer;
		           	      
		        }
		        res.render("oldBBQ", {BBQ:bbqArray, BASE_URL: BASE_URL});
		    }
		}); 
});

app.get("/viewBBQ/:id", function(req, res){
	var bbqID = req.params.id;
	var Query = mysql.query('select * from BBQpi.meatTemp WHERE BBQid =' + bbqID+'; ' +
    						'select * from BBQpi.pitTemp WHERE BBQid =' + bbqID+'; ' +
    						'select * from BBQpi.heaterStatus WHERE BBQid =' + bbqID+'; ' +
    						'SELECT BBQid,name,startTime,meat1Table.meatName as meat1name,meat1targetTemp,meat2Table.meatName as meat2name,meat2targetTemp ' +
							'FROM BBQpi.BBQs '+
							'INNER JOIN BBQpi.meatTable meat1Table ON (meat1Table.meatid = BBQs.meat1id) '+
							'INNER JOIN BBQpi.meatTable meat2Table ON (meat2Table.meatid = BBQs.meat2id) '+
							'WHERE BBQid=' + bbqID +';');
	var meatTempObject=[];
	var pitTempObject=[];
	var heatStatusObject=[];
	var objectBuffer = [];
	var bbqArray = {};
	
	
    // set up the query listeners
    Query.on('error', function(err) {
        // Handle error, and 'end' event will be emitted after this as well
        console.log( err );
        updateSockets( err );
        
    })
    .on('result', function( row, index ) {
        // it fills our array looping on each user row inside the db
        if (index < 3){
	        objectBuffer=[];
		    objectBuffer.push(Date.parse(new Date(row.measTime)));
		    objectBuffer.push(row.measurement);
	        if (index==0){
		        meatTempObject.push (objectBuffer);
		    } else if(index ==1) {
				pitTempObject.push (objectBuffer);
			} else if (index == 2) {
				heatStatusObject.push (objectBuffer);
			}
		} else if (index == 3){
			var name = row.name;
			var id = row.BBQid;
			var startTime = row.startTime;
			var meatName = row.meatName;
			var meatTargetTemp = row.meatTargetTemp;
			bbqArray["id"] = id;
			bbqArray["name"] = name;
			bbqArray["startTime"] = startTime;
			bbqArray["meatTargetTemp"] = meatTargetTemp;
			bbqArray["meatName"] = meatName;
		}
    })
    .on('end',function(){
        res.render("viewBBQ", {	meatTempObject:JSON.stringify(meatTempObject), 
            					pitTempObject:JSON.stringify(pitTempObject), 
								heatStatusObject:JSON.stringify(heatStatusObject),
								bbqArray:JSON.stringify(bbqArray)});
    });

});


app.get('/stopBBQ', function(req, res) {
	sp.write(new Buffer('_stop','ascii'), function(err, results) {
	    console.log('results ' + results);
	});
	res.render("index", {BASE_URL: BASE_URL}) 
});

app.get('/resumeBBQ', function(req, res) {
	sp.write(new Buffer('start','ascii'), function(err, results) {
	    
	    console.log('results ' + results);
	});
	res.render("index", {BASE_URL: BASE_URL}) 
});

app.get("/startBBQ/:BBQname/m/:meatID/mtemp/:meatTargetTemp/ptemp/:pitTargetTemp/db/:deadband", function(req, res) {
	var BBQname = req.params.BBQname;
	var meatID = req.params.meatID;
	var meatTargetTemp = req.params.meatTargetTemp;
	var pitTargetTemp = req.params.pitTargetTemp;
	var deadband = req.params.deadband;
	
	sp.write(new Buffer('_start&pit#' + pitTargetTemp + '&meat#'+ meatTargetTemp + '&db#' + deadband,'ascii'), function(err, results) {
		if (err) {
	    	console.log('err ' + err);
	    }
	    if (results) {
	    	console.log('results ' + results);
	    }
	});	

	
	
	  
	
	var date = new Date();
	var month = date.getMonth() + 1;
	var currentDateTime = 	date.getFullYear() + "-" + 
			    					month + "-" +
			    					date.getDate()+ " " +
			    					date.getHours()+ ":" +
			    					date.getMinutes() + ":" +
			    					date.getSeconds();  
	mysql.query(	"INSERT INTO BBQpi.BBQs (name, startTime, meatID, meatTargetTemp, pitTargetTemp, deadband) VALUES ('"+ 
					BBQname + "','"+
					currentDateTime + "','"+
					meatID + "','"+
					meatTargetTemp + "','"+
					pitTargetTemp + "','"+
					deadband + "');");
	var query = 'SELECT BBQid FROM BBQpi.BBQs ORDER BY BBQid DESC LIMIT 1';
	var q = mysql.query(query);
	q.on('result', function( row, index ) {
		currentBBQ = row.BBQid;
	});
	res.render("index", {BASE_URL: BASE_URL});
	
});

app.get('/about', function(req, res) {
	res.render("about", {BASE_URL: BASE_URL}) 
});

app.get("/", function(req, res){
	res.render("index", {BASE_URL: BASE_URL});
	sp.open(function () {
	  console.log('Serial Port Open');
	  /*var splitLine = [];
	  var deviceName = "";
	  var measurement = "";
	  var currentTime = "";*/
	});
		    
});


app.use(express.static(__dirname + '/public'));

var io = require('socket.io').listen(app.listen(port), function (){
	console.log("Listening on port " + port);
});

io.set('log level', 1); // reduce logging

var pollingLoop = function (bbqID) {
    
    // Make the database query for the Meat Temperature
    var Query = mysql.query('select * from BBQpi.meatTemp WHERE BBQid =' + bbqID+'; ' +
    						'select * from BBQpi.pitTemp WHERE BBQid =' + bbqID+'; ' +
    						'select * from BBQpi.heaterStatus WHERE BBQid =' + bbqID+'; '+
    						'SELECT * FROM BBQpi.meatTemp ORDER BY measID DESC LIMIT 1;' +
    						'SELECT * FROM BBQpi.pitTemp ORDER BY measID DESC LIMIT 1;' +
    						'SELECT * FROM BBQpi.heaterStatus ORDER BY measID DESC LIMIT 1;');
	var meatTempObject=[];
	var pitTempObject=[];
	var heatStatusObject=[];
	var cmeatTempObject=[];
	var cpitTempObject=[];
	var cheatStatusObject=[];
	var objectBuffer = [];
	
	
    // set up the query listeners
    Query.on('error', function(err) {
        // Handle error, and 'end' event will be emitted after this as well
        if (err) {
	    	console.log('err ' + err);
	    }
        updateSockets( err );
        
    })
    .on('result', function( row, index ) {
        // it fills our array looping on each user row inside the db
        
        objectBuffer=[];
	    objectBuffer.push(Date.parse(new Date(row.measTime)));
	    objectBuffer.push(row.measurement);
        if (index==0){
	        meatTempObject.push (objectBuffer);
	    } else if(index ==1) {
			pitTempObject.push (objectBuffer);
		} else if (index == 2) {
			heatStatusObject.push (objectBuffer);
		} else if (index == 3) {
			cmeatTempObject.push (objectBuffer);
	    } else if (index == 4) {
			cpitTempObject.push (objectBuffer);
		} else if (index == 5) {
			cheatStatusObject.push (objectBuffer);
        }
    })
    .on('end',function(){
        // loop on itself only if there are sockets still connected
        if(connectionsArray.length) {
            pollingTimer = setTimeout( pollingLoop(currentBBQ), POLLING_INTERVAL );

            updateSockets({	meatTempObject:meatTempObject, 
            				pitTempObject:pitTempObject, 
            				heatStatusObject:heatStatusObject,
            				cmeatTempObject:cmeatTempObject, 
            				cpitTempObject:cpitTempObject, 
            				cheatStatusObject:cheatStatusObject});
        }
    });
};

// create a new websocket connection to keep the content updated without any AJAX request
io.sockets.on( 'connection', function ( socket ) {
    
    console.log('Number of connections:' + connectionsArray.length);
    // start the polling loop only if at least there is one user connected
    if (!connectionsArray.length) {
        pollingLoop(currentBBQ);
    }
    
    socket.on('disconnect', function () {
        var socketIndex = connectionsArray.indexOf( socket );
        console.log('socket = ' + socketIndex + ' disconnected');
        if (socketIndex >= 0) {
            connectionsArray.splice( socketIndex, 1 );
        }
    });

    console.log( 'A new socket is connected!' );
    connectionsArray.push( socket );
    
});

var updateSockets = function ( data ) {
    // store the time of the latest update
    data.time = new Date();
    // send new data to all the sockets connected
    connectionsArray.forEach(function( tmpSocket ){
        tmpSocket.volatile.emit( 'notification' , data );
    });
};


//SERIAL PORT AND SOCKET IO

//SERIAL
var portName = '/dev/ttyUSB0';
console.log(portName);
var sp = new SerialPort(portName, { // portName is instatiated to be COM3, replace as necessary
   baudRate: 9600, // this is synced to what was set for the Arduino Code
   dataBits: 8, // this is the default for Arduino serial communication
   parity: 'none', // this is the default for Arduino serial communication
   stopBits: 1, // this is the default for Arduino serial communication
   flowControl: false, // this is the default for Arduino serial communication
   parser: serialport.parsers.readline("\n")
});

sp.on('data', function(data) {
	    //console.log('data received: ' + data);
	    splitLine = data.split("--");
	    //console.log(splitLine);
	    var firstChar = splitLine[0].substr(0,1);
	    if (firstChar == "[") {
		    deviceName = splitLine[0].replace("[", "");
		    if (splitLine[1].indexOf("]") > 0) {
			    measurement = splitLine[1].substr(0, splitLine[1].indexOf("]"));
			    console.log("Device: " + deviceName + ", Measurement: " + measurement);
			    var date = new Date();
			    var month = date.getMonth() + 1;
			    var currentDateTime = 	date.getFullYear() + "-" + 
			    					month + "-" +
			    					date.getDate()+ " " +
			    					date.getHours()+ ":" +
			    					date.getMinutes() + ":" +
			    					date.getSeconds();
			    
			    var q = mysql.query(	"INSERT INTO BBQpi." + deviceName +
			    						" (measurement, measTime, BBQid) VALUES ('" + 
										measurement + "','" + currentDateTime + "','" +currentBBQ+ "')");
				//console.log("INSERT INTO BBQpi." + deviceName +
			    //						" (measurement, measTime, BBQid) VALUES ('" + 
				//						measurement + "','" + currentDateTime + "','" +currentBBQ+ "')");						
				q.on('error', function(err) {
			        // Handle error, and 'end' event will be emitted after this as well
			        console.log( err );
			    })
			    .on('end',function(){
			        // loop on itself only if there are sockets still connected
			        //console.log("Stored "+ deviceName +" to MySQL");
			    });
			};
	    }
	  });


process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    sp.close(function(error){
		if (error){    	
    		console.log('Serial Port Error: ' + error);
    	} else {
	    	console.log('Serial Port Closed');
    	}
    	mysql.end(function(e){
    		if (options.cleanup){ 
    			console.log('clean');
    		}
    		if (err) {
    			console.log(err.stack);
    		}
    		if (options.exit) {
	    		process.exit();
    		}
    	})
    });   	
}
    	

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

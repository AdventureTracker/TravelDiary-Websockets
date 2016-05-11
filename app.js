const
	http 					= require('http'),
	fs 						= require('fs'),
	path 					= require('path'),
	contentTypes 	= require('./utils/content-types'),
	sysInfo 			= require('./utils/sys-info'),
	env 					= process.env,
	config 				= require('./config.json')
	;


let server = http.createServer(function (req, res) {
	let url = req.url;

	if (url == '/') {
		url += 'index.html';
	}

	// IMPORTANT: Your application HAS to respond to GET /health with status 200 for OpenShift health monitoring

	if (url == '/health') {
		res.writeHead(200);
		res.end();
	}
	else if (url.indexOf('/info/') == 0) {
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Cache-Control', 'no-cache, no-store');
		res.end(JSON.stringify(sysInfo[url.slice(6)]()));
	}
	else {
		fs.readFile('./static' + url, function (err, data) {
			if (err) {
				res.writeHead(404);
				res.end();
			}
			else {
				let ext = path.extname(url).slice(1);
				res.setHeader('Content-Type', contentTypes[ext]);
				if (ext === 'html') {
					res.setHeader('Cache-Control', 'no-cache, no-store');
				}
				res.end(data);
			}
		});
	}
});

server.listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost', function () {
	console.log(`Application worker ${process.pid} started...`);
});


var io = require('socket.io')(server);

io.on('connection', function (socket) {

	socket.emit('welcome', {'message': 'Yo man, welcome!'});

	socket.on('test', function (data) {

		var response = {
			"message": "Successfully tested!",
			"request": data.message
		};

		this.emit("test", response);

	});

	socket.on('ping', function () {
		this.emit('pong', {"message": "Pong bitch!"});
	});

	socket.on("rest", function (data) {

		var options = {
			"protocol": config.rest.protocol,
			"host": config.rest.host,
			"method": data.method,
			"path": config.rest.version + "/" + data.uri,
			"headers": {
				"Content-Type": "application/json",
				"X-TravelDiary-Device": data.device,
				"X-TravelDiary-Token": data.token
			}
		};

		var req = http.request(options, function(res) {

			res.setEncoding('utf8');

			res.on('data', function (chunk) {
				var response = {
					"status": res.statusCode,
					"content": chunk,
					"requestType": data.requestType
				};
				socket.emit("rest", response);
			});
		});

		req.on("error", function (err) {
			console.log(err);
		});

		if (data.method != 'POST' || data.method != 'PUT') {
			req.write(data.content);
		}

		req.end();

	});

});

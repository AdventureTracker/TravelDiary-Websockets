const
	http 					= require('http'),
	fs 						= require('fs'),
	path 					= require('path'),
	contentTypes 	= require('./utils/content-types'),
	sysInfo 			= require('./utils/sys-info'),
	env 					= process.env,
	redis 				= require('redis'),
	config 				= require('./config.json')
	;

// Redis password: ZTNiMGM0NDI5OGZjMWMxNDlhZmJmNGM4OTk2ZmI5
// Redis host: 127.10.19.130:16379

var redisClient 	= redis.createClient({
	'password': config.redis.password,
	'port': config.redis.port,
	'host': config.redis.host
});

redisClient.on('connect', function() {
	console.log('[Redis] connected');
});

redisClient.on('error', function (err) {
	console.error("Error connecting to redis", err);
});

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

	socket.on('set', function (data) {

		console.log(data);

		var key = data.entity + ":" + data.user + ":" + data.data.id;
		var value = JSON.stringify(data);
		var response = {
			"message": "Created",
			"redis-key": key
		};

		redisClient.set(key, value);

		this.emit("set", response);

	});

	socket.on('remove', function (data) {

		console.log(data);

		var key = data.entity + ":" + data.user + ":" + data.id;
		redisClient.del(key);

		var response = {
			"message": "Removed",
			"redis-key": key,
			"id": data.id,
			"entity": data.entity
		};

		this.emit("remove", response);

	});

	socket.on('get', function (data) {

		// redisClient.keys();

		console.log(data);
	});

	socket.on('test', function (data) {
		console.log(data.message);

		var response = {
			"message": "Mas stastie!",
			"foo": "bar"
		};

		this.emit("post_test", response);

	});

	socket.on('ping', function (data) {
		this.emit('pong', {"message": "Pong bitch!"});
	});

});

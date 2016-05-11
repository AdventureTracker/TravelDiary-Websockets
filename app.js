const
	http 			= require('http'),
	fs 				= require('fs'),
	path 			= require('path'),
	contentTypes 	= require('./utils/content-types'),
	sysInfo 		= require('./utils/sys-info'),
	env 			= process.env,
	redis 			= require('redis'),
	config 			= require('./config.json')
	;

// Redis password: ZTNiMGM0NDI5OGZjMWMxNDlhZmJmNGM4OTk2ZmI5
// Redis host: 127.10.19.130:16379

var redisClient 	= redis.createClient({
	'password': 'ZTNiMGM0NDI5OGZjMWMxNDlhZmJmNGM4OTk2ZmI5',
	'port': 16379,
	'host': '127.10.19.130'
});

redisClient.on('connect', function() {
	console.log('[Redis] connected');
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

	socket.on('post', function (data) {
		// TODO: return enums
	});

	socket.on('put', function (data) {
		// TODO: process trips
	});

	socket.on('remove', function (data) {
		// TODO: process records
	});

	socket.on('get', function (data) {
		console.log(data);
	});

});

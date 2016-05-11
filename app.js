const config = require('./config.json');
var app = require('http').createServer(handler);
var io = require('socket.io')(app);
const fs = require('fs');

function handler (req, res) {
	fs.readFile(__dirname + '/index.html',
		function (err, data) {

			if (err) {
				res.writeHead(500);
				return res.end('Error loading index.html');
			}

			res.writeHead(200);
			res.end(data);
		});
}

app.listen(config.port);

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
var net = require('net');

var serve = net.createServer(function(socket) {
	
	socket.on('data', function(data) {
		console.log("***" + data + "***");
		socket.write("您好");
	});

	socket.on('end', function() {
		console.log("链接断开");
	})

});

serve.listen(8124, function() {
	console.log('serve bound');
});
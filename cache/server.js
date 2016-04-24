var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var generateEtag = require('etag');
var setHeadMiddleware = require('./middleware/setHead');
var getExpires = require('./tools/getExpires');

http.createServer(function(req, res) {
	setHeadMiddleware(res);

	//文件映射路径
	var pathname = url.parse(req.url).pathname;
	var filePath = path.join('assets', pathname);

	//文件后缀名
	var fileExt = path.extname(filePath).substr(1);

	//寻找文件
	fs.exists(filePath, function(exists) {
		if(!exists) {
			res.setHead(404, '');
			res.end('get file fail!');
			return;
		}

		//查看文件最近有没修过过
		fs.stat(filePath, function(err, stat) {
			var etag = generateEtag(stat),
				ifNoneMatch = req.headers['if-none-match'],
				lastModified = stat.mtime.toUTCString(),
				ifModifiedSince = req.headers['if-modified-since'];

			if (ifNoneMatch && ifNoneMatch === etag) {
				res.writeHead(304, "NO Modified", {
					'Cache-Control': "max-age=20"
				});
				res.end();
			}

			//用户第n+1次访问，文件没改动，直接返回304，让浏览器读取自身缓存
			else if (ifModifiedSince && ifModifiedSince === lastModified) {
				res.writeHead(304, "No Modified");
				res.end();
			} 
			else {
				//读取文件
				fs.readFile(filePath, function(err, file){
					if (err) {
						res.setHead(500, '');
						res.end(err);
					} else {
						var expires = getExpires(20);

						//参数：状态码，文件后缀名，expires时间，max-age时间，文件最后修改时间, etag
						res.setHead(200, fileExt, expires, '', lastModified, etag);
						res.write(file, 'binary');
						res.end();
					}
				})
			}
		});
	})
}).listen(8888);
/*
 * 响应头中间件
 **/

var MIME = require('../MIME.json');

module.exports = 

function(res) {

	res.setHead = function(_status, _fileExt, _expires, _cacheCtrl, _lastModified, _etag) {

		var mime = MIME[_fileExt] || "text/plain";

		var header = {
			"ContentType": mime
		};


		_expires ? header['Expires'] = _expires : null;
		_cacheCtrl === 0 || _cacheCtrl ? header['Cache-Control'] = "max-age=" + _cacheCtrl : null;
		_lastModified ? header['Last-Modified'] = _lastModified : null;
		_etag ? header['Etag'] = _etag :null;


		res.writeHead(_status, header);

	}

}
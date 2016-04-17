//参数sec为秒
module.exports = function(sec) {
	var date = new Date();

	date.setTime(date.getTime() + sec * 1000);
	return date.toUTCString();
}

/*
 * GET home page.
 */

exports.device = function(req, res){
	console.log(req.params.deviceName);
	res.render('device');
};


function Route(path, action){
	this.path = path;
  	this.action = action;
}

Route.prototype.matches = function(uri, context){
	return true;
}

// export the class
module.exports = Route;
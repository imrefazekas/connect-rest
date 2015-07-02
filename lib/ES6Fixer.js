/* jshint bitwise: false */
if (!Array.prototype.remove) {
	Object.defineProperty(Array.prototype, 'remove', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (obj) {
			var idx = this.indexOf(obj);
			if (idx > -1)
				this.splice(idx, 1);
			return this;
		}
	});
}
if (!Array.prototype.contains) {
	Object.defineProperty(Array.prototype, 'contains', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (object) {
			for (var i = 0; i < this.length; i += 1) {
				if (object === this[i]) return true;
			}
			return false;
		}
	});
}
if (!Array.prototype.find) {
	Object.defineProperty(Array.prototype, 'find', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (fn) {
			for (var i = 0; i < this.length; i += 1) {
				if (fn(this[i], i, this)) return this[i];
			}
			return null;
		}
	});
}
if (!Array.prototype.findIndex) {
	Object.defineProperty(Array.prototype, 'findIndex', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (fn) {
			for (var i = 0; i < this.length; i += 1) {
				if (fn(this[i], i, this)) return i;
			}
			return -1;
		}
	});
}
if (!String.prototype.endsWith) {
	Object.defineProperty(String.prototype, 'endsWith', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (searchString, position) {
			var subjectString = this.toString();
			if (position === undefined || position > subjectString.length) {
				position = subjectString.length;
			}
			position -= searchString.length;
			var lastIndex = subjectString.indexOf(searchString, position);
			return lastIndex !== -1 && lastIndex === position;
		}
	});
}
if (!String.prototype.startsWith) {
	Object.defineProperty(String.prototype, 'startsWith', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (searchString, position) {
			position = position || 0;
			return this.lastIndexOf(searchString, position) === position;
		}
	});
}

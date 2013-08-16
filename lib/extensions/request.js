var http = require('http');

var Puid = require('puid');
var puid = new Puid();

var Request = http.IncomingMessage;

Request.prototype.isUpgradeRequest = function isUpgradeRequest() {
		if (this._upgradeRequest !== undefined)
				return (this._upgradeRequest);
		else
				return (false);
};

Request.prototype.header = function header(name, value) {
		name = name.toLowerCase();

		if (name === 'referer' || name === 'referrer')
				name = 'referer';

		return (this.headers[name] || value);
};

Request.prototype.getContentLength = function getContentLength() {
		if (this._clen !== undefined)
				return (this._clen === false ? undefined : this._clen);

		// We should not attempt to read and parse the body of an
		// Upgrade request, so force Content-Length to zero:
		if (this.isUpgradeRequest())
				return (0);

		var len = this.header('content-length');
		if (!len) {
				this._clen = false;
		} else {
				this._clen = parseInt(len, 10);
		}

		return (this._clen === false ? undefined : this._clen);
};
Request.prototype.contentLength = Request.prototype.getContentLength;

Request.prototype.getContentType = function getContentType() {
		if (this._contentType !== undefined)
				return (this._contentType);

		var index;
		var type = this.headers['content-type'];

		if (!type) {
				// RFC2616 section 7.2.1
				this._contentType = 'application/octet-stream';
		} else {
				if ((index = type.indexOf(';')) === -1) {
						this._contentType = type;
				} else {
						this._contentType = type.substring(0, index);
				}
		}

		return (this._contentType);
};
Request.prototype.contentType = Request.prototype.getContentType;

Request.prototype.getId = function getId() {
		if (this._id !== undefined)
				return (this._id);

		this._id = this.headers['request-id'] ||
				this.headers['x-request-id'] ||
				puid.generate();

		return (this._id);
};
Request.prototype.id = Request.prototype.getId;

Request.prototype.getVersion = function getVersion() {
		if (this._version !== undefined)
				return (this._version);

		this._version =
				this.headers['accept-version'] ||
				this.headers['x-api-version'] ||
				'*';

		return (this._version);
};
Request.prototype.version = Request.prototype.getVersion;

Request.prototype.isChunked = function isChunked() {
		return (this.headers['transfer-encoding'] === 'chunked');
};
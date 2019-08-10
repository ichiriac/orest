

/**
 * Represents an HTTP error
 */
class HttpError {
    constructor(http, message, code) {
        this._http = http;
        this._err = new Error(message);
        if (!code) code = http;
        if (!message) message = http;
        this.message = message;
        this.code = code;
        this.details = ''
    }
    toString() {
        return this._err.toString();
    }
}

module.exports = HttpError;
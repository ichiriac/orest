

/**
 * 
 * Error internal codes :
 * 
 * Errors are on a 4 digit number, each one represents an information :
 * 
 * - 1 => module or class
 * - 2 => type 
 * - 3 => entry
 * - 4 => incremental
 * 
 * List of modules :
 * 
 * - 1 : generic / not defined / user level
 * - 2 : filtering
 * - 3 : entity
 * - 4 : routing
 * - 5 : response
 * - 6 : model / transactions
 * 
 * List of types :
 * 
 * - 4 : from the browser
 * - 5 : from the server
 * 
 * The entries and incremental values depends on the module contents
 */

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

class BadFormat extends HttpError {
    constructor(message, code) {
        if (!message) {
            message = 'Bad field format';
        }
        if (!code) {
            code = 1400;
        }
        super(400, message, code);
    }
}

class BadArgument extends HttpError {
    constructor(message, code) {
        if (!message) {
            message = 'Bad/unexpected argument';
        }
        if (!code) {
            code = 1500;
        }
        super(400, message, code);
    }
}

HttpError.BadFormat = BadFormat;

module.exports = HttpError;
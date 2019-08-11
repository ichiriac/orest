

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
    /**
     * Default constructor
     * @param {*} http 
     * @param {*} message 
     * @param {*} code 
     * @param {*} from 
     */
    constructor(http, message, code, from) {
        this._http = http;
        if (!code) code = http;
        if (!message) message = http;
        this._err = from ? from : new Error(message);
        this.message = message;
        this.code = code;
        this.details = 'https://<domain>/support/' + code;
    }
    /**
     * Serialize the error
     */
    toString() {
        return "HTTP Error " + this._http + " (#" + this.code + ") : " + this.message +
               "\nCaused by : " + this._err.toString()
        ;
    }
}

class BadFormat extends HttpError {
    constructor(message, code, from) {
        if (!message) {
            message = 'Bad field format';
        }
        if (!code) {
            code = 1401;
        }
        super(400, message, code, from);
    }
}

class BadArgument extends HttpError {
    constructor(message, code, from) {
        if (!message) {
            message = 'Bad/unexpected argument';
        }
        if (!code) {
            code = 1402;
        }
        super(400, message, code, from);
    }
}

class Conflicts extends HttpError {
    constructor(message, code, from) {
        if (!code) {
            code = 1403;
        }
        super(409, message, code, from);
    }
}

class NotFound extends HttpError {
    constructor(message, code, from) {
        if (!code) {
            code = 1404;
        }
        super(404, message, code, from);
    }
}

class Internal extends HttpError {
    constructor(message, code, from) {
        if (!code) {
            code = 1501;
        }
        super(500, message, code, from);
    }
}

HttpError.BadFormat = BadFormat;
HttpError.BadArgument = BadArgument;
HttpError.Conflicts = Conflicts;
HttpError.NotFound = NotFound;
HttpError.Internal = Internal;

module.exports = HttpError;
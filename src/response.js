const HttpError = require('./error');
/**
 * Creates an response handler
 */
class Response {

    constructor(value) {
        this.value = value;
    }

    /**
     * Formatting a value
     * @param {*} value 
     * @param {*} fields 
     */
    format(value, fields) {
        if (value && value.Model && value.id) { 
            if (Array.isArray(fields)) {
                return this.filter(value, fields);    
            } else {
                return {
                    id: value.id,
                    type: value.Model.name
                };
            }
        } else if (typeof value === 'object') {
            return this.filter(value, fields);
        } else if (value instanceof Date) {
            return value.getTime();
        }
        return value;
    }

    /**
     * Filtering an object
     * @param {*} entity 
     * @param {*} fields 
     */
    filter(entity, fields) {
        if (entity === null) return entity;
        if (entity.dataValues) {
            entity = entity.dataValues;
        }
        let result = Array.isArray(entity) ? [] : {};
        if (Array.isArray(fields) && fields.length > 0) {
            // prepare the list of fields to extract
            let names = {};
            fields.forEach(function(name) {
                let parts = name.split('.', 2);
                let field = names[parts[0]];
                if (parts.length > 1) {
                    if (!names[field]) {
                        names[field] = [];
                    }
                    names[field].push(parts[1]);
                } else {
                    names[field] = true;
                }
            });
            // extract each field
            for(let key in names) {
                if (entity.hasOwnProperty(key) && key[0] != '_') {
                    result[key] = this.format(entity[key], names[key]);
                }
            }
        } else {
            // extract every populated column into the object
            for(let k in entity) {
                if (entity.hasOwnProperty(k) && k[0] != '_') {
                    result[k] = this.format(entity[k], null);
                }
            }
        }
        return result;
    }

    /**
     * Respond the specified entry
     * @param {*} req 
     * @param {*} res 
     * @param {*} out 
     */
    process(req, res) {
        let format = 'json';
        let fields = null;
        if (req.params && req.params.format) {
            format = req.params.format;
        }
        if (req.query && req.query.fields) {
            fields = req.query.fields.split(',');
        }
        let out = this.value;
        if (out instanceof HttpError) {
            res.status(out._http);
            out =  { error: out };
        } else {
            res.status(200);
            out =  { data: out };
        }
        res.end(this.serialize(format, out, fields));
    }

    /**
     * Serialize a data
     * @param {*} format 
     * @param {*} data 
     * @param {*} fields 
     */
    serialize(format, data, fields) {
        let result;

        if (Array.isArray(data)) {
            result = [];
            for(let i = 0; i < data.length; i++) {
                result.push(this.filter(data[i], fields));
            }
        } else {
            result = this.filter(data, fields);
        }
        if (format === 'xml') {
            return '<?xml version="1.0" encoding="utf-8"?>\n<response>' + this.xml(result, 1) + '</response>';
        }
        return JSON.stringify(result, null, 2);
    }

    /**
     * Exports a value to XML node
     * @param {*} obj 
     * @param {*} level 
     */
    xml(obj, level) {
        let out;
        if (typeof obj === 'object') {
            out = [''];
            if (Array.isArray(obj))  {
                for(let k in obj) {
                    out.push(
                        '<item>' + 
                        this.xml(obj[k], level + 1) +
                        '</item>'
                    );
                }
            } else {
                for(let k in obj) {
                    out.push(
                        '<' + k + '>' + 
                        this.xml(obj[k], level + 1) +
                        '</' + k + '>'
                    );
                }
            }
            if (out.length > 1) {
                out = out.join('\n' + '\t'.repeat(level));
                out += '\n' + '\t'.repeat(level - 1);
            } else {
                out = '';
            }
        } else {
            out = obj.toString();
        }
        return out;
    }
}

/**
 * Static helper
 */
Response.send = function(req, res, value) {
    return (new Response(value)).process(req, res);
};

module.exports = Response;
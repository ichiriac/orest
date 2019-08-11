const Error = require('./error');
const Op = require('sequelize').Op;
/**
 * 
 * The filters are used to filter a resultset
 * 
 * Query String Parameters :
 * 
 * - limit : by default 10, maximum 200
 * Example : ?limit=25 
 * 
 * - offset : by default 0, maximum 10 000
 * Example : ?offset=50,limit=25 
 * 
 * - marker : by default empty on the first page (used for large datasets when no sorting)
 * Example : ?limit=10&marker=1565145
 * 
 * - fields : list of field to export (for partial responses)
 * Example : ?fields=title,description,author.name,author.email,categories.title
 * 
 * - filters : a list of pre-defined filters
 * Example : ?filters=by-cat-Drama,top-sellers
 * 
 * - order : a list of columns to sort, syntax order=(Column:asc|desc)+
 * Example : ?order=Age:desc,Name:asc will result in ORDER BY Age DESC, Name ASC
 * 
 * - custom filtering : you can use a filter on multiple columns, each criteria will 
 * be agregated by default with `AND`. Use the following syntax : $column_name=operator:value.
 * 
 * > Note : We use `$` in order to distinguish filtered columns and request options
 * 
 * Here a list of operators :
 * - ?$age=gt:6 means `age > 6`
 * - ?$age=lt:6 means `age < 6`
 * - ?$age=eq:6 means `age = 6` (could also use ?age=6)
 * - ?$age=in:6,9,10 means `age IN (6, 9, 10)`
 * - ... check Sequelize for the full list of operators
 * 
 * > @todo Complex queries :
 * > Actually complex queries are not handled, in the future, the following syntax will
 * > be supported : (%and | %or) '=[' ( '$' column '=' operator ':' value+ )+ ']'
 * > Example 1 : ?%and=[%name=like:%john%;%or=[$age=lt:5;$age=gt:10]
 * > will be : name like '%john%' and (age < 5 or age > 10)
 * > Example 2 : ?$age=%or:[lt:5;gt:10]
 * > will be : ... and (age < 5 or age > 10)
 * 
 * Inspired by :
 * - https://sequelize.org/master/manual/querying.html#operators
 * - https://specs.openstack.org/openstack/api-wg/guidelines/pagination_filter_sort.html
 * - https://www.moesif.com/blog/technical/api-design/REST-API-Design-Filtering-Sorting-and-Pagination/#
 */
class Filter {
    /**
     * Defines a filtering request
     * @param {*} model 
     * @param {*} req 
     * @param {*} res 
     */
    constructor(model, req, res) {
        this.model = model;
        this.fields = null;
        if (req.query) {
            if (req.query.fields) {
                this.fields = {};
                req.query.fields.split(',').forEach((field) => {
                    let pt = field.indexOf('.');
                    if (pt > 0) {
                        let property = field.substring(pt + 1);
                        let field = field.substring(0, pt);
                        if (!this.fields[field]) {
                            this.fields[field] = {};
                        }
                        this.fields[field][property] = true;
                    } else {
                        if (this.fields.hasOwnProperty(field)) {
                            throw new Error.BadArgument(
                                'Field "'+field+'" used twice', 2430
                            );
                        }
                        this.fields[field] = true;
                    }
                    // checking each field name
                    if (!this.hasField(field)) {
                        throw new Error.BadArgument(
                            'Bad fields value, undefined attribute "'+field+'"', 2431
                        );
                        // @todo : check relation attributes
                    }
                });
            }
        }        
    }

    /**
     * Check if the field exists
     * @param {*} name 
     */
    hasField(name) {
        return this.model.rawAttributes[name];
    }

}

class EntityFilter extends Filter {
    constructor(model, req, res) {
        super(model, req, res);
        if (!req.params.id) {
            throw new Error.BadArgument(
                'Missing id parameter', 2470
            );
        }
        this.id = req.params.id;
    }

    /**
     * Internal server error
     */
    read() {
        return this.model.findByPk(this.id).catch((error) => {
            throw new Error.Internal(
                'Unable to retrieve record "'+this.id+'"', 2570, error
            );
        });
    }

    update() {

    }

    delete() {

    }    
}

class ListFilter extends Filter {
    constructor(model, req, res) {
        super(model, req, res);
        this.limit = 10;
        this.offset = null;
        this.marker = null;
        this.filters = null;
        this.order = null;
        this.where = {};
        // reads the request parameters
        if (req.query) {
            if (req.query.limit) {
                this.limit = Number.parseInt(req.query.limit, 10);
                if (isNaN(this.limit)) {
                    throw new Error.BadFormat(
                        'Bad limit format, expecting a number', 2410
                    );
                }
                if (this.limit < 1 || this.limit > 200) {
                    throw new Error.BadFormat(
                        'Bad limit value, expecting between 1 and 200', 2411
                    );
                }
            }
            if (req.query.offset) {
                this.offset = Number.parseInt(req.query.offset, 10);
                if (isNaN(this.offset)) {
                    throw new Error.BadFormat(
                        'Bad offset format, expecting a number', 2420
                    );
                }
                if (this.offset < 0 || this.offset > 10000) {
                    throw new Error.BadFormat(
                        'Bad offset value, expecting between 0 and 10 000', 2421
                    );
                }
            }
            if (req.query.marker) {
                this.marker = req.query.marker;
                if (this.offset !== null) {
                    throw new Error.Conflicts(
                        'Marker parameter conflicts with offset', 2422
                    );
                }
            }
            
            if (req.query.filters) {
                this.filters = [];
                req.query.filters.split(',').forEach((filter) => {
                    // @todo check if filters are really defined
                    if (this.filters.indexOf(filter) === -1) {
                        this.filters.push(filter);
                    } else {
                        throw new Error.BadArgument(
                            'Filter "'+filter+'" used twice', 2440
                        );
                    }
                });
            }
            if (req.query.order) {
                this.order = {};
                if (this.marker != null) {
                    throw new Error.Conflicts(
                        'Invalid usage of marker and orders', 2450
                    );   
                }
                req.query.order.split(',').forEach((order) => {
                    order = order.split(':', 2);
                    let dir = 'asc';
                    if (order.length === 2) {
                        dir = order[1].toLowerCase().trim();
                    }
                    // check the field
                    order = order[0];
                    if (!this.hasField(order)) {
                        throw new Error.BadArgument(
                            'Undefined ordering field "'+order+'"', 2451
                        );
                    }
                    // check the direction
                    if (dir === 'asc') {
                        this.order[order] = true;
                    } else if (dir === 'desc') {
                        this.order[order] = false;
                    } else {
                        throw new Error.BadFormat(
                            'Bad order direction for "'+order+'", expecting asc or desc', 2452
                        );
                    }
                });
            }
            // lookup on criterias
            for(let key in req.query) {
                if (key[0] === '$') {
                    let value = req.query[key];
                    let field = key.substring(1);
                    let criteria = value.split(':', 2);
                    value = criteria[1];
                    criteria = criteria[0];
                    if (!this.hasField(field)) {
                        throw new Error.BadArgument(
                            'Undefined criteria field "'+field+'"', 2460
                        );
                    }
                    if (!Op.hasOwnProperty(criteria)) {
                        throw new Error.BadArgument(
                            'Undefined criteria operator "'+criteria+'"', 2461
                        );
                    }
                    criteria = Op[criteria];
                    this.where[field] = {
                        [criteria]: value
                    };
                }
            }
        }        
    }
    /**
     * Retrieve default filtering options
     */
    getOptions() {
        let opt = {
            where: this.where,
            limit: this.limit
        };
        if (this.offset !== null) {
            opt.offset = this.offset;
        }
        if (this.order) {
            opt.order = [];
            for(let k in this.order) {
                opt.order.push([k, this.order[k] ? 'ASC' : 'DESC']);
            }
        }
        return opt;
    }

    /**
     * Request the resultset
     */
    find() {
        let opt = this.getOptions();
        return this.model.findAndCountAll(opt);
    }    
}

Filter.entity = function(model, req, res)  {
    return new EntityFilter(model, req, res);
};

Filter.list = function(model, req, res) {
    return new ListFilter(model, req, res);
};


module.exports = Filter;
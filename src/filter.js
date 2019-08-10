const Error = require('./error');
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
 * - sort : a list of columns to sort, syntax sort=(Column:asc|desc)+
 * Example : ?sort=Age:desc,Name:asc will result in SORT BY Age DESC, Name ASC
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
        this.where = {};
        this.limit = 10;
        this.offset = null;
        this.marker = null;
        this.fields = null;
        this.sort = null;
        this.filters = null;
        this.model = model;
        // reads the request parameters
        if (req.query) {
            if (req.query.limit) {
                this.limit = Number.parseInt(req.query.limit, 10);
                if (isNaN(this.limit)) {
                    throw new Error.BadFormat(
                        'Bad limit format, expecting a number', 1410
                    );
                }
                if (this.limit < 1 || this.limit > 200) {
                    throw new Error.BadFormat(
                        'Bad limit value, expecting between 1 and 200', 1411
                    );
                }
            }
            if (req.query.offset) {
                this.offset = Number.parseInt(req.query.offset, 10);
                if (isNaN(this.offset)) {
                    throw new Error.BadFormat(
                        'Bad offset format, expecting a number', 1420
                    );
                }
                if (this.offset < 0 || this.offset > 10000) {
                    throw new Error.BadFormat(
                        'Bad offset value, expecting between 0 and 10 000', 1421
                    );
                }
            }
            if (req.query.marker) {
                this.marker = req.query.marker;
                if (this.offset !== null) {
                    throw new Error.BadFormat(
                        'Bad offset value, expecting between 0 and 10 000', 1421
                    );
                }
            }
            for(key in req.query) {
                if (key[0] === '$') {
                    let value = req.query[key];
                } else if (key[0] === '%') {

                }
            }
        }
    }

    find() {

    }
    update() {

    }
    delete() {

    }
}

module.exports = Filter;
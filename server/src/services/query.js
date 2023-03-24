// this file is used to paginate any endpoint
// calculates the appropriate skip and limit values given a query

const DEFAULT_LIMIT = 0; //this will return all docs in Mongo.
const DEFAULT_PAGE_NUMBER = 1;

function getPagination(query) {
    const limit = Math.abs(query.limit) || DEFAULT_LIMIT;
    const page = Math.abs(query.page) || DEFAULT_PAGE_NUMBER;
    const skip = (page - 1) * limit;
    return {
        skip,
        limit, 
    }
}

module.exports = {
    getPagination,
}
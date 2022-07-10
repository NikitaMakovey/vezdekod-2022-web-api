let express = require('express');
let router = express.Router();
const fs = require('fs');

// JSON keeps all the emails
const STORAGE_ENDPOINT = (request) => `${request.app.get('storage')}/large_emails.json`;

function syncStorageData(request, data) {
    fs.writeFileSync(STORAGE_ENDPOINT(request), JSON.stringify(data, null, 4));
}

const SOCIAL_CATEGORY = "social";
const NEWS_CATEGORY = "news";
const OTHER_CATEGORY = "other";

const DEFAULT_LIMIT = 10;

router.get('/', function(request, response, next) {
    let items = require(STORAGE_ENDPOINT(request)); // local data storage
    items = items.sort((left, right) => left.dateTime > right.dateTime);
    let data = { categories: {} };
    const limit = request.query.limit ?? DEFAULT_LIMIT;
    data.categories[SOCIAL_CATEGORY] = items.filter(o => o.category === SOCIAL_CATEGORY).splice(0, limit);
    data.categories[NEWS_CATEGORY] = items.filter(o => o.category === NEWS_CATEGORY).splice(0, limit);
    data.categories[OTHER_CATEGORY] = items.filter(o => o.category === OTHER_CATEGORY).splice(0, limit);
    response.status(200).json(data);
});

router.get('/categories/:category', function(request, response, next) {
    let items = require(STORAGE_ENDPOINT(request)); // local data storage
    items = items
        .filter(o => o.category === request.params.category)
        .sort((left, right) => left.dateTime > right.dateTime);
    const total = items.length;
    if (request.query.limit && request.query.page) {
        const limit = 1 * request.query.limit;
        const page = 1 * request.query.page;
        items = items.splice(limit * (page - 1), limit);
    }
    response.status(200).json({items, total});
});

router.get('/:id/read', function(request, response, next) {
    let items = require(STORAGE_ENDPOINT(request)); // local data storage
    const updateItems = items.map((item) => {
        if (item.id === request.params.id) {
            item.read = true;
        }
        return item;
    });
    syncStorageData(request, updateItems);
    response.status(204).send('');
});

router.get('/:id/unread', function(request, response, next) {
    let items = require(STORAGE_ENDPOINT(request)); // local data storage
    const updateItems = items.map((item) => {
        if (item.id === request.params.id) {
            item.read = false;
        }
        return item;
    });
    syncStorageData(request, updateItems);
    response.status(204).send('');
});

router.get('/read', function(request, response, next) {
    let items = require(STORAGE_ENDPOINT(request)); // local data storage
    const ids = request.query.ids ? Object.values(request.query.ids) : [];
    const updateItems = items.map((item) => {
        if (ids.includes(item.id)) {
            item.read = true;
        }
        return item;
    });
    syncStorageData(request, updateItems);
    response.status(204).send('');
});

router.get('/unread', function(request, response, next) {
    let items = require(STORAGE_ENDPOINT(request)); // local data storage
    const ids = request.query.ids ? Object.values(request.query.ids) : [];
    const updateItems = items.map((item) => {
        if (ids.includes(item.id)) {
            item.read = false;
        }
        return item;
    });
    syncStorageData(request, updateItems);
    response.status(204).send('');
});

module.exports = router;
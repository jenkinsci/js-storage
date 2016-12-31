if (global.window === undefined) {
    global.window = {};
}
if (!global.window.localStorage) {
    console.warn('No window.localStorage. Creating a mock in-memory localStorage, assuming this is running in a test environment.');
    global.window.localStorage = require('localstorage-memory');
}

const local = global.window.localStorage;
exports.local = local;

const TYPE_OBJECT = '_$_object:';
const TYPE_NUMBER = '_$_number:';

exports.set = function (name, value) {
    if (name === undefined || name === null) {
        throw new Error('Unexpected call to store via undefined/null name.');
    }
    if (value === undefined || value === null) {
        throw new Error('Unexpected call to store undefined/null value in storage. Name: ' + name);
    }

    const type = typeof value;
    if (type === 'string') {
        local.setItem(name, value);
    } else if (type === 'object') {
        local.setItem(name, TYPE_OBJECT + JSON.stringify(value));
    } else if (type === 'number') {
        local.setItem(name, TYPE_NUMBER + value);
    } else {
        throw new Error('Unexpected call to store type "' + type + '". Name: ' + name);
    }
};

exports.get = function (name) {
    const value = local.getItem(name);

    if (value === undefined) {
        return undefined;
    }

    if (value.substring(0, TYPE_OBJECT.length) === TYPE_OBJECT) {
        return JSON.parse(value.substring(TYPE_OBJECT.length));
    }
    if (value.substring(0, TYPE_NUMBER.length) === TYPE_NUMBER) {
        return Number(value.substring(TYPE_NUMBER.length));
    }

    return value;
};

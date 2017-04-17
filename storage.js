/**
 * Jenkins client-side storage.
 */
var local;

if (global.window && global.window.localStorage) {
    local = global.window.localStorage;
} else {
    console.warn('No window.localStorage. Creating a mock in-memory localStorage, assuming this is running in a test environment.');
    local = require('localstorage-memory');
}

exports.local = local;

var TYPE_OBJECT = '_$_object:';
var TYPE_NUMBER = '_$_number:';
var TYPE_BOOLEAN = '_$_boolean:';

/**
 * Set a value in local storage.
 * @param {string} name The name/key of the value.
 * @param {string|object|boolean|number} value The value to be stored. Accepts a string, object, boolean or number.
 */
exports.setLocal = function (name, value) {
    exports.set(name, value, local);
};

/**
 * Get a value in local storage.
 * @param {string} name The name/key of the value.
 * @return {string|object|boolean|number|undefined} The stored value, or undefined if no value is stored against that name/key.
 * Returns a string, object, boolean or number, depending on the type of the value when it was
 * stored (set {@link #setLocal}).
 */
exports.getLocal = function (name) {
    return exports.get(name, local);
};

/**
 * Remove a value in local storage.
 * @param {string} name The name/key of the value.
 */
exports.removeLocal = function (name) {
    local.removeItem(name);
};

exports.set = function(name, value, storage) {
    if (name === undefined || name === null) {
        throw new Error('Unexpected call to store via undefined/null name.');
    }
    if (value === undefined || value === null) {
        throw new Error('Unexpected call to store undefined/null value in storage. Name: ' + name);
    }

    var type = typeof value;
    if (type === 'string') {
        storage.setItem(name, value);
    } else if (type === 'object') {
        storage.setItem(name, TYPE_OBJECT + JSON.stringify(value));
    } else if (type === 'number') {
        storage.setItem(name, TYPE_NUMBER + value);
    } else if (type === 'boolean') {
        storage.setItem(name, TYPE_BOOLEAN + value);
    } else {
        throw new Error('Unexpected call to store type "' + type + '". Name: ' + name);
    }
};

exports.get = function(name, storage) {
    var value = storage.getItem(name);

    if (typeof value !== 'string') {
        return undefined;
    }

    if (value.substring(0, TYPE_OBJECT.length) === TYPE_OBJECT) {
        return JSON.parse(value.substring(TYPE_OBJECT.length));
    }
    if (value.substring(0, TYPE_NUMBER.length) === TYPE_NUMBER) {
        return Number(value.substring(TYPE_NUMBER.length));
    }
    if (value.substring(0, TYPE_BOOLEAN.length) === TYPE_BOOLEAN) {
        return Boolean(value.substring(TYPE_BOOLEAN.length));
    }

    return value;
};
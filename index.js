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
const TYPE_BOOLEAN = '_$_boolean:';

/**
 * Set a value in local storage.
 * @param name The name/key of the value.
 * @param value The value to be stored. Accepts a string, object, boolean or number.
 */
exports.setLocal = function (name, value) {
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
    } else if (type === 'boolean') {
        local.setItem(name, TYPE_BOOLEAN + value);
    } else {
        throw new Error('Unexpected call to store type "' + type + '". Name: ' + name);
    }
};

/**
 * Get a value in local storage.
 * @param name The name/key of the value.
 * @return The stored value, or undefined if no value is stored against that name/key.
 * Returns a string, object, boolean or number, depending on the type of the value when it was
 * stored (set {@link #setLocal}).
 */
exports.getLocal = function (name) {
    const value = local.getItem(name);

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


/**
 * Remove a value in local storage.
 * @param name The name/key of the value.
 */
exports.removeLocal = function (name) {
    local.removeItem(name);
};
if (global.window === undefined) {
    global.window = {};
}
if (!global.window.localStorage) {
    console.warn('No window.localStorage. Creating a mock in-memory localStorage, assuming this is running in a test environment.');
    global.window.localStorage = require('localstorage-memory');
}

const local = global.window.localStorage;

const TYPE_OBJECT = '_$_object:';
const TYPE_NUMBER = '_$_number:';
const TYPE_BOOLEAN = '_$_boolean:';

/**
 * Set a value in local storage.
 * @param name The name/key of the value.
 * @param value The value to be stored. Accepts a string, object, boolean or number.
 */
exports.setLocal = function (name, value) {
    set(name, value, local);
};

/**
 * Get a value in local storage.
 * @param name The name/key of the value.
 * @return The stored value, or undefined if no value is stored against that name/key.
 * Returns a string, object, boolean or number, depending on the type of the value when it was
 * stored (set {@link #setLocal}).
 */
exports.getLocal = function (name) {
    return get(name, local);
};

/**
 * Remove a value in local storage.
 * @param name The name/key of the value.
 */
exports.removeLocal = function (name) {
    local.removeItem(name);
};

/**
 * Get a local namespace.
 * <p>
 * Returns a {@link Namespace} instance that can be used to perform operations on values in the namespace.
 * @param name The namespace name.
 * @returns {Namespace}
 */
exports.localNamespace = function(name) {
    return new Namespace(name, local);
};

function set(name, value, storage) {
    if (name === undefined || name === null) {
        throw new Error('Unexpected call to store via undefined/null name.');
    }
    if (value === undefined || value === null) {
        throw new Error('Unexpected call to store undefined/null value in storage. Name: ' + name);
    }

    const type = typeof value;
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
}

function get(name, storage) {
    const value = storage.getItem(name);

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
}

/**
 * Namespace
 * @param name The name of the namespace. A dot seprated value indicates sub-namespacing.
 * @param storage The storage to use.
 * @constructor
 */
function Namespace(name, storage) {
    this.namespaceName = name;
    this.storage = storage;
}
Namespace.prototype = {
    set: function (name, value) {
        return set(this.namespaceName + '.' + name, value, this.storage);
    },
    get: function (name) {
        return get(this.namespaceName + '.' + name, this.storage);
    },
    remove: function (name) {
        return this.storage.removeItem(this.namespaceName + '.' + name);
    }
};
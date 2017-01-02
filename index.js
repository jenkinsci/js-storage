/**
 * Jenkins client-side storage.
 */

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
 * @param {string} name The name/key of the value.
 * @param {string|object|boolean|number} value The value to be stored. Accepts a string, object, boolean or number.
 */
exports.setLocal = function (name, value) {
    set(name, value, local);
};

/**
 * Get a value in local storage.
 * @param {string} name The name/key of the value.
 * @return {string|object|boolean|number} The stored value, or undefined if no value is stored against that name/key.
 * Returns a string, object, boolean or number, depending on the type of the value when it was
 * stored (set {@link #setLocal}).
 */
exports.getLocal = function (name) {
    return get(name, local);
};

/**
 * Remove a value in local storage.
 * @param {string} name The name/key of the value.
 */
exports.removeLocal = function (name) {
    local.removeItem(name);
};

/**
 * Get a local namespace.
 * <p>
 * Returns a {@link StorageNamespace} instance that can be used to perform operations on values in the namespace.
 * @param {string} name The namespace name.
 * @returns {StorageNamespace} The storage namespace.
 * @see {@link StorageNamespace#subspace}
 */
exports.localNamespace = function(name) {
    return new StorageNamespace(name, local);
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
 * Storage Namespace.
 * <p>
 * This class allows us to "unflatten" the client Storage (localStorage or sessionStorage) i.e. allows us to introduce
 * an artificial hierarchy within the Storage.
 * <p>
 * This works by prefixing the key names with a namespace, allowing the clearing of a set of values by namespace,
 * as well as storing values by the same name within different namespaces e.g. creating to StorageNamespace instances
 * named "a/b" and "a/z" and setting a value on key "org.jenkins.magickey" on both would work perfectly fine as they
 * would be stored in the underlying storage via keys "a/b:org.jenkins.magickey" and "a/z:org.jenkins.magickey".
 *
 * @param {string} name The name of the namespace. A forward slash separated value indicates sub-namespacing e.g. "a/b".
 * @param {Storage} storage The storage instance to use e.g. {@link window.localStorage} or {@link window.sessionStorage}.
 * @constructor
 */
function StorageNamespace(name, storage) {
    this.namespaceName = name;
    this.storage = storage;
}
StorageNamespace.prototype = {
    /**
     * Set a value in the namespace.
     * @param {string} name The name/key.
     * @param {string|object|boolean|number} value The value.
     */
    set: function (name, value) {
        return set(this.namespaceName + ':' + name, value, this.storage);
    },
    /**
     * Get a value from the namespace.
     * @param {string} name The name/key.
     * @return {string|object|boolean|number} The value.
     */
    get: function (name) {
        return get(this.namespaceName + ':' + name, this.storage);
    },
    /**
     * Remove a value from the namespace.
     * @param {string} name The name/key.
     */
    remove: function (name) {
        return this.storage.removeItem(this.namespaceName + ':' + name);
    },
    /**
     * Clear all stored values in this namespace.
     */
    clear: function() {
        this.iterate(function(key) {
            this.remove(key);
        });
    },
    /**
     * Iterate the key/value pairs in this namespace.
     * @param {function} callback A callback that's called with the key (1st arg) value (2nd arg) pairs.
     * <code>this</code> for the callback is set to "this" {StorageNamespace} instance.
     */
    iterate: function (callback) {
        const namespacePrefix = this.namespaceName + ':';
        const nsKeys = [];
        for (var i = 0; i < this.storage.length; i++) {
            const keyName = this.storage.key(i);
            if (keyName.substring(0, namespacePrefix.length) === namespacePrefix) {
                nsKeys.push(keyName);
            }
        }
        for (var ii = 0; ii < nsKeys.length; ii++) {
            var nsKey = nsKeys[ii].substring(namespacePrefix.length);
            var nsValue = this.storage.getItem(nsKey);
            try {
                callback.call(this, nsKey, nsValue);
            } catch (e) {
                console.error('Error iterating storage namespace.', e);
            }
        }
    },
    /**
     * Create a sub-namespace of this namespace.
     * <p>
     * Creating a sub-space "y" from a namespace "x" will result in a new namespace named "x/y" (see example below).
     * @param {string} name The name of the sub-space.
     * @returns {StorageNamespace} The storage namespace.
     * @example
     * const storage = require('@jenkins-cd/storage');
     * const x = storage.localNamespace('x'); // "x"
     * const y = x.subspace('y'); // "x/y"
     */
    subspace: function(name) {
        return new StorageNamespace(this.namespaceName + '/' + name, this.storage);
    }
};
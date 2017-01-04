const storage = require('./storage');

/**
 * Storage Namespace class.
 * <p>
 * This class allows us to "unflatten" and "typen" the client Storage (localStorage or sessionStorage) i.e. allows us to introduce
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
 * @example
 * // Store some info in a namespace.
 * const storage = require('@jenkins-cd/storage');
 * const jenkinsInstance = storage.localNamespace('jenkins-instance');
 * jenkinsInstance.set('currentVersion', versionString);
 * jenkinsInstance.set('currentPlugins', pluginsArray);
 *
 * @example
 * // After detecting that the Jenkins instance version has changed, or
 * // active plugins have changed, lets clear the "jenkins-instance"
 * // namespace.
 * const storage = require('@jenkins-cd/storage');
 * const jenkinsInstance = storage.localNamespace('jenkins-instance');
 * jenkinsInstance.clear(); // Clear all NVPs in that namespace only.
 */
function StorageNamespace(name, storage) {
    this.namespaceName = name;
    this.storageInst = storage;
}
StorageNamespace.prototype = {
    /**
     * Set a value in the namespace.
     * @param {string} name The name/key.
     * @param {string|object|boolean|number} value The value.
     */
    set: function (name, value) {
        return storage.set(this.namespaceName + ':' + name, value, this.storageInst);
    },
    /**
     * Get a value from the namespace.
     * <p>
     * Options controlling the get can be configured by the optional "options"
     * object argument. Available options:
     * <ul>
     *     <li>"checkDotParent": Flag (true/false) indicating that if the name is (e.g.) "a.b.c" and no value is found for that name, then fall back and check "a.b" and then "a" etc.
     * </ul>
     *
     * @param {string} name The name/key.
     * @param {undefined|object} options Used to configure the secondary checks that
     * should be made should there not be a value for the initially specified key.
     * See examples below.
     * @return {string|object|boolean|number|undefined} The value.
     * @example
     * // get a value from a namespace
     * const storage = require('@jenkins-cd/storage');
     * const jenkinsInstance = storage.localNamespace('jenkins-instance');
     * const lastVersion = jenkinsInstance.get('currentVersion');
     *
     * if (lastVersion !== versionString) {
     *     // Jenkins version has changed deom the last time we ran
     *     // in this browser. Lets clear all old stored values.
     *     jenkinsInstance.clear();
     * }
     *
     * @example
     * // get a value from a namespace, with fallback
     * const storage = require('@jenkins-cd/storage');
     * const jenkinsInstance = storage.localNamespace('jenkins-instance');
     * const logCategories = jenkinsInstance.subspace('log-categories');
     * const sseLogLevel = logCategories.get('org.jenkins.blueocean.sse', {checkDotParent: true});
     *
     * if (sseLogLevel) {
     *     // A log level for 'org.jenkins.blueocean.sse', or one of it's "dot parent"
     *     // ('org.jenkins.blueocean' etc) is set ... do something with with it.
     *     // Of course this would be wrapped up in a higher level logging API e.g.
     *     // in @jenkins-cd/diag.
     * }
     */
    get: function (name, options) {
        var value = storage.get(this.namespaceName + ':' + name, this.storageInst);

        if (value) {
            return value;
        }

        if (options) {
            if (options.checkDotParent) {
                var nameDotTokens = name.split('\.');
                while (nameDotTokens.length > 0) {
                    nameDotTokens.pop();
                    const dotParentName = nameDotTokens.join('.');
                    value = storage.get(this.namespaceName + ':' + dotParentName, this.storageInst);
                    if (value) {
                        return value;
                    }
                }
            }
        }

        return undefined;
    },
    /**
     * Remove a value from the namespace.
     * @param {string} name The name/key.
     */
    remove: function (name) {
        return this.storageInst.removeItem(this.namespaceName + ':' + name);
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
     * Get the count of stored values in this namespace.
     * <p>
     * Note that this is not a "free" operation. This function iterates the
     * namespace values in order to count.
     * @return {number} The count of stored values in this namespace.
     */
    count: function() {
        var count = 0;
        this.iterate(function() {
            count++;
        });
        return count;
    },
    /**
     * Iterate the key/value pairs in this namespace.
     * @param {function} callback A callback that's called with the key (1st arg) value (2nd arg) pairs.
     * <code>this</code> for the callback is set to "this" {StorageNamespace} instance.
     */
    iterate: function (callback) {
        const namespacePrefix = this.namespaceName + ':';
        const nsKeys = [];
        for (var i = 0; i < this.storageInst.length; i++) {
            const keyName = this.storageInst.key(i);
            if (keyName.substring(0, namespacePrefix.length) === namespacePrefix) {
                nsKeys.push(keyName);
            }
        }
        for (var ii = 0; ii < nsKeys.length; ii++) {
            var nsKey = nsKeys[ii].substring(namespacePrefix.length);
            var nsValue = this.storageInst.getItem(nsKey);
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
        return new StorageNamespace(this.namespaceName + '/' + name, this.storageInst);
    }
};

module.exports = StorageNamespace;
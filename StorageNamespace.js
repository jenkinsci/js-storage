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
     *     <li>"checkDotParent": Flag (true/false) or an array of permitted values, indicating that if the name is (e.g.) "a.b.c" and no value is found for that name (or the found value is not permitted), then fall back and check "a.b" and then "a" etc.
     * </ul>
     *
     * @param {string} name The name/key.
     * @param {object} [options] Used to configure the secondary checks that
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
            // Do not return the value if there's a options.checkDotParent config
            // with value constraints on it.
            if (options && options.checkDotParent && Array.isArray(options.checkDotParent)) {
                // options.checkDotParent is defining an enum of permitted values.
                if (options.checkDotParent.indexOf(value) !== -1) {
                    return value;
                }
            } else {
                return value;
            }
        }

        if (options) {
            if (options.checkDotParent) {
                var nameDotTokens = name.split('\.');
                while (nameDotTokens.length > 0) {
                    nameDotTokens.pop();
                    const dotParentName = nameDotTokens.join('.');
                    value = storage.get(this.namespaceName + ':' + dotParentName, this.storageInst);
                    if (value) {
                        if (Array.isArray(options.checkDotParent)) {
                            // options.checkDotParent is defining an enum of permitted values.
                            if (options.checkDotParent.indexOf(value) !== -1) {
                                return value;
                            }
                        } else {
                            return value;
                        }
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
     * @param {boolean} [clearSubspaces] Also clear subspace values. Default <code>true</code>.
     */
    clear: function(clearSubspaces) {
        this.iterate(function(key, value, namespace) {
            return this.storageInst.removeItem(namespace + ':' + key);
        }, clearSubspaces);
    },
    /**
     * Get the count of stored values in this namespace.
     * <p>
     * Note that this is not a "free" operation. This function iterates the
     * namespace values in order to count.
     * @return {number} The count of stored values in this namespace.
     * @param {boolean} [countSubspaces] Also count subspace values. Default <code>true</code>.
     */
    count: function(countSubspaces) {
        var count = 0;
        this.iterate(function() {
            count++;
        }, countSubspaces);
        return count;
    },
    /**
     * Iterate the key/value pairs in this namespace.
     * <p>
     * Note, values in subspaces will also be sent to the callback.
     * @param {function} callback A callback that's called with the key (1st arg) value (2nd arg) pairs,
     * as well as the namespace (3rd arg) that the value is in (which can be a subspace).
     * <code>this</code> for the callback is set to "this" {StorageNamespace} instance.
     * @param {boolean} [iterateSubspaces] Also iterate subspace values. Default <code>true</code>.
     */
    iterate: function (callback, iterateSubspaces) {
        const subspacePrefix = this.namespaceName + '/';
        const matchedEntries = [];

        // default iterateSubspaces to true.
        if (iterateSubspaces === undefined) {
            iterateSubspaces = true;
        }

        // Iterate all keys in the Storage, looking for
        // keys where they are an exact match for this namespace,
        // or a subspace of this namespace (if iterateSubspaces true).
        // Add ref objects to matchedEntries for each match.
        for (var i = 0; i < this.storageInst.length; i++) {
            const qName = this.storageInst.key(i);
            const keyNameTokens = qName.split(':');
            if (keyNameTokens.length > 1) {
                const keyNamespace = keyNameTokens.shift();
                const key = keyNameTokens.join(':');
                if (keyNamespace === this.namespaceName) {
                    // Exact namespace match
                    matchedEntries.push({
                        qName: qName,
                        namespace: keyNamespace,
                        key: key
                    });
                } else if (iterateSubspaces && keyNamespace.substring(0, subspacePrefix.length) === subspacePrefix) {
                    // Subspace match
                    matchedEntries.push({
                        qName: qName,
                        namespace: keyNamespace,
                        key: key
                    });
                }
            }
        }

        // Iterate the ref objects in matchedEntries, calling the
        // callback for each object.
        for (var ii = 0; ii < matchedEntries.length; ii++) {
            var matchedEntry = matchedEntries[ii];
            var nsValue = this.storageInst.getItem(matchedEntry.qName);
            try {
                callback.call(this, matchedEntry.key, nsValue, matchedEntry.namespace);
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
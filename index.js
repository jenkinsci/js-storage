/**
 * Jenkins client-side storage.
 */

// TODO: find out how to @ignore from inside the storage module. TFs initial attempts failed.
/**
 * @ignore
 */
var storage = require('./storage');
var StorageNamespace = require('./StorageNamespace');

var JENKINS_NS_NAME = 'jenkins-instance';

/**
 * Get a local namespace.
 * <p>
 * Returns a {@link StorageNamespace} instance that can be used to perform operations on values in the namespace.
 * <p>
 * Use {@link jenkinsNamespace} if you want the Storage namespace for the Jenkins instance.
 *
 * @param {string} name The namespace name.
 * @returns {StorageNamespace} The storage namespace.
 * @see {@link StorageNamespace#subspace} and {@link #jenkinsNamespace}.
 */
exports.localNamespace = function(name) {
    if (name === JENKINS_NS_NAME) {
        throw new Error('Call to localNamespace() function using a reserved namespace name "' + JENKINS_NS_NAME + '". Please call jenkinsInstanceNamespace() instead.');
    }
    return new StorageNamespace(name, storage.local);
};

/**
 * Get the Jenkins Instance namespace.
 * <p>
 * Returns a {@link StorageNamespace} instance that can be used for the Jenkins instance. Note that it is up
 * to the bootstrapping application (e.g. the blueocean-web plugin) to clear the namespace
 * (see {@link StorageNamespace#clear}) when it detects that the backend Jenkins instance has changed in some
 * way i.e. a new Jenkins version or a change in plugin configuration.
 *
 * @param {string|undefined} jenkinsInstanceId The Jenkins Instance ID, or {@code undefined}.
 * @returns {StorageNamespace} The storage namespace for the Jenkins instance.
 * @see {@link StorageNamespace#subspace}
 */
exports.jenkinsNamespace = function(jenkinsInstanceId) {
    if (jenkinsInstanceId) {
        return new StorageNamespace(JENKINS_NS_NAME + '-' + jenkinsInstanceId, storage.local);
    } else {
        return new StorageNamespace(JENKINS_NS_NAME, storage.local);
    }
};
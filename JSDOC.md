Jenkins client-side storage JavaScript API, providing a simple API on top of the HTML5 [Storage] (Web Storage API).

HTML5 [Storage] is great for storing per-domain name/value pairs, but it's a totally flat and untyped structure.
The lack of hierarchy/namespacing makes it difficult to perform operations on subsets of data stored in
[localStorage] e.g. to clear out (invalidate) a subset of [localStorage] NVPs when a new instance of Jenkins is
installed, or to group a subset of NVPs and have APIs that allow the client code to just navigate those properties
only e.g. log categories.

This API attempts to do the following: 

1. Namespaces the [Storage] so that we can perform operations on a subset of NVPs.
1. Support more than just `string` values e.g. `boolean`, `number` and `object`. Not `function` though, obviously.
1. Support subspaces i.e. namespaces inside namespaces e.g. you could have the "log-gategory" namespace inside the "jenkins-instance" namespace i.e. "jenkins-instance/log-gategory". Another one might be "jenkins-instance/classes-info" for storing classes metadata Vs the client UI contantly firing REST API calls to get it (see JENKINS-40080).
1. Support `get` fallback options, whereby you can configure the `get` to look in the parent namespaces, or if using a dot separated key in the name (the N part of the NVP) that it can be configured to check back along the "dot parent path" e.g. if "org.jenkins.a.b" has no value, then fallback and check "org.jenkins.a" etc. This would be useful for e.g. log categories.

# StorageNamespace

The API offers a few top-level utility functions, but the main one is [`localNamespace`](./global.html#localNamespace),
which returns an instance of the [StorageNamespace] class. [StorageNamespace] is where the interesting action happens.

__Examples__:

```javascript
// Store some info in a namespace.
const storage = require('@jenkins-cd/storage');
const jenkinsInstance = storage.localNamespace('jenkins-instance');
jenkinsInstance.set('currentVersion', versionString);
jenkinsInstance.set('currentPlugins', pluginsArray);
```

```javascript
// After detecting that the Jenkins instance version has changed, or
// active plugins have changed, lets clear the "jenkins-instance"
// namespace.
const storage = require('@jenkins-cd/storage');
const jenkinsInstance = storage.localNamespace('jenkins-instance');
jenkinsInstance.clear(); // Clear all NVPs in that namespace only.
```

See the [StorageNamespace] docs for more details and examples.

[Storage]: https://developer.mozilla.org/en-US/docs/Web/API/Storage
[localStorage]: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
[StorageNamespace]: ./StorageNamespace.html


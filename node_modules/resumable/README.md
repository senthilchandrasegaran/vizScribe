# Resumable

Define a resumable task queue.


## Usage

```javascript
  var Resumable = require('resumable');
  var mod = require('./foo');

  // Use some kind of persistent storage
  // with available 'get/set' methods.
  // A redis client, for example.
  var store = new Redis(...);

  var queue = new Resumable({
    key: 'queue-foo',
    mod: mod,
    storage: store,
    ensure: function(list) {
      var seen = {};
      var ret = list.filter(function(arg) {
        if (!arg[0] || !arg[1]) return false;
        if (arg[1].user in seen) return false;
        seen[arg[1].user] = 1;
        return true;
      });
      return ret;
    }
  });
  mod.queue = queue;
```

In `foo.js`:

```javascript
module.exports = {
  method_1: function(arg) {
    module.exports.queue.safely('method_1', arg);
  },
};
```

The `arg` object should provide callbacks for `success` and `error`:
```
{
  success: function(){ },
  error: function(){ }
}
```

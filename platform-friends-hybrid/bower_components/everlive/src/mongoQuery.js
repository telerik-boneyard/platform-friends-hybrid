(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mongoQuery = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * Module dependencies.
 */

var ops = require('./ops');
var eql = require('mongo-eql');
var dot = require('dot-component');
var type = require('component-type');
var object = require('object-component');
var debug = require('debug')('mongo-query');

/**
 * Module exports.
 */

module.exports = exports = filter;
exports.ops = ops;

/**
 * Filters an `obj` by the given `query` for subdocuments.
 *
 * @return {Object|Boolean} false if no match, or matched subdocs
 * @api public
 */

function filter(obj, query){
  obj = obj || {};
  var ret = {};

  for (var key in query) {
    if (!query.hasOwnProperty(key)) continue;

    // search value
    var val = query[key];

    // split the key into prefix and suffix
    var keys = key.split('.');
    var target = obj;
    var prefix, search;
    var matches = [];

    walk_keys:
    for (var i = 0; i < keys.length; i++) {
      target = target[keys[i]];

      switch (type(target)) {
        case 'array':
          // if it's an array subdocument search we stop here
          prefix = keys.slice(0, i + 1).join('.');
          search = keys.slice(i + 1).join('.');

          debug('searching array "%s"', prefix);

          // we special case operators that don't walk the array
          if (val.$size && !search.length) {
            return compare(val, target);
          }

          // walk subdocs
          var subset = ret[prefix] || target;

          for (var ii = 0; ii < subset.length; ii++) {
            if (search.length) {
              var q = {};
              q[search] = val;
              if ('object' == type(subset[ii])) {
                debug('attempting subdoc search with query %j', q);
                if (filter(subset[ii], q)) {
                  // we ignore the ret value of filter
                  if (!ret[prefix] || !~ret[prefix].indexOf(subset[ii])) {
                    matches.push(subset[ii]);
                  }
                }
              }
            } else {
              debug('performing simple array item search');
              if (compare(val, subset[ii])) {
                if (!ret[prefix] || !~ret[prefix].indexOf(subset[ii])) {
                  matches.push(subset[ii]);
                }
              }
            }
          }

          if (matches.length) {
            ret[prefix] = ret[prefix] || [];
            ret[prefix].push.apply(ret[prefix], matches);
          }

          // we don't continue the key search
          break walk_keys;

        case 'undefined':
          // if we can't find the key
          return false;

        case 'object':
          if (null != keys[i + 1]) {
            continue;
          } else if (!compare(val, target)) {
            return false;
          }
          break;

        default:
          if (!compare(val, target)) return false;
      }
    }
  }

  return ret;
}

/**
 * Compares the given matcher with the document value.
 *
 * @param {Mixed} matcher
 * @param {Mixed} value
 * @api private
 */

function compare(matcher, val){
  if ('object' != type(matcher)) {
    return eql(matcher, val);
  }

  var keys = object.keys(matcher);
  if ('$' == keys[0][0]) {
    for (var i = 0; i < keys.length; i++) {
      // special case for sub-object matching
      if ('$elemMatch' == keys[i]) {
        return false !== filter(val, matcher.$elemMatch);
      } else {
        if (!ops[keys[i]](matcher[keys[i]], val)) return false;
      }
    }
    return true;
  } else {
    return eql(matcher, val);
  }
}

},{"./ops":12,"component-type":4,"debug":5,"dot-component":8,"mongo-eql":10,"object-component":11}],2:[function(require,module,exports){

/**
 * Module dependencies.
 */

var mods = require('./mods');
var filter = require('./filter');
var dot = require('dot-component');
var type = require('component-type');
var object = require('object-component');
var debug = require('debug')('mongo-query');

/**
 * Module exports.
 */

module.exports = exports = query;

/**
 * Export filter helper.
 */

exports.filter = filter;

/**
 * Export modifiers.
 */

exports.mods = mods;

/**
 * Execute a query.
 *
 * Options:
 *  - `strict` only modify if query matches
 *
 * @param {Object} object to alter
 * @param {Object} query to filter modifications by
 * @param {Object} update object
 * @param {Object} options
 */

function query(obj, query, update, opts){
  obj = obj || {};
  opts = opts || {};
  query = query || {};
  update = update || {};

  // strict mode
  var strict = !!opts.strict;

  var match;
  var log = [];

  if (object.length(query)) {
    match = filter(obj, query);
  }

  if (!strict || false !== match) {
    var keys = object.keys(update);
    var transactions = [];

    for (var i = 0, l = keys.length; i < l; i++) {
      if (mods[keys[i]]) {
        debug('found modifier "%s"', keys[i]);
        for (var key in update[keys[i]]) {
          var pos = key.indexOf('.$.');

          if (~pos) {
            var prefix = key.substr(0, pos);
            var suffix = key.substr(pos + 3);

            if (match[prefix]) {
              debug('executing "%s" %s on first match within "%s"', key, keys[i], prefix);
              var fn = mods[keys[i]](match[prefix][0], suffix, update[keys[i]][key]);
              if (fn) {
                // produce a key name replacing $ with the actual index
                // TODO: this is unnecessarily expensive
                var index = dot.get(obj, prefix).indexOf(match[prefix][0]);
                fn.key = prefix + '.' + index + '.' + suffix;
                fn.op = keys[i];
                transactions.push(fn);
              }
            } else {
              debug('ignoring "%s" %s - no matches within "%s"', key, keys[i], prefix);
            }
          } else {
            var fn = mods[keys[i]](obj, key, update[keys[i]][key]);
            if (fn) {
              fn.key = key;
              fn.op = keys[i];
              transactions.push(fn);
            }
          }
        }
      } else {
        debug('skipping unknown modifier "%s"', keys[i]);
      }
    }

    if (transactions.length) {
      // if we got here error free we process all transactions
      for (var i = 0; i < transactions.length; i++) {
        var fn = transactions[i];
        var val = fn();
        log.push({ op: fn.op, key: fn.key, value: val });
      }
    }
  } else {
    debug('no matches for query %j', query);
  }

  return log;
}

},{"./filter":1,"./mods":3,"component-type":4,"debug":5,"dot-component":8,"object-component":11}],3:[function(require,module,exports){

/**
 * Module dependencies.
 */

var eql = require('mongo-eql');
var dot = require('dot-component');
var type = require('component-type');
var keys = require('object-component').keys;
var debug = require('debug')('mongo-query');

/**
 * Performs a `$set`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {String} value to set
 * @return {Function} transaction (unless noop)
 */

exports.$set = function $set(obj, path, val){
  var key = path.split('.').pop();
  obj = dot.parent(obj, path, true);

  switch (type(obj)) {
    case 'object':
      if (!eql(obj[key], val)) {
        return function(){
          obj[key] = val;
          return val;
        };
      }
      break;

    case 'array':
      if (numeric(key)) {
        if (!eql(obj[key], val)) {
          return function(){
            obj[key] = val;
            return val;
          };
        }
      } else {
        throw new Error('can\'t append to array using string field name [' + key + ']');
      }
      break;

    default:
      throw new Error('$set only supports object not ' + type(obj));
  }
};

/**
 * Performs an `$unset`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {String} value to set
 * @return {Function} transaction (unless noop)
 */

exports.$unset = function $unset(obj, path){
  var key = path.split('.').pop();
  obj = dot.parent(obj, path);

  switch (type(obj)) {
    case 'array':
    case 'object':
      if (obj.hasOwnProperty(key)) {
        return function(){
          // reminder: `delete arr[1]` === `delete arr['1']` [!]
          delete obj[key];
        };
      } else {
        // we fail silently
        debug('ignoring unset of inexisting key');
      }
  }
};

/**
 * Performs a `$rename`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {String} value to set
 * @return {Function} transaction (unless noop)
 */

exports.$rename = function $rename(obj, path, newKey){
  // target = source
  if (path == newKey) {
    throw new Error('$rename source must differ from target');
  }

  // target is parent of source
  if (0 === path.indexOf(newKey + '.')) {
    throw new Error('$rename target may not be a parent of source');
  }

  var p = dot.parent(obj, path);
  var t = type(p);

  if ('object' == t) {
    var key = path.split('.').pop();

    if (p.hasOwnProperty(key)) {
      return function(){
        var val = p[key];
        delete p[key];

        // target does initialize the path
        var newp = dot.parent(obj, newKey, true);

        // and also fails silently upon type mismatch
        if ('object' == type(newp)) {
          newp[newKey.split('.').pop()] = val;
        } else {
          debug('invalid $rename target path type');
        }

        // returns the name of the new key
        return newKey;
      };
    } else {
      debug('ignoring rename from inexisting source');
    }
  } else if ('undefined' != t) {
    throw new Error('$rename source field invalid');
  }
};

/**
 * Performs an `$inc`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {String} value to set
 * @return {Function} transaction (unless noop)
 */

exports.$inc = function $inc(obj, path, inc){
  if ('number' != type(inc)) {
    throw new Error('Modifier $inc allowed for numbers only');
  }

  obj = dot.parent(obj, path, true);
  var key = path.split('.').pop();

  switch (type(obj)) {
    case 'array':
    case 'object':
      if (obj.hasOwnProperty(key)) {
        if ('number' != type(obj[key])) {
          throw new Error('Cannot apply $inc modifier to non-number');
        }

        return function(){
          obj[key] += inc;
          return inc;
        };
      } else if('object' == type(obj) || numeric(key)){
        return function(){
          obj[key] = inc;
          return inc;
        };
      } else {
        throw new Error('can\'t append to array using string field name [' + key + ']');
      }
      break;

    default:
      throw new Error('Cannot apply $inc modifier to non-number');
  }
};

/**
 * Performs an `$pop`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {String} value to set
 * @return {Function} transaction (unless noop)
 */

exports.$pop = function $pop(obj, path, val){
  obj = dot.parent(obj, path);
  var key = path.split('.').pop();

  // we make sure the array is not just the parent of the main key
  switch (type(obj)) {
    case 'array':
    case 'object':
      if (obj.hasOwnProperty(key)) {
        switch (type(obj[key])) {
          case 'array':
            if (obj[key].length) {
              return function(){
                if (-1 == val) {
                  return obj[key].shift();
                } else {
                  // mongodb allows any value to pop
                  return obj[key].pop();
                }
              };
            }
            break;

          case 'undefined':
            debug('ignoring pop to inexisting key');
            break;

          default:
            throw new Error('Cannot apply $pop modifier to non-array');
        }
      } else {
        debug('ignoring pop to inexisting key');
      }
      break;

    case 'undefined':
      debug('ignoring pop to inexisting key');
      break;
  }
};

/**
 * Performs a `$push`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {Object} value to push
 * @return {Function} transaction (unless noop)
 */

exports.$push = function $push(obj, path, val){
  obj = dot.parent(obj, path, true);
  var key = path.split('.').pop();

  switch (type(obj)) {
    case 'object':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          return function(){
            obj[key].push(val);
            return val;
          };
        } else {
          throw new Error('Cannot apply $push/$pushAll modifier to non-array');
        }
      } else {
        return function(){
          obj[key] = [val];
          return val;
        };
      }
      break;

    case 'array':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          return function(){
            obj[key].push(val);
            return val;
          };
        } else {
          throw new Error('Cannot apply $push/$pushAll modifier to non-array');
        }
      } else if (numeric(key)) {
        return function(){
          obj[key] = [val];
          return val;
        };
      } else {
        throw new Error('can\'t append to array using string field name [' + key + ']');
      }
      break;
  }
};

/**
 * Performs a `$pushAll`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {Array} values to push
 * @return {Function} transaction (unless noop)
 */

exports.$pushAll = function $pushAll(obj, path, val){
  if ('array' != type(val)) {
    throw new Error('Modifier $pushAll/pullAll allowed for arrays only');
  }

  obj = dot.parent(obj, path, true);
  var key = path.split('.').pop();

  switch (type(obj)) {
    case 'object':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          return function(){
            obj[key].push.apply(obj[key], val);
            return val;
          };
        } else {
          throw new Error('Cannot apply $push/$pushAll modifier to non-array');
        }
      } else {
        return function(){
          obj[key] = val;
          return val;
        };
      }
      break;

    case 'array':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          return function(){
            obj[key].push.apply(obj[key], val);
            return val;
          };
        } else {
          throw new Error('Cannot apply $push/$pushAll modifier to non-array');
        }
      } else if (numeric(key)) {
        return function(){
          obj[key] = val;
          return val;
        };
      } else {
        throw new Error('can\'t append to array using string field name [' + key + ']');
      }
      break;
  }
};

/**
 * Performs a `$pull`.
 */

exports.$pull = function $pull(obj, path, val){
  obj = dot.parent(obj, path, true);
  var key = path.split('.').pop();
  var t = type(obj);

  switch (t) {
    case 'object':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          var pulled = [];
          var splice = pull(obj[key], [val], pulled);
          if (pulled.length) {
            return function(){
              splice();
              return pulled;
            };
          }
        } else {
          throw new Error('Cannot apply $pull/$pullAll modifier to non-array');
        }
      }
      break;

    case 'array':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          var pulled = [];
          var splice = pull(obj[key], [val], pulled);
          if (pulled.length) {
            return function(){
              splice();
              return pulled;
            };
          }
        } else {
          throw new Error('Cannot apply $pull/$pullAll modifier to non-array');
        }
      } else {
        debug('ignoring pull to non array');
      }
      break;

    default:
      if ('undefined' != t) {
        throw new Error('LEFT_SUBFIELD only supports Object: hello not: ' + t);
      }
  }
};

/**
 * Performs a `$pullAll`.
 */

exports.$pullAll = function $pullAll(obj, path, val){
  if ('array' != type(val)) {
    throw new Error('Modifier $pushAll/pullAll allowed for arrays only');
  }

  obj = dot.parent(obj, path, true);
  var key = path.split('.').pop();
  var t = type(obj);

  switch (t) {
    case 'object':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          var pulled = [];
          var splice = pull(obj[key], val, pulled);
          if (pulled.length) {
            return function(){
              splice();
              return pulled;
            };
          }
        } else {
          throw new Error('Cannot apply $pull/$pullAll modifier to non-array');
        }
      }
      break;

    case 'array':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          var pulled = [];
          var splice = pull(obj[key], val, pulled);
          if (pulled.length) {
            return function(){
              splice();
              return pulled;
            };
          }
        } else {
          throw new Error('Cannot apply $pull/$pullAll modifier to non-array');
        }
      } else {
        debug('ignoring pull to non array');
      }
      break;

    default:
      if ('undefined' != t) {
        throw new Error('LEFT_SUBFIELD only supports Object: hello not: ' + t);
      }
  }
};

/**
 * Performs a `$addToSet`.
 *
 * @param {Object} object to modify
 * @param {String} path to alter
 * @param {Object} value to push
 * @param {Boolean} internal, true if recursing
 * @return {Function} transaction (unless noop)
 */

exports.$addToSet = function $addToSet(obj, path, val, recursing){
  if (!recursing && 'array' == type(val.$each)) {
    var fns = [];
    for (var i = 0, l = val.$each.length; i < l; i++) {
      var fn = $addToSet(obj, path, val.$each[i], true);
      if (fn) fns.push(fn);
    }
    if (fns.length) {
      return function(){
        var values = [];
        for (var i = 0; i < fns.length; i++) values.push(fns[i]());
        return values;
      };
    } else {
      return;
    }
  }

  obj = dot.parent(obj, path, true);
  var key = path.split('.').pop();

  switch (type(obj)) {
    case 'object':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          if (!has(obj[key], val)) {
            return function(){
              obj[key].push(val);
              return val;
            };
          }
        } else {
          throw new Error('Cannot apply $addToSet modifier to non-array');
        }
      } else {
        return function(){
          obj[key] = [val];
          return val;
        };
      }
      break;

    case 'array':
      if (obj.hasOwnProperty(key)) {
        if ('array' == type(obj[key])) {
          if (!has(obj[key], val)) {
            return function(){
              obj[key].push(val);
              return val;
            };
          }
        } else {
          throw new Error('Cannot apply $addToSet modifier to non-array');
        }
      } else if (numeric(key)) {
        return function(){
          obj[key] = [val];
          return val;
        };
      } else {
        throw new Error('can\'t append to array using string field name [' + key + ']');
      }
      break;
  }
};

/**
 * Helper for determining if an array has the given value.
 *
 * @param {Array} array
 * @param {Object} value to check
 * @return {Boolean}
 */

function has(array, val){
  for (var i = 0, l = array.length; i < l; i++) {
    if (eql(val, array[i])) return true;
  }
  return false;
}

/**
 * Array#filter function generator for `$pull`/`$pullAll` operations.
 *
 * @param {Array} array of values to match
 * @param {Array} array to populate with results
 * @return {Function} that splices the array
 */

function pull(arr, vals, pulled){
  var indexes = [];

  for (var a = 0; a < arr.length; a++) {
    var val = arr[a];

    for (var i = 0; i < vals.length; i++) {
      var matcher = vals[i];
      if ('object' == type(matcher)) {
        // we only are only interested in obj <-> obj comparisons
        if ('object' == type(val)) {
          var match = false;

          if (keys(matcher).length) {
            for (var i in matcher) {
              if (matcher.hasOwnProperty(i)) {
                // we need at least one matching key to pull
                if (eql(matcher[i], val[i])) {
                  match = true;
                } else {
                  // if a single key doesn't match we move on
                  match = false;
                  break;
                }
              }
            }
          } else if (!keys(val).length) {
            // pull `{}` matches [{}]
            match = true;
          }

          if (match) {
            indexes.push(a);
            pulled.push(val);
            continue;
          }
        } else {
          debug('ignoring pull match against object');
        }
      } else {
        if (eql(matcher, val)) {
          indexes.push(a);
          pulled.push(val);
          continue;
        }
      }
    }
  }

  return function(){
    for (var i = 0; i < indexes.length; i++) {
      var index = indexes[i];
      arr.splice(index - i, 1);
    }
  };
}

/**
 * Helper to determine if a value is numeric.
 *
 * @param {String|Number} value
 * @return {Boolean} true if numeric
 * @api private
 */

function numeric(val){
  return 'number' == type(val) || Number(val) == val;
}

},{"component-type":4,"debug":5,"dot-component":8,"mongo-eql":10,"object-component":11}],4:[function(require,module,exports){
/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object Error]': return 'error';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val !== val) return 'nan';
  if (val && val.nodeType === 1) return 'element';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val)

  return typeof val;
};

},{}],5:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Use chrome.storage.local if we are in an app
 */

var storage;

if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined')
  storage = chrome.storage.local;
else
  storage = localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      storage.removeItem('debug');
    } else {
      storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

},{"./debug":6}],6:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":7}],7:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],8:[function(require,module,exports){

/**
 * Module dependencies.
 */

var type = require('type-component');

/**
 * Gets a certain `path` from the `obj`.
 *
 * @param {Object} target
 * @param {String} key
 * @return {Object} found object, or `undefined
 * @api public
 */

exports.get = function(obj, path){
  if (~path.indexOf('.')) {
    var par = parent(obj, path);
    var mainKey = path.split('.').pop();
    var t = type(par);
    if ('object' == t || 'array' == t) return par[mainKey];
  } else {
    return obj[path];
  }
};

/**
 * Sets the given `path` to `val` in `obj`.
 *
 * @param {Object} target
 * @Param {String} key
 * @param {Object} value
 * @api public
 */

exports.set = function(obj, path, val){
  if (~path.indexOf('.')) {
    var par = parent(obj, path, true);
    var mainKey = path.split('.').pop();
    if (par && 'object' == type(par)) par[mainKey] = val;
  } else {
    obj[path] = val;
  }
};

/**
 * Gets the parent object for a given key (dot notation aware).
 *
 * - If a parent object doesn't exist, it's initialized.
 * - Array index lookup is supported
 *
 * @param {Object} target object
 * @param {String} key
 * @param {Boolean} true if it should initialize the path
 * @api public
 */

exports.parent = parent;

function parent(obj, key, init){
  if (~key.indexOf('.')) {
    var pieces = key.split('.');
    var ret = obj;

    for (var i = 0; i < pieces.length - 1; i++) {
      // if the key is a number string and parent is an array
      if (Number(pieces[i]) == pieces[i] && 'array' == type(ret)) {
        ret = ret[pieces[i]];
      } else if ('object' == type(ret)) {
        if (init && !ret.hasOwnProperty(pieces[i])) {
          ret[pieces[i]] = {};
        }
        if (ret) ret = ret[pieces[i]];
      }
    }

    return ret;
  } else {
    return obj;
  }
}

},{"type-component":9}],9:[function(require,module,exports){

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val === Object(val)) return 'object';

  return typeof val;
};

},{}],10:[function(require,module,exports){

/**
 * Module dependencies.
 */

var type = require('component-type');

/**
 * Module exports.
 */

module.exports = eql;

/**
 * MongoDB style value comparisons.
 *
 * @param {Object} matcher
 * @param {Object} value
 * @return {Boolean} true if they match
 */

function eql(matcher, val){
  switch (type(matcher)) {
    case 'null':
    case 'undefined':
      // we treat null as undefined
      return null == val;

    case 'regexp':
      return matcher.test(val);

    case 'array':
      if ('array' == type(val) && matcher.length == val.length) {
        for (var i = 0; i < matcher.length; i++) {
          if (!eql(val[i], matcher[i])) return false;
        }
        return true;
      } else {
        return false;
      }
      break;

    case 'object':
      // object can match keys in any order
      var keys = {};

      // we match all values of `matcher` in `val`
      for (var i in matcher) {
        if (matcher.hasOwnProperty(i)) {
          if (!val.hasOwnProperty(i) || !eql(matcher[i], val[i])) {
            return false;
          }
        }
        keys[i] = true;
      }

      // we make sure `val` doesn't have extra keys
      for (var i in val) {
        if (val.hasOwnProperty(i) && !keys.hasOwnProperty(i)) {
          return false;
        }
      }

      return true;

    default:
      return matcher === val;
  }
}

},{"component-type":4}],11:[function(require,module,exports){

/**
 * HOP ref.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Return own keys in `obj`.
 *
 * @param {Object} obj
 * @return {Array}
 * @api public
 */

exports.keys = Object.keys || function(obj){
  var keys = [];
  for (var key in obj) {
    if (has.call(obj, key)) {
      keys.push(key);
    }
  }
  return keys;
};

/**
 * Return own values in `obj`.
 *
 * @param {Object} obj
 * @return {Array}
 * @api public
 */

exports.values = function(obj){
  var vals = [];
  for (var key in obj) {
    if (has.call(obj, key)) {
      vals.push(obj[key]);
    }
  }
  return vals;
};

/**
 * Merge `b` into `a`.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api public
 */

exports.merge = function(a, b){
  for (var key in b) {
    if (has.call(b, key)) {
      a[key] = b[key];
    }
  }
  return a;
};

/**
 * Return length of `obj`.
 *
 * @param {Object} obj
 * @return {Number}
 * @api public
 */

exports.length = function(obj){
  return exports.keys(obj).length;
};

/**
 * Check if `obj` is empty.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api public
 */

exports.isEmpty = function(obj){
  return 0 == exports.length(obj);
};
},{}],12:[function(require,module,exports){

/**
 * Module dependencies.
 */

var eql = require('mongo-eql');
var type = require('component-type');

/**
 * $ne: not equal.
 */

exports.$ne = function $ne(matcher, val){
  return !eql(matcher, val);
};

/**
 * $gt: greater than.
 */

exports.$gt = function $gt(matcher, val){
  return type(matcher) === 'number' && val > matcher;
};

/**
 * $gte: greater than equal.
 */

exports.$gte = function $gte(matcher, val){
  return type(matcher) === 'number' && val >= matcher;
};

/**
 * $lt: less than.
 */

exports.$lt = function $lt(matcher, val){
  return type(matcher) === 'number' && val < matcher;
};

/**
 * $lte: less than equal.
 */

exports.$lte = function $lte(matcher, val){
  return type(matcher) === 'number' && val <= matcher;
};

/**
 * $regex: supply a regular expression as a string.
 */

exports.$regex = function $regex(matcher, val){
  // TODO: add $options support
  if ('regexp' != type('matcher')) matcher = new RegExp(matcher);
  return matcher.test(val);
};

/**
 * $exists: key exists.
 */

exports.$exists = function $exists(matcher, val){
  if (matcher) {
    return undefined !== val;
  } else {
    return undefined === val;
  }
};

/**
 * $in: value in array.
 */

exports.$in = function $in(matcher, val){
  if ('array' != type(matcher)) return false;
  for (var i = 0; i < matcher.length; i++) {
    if (eql(matcher[i], val)) return true;
  }
  return false;
};

/**
 * $nin: value not in array.
 */

exports.$nin = function $nin(matcher, val){
  return !exports.$in(matcher, val);
};

/**
 * @size: array length
 */

exports.$size = function(matcher, val){
  return Array.isArray(val) && matcher == val.length;
};

},{"component-type":4,"mongo-eql":10}]},{},[2])(2)
});
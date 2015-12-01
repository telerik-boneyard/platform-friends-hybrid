(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Everlive = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":4}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],6:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":5,"_process":4,"inherits":2}],7:[function(require,module,exports){
var json = typeof JSON !== 'undefined' ? JSON : require('jsonify');

module.exports = function (obj, opts) {
    if (!opts) opts = {};
    if (typeof opts === 'function') opts = { cmp: opts };
    var space = opts.space || '';
    if (typeof space === 'number') space = Array(space+1).join(' ');
    var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;
    var replacer = opts.replacer || function(key, value) { return value; };

    var cmp = opts.cmp && (function (f) {
        return function (node) {
            return function (a, b) {
                var aobj = { key: a, value: node[a] };
                var bobj = { key: b, value: node[b] };
                return f(aobj, bobj);
            };
        };
    })(opts.cmp);

    var seen = [];
    return (function stringify (parent, key, node, level) {
        var indent = space ? ('\n' + new Array(level + 1).join(space)) : '';
        var colonSeparator = space ? ': ' : ':';

        if (node && node.toJSON && typeof node.toJSON === 'function') {
            node = node.toJSON();
        }

        node = replacer.call(parent, key, node);

        if (node === undefined) {
            return;
        }
        if (typeof node !== 'object' || node === null) {
            return json.stringify(node);
        }
        if (isArray(node)) {
            var out = [];
            for (var i = 0; i < node.length; i++) {
                var item = stringify(node, i, node[i], level+1) || json.stringify(null);
                out.push(indent + space + item);
            }
            return '[' + out.join(',') + indent + ']';
        }
        else {
            if (seen.indexOf(node) !== -1) {
                if (cycles) return json.stringify('__cycle__');
                throw new TypeError('Converting circular structure to JSON');
            }
            else seen.push(node);

            var keys = objectKeys(node).sort(cmp && cmp(node));
            var out = [];
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var value = stringify(node, key, node[key], level+1);

                if(!value) continue;

                var keyValue = json.stringify(key)
                    + colonSeparator
                    + value;
                ;
                out.push(indent + space + keyValue);
            }
            return '{' + out.join(',') + indent + '}';
        }
    })({ '': obj }, '', obj, 0);
};

var isArray = Array.isArray || function (x) {
    return {}.toString.call(x) === '[object Array]';
};

var objectKeys = Object.keys || function (obj) {
    var has = Object.prototype.hasOwnProperty || function () { return true };
    var keys = [];
    for (var key in obj) {
        if (has.call(obj, key)) keys.push(key);
    }
    return keys;
};

},{"jsonify":8}],8:[function(require,module,exports){
exports.parse = require('./lib/parse');
exports.stringify = require('./lib/stringify');

},{"./lib/parse":9,"./lib/stringify":10}],9:[function(require,module,exports){
var at, // The index of the current character
    ch, // The current character
    escapee = {
        '"':  '"',
        '\\': '\\',
        '/':  '/',
        b:    '\b',
        f:    '\f',
        n:    '\n',
        r:    '\r',
        t:    '\t'
    },
    text,

    error = function (m) {
        // Call error when something is wrong.
        throw {
            name:    'SyntaxError',
            message: m,
            at:      at,
            text:    text
        };
    },
    
    next = function (c) {
        // If a c parameter is provided, verify that it matches the current character.
        if (c && c !== ch) {
            error("Expected '" + c + "' instead of '" + ch + "'");
        }
        
        // Get the next character. When there are no more characters,
        // return the empty string.
        
        ch = text.charAt(at);
        at += 1;
        return ch;
    },
    
    number = function () {
        // Parse a number value.
        var number,
            string = '';
        
        if (ch === '-') {
            string = '-';
            next('-');
        }
        while (ch >= '0' && ch <= '9') {
            string += ch;
            next();
        }
        if (ch === '.') {
            string += '.';
            while (next() && ch >= '0' && ch <= '9') {
                string += ch;
            }
        }
        if (ch === 'e' || ch === 'E') {
            string += ch;
            next();
            if (ch === '-' || ch === '+') {
                string += ch;
                next();
            }
            while (ch >= '0' && ch <= '9') {
                string += ch;
                next();
            }
        }
        number = +string;
        if (!isFinite(number)) {
            error("Bad number");
        } else {
            return number;
        }
    },
    
    string = function () {
        // Parse a string value.
        var hex,
            i,
            string = '',
            uffff;
        
        // When parsing for string values, we must look for " and \ characters.
        if (ch === '"') {
            while (next()) {
                if (ch === '"') {
                    next();
                    return string;
                } else if (ch === '\\') {
                    next();
                    if (ch === 'u') {
                        uffff = 0;
                        for (i = 0; i < 4; i += 1) {
                            hex = parseInt(next(), 16);
                            if (!isFinite(hex)) {
                                break;
                            }
                            uffff = uffff * 16 + hex;
                        }
                        string += String.fromCharCode(uffff);
                    } else if (typeof escapee[ch] === 'string') {
                        string += escapee[ch];
                    } else {
                        break;
                    }
                } else {
                    string += ch;
                }
            }
        }
        error("Bad string");
    },

    white = function () {

// Skip whitespace.

        while (ch && ch <= ' ') {
            next();
        }
    },

    word = function () {

// true, false, or null.

        switch (ch) {
        case 't':
            next('t');
            next('r');
            next('u');
            next('e');
            return true;
        case 'f':
            next('f');
            next('a');
            next('l');
            next('s');
            next('e');
            return false;
        case 'n':
            next('n');
            next('u');
            next('l');
            next('l');
            return null;
        }
        error("Unexpected '" + ch + "'");
    },

    value,  // Place holder for the value function.

    array = function () {

// Parse an array value.

        var array = [];

        if (ch === '[') {
            next('[');
            white();
            if (ch === ']') {
                next(']');
                return array;   // empty array
            }
            while (ch) {
                array.push(value());
                white();
                if (ch === ']') {
                    next(']');
                    return array;
                }
                next(',');
                white();
            }
        }
        error("Bad array");
    },

    object = function () {

// Parse an object value.

        var key,
            object = {};

        if (ch === '{') {
            next('{');
            white();
            if (ch === '}') {
                next('}');
                return object;   // empty object
            }
            while (ch) {
                key = string();
                white();
                next(':');
                if (Object.hasOwnProperty.call(object, key)) {
                    error('Duplicate key "' + key + '"');
                }
                object[key] = value();
                white();
                if (ch === '}') {
                    next('}');
                    return object;
                }
                next(',');
                white();
            }
        }
        error("Bad object");
    };

value = function () {

// Parse a JSON value. It could be an object, an array, a string, a number,
// or a word.

    white();
    switch (ch) {
    case '{':
        return object();
    case '[':
        return array();
    case '"':
        return string();
    case '-':
        return number();
    default:
        return ch >= '0' && ch <= '9' ? number() : word();
    }
};

// Return the json_parse function. It will have access to all of the above
// functions and variables.

module.exports = function (source, reviver) {
    var result;
    
    text = source;
    at = 0;
    ch = ' ';
    result = value();
    white();
    if (ch) {
        error("Syntax error");
    }

    // If there is a reviver function, we recursively walk the new structure,
    // passing each name/value pair to the reviver function for possible
    // transformation, starting with a temporary root object that holds the result
    // in an empty key. If there is not a reviver function, we simply return the
    // result.

    return typeof reviver === 'function' ? (function walk(holder, key) {
        var k, v, value = holder[key];
        if (value && typeof value === 'object') {
            for (k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    v = walk(value, k);
                    if (v !== undefined) {
                        value[k] = v;
                    } else {
                        delete value[k];
                    }
                }
            }
        }
        return reviver.call(holder, key, value);
    }({'': result}, '')) : result;
};

},{}],10:[function(require,module,exports){
var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    gap,
    indent,
    meta = {    // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    },
    rep;

function quote(string) {
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.
    
    escapable.lastIndex = 0;
    return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
        var c = meta[a];
        return typeof c === 'string' ? c :
            '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
}

function str(key, holder) {
    // Produce a string from holder[key].
    var i,          // The loop counter.
        k,          // The member key.
        v,          // The member value.
        length,
        mind = gap,
        partial,
        value = holder[key];
    
    // If the value has a toJSON method, call it to obtain a replacement value.
    if (value && typeof value === 'object' &&
            typeof value.toJSON === 'function') {
        value = value.toJSON(key);
    }
    
    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.
    if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
    }
    
    // What happens next depends on the value's type.
    switch (typeof value) {
        case 'string':
            return quote(value);
        
        case 'number':
            // JSON numbers must be finite. Encode non-finite numbers as null.
            return isFinite(value) ? String(value) : 'null';
        
        case 'boolean':
        case 'null':
            // If the value is a boolean or null, convert it to a string. Note:
            // typeof null does not produce 'null'. The case is included here in
            // the remote chance that this gets fixed someday.
            return String(value);
            
        case 'object':
            if (!value) return 'null';
            gap += indent;
            partial = [];
            
            // Array.isArray
            if (Object.prototype.toString.apply(value) === '[object Array]') {
                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }
                
                // Join all of the elements together, separated with commas, and
                // wrap them in brackets.
                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }
            
            // If the replacer is an array, use it to select the members to be
            // stringified.
            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            else {
                // Otherwise, iterate through all of the keys in the object.
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            
        // Join all of the member texts together, separated with commas,
        // and wrap them in braces.

        v = partial.length === 0 ? '{}' : gap ?
            '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
            '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
}

module.exports = function (value, replacer, space) {
    var i;
    gap = '';
    indent = '';
    
    // If the space parameter is a number, make an indent string containing that
    // many spaces.
    if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
            indent += ' ';
        }
    }
    // If the space parameter is a string, it will be used as the indent string.
    else if (typeof space === 'string') {
        indent = space;
    }

    // If there is a replacer, it must be a function or an array.
    // Otherwise, throw an error.
    rep = replacer;
    if (replacer && typeof replacer !== 'function'
    && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
    }
    
    // Make a fake root object containing our value under the key of ''.
    // Return the result of stringifying the value.
    return str('', {'': value});
};

},{}],11:[function(require,module,exports){
/**
 * This script gives you the zone info key representing your device's time zone setting.
 *
 * @name jsTimezoneDetect
 * @version 1.0.5
 * @author Jon Nylander
 * @license MIT License - http://www.opensource.org/licenses/mit-license.php
 *
 * For usage and examples, visit:
 * http://pellepim.bitbucket.org/jstz/
 *
 * Copyright (c) Jon Nylander
 */

/*jslint undef: true */
/*global console, exports*/

(function(root) {
  /**
   * Namespace to hold all the code for timezone detection.
   */
  var jstz = (function () {
      'use strict';
      var HEMISPHERE_SOUTH = 's',
          
          /**
           * Gets the offset in minutes from UTC for a certain date.
           * @param {Date} date
           * @returns {Number}
           */
          get_date_offset = function (date) {
              var offset = -date.getTimezoneOffset();
              return (offset !== null ? offset : 0);
          },

          get_date = function (year, month, date) {
              var d = new Date();
              if (year !== undefined) {
                d.setFullYear(year);
              }
              d.setMonth(month);
              d.setDate(date);
              return d;
          },

          get_january_offset = function (year) {
              return get_date_offset(get_date(year, 0 ,2));
          },

          get_june_offset = function (year) {
              return get_date_offset(get_date(year, 5, 2));
          },

          /**
           * Private method.
           * Checks whether a given date is in daylight saving time.
           * If the date supplied is after august, we assume that we're checking
           * for southern hemisphere DST.
           * @param {Date} date
           * @returns {Boolean}
           */
          date_is_dst = function (date) {
              var is_southern = date.getMonth() > 7,
                  base_offset = is_southern ? get_june_offset(date.getFullYear()) : 
                                              get_january_offset(date.getFullYear()),
                  date_offset = get_date_offset(date),
                  is_west = base_offset < 0,
                  dst_offset = base_offset - date_offset;
                  
              if (!is_west && !is_southern) {
                  return dst_offset < 0;
              }

              return dst_offset !== 0;
          },

          /**
           * This function does some basic calculations to create information about
           * the user's timezone. It uses REFERENCE_YEAR as a solid year for which
           * the script has been tested rather than depend on the year set by the
           * client device.
           *
           * Returns a key that can be used to do lookups in jstz.olson.timezones.
           * eg: "720,1,2". 
           *
           * @returns {String}
           */

          lookup_key = function () {
              var january_offset = get_january_offset(),
                  june_offset = get_june_offset(),
                  diff = january_offset - june_offset;

              if (diff < 0) {
                  return january_offset + ",1";
              } else if (diff > 0) {
                  return june_offset + ",1," + HEMISPHERE_SOUTH;
              }

              return january_offset + ",0";
          },

          /**
           * Uses get_timezone_info() to formulate a key to use in the olson.timezones dictionary.
           *
           * Returns a primitive object on the format:
           * {'timezone': TimeZone, 'key' : 'the key used to find the TimeZone object'}
           *
           * @returns Object
           */
          determine = function () {
              var key = lookup_key();
              return new jstz.TimeZone(jstz.olson.timezones[key]);
          },

          /**
           * This object contains information on when daylight savings starts for
           * different timezones.
           *
           * The list is short for a reason. Often we do not have to be very specific
           * to single out the correct timezone. But when we do, this list comes in
           * handy.
           *
           * Each value is a date denoting when daylight savings starts for that timezone.
           */
          dst_start_for = function (tz_name) {

            var ru_pre_dst_change = new Date(2010, 6, 15, 1, 0, 0, 0), // In 2010 Russia had DST, this allows us to detect Russia :)
                dst_starts = {
                    'America/Denver': new Date(2011, 2, 13, 3, 0, 0, 0),
                    'America/Mazatlan': new Date(2011, 3, 3, 3, 0, 0, 0),
                    'America/Chicago': new Date(2011, 2, 13, 3, 0, 0, 0),
                    'America/Mexico_City': new Date(2011, 3, 3, 3, 0, 0, 0),
                    'America/Asuncion': new Date(2012, 9, 7, 3, 0, 0, 0),
                    'America/Santiago': new Date(2012, 9, 3, 3, 0, 0, 0),
                    'America/Campo_Grande': new Date(2012, 9, 21, 5, 0, 0, 0),
                    'America/Montevideo': new Date(2011, 9, 2, 3, 0, 0, 0),
                    'America/Sao_Paulo': new Date(2011, 9, 16, 5, 0, 0, 0),
                    'America/Los_Angeles': new Date(2011, 2, 13, 8, 0, 0, 0),
                    'America/Santa_Isabel': new Date(2011, 3, 5, 8, 0, 0, 0),
                    'America/Havana': new Date(2012, 2, 10, 2, 0, 0, 0),
                    'America/New_York': new Date(2012, 2, 10, 7, 0, 0, 0),
                    'Europe/Helsinki': new Date(2013, 2, 31, 5, 0, 0, 0),
                    'Pacific/Auckland': new Date(2011, 8, 26, 7, 0, 0, 0),
                    'America/Halifax': new Date(2011, 2, 13, 6, 0, 0, 0),
                    'America/Goose_Bay': new Date(2011, 2, 13, 2, 1, 0, 0),
                    'America/Miquelon': new Date(2011, 2, 13, 5, 0, 0, 0),
                    'America/Godthab': new Date(2011, 2, 27, 1, 0, 0, 0),
                    'Europe/Moscow': ru_pre_dst_change,
                    'Asia/Amman': new Date(2013, 2, 29, 1, 0, 0, 0),
                    'Asia/Beirut': new Date(2013, 2, 31, 2, 0, 0, 0),
                    'Asia/Damascus': new Date(2013, 3, 6, 2, 0, 0, 0),
                    'Asia/Jerusalem': new Date(2013, 2, 29, 5, 0, 0, 0),
                    'Asia/Yekaterinburg': ru_pre_dst_change,
                    'Asia/Omsk': ru_pre_dst_change,
                    'Asia/Krasnoyarsk': ru_pre_dst_change,
                    'Asia/Irkutsk': ru_pre_dst_change,
                    'Asia/Yakutsk': ru_pre_dst_change,
                    'Asia/Vladivostok': ru_pre_dst_change,
                    'Asia/Baku': new Date(2013, 2, 31, 4, 0, 0),
                    'Asia/Yerevan': new Date(2013, 2, 31, 3, 0, 0),
                    'Asia/Kamchatka': ru_pre_dst_change,
                    'Asia/Gaza': new Date(2010, 2, 27, 4, 0, 0),
                    'Africa/Cairo': new Date(2010, 4, 1, 3, 0, 0),
                    'Europe/Minsk': ru_pre_dst_change,
                    'Pacific/Apia': new Date(2010, 10, 1, 1, 0, 0, 0),
                    'Pacific/Fiji': new Date(2010, 11, 1, 0, 0, 0),
                    'Australia/Perth': new Date(2008, 10, 1, 1, 0, 0, 0)
                };

              return dst_starts[tz_name];
          };

      return {
          determine: determine,
          date_is_dst: date_is_dst,
          dst_start_for: dst_start_for 
      };
  }());

  /**
   * Simple object to perform ambiguity check and to return name of time zone.
   */
  jstz.TimeZone = function (tz_name) {
      'use strict';
        /**
         * The keys in this object are timezones that we know may be ambiguous after
         * a preliminary scan through the olson_tz object.
         *
         * The array of timezones to compare must be in the order that daylight savings
         * starts for the regions.
         */
      var AMBIGUITIES = {
              'America/Denver':       ['America/Denver', 'America/Mazatlan'],
              'America/Chicago':      ['America/Chicago', 'America/Mexico_City'],
              'America/Santiago':     ['America/Santiago', 'America/Asuncion', 'America/Campo_Grande'],
              'America/Montevideo':   ['America/Montevideo', 'America/Sao_Paulo'],
              'Asia/Beirut':          ['Asia/Amman', 'Asia/Jerusalem', 'Asia/Beirut', 'Europe/Helsinki','Asia/Damascus'],
              'Pacific/Auckland':     ['Pacific/Auckland', 'Pacific/Fiji'],
              'America/Los_Angeles':  ['America/Los_Angeles', 'America/Santa_Isabel'],
              'America/New_York':     ['America/Havana', 'America/New_York'],
              'America/Halifax':      ['America/Goose_Bay', 'America/Halifax'],
              'America/Godthab':      ['America/Miquelon', 'America/Godthab'],
              'Asia/Dubai':           ['Europe/Moscow'],
              'Asia/Dhaka':           ['Asia/Yekaterinburg'],
              'Asia/Jakarta':         ['Asia/Omsk'],
              'Asia/Shanghai':        ['Asia/Krasnoyarsk', 'Australia/Perth'],
              'Asia/Tokyo':           ['Asia/Irkutsk'],
              'Australia/Brisbane':   ['Asia/Yakutsk'],
              'Pacific/Noumea':       ['Asia/Vladivostok'],
              'Pacific/Tarawa':       ['Asia/Kamchatka', 'Pacific/Fiji'],
              'Pacific/Tongatapu':    ['Pacific/Apia'],
              'Asia/Baghdad':         ['Europe/Minsk'],
              'Asia/Baku':            ['Asia/Yerevan','Asia/Baku'],
              'Africa/Johannesburg':  ['Asia/Gaza', 'Africa/Cairo']
          },

          timezone_name = tz_name,
          
          /**
           * Checks if a timezone has possible ambiguities. I.e timezones that are similar.
           *
           * For example, if the preliminary scan determines that we're in America/Denver.
           * We double check here that we're really there and not in America/Mazatlan.
           *
           * This is done by checking known dates for when daylight savings start for different
           * timezones during 2010 and 2011.
           */
          ambiguity_check = function () {
              var ambiguity_list = AMBIGUITIES[timezone_name],
                  length = ambiguity_list.length,
                  i = 0,
                  tz = ambiguity_list[0];

              for (; i < length; i += 1) {
                  tz = ambiguity_list[i];

                  if (jstz.date_is_dst(jstz.dst_start_for(tz))) {
                      timezone_name = tz;
                      return;
                  }
              }
          },

          /**
           * Checks if it is possible that the timezone is ambiguous.
           */
          is_ambiguous = function () {
              return typeof (AMBIGUITIES[timezone_name]) !== 'undefined';
          };

      if (is_ambiguous()) {
          ambiguity_check();
      }

      return {
          name: function () {
              return timezone_name;
          }
      };
  };

  jstz.olson = {};

  /*
   * The keys in this dictionary are comma separated as such:
   *
   * First the offset compared to UTC time in minutes.
   *
   * Then a flag which is 0 if the timezone does not take daylight savings into account and 1 if it
   * does.
   *
   * Thirdly an optional 's' signifies that the timezone is in the southern hemisphere,
   * only interesting for timezones with DST.
   *
   * The mapped arrays is used for constructing the jstz.TimeZone object from within
   * jstz.determine_timezone();
   */
  jstz.olson.timezones = {
      '-720,0'   : 'Pacific/Majuro',
      '-660,0'   : 'Pacific/Pago_Pago',
      '-600,1'   : 'America/Adak',
      '-600,0'   : 'Pacific/Honolulu',
      '-570,0'   : 'Pacific/Marquesas',
      '-540,0'   : 'Pacific/Gambier',
      '-540,1'   : 'America/Anchorage',
      '-480,1'   : 'America/Los_Angeles',
      '-480,0'   : 'Pacific/Pitcairn',
      '-420,0'   : 'America/Phoenix',
      '-420,1'   : 'America/Denver',
      '-360,0'   : 'America/Guatemala',
      '-360,1'   : 'America/Chicago',
      '-360,1,s' : 'Pacific/Easter',
      '-300,0'   : 'America/Bogota',
      '-300,1'   : 'America/New_York',
      '-270,0'   : 'America/Caracas',
      '-240,1'   : 'America/Halifax',
      '-240,0'   : 'America/Santo_Domingo',
      '-240,1,s' : 'America/Santiago',
      '-210,1'   : 'America/St_Johns',
      '-180,1'   : 'America/Godthab',
      '-180,0'   : 'America/Argentina/Buenos_Aires',
      '-180,1,s' : 'America/Montevideo',
      '-120,0'   : 'America/Noronha',
      '-120,1'   : 'America/Noronha',
      '-60,1'    : 'Atlantic/Azores',
      '-60,0'    : 'Atlantic/Cape_Verde',
      '0,0'      : 'UTC',
      '0,1'      : 'Europe/London',
      '60,1'     : 'Europe/Berlin',
      '60,0'     : 'Africa/Lagos',
      '60,1,s'   : 'Africa/Windhoek',
      '120,1'    : 'Asia/Beirut',
      '120,0'    : 'Africa/Johannesburg',
      '180,0'    : 'Asia/Baghdad',
      '180,1'    : 'Europe/Moscow',
      '210,1'    : 'Asia/Tehran',
      '240,0'    : 'Asia/Dubai',
      '240,1'    : 'Asia/Baku',
      '270,0'    : 'Asia/Kabul',
      '300,1'    : 'Asia/Yekaterinburg',
      '300,0'    : 'Asia/Karachi',
      '330,0'    : 'Asia/Kolkata',
      '345,0'    : 'Asia/Kathmandu',
      '360,0'    : 'Asia/Dhaka',
      '360,1'    : 'Asia/Omsk',
      '390,0'    : 'Asia/Rangoon',
      '420,1'    : 'Asia/Krasnoyarsk',
      '420,0'    : 'Asia/Jakarta',
      '480,0'    : 'Asia/Shanghai',
      '480,1'    : 'Asia/Irkutsk',
      '525,0'    : 'Australia/Eucla',
      '525,1,s'  : 'Australia/Eucla',
      '540,1'    : 'Asia/Yakutsk',
      '540,0'    : 'Asia/Tokyo',
      '570,0'    : 'Australia/Darwin',
      '570,1,s'  : 'Australia/Adelaide',
      '600,0'    : 'Australia/Brisbane',
      '600,1'    : 'Asia/Vladivostok',
      '600,1,s'  : 'Australia/Sydney',
      '630,1,s'  : 'Australia/Lord_Howe',
      '660,1'    : 'Asia/Kamchatka',
      '660,0'    : 'Pacific/Noumea',
      '690,0'    : 'Pacific/Norfolk',
      '720,1,s'  : 'Pacific/Auckland',
      '720,0'    : 'Pacific/Tarawa',
      '765,1,s'  : 'Pacific/Chatham',
      '780,0'    : 'Pacific/Tongatapu',
      '780,1,s'  : 'Pacific/Apia',
      '840,0'    : 'Pacific/Kiritimati'
  };

  if (typeof exports !== 'undefined') {
    exports.jstz = jstz;
  } else {
    root.jstz = jstz;
  }
})(this);


},{}],12:[function(require,module,exports){
// Mingo.js 0.4.0
// Copyright (c) 2015 Francis Asante <kofrasa@gmail.com>
// MIT

(function (root, undefined) {

  "use strict";

  // global on the server, window in the browser
  var Mingo = {}, previousMingo;
  var _;

  // backup previous Mingo
  if (root != null) {
    previousMingo = root.Mingo;
  }

  Mingo.noConflict = function () {
    root.Mingo = previousMingo;
    return Mingo;
  };

  var nativeScriptEnabled = Boolean(((typeof android !== 'undefined' && android && android.widget && android.widget.Button)
  || (typeof UIButton !== 'undefined' && UIButton)));

  var nodeEnabled = ('undefined' !== typeof exports && 'undefined' !== typeof require && 'undefined' === typeof window && !nativeScriptEnabled);

  var browserifyEnabled = 'undefined' !== typeof exports && 'undefined' !== typeof require;

  // Export the Mingo object for Node.js
  if (nodeEnabled || nativeScriptEnabled || browserifyEnabled) {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Mingo;
    } else {
      exports = Mingo;
    }
    _ = require("underscore"); // get a reference to underscore
  } else {
    root.Mingo = Mingo;
    _ = root._; // get a reference to underscore
  }

  // quick reference for
  var primitives = [
    _.isString, _.isBoolean, _.isNumber, _.isDate, _.isNull, _.isRegExp
  ];

  function normalize(expr) {
    // normalized primitives
    for (var i = 0; i < primitives.length; i++) {
      if (primitives[i](expr)) {
        if (_.isRegExp(expr)) {
          return {"$regex": expr};
        } else {
          return {"$eq": expr};
        }
      }
    }
    // normalize object expression
    if (_.isObject(expr)) {
      var keys = _.keys(expr);
      var notQuery = _.intersection(Ops.queryOperators, keys).length === 0;

      // no valid query operator found, so we do simple comparison
      if (notQuery) {
        return {"$eq": expr};
      }

      // ensure valid regex
      if (_.contains(keys, "$regex")) {
        var regex = expr['$regex'];
        var options = expr['$options'] || "";
        var modifiers = "";
        if (_.isString(regex)) {
          modifiers += (regex.ignoreCase || options.indexOf("i") >= 0) ? "i" : "";
          modifiers += (regex.multiline || options.indexOf("m") >= 0) ? "m" : "";
          modifiers += (regex.global || options.indexOf("g") >= 0) ? "g" : "";
          regex = new RegExp(regex, modifiers);
        }
        expr['$regex'] = regex;
        delete expr['$options'];
      }
    }

    return expr;
  }

  // Settings used by Mingo internally
  var settings = {
    key: "_id"
  };

  /**
   * Setup default settings for Mingo
   * @param options
   */
  Mingo.setup = function (options) {
    _.extend(settings, options || {});
  };


  /**
   * Query object to test collection elements with
   * @param criteria the pass criteria for the query
   * @param projection optional projection specifiers
   * @constructor
   */
  Mingo.Query = function (criteria, projection) {
    if (!(this instanceof Mingo.Query))
      return new Mingo.Query(criteria, projection);

    this._criteria = criteria;
    this._projection = projection;
    this._compiled = [];
    this._compile();
  };

  Mingo.Query.prototype = {

    _compile: function () {

      if (_.isEmpty(this._criteria)) return;

      if (_.isArray(this._criteria) || _.isFunction(this._criteria) || !_.isObject(this._criteria)) {
        throw new Error("Invalid type for criteria");
      }

      for (var field in this._criteria) {
        if (this._criteria.hasOwnProperty(field)) {
          var expr = this._criteria[field];
          if (_.contains(['$and', '$or', '$nor', '$where'], field)) {
            this._processOperator(field, field, expr);
          } else {
            // normalize expression
            expr = normalize(expr);
            for (var op in expr) {
              if (expr.hasOwnProperty(op)) {
                this._processOperator(field, op, expr[op]);
              }
            }
          }
        }
      }
    },

    _processOperator: function (field, operator, value) {
      var compiledSelector;
      if (_.contains(Ops.simpleOperators, operator)) {
        compiledSelector = {
          test: function (obj) {
            var actualValue = resolve(obj, field);
            // value of operator must already be fully resolved.
            return simpleOperators[operator](actualValue, value);
          }
        };
      } else if (_.contains(Ops.compoundOperators, operator)) {
        compiledSelector = compoundOperators[operator](field, value);
      } else {
        throw new Error("Invalid query operator '" + operator + "' detected");
      }
      this._compiled.push(compiledSelector);
    },

    /**
     * Checks if the object passes the query criteria. Returns true if so, false otherwise.
     * @param obj
     * @returns {boolean}
     */
    test: function (obj) {
      for (var i = 0; i < this._compiled.length; i++) {
        if (!this._compiled[i].test(obj)) {
          return false;
        }
      }
      return true;
    },

    /**
     * Performs a query on a collection and returns a cursor object.
     * @param collection
     * @param projection
     * @returns {Mingo.Cursor}
     */
    find: function (collection, projection) {
      return new Mingo.Cursor(collection, this, projection);
    },

    /**
     * Remove matched documents from the collection returning the remainder
     * @param collection
     * @returns {Array}
     */
    remove: function (collection) {
      var arr = [];
      for (var i = 0; i < collection.length; i++) {
        if (!this.test(collection[i])) {
          arr.push(collection[i]);
        }
      }
      return arr;
    }
  };

  if (nodeEnabled) {

    var Transform = require('stream').Transform;
    var util = require('util');

    Mingo.Query.prototype.stream = function (options) {
      return new Mingo.Stream(this, options);
    };

    /**
     * Create a Transform class
     * @param query
     * @param options
     * @returns {Mingo.Stream}
     * @constructor
     */
    Mingo.Stream = function (query, options) {

      if (!(this instanceof Mingo.Stream))
        return new Mingo.Stream(query, options);

      options = options || {};
      _.extend(options, {objectMode: true});
      Transform.call(this, options);
      // query for this stream
      this._query = query;
    };
    // extend Transform
    util.inherits(Mingo.Stream, Transform);

    Mingo.Stream.prototype._transform = function (chunk, encoding, done) {
      if (_.isObject(chunk) && this._query.test(chunk)) {
        if (_.isEmpty(this._query._projection)) {
          this.push(chunk);
        } else {
          var cursor = new Mingo.Cursor([chunk], this._query);
          if (cursor.hasNext()) {
            this.push(cursor.next());
          }
        }
      }
      done();
    };
  }

  /**
   * Cursor to iterate and perform filtering on matched objects
   * @param collection
   * @param query
   * @param projection
   * @constructor
   */
  Mingo.Cursor = function (collection, query, projection) {

    if (!(this instanceof Mingo.Cursor))
      return new Mingo.Cursor(collection, query, projection);

    this._query = query;
    this._collection = collection;
    this._projection = projection || query._projection;
    this._operators = {};
    this._result = false;
    this._position = 0;
  };

  Mingo.Cursor.prototype = {

    _fetch: function () {
      var self = this;

      if (this._result !== false) {
        return this._result;
      }

      // inject projection operator
      if (_.isObject(this._projection)) {
        _.extend(this._operators, {"$project": this._projection});
      }

      // if (!_.isArray(this._collection) && !_.isObject(this._collection)) {
      //   throw new Error("Input collection is not of valid type. Must be an Array.");
      // }

      // filter collection
      this._result = _.filter(this._collection, this._query.test, this._query);
      var pipeline = [];

      _.each(['$sort', '$skip', '$limit', '$project'], function (op) {
        if (_.has(self._operators, op)) {
          pipeline.push(_.pick(self._operators, op));
        }
      });

      if (pipeline.length > 0) {
        var aggregator = new Mingo.Aggregator(pipeline);
        this._result = aggregator.run(this._result, this._query);
      }
      return this._result;
    },

    /**
     * Fetch and return all matched results
     * @returns {Array}
     */
    all: function () {
      return this._fetch();
    },

    /**
     * Fetch and return the first matching result
     * @returns {Object}
     */
    first: function () {
      return this.count() > 0 ? this._fetch()[0] : null;
    },

    /**
     * Fetch and return the last matching object from the result
     * @returns {Object}
     */
    last: function () {
      return this.count() > 0 ? this._fetch()[this.count() - 1] : null;
    },

    /**
     * Counts the number of matched objects found
     * @returns {Number}
     */
    count: function () {
      return this._fetch().length;
    },

    /**
     * Returns a cursor that begins returning results only after passing or skipping a number of documents.
     * @param {Number} n the number of results to skip.
     * @return {Mingo.Cursor} Returns the cursor, so you can chain this call.
     */
    skip: function (n) {
      _.extend(this._operators, {"$skip": n});
      return this;
    },

    /**
     * Constrains the size of a cursor's result set.
     * @param {Number} n the number of results to limit to.
     * @return {Mingo.Cursor} Returns the cursor, so you can chain this call.
     */
    limit: function (n) {
      _.extend(this._operators, {"$limit": n});
      return this;
    },

    /**
     * Returns results ordered according to a sort specification.
     * @param {Object} modifier an object of key and values specifying the sort order. 1 for ascending and -1 for descending
     * @return {Mingo.Cursor} Returns the cursor, so you can chain this call.
     */
    sort: function (modifier) {
      _.extend(this._operators, {"$sort": modifier});
      return this;
    },

    /**
     * Returns the next document in a cursor.
     * @returns {Object | Boolean}
     */
    next: function () {
      if (this.hasNext()) {
        return this._fetch()[this._position++];
      }
      return null;
    },

    /**
     * Returns true if the cursor has documents and can be iterated.
     * @returns {boolean}
     */
    hasNext: function () {
      return this.count() > this._position;
    },

    /**
     * Specifies the exclusive upper bound for a specific field
     * @param expr
     * @returns {Number}
     */
    max: function (expr) {
      return groupOperators.$max(this._fetch(), expr);
    },

    /**
     * Specifies the inclusive lower bound for a specific field
     * @param expr
     * @returns {Number}
     */
    min: function (expr) {
      return groupOperators.$min(this._fetch(), expr);
    },

    /**
     * Applies a function to each document in a cursor and collects the return values in an array.
     * @param callback
     * @returns {Array}
     */
    map: function (callback) {
      return _.map(this._fetch(), callback);
    },

    /**
     * Applies a JavaScript function for every document in a cursor.
     * @param callback
     */
    forEach: function (callback) {
      _.each(this._fetch(), callback);
    }

  };

  /**
   * Aggregator for defining filter using mongoDB aggregation pipeline syntax
   * @param operators an Array of pipeline operators
   * @constructor
   */
  Mingo.Aggregator = function (operators) {
    if (!(this instanceof Mingo.Aggregator))
      return new Mingo.Aggregator(operators);

    this._operators = operators;
  };

  Mingo.Aggregator.prototype = {

    /**
     * Apply the pipeline operations over the collection by order of the sequence added
     * @param collection an array of objects to process
     * @param query the `Mingo.Query` object to use as context
     * @returns {Array}
     */
    run: function (collection, query) {
      if (!_.isEmpty(this._operators)) {
        // run aggregation pipeline
        for (var i = 0; i < this._operators.length; i++) {
          var operator = this._operators[i];
          for (var key in operator) {
            if (operator.hasOwnProperty(key)) {
              if (query instanceof Mingo.Query) {
                collection = pipelineOperators[key].call(query, collection, operator[key]);
              } else {
                collection = pipelineOperators[key](collection, operator[key]);
              }
            }
          }
        }
      }
      return collection;
    }
  };

  /**
   * Retrieve the value of a given key on an object
   * @param obj
   * @param field
   * @returns {*}
   * @private
   */
  function getValue(obj, field) {
    return _.result(obj, field);
  }

  /**
   * Resolve the value of the field (dot separated) on the given object
   * @param obj
   * @param field
   * @returns {*}
   */
  function resolve(obj, field) {
    if (!field) {
      return undefined;
    }
    var names = field.split(".");
    var value = obj;
    var isText;

    for (var i = 0; i < names.length; i++) {
      isText = names[i].match(/^\d+$/) === null;

      if (isText && _.isArray(value)) {
        var res = [];
        _.each(value, function (item) {
          if (_.isObject(item)) {
            res.push(resolve(item, names[i]));
          }
        });
        value = res;
      } else {
        value = getValue(value, names[i]);
      }

      if (value === undefined) {
        break;
      }
    }

    return value;
  }

  /**
   * Performs a query on a collection and returns a cursor object.
   * @param collection
   * @param criteria
   * @param projection
   * @returns {Mingo.Cursor}
   */
  Mingo.find = function (collection, criteria, projection) {
    return (new Mingo.Query(criteria)).find(collection, projection);
  };

  /**
   * Returns a new array without objects which match the criteria
   * @param collection
   * @param criteria
   * @returns {Array}
   */
  Mingo.remove = function (collection, criteria) {
    return (new Mingo.Query(criteria)).remove(collection);
  };

  /**
   * Return the result collection after running the aggregation pipeline for the given collection
   * @param collection
   * @param pipeline
   * @returns {Array}
   */
  Mingo.aggregate = function (collection, pipeline) {
    if (!_.isArray(pipeline)) {
      throw new Error("Aggregation pipeline must be an array")
    }
    return (new Mingo.Aggregator(pipeline)).run(collection);
  };

  /**
   * Mixin for Backbone.Collection objects
   */
  Mingo.CollectionMixin = {
    /**
     * Runs a query and returns a cursor to the result
     * @param criteria
     * @param projection
     * @returns {Mingo.Cursor}
     */
    query: function (criteria, projection) {
      return Mingo.find(this.toJSON(), criteria, projection);
    },

    /**
     * Runs the given aggregation operators on this collection
     * @params pipeline
     * @returns {Array}
     */
    aggregate: function (pipeline) {
      var args = [this.toJSON(), pipeline];
      return Mingo.aggregate.apply(null, args);
    }
  };

  var pipelineOperators = {

    /**
     * Groups documents together for the purpose of calculating aggregate values based on a collection of documents.
     *
     * @param collection
     * @param expr
     * @returns {Array}
     */
    $group: function (collection, expr) {
      // lookup key for grouping
      var idKey = expr[settings.key];
      var indexes = [];
      // group collection by key
      var groups = _.groupBy(collection, function (obj) {
        var key = computeValue(obj, idKey, idKey);
        indexes.push(key);
        return key;
      });

      // group indexes
      indexes = _.uniq(indexes);

      // remove the group key
      expr = _.omit(expr, settings.key);

      var result = [];
      _.each(indexes, function (index) {
        var obj = {};
        obj[settings.key] = index;
        // compute remaining keys in expression
        for (var key in expr) {
          if (expr.hasOwnProperty(key)) {
            obj[key] = accumulate(groups[index], key, expr[key]);
          }
        }
        result.push(obj);
      });

      return result;
    },

    /**
     * Filters the document stream, and only allows matching documents to pass into the next pipeline stage.
     * $match uses standard MongoDB queries.
     *
     * @param collection
     * @param expr
     * @returns {Array|*}
     */
    $match: function (collection, expr) {
      return (new Mingo.Query(expr)).find(collection).all();
    },

    /**
     * Reshapes a document stream.
     * $project can rename, add, or remove fields as well as create computed values and sub-documents.
     *
     * @param collection
     * @param expr
     * @returns {Array}
     */
    $project: function (collection, expr) {

      if (_.isEmpty(expr)) {
        return collection;
      }
      var usesExclusion = false;
      _.each(expr, function(val, key) {
        if(val === 0 && key !== settings.key) {
           usesExclusion = true;
        }
        if(val !== 0 && usesExclusion) {
            throw new Error("You cannot mix including and excluding fields."); 
        }
      });

      // result collection
      var projected = [];
      var objKeys = _.keys(expr);
      var idOnlyExcludedExpression = false;

      if (_.contains(objKeys, settings.key)) {
        var id = expr[settings.key];
        if (id === 0 || id === false) {
          objKeys = _.without(objKeys, settings.key);
          if (_.isEmpty(objKeys)) {
            idOnlyExcludedExpression = true;
          }
        }
      } else {
        // if not specified the add the ID field
        objKeys.push(settings.key);
      }

      for (var i = 0; i < collection.length; i++) {
        var obj = collection[i];
        var cloneObj = {};
        var foundSlice = false;
        var foundExclusion = false;
        var dropKeys = [];
        if (idOnlyExcludedExpression) {
          dropKeys.push(settings.key);
        }
        _.each(objKeys, function (key) {

          var subExpr = expr[key];
          var newValue;
          if (key !== settings.key && subExpr === 0) {
            foundExclusion = true;
          }

          // tiny optimization here to skip over id
          if (key === settings.key && _.isEmpty(subExpr)) {
            newValue = obj[key];
          } else if (_.isString(subExpr)) {
            newValue = computeValue(obj, subExpr, key);
          } else if (subExpr === 1 || subExpr === true) {
            newValue = _.result(obj, key);
          } else if (_.isObject(subExpr)) {
            var operator = _.keys(subExpr);
            operator = operator.length > 1 ? false : operator[0];
            if (operator !== false && _.contains(Ops.projectionOperators, operator)) {
              // apply the projection operator on the operator expression for the key
              var temp = projectionOperators[operator](obj, subExpr[operator], key);
              if (!_.isUndefined(temp)) {
                newValue = temp;
              }
              if (operator == '$slice') {
                foundSlice = true;
              }
            } else {
              // compute the value for the sub expression for the key
              newValue = computeValue(obj, subExpr, key);
            }
          } else {
            dropKeys.push(key);
          }

          if (newValue !== undefined) {
            cloneObj[key] = _.isObject(newValue) ? _.clone(newValue) : newValue;
          }
        });
        // if projection included $slice operator
        // Also if exclusion fields are found or we want to exclude only the id field
        // include keys that were not explicitly excluded
        if (foundSlice || foundExclusion || idOnlyExcludedExpression) {
          cloneObj = _.defaults(cloneObj, _.omit(obj, dropKeys));
        }
        projected.push(cloneObj);
      }

      return projected;
    },

    /**
     * Restricts the number of documents in an aggregation pipeline.
     *
     * @param collection
     * @param value
     * @returns {Object|*}
     */
    $limit: function (collection, value) {
      return _.first(collection, value);
    },

    /**
     * Skips over a specified number of documents from the pipeline and returns the rest.
     *
     * @param collection
     * @param value
     * @returns {*}
     */
    $skip: function (collection, value) {
      return _.rest(collection, value);
    },

    /**
     * Takes an array of documents and returns them as a stream of documents.
     *
     * @param collection
     * @param expr
     * @returns {Array}
     */
    $unwind: function (collection, expr) {
      var result = [];
      var field = expr.substr(1);
      for (var i = 0; i < collection.length; i++) {
        var obj = collection[i];
        // must throw an error if value is not an array
        var value = getValue(obj, field);
        if (_.isArray(value)) {
          _.each(value, function (item) {
            var tmp = _.clone(obj);
            tmp[field] = item;
            result.push(tmp);
          });
        } else {
          throw new Error("Target field '" + field + "' is not of type Array.");
        }
      }
      return result;
    },

    /**
     * Takes all input documents and returns them in a stream of sorted documents.
     *
     * @param collection
     * @param sortKeys
     * @returns {*}
     */
    $sort: function (collection, sortKeys) {
      if (!_.isEmpty(sortKeys) && _.isObject(sortKeys)) {
        var modifiers = _.keys(sortKeys);
        modifiers.reverse().forEach(function (key) {
          var indexes = [];
          var grouped = _.groupBy(collection, function (obj) {
            var value = resolve(obj, key);
            indexes.push(value);
            return value;
          });
          indexes = _.sortBy(_.uniq(indexes), function (item) {
            return item;
          });
          if (sortKeys[key] === -1) {
            indexes.reverse();
          }
          collection = [];
          _.each(indexes, function (item) {
            Array.prototype.push.apply(collection, grouped[item]);
          });
        });
      }
      return collection;
    }
  };

  var compoundOperators = {

    /**
     * Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.
     *
     * @param selector
     * @param value
     * @returns {{test: Function}}
     */
    $and: function (selector, value) {
      if (!_.isArray(value)) {
        throw new Error("Invalid expression for $and criteria");
      }
      var queries = [];
      _.each(value, function (expr) {
        queries.push(new Mingo.Query(expr));
      });

      return {
        test: function (obj) {
          for (var i = 0; i < queries.length; i++) {
            if (!queries[i].test(obj)) {
              return false;
            }
          }
          return true;
        }
      };
    },

    /**
     * Joins query clauses with a logical OR returns all documents that match the conditions of either clause.
     *
     * @param selector
     * @param value
     * @returns {{test: Function}}
     */
    $or: function (selector, value) {
      if (!_.isArray(value)) {
        throw new Error("Invalid expression for $or criteria");
      }
      var queries = [];
      _.each(value, function (expr) {
        queries.push(new Mingo.Query(expr));
      });

      return {
        test: function (obj) {
          for (var i = 0; i < queries.length; i++) {
            if (queries[i].test(obj)) {
              return true;
            }
          }
          return false;
        }
      };
    },

    /**
     * Joins query clauses with a logical NOR returns all documents that fail to match both clauses.
     *
     * @param selector
     * @param value
     * @returns {{test: Function}}
     */
    $nor: function (selector, value) {
      if (!_.isArray(value)) {
        throw new Error("Invalid expression for $nor criteria");
      }
      var query = this.$or("$or", value);
      return {
        test: function (obj) {
          return !query.test(obj);
        }
      };
    },

    /**
     * Inverts the effect of a query expression and returns documents that do not match the query expression.
     *
     * @param selector
     * @param value
     * @returns {{test: Function}}
     */
    $not: function (selector, value) {
      var criteria = {};
      criteria[selector] = normalize(value);
      var query = new Mingo.Query(criteria);
      return {
        test: function (obj) {
          return !query.test(obj);
        }
      };
    },

    /**
     * Matches documents that satisfy a JavaScript expression.
     *
     * @param selector
     * @param value
     * @returns {{test: test}}
     */
    $where: function (selector, value) {
      if (!_.isFunction(value)) {
        value = new Function("return " + value + ";");
      }
      return {
        test: function (obj) {
          return value.call(obj) === true;
        }
      };
    }

  };

  var simpleOperators = {

    /**
     * Checks that two values are equal. Pseudo operator introduced for convenience and consistency
     *
     * @param a
     * @param b
     * @returns {*}
     */
    $eq: function (a, b) {
      a = _.isArray(a) ? a : [a];
      a = _.find(a, function (val) {
        return _.isEqual(val, b);
      });
      return a !== undefined;
    },

    /**
     * Matches all values that are not equal to the value specified in the query.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $ne: function (a, b) {
      return !this.$eq(a, b);
    },

    /**
     * Matches any of the values that exist in an array specified in the query.
     *
     * @param a
     * @param b
     * @returns {*}
     */
    $in: function (a, b) {
      a = _.isArray(a) ? a : [a];
      return _.intersection(a, b).length > 0;
    },

    /**
     * Matches values that do not exist in an array specified to the query.
     *
     * @param a
     * @param b
     * @returns {*|boolean}
     */
    $nin: function (a, b) {
      return _.isUndefined(a) || !this.$in(a, b);
    },

    /**
     * Matches values that are less than the value specified in the query.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $lt: function (a, b) {
      a = _.isArray(a) ? a : [a];
      a = _.find(a, function (val) {
        return val < b
      });
      return a !== undefined;
    },

    /**
     * Matches values that are less than or equal to the value specified in the query.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $lte: function (a, b) {
      a = _.isArray(a) ? a : [a];
      a = _.find(a, function (val) {
        return val <= b
      });
      return a !== undefined;
    },

    /**
     * Matches values that are greater than the value specified in the query.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $gt: function (a, b) {
      a = _.isArray(a) ? a : [a];
      a = _.find(a, function (val) {
        return val > b
      });
      return a !== undefined;
    },

    /**
     * Matches values that are greater than or equal to the value specified in the query.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $gte: function (a, b) {
      a = _.isArray(a) ? a : [a];
      a = _.find(a, function (val) {
        return val >= b
      });
      return a !== undefined;
    },

    /**
     * Performs a modulo operation on the value of a field and selects documents with a specified result.
     *
     * @param a
     * @param b
     * @returns {*|boolean|boolean}
     */
    $mod: function (a, b) {
      a = _.isArray(a) ? a : [a];
      a = _.find(a, function (val) {
        return _.isNumber(val) && _.isArray(b) && b.length === 2 && (val % b[0]) === b[1];
      });
      return a !== undefined;
    },

    /**
     * Selects documents where values match a specified regular expression.
     *
     * @param a
     * @param b
     * @returns {*|boolean}
     */
    $regex: function (a, b) {
      a = _.isArray(a) ? a : [a];
      a = _.find(a, function (val) {
        return _.isString(val) && _.isRegExp(b) && (!!val.match(b));
      });
      return a !== undefined;
    },

    /**
     * Matches documents that have the specified field.
     *
     * @param a
     * @param b
     * @returns {boolean|*|boolean}
     */
    $exists: function (a, b) {
      return (b === false && _.isUndefined(a)) || (b === true && !_.isUndefined(a));
    },

    /**
     * Matches arrays that contain all elements specified in the query.
     *
     * @param a
     * @param b
     * @returns boolean
     */
    $all: function (a, b) {
      var self = this;
      var matched = false;
      if (_.isArray(a) && _.isArray(b)) {
        for (var i = 0; i < b.length; i++) {
          if (_.isObject(b[i]) && _.contains(_.keys(b[i]), "$elemMatch")) {
            matched = matched || self.$elemMatch(a, b[i].$elemMatch);
          } else {
            // order of arguments matter. underscore maintains order after intersection
            return _.intersection(b, a).length === b.length;
          }
        }
      }
      return matched;
    },

    /**
     * Selects documents if the array field is a specified size.
     *
     * @param a
     * @param b
     * @returns {*|boolean}
     */
    $size: function (a, b) {
      return _.isArray(a) && _.isNumber(b) && (a.length === b);
    },

    /**
     * Selects documents if element in the array field matches all the specified $elemMatch condition.
     *
     * @param a
     * @param b
     */
    $elemMatch: function (a, b) {
      if (_.isArray(a) && !_.isEmpty(a)) {
        var query = new Mingo.Query(b);
        for (var i = 0; i < a.length; i++) {
          if (query.test(a[i])) {
            return true;
          }
        }
      }
      return false;
    },

    /**
     * Selects documents if a field is of the specified type.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $type: function (a, b) {
      switch (b) {
        case 1:
          return _.isNumeric(a) && (a + "").indexOf(".") !== -1;
        case 2:
        case 5:
          return _.isString(a);
        case 3:
          return _.isObject(a);
        case 4:
          return _.isArray(a);
        case 8:
          return _.isBoolean(a);
        case 9:
          return _.isDate(a);
        case 10:
          return _.isNull(a);
        case 11:
          return _.isRegExp(a);
        case 16:
          return _.isNumeric(a) && a <= 2147483647 && (a + "").indexOf(".") === -1;
        case 18:
          return _.isNumeric(a) && a > 2147483647 && a <= 9223372036854775807 && (a + "").indexOf(".") === -1;
        default:
          return false;
      }
    }

  };

  var projectionOperators = {

    /**
     * Projects the first element in an array that matches the query condition.
     *
     * @param obj
     * @param field
     * @param expr
     */
    $: function (obj, expr, field) {
      throw new Error("$ not implemented");
    },

    /**
     * Projects only the first element from an array that matches the specified $elemMatch condition.
     *
     * @param obj
     * @param field
     * @param expr
     * @returns {*}
     */
    $elemMatch: function (obj, expr, field) {
      var array = resolve(obj, field);
      var query = new Mingo.Query(expr);

      if (_.isUndefined(array) || !_.isArray(array)) {
        return undefined;
      }

      for (var i = 0; i < array.length; i++) {
        if (query.test(array[i])) {
          return [array[i]];
        }
      }

      return undefined;
    },

    /**
     * Limits the number of elements projected from an array. Supports skip and limit slices.
     *
     * @param obj
     * @param field
     * @param expr
     */
    $slice: function (obj, expr, field) {
      var array = resolve(obj, field);

      if (!_.isArray(array)) {
        return array;
      }
      if (!_.isArray(expr)) {
        if (!_.isNumber(expr)) {
          throw new Error("Invalid type for $slice operator");
        }
        expr = expr < 0 ? [expr] : [0, expr];
      } else {
        // MongoDB $slice works a bit differently from Array.slice
        // Uses single argument for 'limit' and array argument [skip, limit]
        var skip = (expr[0] < 0) ? array.length + expr[0] : expr;
        var limit = skip + expr[1];
        expr = [skip, limit];
      }

      return Array.prototype.slice.apply(array, expr);
    }
  };

  var groupOperators = {

    /**
     * Returns an array of all the unique values for the selected field among for each document in that group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $addToSet: function (collection, expr) {
      var result = _.map(collection, function (obj) {
        return computeValue(obj, expr);
      });
      return _.uniq(result);
    },

    /**
     * Returns the sum of all the values in a group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $sum: function (collection, expr) {
      if (_.isNumber(expr)) {
        // take a short cut if expr is number literal
        return collection.length * expr;
      }
      return _.reduce(collection, function (acc, obj) {
        // pass empty field to avoid naming conflicts with fields on documents
        return acc + computeValue(obj, expr);
      }, 0);
    },

    /**
     * Returns the highest value in a group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $max: function (collection, expr) {
      var obj = _.max(collection, function (obj) {
        return computeValue(obj, expr);
      });
      return computeValue(obj, expr);
    },

    /**
     * Returns the lowest value in a group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $min: function (collection, expr) {
      var obj = _.min(collection, function (obj) {
        return computeValue(obj, expr);
      });
      return computeValue(obj, expr);
    },

    /**
     * Returns an average of all the values in a group.
     *
     * @param collection
     * @param expr
     * @returns {number}
     */
    $avg: function (collection, expr) {
      return this.$sum(collection, expr) / (collection.length || 1);
    },

    /**
     * Returns an array of all values for the selected field among for each document in that group.
     *
     * @param collection
     * @param expr
     * @returns {Array|*}
     */
    $push: function (collection, expr) {
      return _.map(collection, function (obj) {
        return computeValue(obj, expr);
      });
    },

    /**
     * Returns the first value in a group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $first: function (collection, expr) {
      return (collection.length > 0) ? computeValue(collection[0], expr) : undefined;
    },

    /**
     * Returns the last value in a group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $last: function (collection, expr) {
      return (collection.length > 0) ? computeValue(collection[collection.length - 1], expr) : undefined;
    }
  };


  /////////// Common Aggregation Operators ///////////

  var arithmeticOperators = {

    /**
     * Computes the sum of an array of numbers.
     *
     * @param obj
     * @param expr
     * @returns {Object}
     */
    $add: function (obj, expr) {
      var args = computeValue(obj, expr);
      return _.reduce(args, function (memo, num) {
        return memo + num;
      }, 0);
    },

    /**
     * Takes an array that contains two numbers or two dates and subtracts the second value from the first.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $subtract: function (obj, expr) {
      var args = computeValue(obj, expr);
      return args[0] - args[1];
    },

    /**
     * Takes two numbers and divides the first number by the second.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $divide: function (obj, expr) {
      var args = computeValue(obj, expr);
      return args[0] / args[1];
    },

    /**
     * Computes the product of an array of numbers.
     *
     * @param obj
     * @param expr
     * @returns {Object}
     */
    $multiply: function (obj, expr) {
      var args = computeValue(obj, expr);
      return _.reduce(args, function (memo, num) {
        return memo * num;
      }, 1);
    },

    /**
     * Takes two numbers and calculates the modulo of the first number divided by the second.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $mod: function (obj, expr) {
      var args = computeValue(obj, expr);
      return args[0] % args[1];
    }
  };

  var stringOperators = {

    /**
     * Concatenates two strings.
     *
     * @param obj
     * @param expr
     * @returns {string|*}
     */
    $concat: function (obj, expr) {
      var args = computeValue(obj, expr);
      // does not allow concatenation with nulls
      if (_.contains(args, null) || _.contains(args, undefined)) {
        return null;
      }
      return args.join("");
    },

    /**
     * Compares two strings and returns an integer that reflects the comparison.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $strcasecmp: function (obj, expr) {
      var args = computeValue(obj, expr);
      args[0] = _.isEmpty(args[0]) ? "" : args[0].toUpperCase();
      args[1] = _.isEmpty(args[1]) ? "" : args[1].toUpperCase();
      if (args[0] > args[1]) {
        return 1;
      }
      return (args[0] < args[1]) ? -1 : 0;
    },

    /**
     * Returns a substring of a string, starting at a specified index position and including the specified number of characters.
     * The index is zero-based.
     *
     * @param obj
     * @param expr
     * @returns {string}
     */
    $substr: function (obj, expr) {
      var args = computeValue(obj, expr);
      if (_.isString(args[0])) {
        if (args[1] < 0) {
          return "";
        } else if (args[2] < 0) {
          return args[0].substr(args[1]);
        } else {
          return args[0].substr(args[1], args[2]);
        }
      }
      return "";
    },

    /**
     * Converts a string to lowercase.
     *
     * @param obj
     * @param expr
     * @returns {string}
     */
    $toLower: function (obj, expr) {
      var value = computeValue(obj, expr);
      return _.isEmpty(value) ? "" : value.toLowerCase();
    },

    /**
     * Converts a string to uppercase.
     *
     * @param obj
     * @param expr
     * @returns {string}
     */
    $toUpper: function (obj, expr) {
      var value = computeValue(obj, expr);
      return _.isEmpty(value) ? "" : value.toUpperCase();
    }
  };

  var dateOperators = {
    /**
     * Returns the day of the year for a date as a number between 1 and 366 (leap year).
     * @param obj
     * @param expr
     */
    $dayOfYear: function (obj, expr) {
      var d = computeValue(obj, expr);
      if (_.isDate(value)) {
        var start = new Date(d.getFullYear(), 0, 0);
        var diff = d - start;
        var oneDay = 1000 * 60 * 60 * 24;
        return Math.round(diff / oneDay);
      }
      return undefined;
    },

    /**
     * Returns the day of the month for a date as a number between 1 and 31.
     * @param obj
     * @param expr
     */
    $dayOfMonth: function (obj, expr) {
      var d = computeValue(obj, expr);
      return _.isDate(d) ? d.getDate() : undefined;
    },

    /**
     * Returns the day of the week for a date as a number between 1 (Sunday) and 7 (Saturday).
     * @param obj
     * @param expr
     */
    $dayOfWeek: function (obj, expr) {
      var d = computeValue(obj, expr);
      return _.isDate(d) ? d.getDay() + 1 : undefined;
    },

    /**
     * Returns the year for a date as a number (e.g. 2014).
     * @param obj
     * @param expr
     */
    $year: function (obj, expr) {
      var d = computeValue(obj, expr);
      return _.isDate(d) ? d.getFullYear() + 1 : undefined;
    },

    /**
     * Returns the month for a date as a number between 1 (January) and 12 (December).
     * @param obj
     * @param expr
     */
    $month: function (obj, expr) {
      var d = computeValue(obj, expr);
      return _.isDate(d) ? d.getMonth() + 1 : undefined;
    },

    /**
     * Returns the week number for a date as a number between 0
     * (the partial week that precedes the first Sunday of the year) and 53 (leap year).
     * @param obj
     * @param expr
     */
    $week: function (obj, expr) {
      var d = computeValue(obj, expr);
      // TODO
      throw new Error("Not Implemented");
    },

    /**
     * Returns the hour for a date as a number between 0 and 23.
     * @param obj
     * @param expr
     */
    $hour: function (obj, expr) {
      var d = computeValue(obj, expr);
      return _.isDate(d) ? d.getHours() : undefined;
    },

    /**
     * Returns the minute for a date as a number between 0 and 59.
     * @param obj
     * @param expr
     */
    $minute: function (obj, expr) {
      var d = computeValue(obj, expr);
      return _.isDate(d) ? d.getMinutes() : undefined;
    },

    /**
     * Returns the seconds for a date as a number between 0 and 60 (leap seconds).
     * @param obj
     * @param expr
     */
    $second: function (obj, expr) {
      var d = computeValue(obj, expr);
      return _.isDate(d) ? d.getSeconds() : undefined;
    },

    /**
     * Returns the milliseconds of a date as a number between 0 and 999.
     * @param obj
     * @param expr
     */
    $millisecond: function (obj, expr) {
      var d = computeValue(obj, expr);
      return _.isDate(d) ? d.getMilliseconds() : undefined;
    },

    /**
     * Returns the date as a formatted string.
     * @param obj
     * @param expr
     */
    $dateToString: function (obj, expr) {
      var fmt = expr['format'];
      var date = computeValue(obj, expr['date']);
      // TODO: use python-style date formatting
      /*
       %Y	Year (4 digits, zero padded)	0000-9999
       %m	Month (2 digits, zero padded)	01-12
       %d	Day of Month (2 digits, zero padded)	01-31
       %H	Hour (2 digits, zero padded, 24-hour clock)	00-23
       %M	Minute (2 digits, zero padded)	00-59
       %S	Second (2 digits, zero padded)	00-60
       %L	Millisecond (3 digits, zero padded)	000-999
       %j	Day of year (3 digits, zero padded)	001-366
       %w	Day of week (1-Sunday, 7-Saturday)	1-7
       %U	Week of year (2 digits, zero padded)	00-53
       %%	Percent Character as a Literal	%
       */
      throw new Error("Not Implemented");
    }
  };

  var setOperators = {
    /**
     * Returns true if two sets have the same elements.
     * @param obj
     * @param expr
     */
    $setEquals: function (obj, expr) {
      var args = computeValue(obj, expr);
      var first = _.uniq(args[0]);
      var second = _.uniq(args[1]);
      if (first.length !== second.length) {
        return false;
      }
      return _.difference(first, second).length == 0;
    },

    /**
     * Returns the common elements of the input sets.
     * @param obj
     * @param expr
     */
    $setIntersection: function (obj, expr) {
      var args = computeValue(obj, expr);
      return _.intersection(args[0], args[1]);
    },

    /**
     * Returns elements of a set that do not appear in a second set.
     * @param obj
     * @param expr
     */
    $setDifference: function (obj, expr) {
      var args = computeValue(obj, expr);
      return _.difference(args[0], args[1]);
    },

    /**
     * Returns a set that holds all elements of the input sets.
     * @param obj
     * @param expr
     */
    $setUnion: function (obj, expr) {
      var args = computeValue(obj, expr);
      return _.union(args[0], args[1]);
    },

    /**
     * Returns true if all elements of a set appear in a second set.
     * @param obj
     * @param expr
     */
    $setIsSubset: function (obj, expr) {
      var args = computeValue(obj, expr);
      return _.intersection(args[0], args[1]).length === args[0].length;
    },

    /**
     * Returns true if any elements of a set evaluate to true, and false otherwise.
     * @param obj
     * @param expr
     */
    $anyElementTrue: function (obj, expr) {
      // mongodb nests the array expression in another
      var args = computeValue(obj, expr)[0];
      for (var i = 0; i < args.length; i++) {
        if (!!args[i])
          return true;
      }
      return false;
    },

    /**
     * Returns true if all elements of a set evaluate to true, and false otherwise.
     * @param obj
     * @param expr
     */
    $allElementsTrue: function (obj, expr) {
      // mongodb nests the array expression in another
      var args = computeValue(obj, expr)[0];
      for (var i = 0; i < args.length; i++) {
        if (!args[i])
          return false;
      }
      return true;
    }
  };

  var conditionalOperators = {

    /**
     * A ternary operator that evaluates one expression,
     * and depending on the result returns the value of one following expressions.
     *
     * @param obj
     * @param expr
     */
    $cond: function (obj, expr) {
      var ifExpr, thenExpr, elseExpr;
      if (_.isArray(expr)) {
        if (expr.length != 3) {
          throw new Error("Invalid arguments for $cond operator");
        }
        ifExpr = expr[0];
        thenExpr = expr[1];
        elseExpr = expr[2];
      } else if (_.isObject(expr)) {
        ifExpr = expr['if'];
        thenExpr = expr['then'];
        elseExpr = expr['else'];
      }
      var condition = computeValue(obj, ifExpr);
      return condition ? computeValue(obj, thenExpr) : computeValue(obj, elseExpr);
    },

    /**
     * Evaluates an expression and returns the first expression if it evaluates to a non-null value.
     * Otherwise, $ifNull returns the second expression's value.
     *
     * @param obj
     * @param expr
     * @returns {*}
     */
    $ifNull: function (obj, expr) {
      if (!_.isArray(expr) || expr.length != 2) {
        throw new Error("Invalid arguments for $ifNull operator");
      }
      var args = computeValue(obj, expr);
      return (args[0] === null || args[0] === undefined) ? args[1] : args[0];
    }
  };

  var comparisonOperators = {
    /**
     * Compares two values and returns the result of the comparison as an integer.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $cmp: function (obj, expr) {
      var args = computeValue(obj, expr);
      if (args[0] > args[1]) {
        return 1;
      }
      return (args[0] < args[1]) ? -1 : 0;
    }
  };

  // combine aggregate operators
  var aggregateOperators = _.extend(
      {},
      arithmeticOperators,
      comparisonOperators,
      conditionalOperators,
      dateOperators,
      setOperators,
      stringOperators
  );

  // mixin comparison operators
  _.each(["$eq", "$ne", "$gt", "$gte", "$lt", "$lte"], function (op) {
    aggregateOperators[op] = function (obj, expr) {
      var args = computeValue(obj, expr);
      return simpleOperators[op](args[0], args[1]);
    };
  });

  var Ops = {
    simpleOperators: _.keys(simpleOperators),
    compoundOperators: _.keys(compoundOperators),
    aggregateOperators: _.keys(aggregateOperators),
    groupOperators: _.keys(groupOperators),
    pipelineOperators: _.keys(pipelineOperators),
    projectionOperators: _.keys(projectionOperators)
  };
  Ops.queryOperators = _.union(Ops.simpleOperators, Ops.compoundOperators);

  /**
   * Returns the result of evaluating a $group operation over a collection
   *
   * @param collection
   * @param field the name of the aggregate operator or field
   * @param expr the expression of the aggregate operator for the field
   * @returns {*}
   */
  function accumulate(collection, field, expr) {
    if (_.contains(Ops.groupOperators, field)) {
      return groupOperators[field](collection, expr);
    }

    if (_.isObject(expr)) {
      var result = {};
      for (var key in expr) {
        if (expr.hasOwnProperty(key)) {
          result[key] = accumulate(collection, key, expr[key]);
          // must run ONLY one group operator per expression
          // if so, return result of the computed value
          if (_.contains(Ops.groupOperators, key)) {
            result = result[key];
            // if there are more keys in expression this is bad
            if (_.keys(expr).length > 1) {
              throw new Error("Invalid $group expression '" + JSON.stringify(expr) + "'");
            }
            break;
          }
        }
      }
      return result;
    }

    return undefined;
  }

  /**
   * Computes the actual value of the expression using the given object as context
   *
   * @param obj the current object from the collection
   * @param expr the expression for the given field
   * @param field the field name (may also be an aggregate operator)
   * @returns {*}
   */
  function computeValue(obj, expr, field) {

    // if the field of the object is a valid operator
    if (_.contains(Ops.aggregateOperators, field)) {
      return aggregateOperators[field](obj, expr);
    }

    // if expr is a variable for an object field
    // field not used in this case
    if (_.isString(expr) && expr.length > 0 && expr[0] === "$") {
      return resolve(obj, expr.slice(1));
    }

    var result;

    if (_.isArray(expr)) {
      result = [];
      for (var i = 0; i < expr.length; i++) {
        result.push(computeValue(obj, expr[i], null));
      }
    } else if (_.isObject(expr)) {
      result = {};
      for (var key in expr) {
        if (expr.hasOwnProperty(key)) {
          result[key] = computeValue(obj, expr[key], key);

          // must run ONLY one aggregate operator per expression
          // if so, return result of the computed value
          if (_.contains(Ops.aggregateOperators, key)) {
            result = result[key];
            // if there are more keys in expression this is bad
            if (_.keys(expr).length > 1) {
              throw new Error("Invalid aggregation expression '" + JSON.stringify(expr) + "'");
            }
            break;
          }
        }
      }
    } else {
      // check and return value if already in a resolved state
      for (var i = 0; i < primitives.length; i++) {
        if (primitives[i](expr)) {
          return expr;
        }
      }
    }

    return result;
  }

}(this));

},{"stream":"stream","underscore":35,"util":6}],13:[function(require,module,exports){

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

},{"./ops":24,"component-type":16,"debug":17,"dot-component":20,"mongo-eql":22,"object-component":23}],14:[function(require,module,exports){

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

},{"./filter":13,"./mods":15,"component-type":16,"debug":17,"dot-component":20,"object-component":23}],15:[function(require,module,exports){

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

},{"component-type":16,"debug":17,"dot-component":20,"mongo-eql":22,"object-component":23}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){

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
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

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
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
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
    r = exports.storage.debug;
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

},{"./debug":18}],18:[function(require,module,exports){

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

},{"ms":19}],19:[function(require,module,exports){
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
  str = '' + str;
  if (str.length > 10000) return;
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

},{}],20:[function(require,module,exports){

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

},{"type-component":21}],21:[function(require,module,exports){

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

},{}],22:[function(require,module,exports){

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

},{"component-type":16}],23:[function(require,module,exports){

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
},{}],24:[function(require,module,exports){

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

},{"component-type":16,"mongo-eql":22}],25:[function(require,module,exports){
var CryptoJS = require('./lib/core').CryptoJS;
require('./lib/enc-base64');
require('./lib/md5');
require('./lib/evpkdf');
require('./lib/cipher-core');
require('./lib/aes');
var JsonFormatter = require('./lib/jsonformatter').JsonFormatter;

exports.CryptoJS = CryptoJS;
exports.JsonFormatter = JsonFormatter;
},{"./lib/aes":26,"./lib/cipher-core":27,"./lib/core":28,"./lib/enc-base64":29,"./lib/evpkdf":30,"./lib/jsonformatter":31,"./lib/md5":32}],26:[function(require,module,exports){
var CryptoJS = require('./core').CryptoJS;

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var BlockCipher = C_lib.BlockCipher;
    var C_algo = C.algo;

    // Lookup tables
    var SBOX = [];
    var INV_SBOX = [];
    var SUB_MIX_0 = [];
    var SUB_MIX_1 = [];
    var SUB_MIX_2 = [];
    var SUB_MIX_3 = [];
    var INV_SUB_MIX_0 = [];
    var INV_SUB_MIX_1 = [];
    var INV_SUB_MIX_2 = [];
    var INV_SUB_MIX_3 = [];

    // Compute lookup tables
    (function () {
        // Compute double table
        var d = [];
        for (var i = 0; i < 256; i++) {
            if (i < 128) {
                d[i] = i << 1;
            } else {
                d[i] = (i << 1) ^ 0x11b;
            }
        }

        // Walk GF(2^8)
        var x = 0;
        var xi = 0;
        for (var i = 0; i < 256; i++) {
            // Compute sbox
            var sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
            sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
            SBOX[x] = sx;
            INV_SBOX[sx] = x;

            // Compute multiplication
            var x2 = d[x];
            var x4 = d[x2];
            var x8 = d[x4];

            // Compute sub bytes, mix columns tables
            var t = (d[sx] * 0x101) ^ (sx * 0x1010100);
            SUB_MIX_0[x] = (t << 24) | (t >>> 8);
            SUB_MIX_1[x] = (t << 16) | (t >>> 16);
            SUB_MIX_2[x] = (t << 8)  | (t >>> 24);
            SUB_MIX_3[x] = t;

            // Compute inv sub bytes, inv mix columns tables
            var t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
            INV_SUB_MIX_0[sx] = (t << 24) | (t >>> 8);
            INV_SUB_MIX_1[sx] = (t << 16) | (t >>> 16);
            INV_SUB_MIX_2[sx] = (t << 8)  | (t >>> 24);
            INV_SUB_MIX_3[sx] = t;

            // Compute next counter
            if (!x) {
                x = xi = 1;
            } else {
                x = x2 ^ d[d[d[x8 ^ x2]]];
                xi ^= d[d[xi]];
            }
        }
    }());

    // Precomputed Rcon lookup
    var RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

    /**
     * AES block cipher algorithm.
     */
    var AES = C_algo.AES = BlockCipher.extend({
        _doReset: function () {
            // Shortcuts
            var key = this._key;
            var keyWords = key.words;
            var keySize = key.sigBytes / 4;

            // Compute number of rounds
            var nRounds = this._nRounds = keySize + 6

            // Compute number of key schedule rows
            var ksRows = (nRounds + 1) * 4;

            // Compute key schedule
            var keySchedule = this._keySchedule = [];
            for (var ksRow = 0; ksRow < ksRows; ksRow++) {
                if (ksRow < keySize) {
                    keySchedule[ksRow] = keyWords[ksRow];
                } else {
                    var t = keySchedule[ksRow - 1];

                    if (!(ksRow % keySize)) {
                        // Rot word
                        t = (t << 8) | (t >>> 24);

                        // Sub word
                        t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];

                        // Mix Rcon
                        t ^= RCON[(ksRow / keySize) | 0] << 24;
                    } else if (keySize > 6 && ksRow % keySize == 4) {
                        // Sub word
                        t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
                    }

                    keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
                }
            }

            // Compute inv key schedule
            var invKeySchedule = this._invKeySchedule = [];
            for (var invKsRow = 0; invKsRow < ksRows; invKsRow++) {
                var ksRow = ksRows - invKsRow;

                if (invKsRow % 4) {
                    var t = keySchedule[ksRow];
                } else {
                    var t = keySchedule[ksRow - 4];
                }

                if (invKsRow < 4 || ksRow <= 4) {
                    invKeySchedule[invKsRow] = t;
                } else {
                    invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[(t >>> 16) & 0xff]] ^
                                               INV_SUB_MIX_2[SBOX[(t >>> 8) & 0xff]] ^ INV_SUB_MIX_3[SBOX[t & 0xff]];
                }
            }
        },

        encryptBlock: function (M, offset) {
            this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
        },

        decryptBlock: function (M, offset) {
            // Swap 2nd and 4th rows
            var t = M[offset + 1];
            M[offset + 1] = M[offset + 3];
            M[offset + 3] = t;

            this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);

            // Inv swap 2nd and 4th rows
            var t = M[offset + 1];
            M[offset + 1] = M[offset + 3];
            M[offset + 3] = t;
        },

        _doCryptBlock: function (M, offset, keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX) {
            // Shortcut
            var nRounds = this._nRounds;

            // Get input, add round key
            var s0 = M[offset]     ^ keySchedule[0];
            var s1 = M[offset + 1] ^ keySchedule[1];
            var s2 = M[offset + 2] ^ keySchedule[2];
            var s3 = M[offset + 3] ^ keySchedule[3];

            // Key schedule row counter
            var ksRow = 4;

            // Rounds
            for (var round = 1; round < nRounds; round++) {
                // Shift rows, sub bytes, mix columns, add round key
                var t0 = SUB_MIX_0[s0 >>> 24] ^ SUB_MIX_1[(s1 >>> 16) & 0xff] ^ SUB_MIX_2[(s2 >>> 8) & 0xff] ^ SUB_MIX_3[s3 & 0xff] ^ keySchedule[ksRow++];
                var t1 = SUB_MIX_0[s1 >>> 24] ^ SUB_MIX_1[(s2 >>> 16) & 0xff] ^ SUB_MIX_2[(s3 >>> 8) & 0xff] ^ SUB_MIX_3[s0 & 0xff] ^ keySchedule[ksRow++];
                var t2 = SUB_MIX_0[s2 >>> 24] ^ SUB_MIX_1[(s3 >>> 16) & 0xff] ^ SUB_MIX_2[(s0 >>> 8) & 0xff] ^ SUB_MIX_3[s1 & 0xff] ^ keySchedule[ksRow++];
                var t3 = SUB_MIX_0[s3 >>> 24] ^ SUB_MIX_1[(s0 >>> 16) & 0xff] ^ SUB_MIX_2[(s1 >>> 8) & 0xff] ^ SUB_MIX_3[s2 & 0xff] ^ keySchedule[ksRow++];

                // Update state
                s0 = t0;
                s1 = t1;
                s2 = t2;
                s3 = t3;
            }

            // Shift rows, sub bytes, add round key
            var t0 = ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ keySchedule[ksRow++];
            var t1 = ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ keySchedule[ksRow++];
            var t2 = ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ keySchedule[ksRow++];
            var t3 = ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ keySchedule[ksRow++];

            // Set output
            M[offset]     = t0;
            M[offset + 1] = t1;
            M[offset + 2] = t2;
            M[offset + 3] = t3;
        },

        keySize: 256/32
    });

    /**
     * Shortcut functions to the cipher's object interface.
     *
     * @example
     *
     *     var ciphertext = CryptoJS.AES.encrypt(message, key, cfg);
     *     var plaintext  = CryptoJS.AES.decrypt(ciphertext, key, cfg);
     */
    C.AES = BlockCipher._createHelper(AES);
}());

},{"./core":28}],27:[function(require,module,exports){
var CryptoJS = require('./core').CryptoJS;

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
/**
 * Cipher core components.
 */
CryptoJS.lib.Cipher || (function (undefined) {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var Base = C_lib.Base;
    var WordArray = C_lib.WordArray;
    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm;
    var C_enc = C.enc;
    var Utf8 = C_enc.Utf8;
    var Base64 = C_enc.Base64;
    var C_algo = C.algo;
    var EvpKDF = C_algo.EvpKDF;

    /**
     * Abstract base cipher template.
     *
     * @property {number} keySize This cipher's key size. Default: 4 (128 bits)
     * @property {number} ivSize This cipher's IV size. Default: 4 (128 bits)
     * @property {number} _ENC_XFORM_MODE A constant representing encryption mode.
     * @property {number} _DEC_XFORM_MODE A constant representing decryption mode.
     */
    var Cipher = C_lib.Cipher = BufferedBlockAlgorithm.extend({
        /**
         * Configuration options.
         *
         * @property {WordArray} iv The IV to use for this operation.
         */
        cfg: Base.extend(),

        /**
         * Creates this cipher in encryption mode.
         *
         * @param {WordArray} key The key.
         * @param {Object} cfg (Optional) The configuration options to use for this operation.
         *
         * @return {Cipher} A cipher instance.
         *
         * @static
         *
         * @example
         *
         *     var cipher = CryptoJS.algo.AES.createEncryptor(keyWordArray, { iv: ivWordArray });
         */
        createEncryptor: function (key, cfg) {
            return this.create(this._ENC_XFORM_MODE, key, cfg);
        },

        /**
         * Creates this cipher in decryption mode.
         *
         * @param {WordArray} key The key.
         * @param {Object} cfg (Optional) The configuration options to use for this operation.
         *
         * @return {Cipher} A cipher instance.
         *
         * @static
         *
         * @example
         *
         *     var cipher = CryptoJS.algo.AES.createDecryptor(keyWordArray, { iv: ivWordArray });
         */
        createDecryptor: function (key, cfg) {
            return this.create(this._DEC_XFORM_MODE, key, cfg);
        },

        /**
         * Initializes a newly created cipher.
         *
         * @param {number} xformMode Either the encryption or decryption transormation mode constant.
         * @param {WordArray} key The key.
         * @param {Object} cfg (Optional) The configuration options to use for this operation.
         *
         * @example
         *
         *     var cipher = CryptoJS.algo.AES.create(CryptoJS.algo.AES._ENC_XFORM_MODE, keyWordArray, { iv: ivWordArray });
         */
        init: function (xformMode, key, cfg) {
            // Apply config defaults
            this.cfg = this.cfg.extend(cfg);

            // Store transform mode and key
            this._xformMode = xformMode;
            this._key = key;

            // Set initial values
            this.reset();
        },

        /**
         * Resets this cipher to its initial state.
         *
         * @example
         *
         *     cipher.reset();
         */
        reset: function () {
            // Reset data buffer
            BufferedBlockAlgorithm.reset.call(this);

            // Perform concrete-cipher logic
            this._doReset();
        },

        /**
         * Adds data to be encrypted or decrypted.
         *
         * @param {WordArray|string} dataUpdate The data to encrypt or decrypt.
         *
         * @return {WordArray} The data after processing.
         *
         * @example
         *
         *     var encrypted = cipher.process('data');
         *     var encrypted = cipher.process(wordArray);
         */
        process: function (dataUpdate) {
            // Append
            this._append(dataUpdate);

            // Process available blocks
            return this._process();
        },

        /**
         * Finalizes the encryption or decryption process.
         * Note that the finalize operation is effectively a destructive, read-once operation.
         *
         * @param {WordArray|string} dataUpdate The final data to encrypt or decrypt.
         *
         * @return {WordArray} The data after final processing.
         *
         * @example
         *
         *     var encrypted = cipher.finalize();
         *     var encrypted = cipher.finalize('data');
         *     var encrypted = cipher.finalize(wordArray);
         */
        finalize: function (dataUpdate) {
            // Final data update
            if (dataUpdate) {
                this._append(dataUpdate);
            }

            // Perform concrete-cipher logic
            var finalProcessedData = this._doFinalize();

            return finalProcessedData;
        },

        keySize: 128/32,

        ivSize: 128/32,

        _ENC_XFORM_MODE: 1,

        _DEC_XFORM_MODE: 2,

        /**
         * Creates shortcut functions to a cipher's object interface.
         *
         * @param {Cipher} cipher The cipher to create a helper for.
         *
         * @return {Object} An object with encrypt and decrypt shortcut functions.
         *
         * @static
         *
         * @example
         *
         *     var AES = CryptoJS.lib.Cipher._createHelper(CryptoJS.algo.AES);
         */
        _createHelper: (function () {
            function selectCipherStrategy(key) {
                if (typeof key == 'string') {
                    return PasswordBasedCipher;
                } else {
                    return SerializableCipher;
                }
            }

            return function (cipher) {
                return {
                    encrypt: function (message, key, cfg) {
                        return selectCipherStrategy(key).encrypt(cipher, message, key, cfg);
                    },

                    decrypt: function (ciphertext, key, cfg) {
                        return selectCipherStrategy(key).decrypt(cipher, ciphertext, key, cfg);
                    }
                };
            };
        }())
    });

    /**
     * Abstract base stream cipher template.
     *
     * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 1 (32 bits)
     */
    var StreamCipher = C_lib.StreamCipher = Cipher.extend({
        _doFinalize: function () {
            // Process partial blocks
            var finalProcessedBlocks = this._process(!!'flush');

            return finalProcessedBlocks;
        },

        blockSize: 1
    });

    /**
     * Mode namespace.
     */
    var C_mode = C.mode = {};

    /**
     * Abstract base block cipher mode template.
     */
    var BlockCipherMode = C_lib.BlockCipherMode = Base.extend({
        /**
         * Creates this mode for encryption.
         *
         * @param {Cipher} cipher A block cipher instance.
         * @param {Array} iv The IV words.
         *
         * @static
         *
         * @example
         *
         *     var mode = CryptoJS.mode.CBC.createEncryptor(cipher, iv.words);
         */
        createEncryptor: function (cipher, iv) {
            return this.Encryptor.create(cipher, iv);
        },

        /**
         * Creates this mode for decryption.
         *
         * @param {Cipher} cipher A block cipher instance.
         * @param {Array} iv The IV words.
         *
         * @static
         *
         * @example
         *
         *     var mode = CryptoJS.mode.CBC.createDecryptor(cipher, iv.words);
         */
        createDecryptor: function (cipher, iv) {
            return this.Decryptor.create(cipher, iv);
        },

        /**
         * Initializes a newly created mode.
         *
         * @param {Cipher} cipher A block cipher instance.
         * @param {Array} iv The IV words.
         *
         * @example
         *
         *     var mode = CryptoJS.mode.CBC.Encryptor.create(cipher, iv.words);
         */
        init: function (cipher, iv) {
            this._cipher = cipher;
            this._iv = iv;
        }
    });

    /**
     * Cipher Block Chaining mode.
     */
    var CBC = C_mode.CBC = (function () {
        /**
         * Abstract base CBC mode.
         */
        var CBC = BlockCipherMode.extend();

        /**
         * CBC encryptor.
         */
        CBC.Encryptor = CBC.extend({
            /**
             * Processes the data block at offset.
             *
             * @param {Array} words The data words to operate on.
             * @param {number} offset The offset where the block starts.
             *
             * @example
             *
             *     mode.processBlock(data.words, offset);
             */
            processBlock: function (words, offset) {
                // Shortcuts
                var cipher = this._cipher;
                var blockSize = cipher.blockSize;

                // XOR and encrypt
                xorBlock.call(this, words, offset, blockSize);
                cipher.encryptBlock(words, offset);

                // Remember this block to use with next block
                this._prevBlock = words.slice(offset, offset + blockSize);
            }
        });

        /**
         * CBC decryptor.
         */
        CBC.Decryptor = CBC.extend({
            /**
             * Processes the data block at offset.
             *
             * @param {Array} words The data words to operate on.
             * @param {number} offset The offset where the block starts.
             *
             * @example
             *
             *     mode.processBlock(data.words, offset);
             */
            processBlock: function (words, offset) {
                // Shortcuts
                var cipher = this._cipher;
                var blockSize = cipher.blockSize;

                // Remember this block to use with next block
                var thisBlock = words.slice(offset, offset + blockSize);

                // Decrypt and XOR
                cipher.decryptBlock(words, offset);
                xorBlock.call(this, words, offset, blockSize);

                // This block becomes the previous block
                this._prevBlock = thisBlock;
            }
        });

        function xorBlock(words, offset, blockSize) {
            // Shortcut
            var iv = this._iv;

            // Choose mixing block
            if (iv) {
                var block = iv;

                // Remove IV for subsequent blocks
                this._iv = undefined;
            } else {
                var block = this._prevBlock;
            }

            // XOR blocks
            for (var i = 0; i < blockSize; i++) {
                words[offset + i] ^= block[i];
            }
        }

        return CBC;
    }());

    /**
     * Padding namespace.
     */
    var C_pad = C.pad = {};

    /**
     * PKCS #5/7 padding strategy.
     */
    var Pkcs7 = C_pad.Pkcs7 = {
        /**
         * Pads data using the algorithm defined in PKCS #5/7.
         *
         * @param {WordArray} data The data to pad.
         * @param {number} blockSize The multiple that the data should be padded to.
         *
         * @static
         *
         * @example
         *
         *     CryptoJS.pad.Pkcs7.pad(wordArray, 4);
         */
        pad: function (data, blockSize) {
            // Shortcut
            var blockSizeBytes = blockSize * 4;

            // Count padding bytes
            var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

            // Create padding word
            var paddingWord = (nPaddingBytes << 24) | (nPaddingBytes << 16) | (nPaddingBytes << 8) | nPaddingBytes;

            // Create padding
            var paddingWords = [];
            for (var i = 0; i < nPaddingBytes; i += 4) {
                paddingWords.push(paddingWord);
            }
            var padding = WordArray.create(paddingWords, nPaddingBytes);

            // Add padding
            data.concat(padding);
        },

        /**
         * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
         *
         * @param {WordArray} data The data to unpad.
         *
         * @static
         *
         * @example
         *
         *     CryptoJS.pad.Pkcs7.unpad(wordArray);
         */
        unpad: function (data) {
            // Get number of padding bytes from last byte
            var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

            // Remove padding
            data.sigBytes -= nPaddingBytes;
        }
    };

    /**
     * Abstract base block cipher template.
     *
     * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 4 (128 bits)
     */
    var BlockCipher = C_lib.BlockCipher = Cipher.extend({
        /**
         * Configuration options.
         *
         * @property {Mode} mode The block mode to use. Default: CBC
         * @property {Padding} padding The padding strategy to use. Default: Pkcs7
         */
        cfg: Cipher.cfg.extend({
            mode: CBC,
            padding: Pkcs7
        }),

        reset: function () {
            // Reset cipher
            Cipher.reset.call(this);

            // Shortcuts
            var cfg = this.cfg;
            var iv = cfg.iv;
            var mode = cfg.mode;

            // Reset block mode
            if (this._xformMode == this._ENC_XFORM_MODE) {
                var modeCreator = mode.createEncryptor;
            } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
                var modeCreator = mode.createDecryptor;

                // Keep at least one block in the buffer for unpadding
                this._minBufferSize = 1;
            }
            this._mode = modeCreator.call(mode, this, iv && iv.words);
        },

        _doProcessBlock: function (words, offset) {
            this._mode.processBlock(words, offset);
        },

        _doFinalize: function () {
            // Shortcut
            var padding = this.cfg.padding;

            // Finalize
            if (this._xformMode == this._ENC_XFORM_MODE) {
                // Pad data
                padding.pad(this._data, this.blockSize);

                // Process final blocks
                var finalProcessedBlocks = this._process(!!'flush');
            } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
                // Process final blocks
                var finalProcessedBlocks = this._process(!!'flush');

                // Unpad data
                padding.unpad(finalProcessedBlocks);
            }

            return finalProcessedBlocks;
        },

        blockSize: 128/32
    });

    /**
     * A collection of cipher parameters.
     *
     * @property {WordArray} ciphertext The raw ciphertext.
     * @property {WordArray} key The key to this ciphertext.
     * @property {WordArray} iv The IV used in the ciphering operation.
     * @property {WordArray} salt The salt used with a key derivation function.
     * @property {Cipher} algorithm The cipher algorithm.
     * @property {Mode} mode The block mode used in the ciphering operation.
     * @property {Padding} padding The padding scheme used in the ciphering operation.
     * @property {number} blockSize The block size of the cipher.
     * @property {Format} formatter The default formatting strategy to convert this cipher params object to a string.
     */
    var CipherParams = C_lib.CipherParams = Base.extend({
        /**
         * Initializes a newly created cipher params object.
         *
         * @param {Object} cipherParams An object with any of the possible cipher parameters.
         *
         * @example
         *
         *     var cipherParams = CryptoJS.lib.CipherParams.create({
         *         ciphertext: ciphertextWordArray,
         *         key: keyWordArray,
         *         iv: ivWordArray,
         *         salt: saltWordArray,
         *         algorithm: CryptoJS.algo.AES,
         *         mode: CryptoJS.mode.CBC,
         *         padding: CryptoJS.pad.PKCS7,
         *         blockSize: 4,
         *         formatter: CryptoJS.format.OpenSSL
         *     });
         */
        init: function (cipherParams) {
            this.mixIn(cipherParams);
        },

        /**
         * Converts this cipher params object to a string.
         *
         * @param {Format} formatter (Optional) The formatting strategy to use.
         *
         * @return {string} The stringified cipher params.
         *
         * @throws Error If neither the formatter nor the default formatter is set.
         *
         * @example
         *
         *     var string = cipherParams + '';
         *     var string = cipherParams.toString();
         *     var string = cipherParams.toString(CryptoJS.format.OpenSSL);
         */
        toString: function (formatter) {
            return (formatter || this.formatter).stringify(this);
        }
    });

    /**
     * Format namespace.
     */
    var C_format = C.format = {};

    /**
     * OpenSSL formatting strategy.
     */
    var OpenSSLFormatter = C_format.OpenSSL = {
        /**
         * Converts a cipher params object to an OpenSSL-compatible string.
         *
         * @param {CipherParams} cipherParams The cipher params object.
         *
         * @return {string} The OpenSSL-compatible string.
         *
         * @static
         *
         * @example
         *
         *     var openSSLString = CryptoJS.format.OpenSSL.stringify(cipherParams);
         */
        stringify: function (cipherParams) {
            // Shortcuts
            var ciphertext = cipherParams.ciphertext;
            var salt = cipherParams.salt;

            // Format
            if (salt) {
                var wordArray = WordArray.create([0x53616c74, 0x65645f5f]).concat(salt).concat(ciphertext);
            } else {
                var wordArray = ciphertext;
            }

            return wordArray.toString(Base64);
        },

        /**
         * Converts an OpenSSL-compatible string to a cipher params object.
         *
         * @param {string} openSSLStr The OpenSSL-compatible string.
         *
         * @return {CipherParams} The cipher params object.
         *
         * @static
         *
         * @example
         *
         *     var cipherParams = CryptoJS.format.OpenSSL.parse(openSSLString);
         */
        parse: function (openSSLStr) {
            // Parse base64
            var ciphertext = Base64.parse(openSSLStr);

            // Shortcut
            var ciphertextWords = ciphertext.words;

            // Test for salt
            if (ciphertextWords[0] == 0x53616c74 && ciphertextWords[1] == 0x65645f5f) {
                // Extract salt
                var salt = WordArray.create(ciphertextWords.slice(2, 4));

                // Remove salt from ciphertext
                ciphertextWords.splice(0, 4);
                ciphertext.sigBytes -= 16;
            }

            return CipherParams.create({ ciphertext: ciphertext, salt: salt });
        }
    };

    /**
     * A cipher wrapper that returns ciphertext as a serializable cipher params object.
     */
    var SerializableCipher = C_lib.SerializableCipher = Base.extend({
        /**
         * Configuration options.
         *
         * @property {Formatter} format The formatting strategy to convert cipher param objects to and from a string. Default: OpenSSL
         */
        cfg: Base.extend({
            format: OpenSSLFormatter
        }),

        /**
         * Encrypts a message.
         *
         * @param {Cipher} cipher The cipher algorithm to use.
         * @param {WordArray|string} message The message to encrypt.
         * @param {WordArray} key The key.
         * @param {Object} cfg (Optional) The configuration options to use for this operation.
         *
         * @return {CipherParams} A cipher params object.
         *
         * @static
         *
         * @example
         *
         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key);
         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv, format: CryptoJS.format.OpenSSL });
         */
        encrypt: function (cipher, message, key, cfg) {
            // Apply config defaults
            cfg = this.cfg.extend(cfg);

            // Encrypt
            var encryptor = cipher.createEncryptor(key, cfg);
            var ciphertext = encryptor.finalize(message);

            // Shortcut
            var cipherCfg = encryptor.cfg;

            // Create and return serializable cipher params
            return CipherParams.create({
                ciphertext: ciphertext,
                key: key,
                iv: cipherCfg.iv,
                algorithm: cipher,
                mode: cipherCfg.mode,
                padding: cipherCfg.padding,
                blockSize: cipher.blockSize,
                formatter: cfg.format
            });
        },

        /**
         * Decrypts serialized ciphertext.
         *
         * @param {Cipher} cipher The cipher algorithm to use.
         * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
         * @param {WordArray} key The key.
         * @param {Object} cfg (Optional) The configuration options to use for this operation.
         *
         * @return {WordArray} The plaintext.
         *
         * @static
         *
         * @example
         *
         *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, key, { iv: iv, format: CryptoJS.format.OpenSSL });
         *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, key, { iv: iv, format: CryptoJS.format.OpenSSL });
         */
        decrypt: function (cipher, ciphertext, key, cfg) {
            // Apply config defaults
            cfg = this.cfg.extend(cfg);

            // Convert string to CipherParams
            ciphertext = this._parse(ciphertext, cfg.format);

            // Decrypt
            var plaintext = cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);

            return plaintext;
        },

        /**
         * Converts serialized ciphertext to CipherParams,
         * else assumed CipherParams already and returns ciphertext unchanged.
         *
         * @param {CipherParams|string} ciphertext The ciphertext.
         * @param {Formatter} format The formatting strategy to use to parse serialized ciphertext.
         *
         * @return {CipherParams} The unserialized ciphertext.
         *
         * @static
         *
         * @example
         *
         *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
         */
        _parse: function (ciphertext, format) {
            if (typeof ciphertext == 'string') {
                return format.parse(ciphertext, this);
            } else {
                return ciphertext;
            }
        }
    });

    /**
     * Key derivation function namespace.
     */
    var C_kdf = C.kdf = {};

    /**
     * OpenSSL key derivation function.
     */
    var OpenSSLKdf = C_kdf.OpenSSL = {
        /**
         * Derives a key and IV from a password.
         *
         * @param {string} password The password to derive from.
         * @param {number} keySize The size in words of the key to generate.
         * @param {number} ivSize The size in words of the IV to generate.
         * @param {WordArray|string} salt (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
         *
         * @return {CipherParams} A cipher params object with the key, IV, and salt.
         *
         * @static
         *
         * @example
         *
         *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32);
         *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
         */
        execute: function (password, keySize, ivSize, salt) {
            // Generate random salt
            if (!salt) {
                salt = WordArray.random(64/8);
            }

            // Derive key and IV
            var key = EvpKDF.create({ keySize: keySize + ivSize }).compute(password, salt);

            // Separate key and IV
            var iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
            key.sigBytes = keySize * 4;

            // Return params
            return CipherParams.create({ key: key, iv: iv, salt: salt });
        }
    };

    /**
     * A serializable cipher wrapper that derives the key from a password,
     * and returns ciphertext as a serializable cipher params object.
     */
    var PasswordBasedCipher = C_lib.PasswordBasedCipher = SerializableCipher.extend({
        /**
         * Configuration options.
         *
         * @property {KDF} kdf The key derivation function to use to generate a key and IV from a password. Default: OpenSSL
         */
        cfg: SerializableCipher.cfg.extend({
            kdf: OpenSSLKdf
        }),

        /**
         * Encrypts a message using a password.
         *
         * @param {Cipher} cipher The cipher algorithm to use.
         * @param {WordArray|string} message The message to encrypt.
         * @param {string} password The password.
         * @param {Object} cfg (Optional) The configuration options to use for this operation.
         *
         * @return {CipherParams} A cipher params object.
         *
         * @static
         *
         * @example
         *
         *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password');
         *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password', { format: CryptoJS.format.OpenSSL });
         */
        encrypt: function (cipher, message, password, cfg) {
            // Apply config defaults
            cfg = this.cfg.extend(cfg);

            // Derive key and other params
            var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize);

            // Add IV to config
            cfg.iv = derivedParams.iv;

            // Encrypt
            var ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, cfg);

            // Mix in derived params
            ciphertext.mixIn(derivedParams);

            return ciphertext;
        },

        /**
         * Decrypts serialized ciphertext using a password.
         *
         * @param {Cipher} cipher The cipher algorithm to use.
         * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
         * @param {string} password The password.
         * @param {Object} cfg (Optional) The configuration options to use for this operation.
         *
         * @return {WordArray} The plaintext.
         *
         * @static
         *
         * @example
         *
         *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, 'password', { format: CryptoJS.format.OpenSSL });
         *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, 'password', { format: CryptoJS.format.OpenSSL });
         */
        decrypt: function (cipher, ciphertext, password, cfg) {
            // Apply config defaults
            cfg = this.cfg.extend(cfg);

            // Convert string to CipherParams
            ciphertext = this._parse(ciphertext, cfg.format);

            // Derive key and other params
            var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt);

            // Add IV to config
            cfg.iv = derivedParams.iv;

            // Decrypt
            var plaintext = SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, cfg);

            return plaintext;
        }
    });
}());

},{"./core":28}],28:[function(require,module,exports){
/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
/**
 * CryptoJS core components.
 */
var CryptoJS = CryptoJS || (function (Math, undefined) {
    /**
     * CryptoJS namespace.
     */
    var C = {};

    /**
     * Library namespace.
     */
    var C_lib = C.lib = {};

    /**
     * Base object for prototypal inheritance.
     */
    var Base = C_lib.Base = (function () {
        function F() {}

        return {
            /**
             * Creates a new object that inherits from this object.
             *
             * @param {Object} overrides Properties to copy into the new object.
             *
             * @return {Object} The new object.
             *
             * @static
             *
             * @example
             *
             *     var MyType = CryptoJS.lib.Base.extend({
             *         field: 'value',
             *
             *         method: function () {
             *         }
             *     });
             */
            extend: function (overrides) {
                // Spawn
                F.prototype = this;
                var subtype = new F();

                // Augment
                if (overrides) {
                    subtype.mixIn(overrides);
                }

                // Create default initializer
                if (!subtype.hasOwnProperty('init')) {
                    subtype.init = function () {
                        subtype.$super.init.apply(this, arguments);
                    };
                }

                // Initializer's prototype is the subtype object
                subtype.init.prototype = subtype;

                // Reference supertype
                subtype.$super = this;

                return subtype;
            },

            /**
             * Extends this object and runs the init method.
             * Arguments to create() will be passed to init().
             *
             * @return {Object} The new object.
             *
             * @static
             *
             * @example
             *
             *     var instance = MyType.create();
             */
            create: function () {
                var instance = this.extend();
                instance.init.apply(instance, arguments);

                return instance;
            },

            /**
             * Initializes a newly created object.
             * Override this method to add some logic when your objects are created.
             *
             * @example
             *
             *     var MyType = CryptoJS.lib.Base.extend({
             *         init: function () {
             *             // ...
             *         }
             *     });
             */
            init: function () {
            },

            /**
             * Copies properties into this object.
             *
             * @param {Object} properties The properties to mix in.
             *
             * @example
             *
             *     MyType.mixIn({
             *         field: 'value'
             *     });
             */
            mixIn: function (properties) {
                for (var propertyName in properties) {
                    if (properties.hasOwnProperty(propertyName)) {
                        this[propertyName] = properties[propertyName];
                    }
                }

                // IE won't copy toString using the loop above
                if (properties.hasOwnProperty('toString')) {
                    this.toString = properties.toString;
                }
            },

            /**
             * Creates a copy of this object.
             *
             * @return {Object} The clone.
             *
             * @example
             *
             *     var clone = instance.clone();
             */
            clone: function () {
                return this.init.prototype.extend(this);
            }
        };
    }());

    /**
     * An array of 32-bit words.
     *
     * @property {Array} words The array of 32-bit words.
     * @property {number} sigBytes The number of significant bytes in this word array.
     */
    var WordArray = C_lib.WordArray = Base.extend({
        /**
         * Initializes a newly created word array.
         *
         * @param {Array} words (Optional) An array of 32-bit words.
         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
         *
         * @example
         *
         *     var wordArray = CryptoJS.lib.WordArray.create();
         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
         */
        init: function (words, sigBytes) {
            words = this.words = words || [];

            if (sigBytes != undefined) {
                this.sigBytes = sigBytes;
            } else {
                this.sigBytes = words.length * 4;
            }
        },

        /**
         * Converts this word array to a string.
         *
         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
         *
         * @return {string} The stringified word array.
         *
         * @example
         *
         *     var string = wordArray + '';
         *     var string = wordArray.toString();
         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
         */
        toString: function (encoder) {
            return (encoder || Hex).stringify(this);
        },

        /**
         * Concatenates a word array to this word array.
         *
         * @param {WordArray} wordArray The word array to append.
         *
         * @return {WordArray} This word array.
         *
         * @example
         *
         *     wordArray1.concat(wordArray2);
         */
        concat: function (wordArray) {
            // Shortcuts
            var thisWords = this.words;
            var thatWords = wordArray.words;
            var thisSigBytes = this.sigBytes;
            var thatSigBytes = wordArray.sigBytes;

            // Clamp excess bits
            this.clamp();

            // Concat
            if (thisSigBytes % 4) {
                // Copy one byte at a time
                for (var i = 0; i < thatSigBytes; i++) {
                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
                }
            } else if (thatWords.length > 0xffff) {
                // Copy one word at a time
                for (var i = 0; i < thatSigBytes; i += 4) {
                    thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
                }
            } else {
                // Copy all words at once
                thisWords.push.apply(thisWords, thatWords);
            }
            this.sigBytes += thatSigBytes;

            // Chainable
            return this;
        },

        /**
         * Removes insignificant bits.
         *
         * @example
         *
         *     wordArray.clamp();
         */
        clamp: function () {
            // Shortcuts
            var words = this.words;
            var sigBytes = this.sigBytes;

            // Clamp
            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
            words.length = Math.ceil(sigBytes / 4);
        },

        /**
         * Creates a copy of this word array.
         *
         * @return {WordArray} The clone.
         *
         * @example
         *
         *     var clone = wordArray.clone();
         */
        clone: function () {
            var clone = Base.clone.call(this);
            clone.words = this.words.slice(0);

            return clone;
        },

        /**
         * Creates a word array filled with random bytes.
         *
         * @param {number} nBytes The number of random bytes to generate.
         *
         * @return {WordArray} The random word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.lib.WordArray.random(16);
         */
        random: function (nBytes) {
            var words = [];
            for (var i = 0; i < nBytes; i += 4) {
                words.push((Math.random() * 0x100000000) | 0);
            }

            return new WordArray.init(words, nBytes);
        }
    });

    /**
     * Encoder namespace.
     */
    var C_enc = C.enc = {};

    /**
     * Hex encoding strategy.
     */
    var Hex = C_enc.Hex = {
        /**
         * Converts a word array to a hex string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The hex string.
         *
         * @static
         *
         * @example
         *
         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
         */
        stringify: function (wordArray) {
            // Shortcuts
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;

            // Convert
            var hexChars = [];
            for (var i = 0; i < sigBytes; i++) {
                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                hexChars.push((bite >>> 4).toString(16));
                hexChars.push((bite & 0x0f).toString(16));
            }

            return hexChars.join('');
        },

        /**
         * Converts a hex string to a word array.
         *
         * @param {string} hexStr The hex string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
         */
        parse: function (hexStr) {
            // Shortcut
            var hexStrLength = hexStr.length;

            // Convert
            var words = [];
            for (var i = 0; i < hexStrLength; i += 2) {
                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
            }

            return new WordArray.init(words, hexStrLength / 2);
        }
    };

    /**
     * Latin1 encoding strategy.
     */
    var Latin1 = C_enc.Latin1 = {
        /**
         * Converts a word array to a Latin1 string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The Latin1 string.
         *
         * @static
         *
         * @example
         *
         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
         */
        stringify: function (wordArray) {
            // Shortcuts
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;

            // Convert
            var latin1Chars = [];
            for (var i = 0; i < sigBytes; i++) {
                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                latin1Chars.push(String.fromCharCode(bite));
            }

            return latin1Chars.join('');
        },

        /**
         * Converts a Latin1 string to a word array.
         *
         * @param {string} latin1Str The Latin1 string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
         */
        parse: function (latin1Str) {
            // Shortcut
            var latin1StrLength = latin1Str.length;

            // Convert
            var words = [];
            for (var i = 0; i < latin1StrLength; i++) {
                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
            }

            return new WordArray.init(words, latin1StrLength);
        }
    };

    /**
     * UTF-8 encoding strategy.
     */
    var Utf8 = C_enc.Utf8 = {
        /**
         * Converts a word array to a UTF-8 string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The UTF-8 string.
         *
         * @static
         *
         * @example
         *
         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
         */
        stringify: function (wordArray) {
            try {
                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
            } catch (e) {
                throw new Error('Malformed UTF-8 data');
            }
        },

        /**
         * Converts a UTF-8 string to a word array.
         *
         * @param {string} utf8Str The UTF-8 string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
         */
        parse: function (utf8Str) {
            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
        }
    };

    /**
     * Abstract buffered block algorithm template.
     *
     * The property blockSize must be implemented in a concrete subtype.
     *
     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
     */
    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
        /**
         * Resets this block algorithm's data buffer to its initial state.
         *
         * @example
         *
         *     bufferedBlockAlgorithm.reset();
         */
        reset: function () {
            // Initial values
            this._data = new WordArray.init();
            this._nDataBytes = 0;
        },

        /**
         * Adds new data to this block algorithm's buffer.
         *
         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
         *
         * @example
         *
         *     bufferedBlockAlgorithm._append('data');
         *     bufferedBlockAlgorithm._append(wordArray);
         */
        _append: function (data) {
            // Convert string to WordArray, else assume WordArray already
            if (typeof data == 'string') {
                data = Utf8.parse(data);
            }

            // Append
            this._data.concat(data);
            this._nDataBytes += data.sigBytes;
        },

        /**
         * Processes available data blocks.
         *
         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
         *
         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
         *
         * @return {WordArray} The processed data.
         *
         * @example
         *
         *     var processedData = bufferedBlockAlgorithm._process();
         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
         */
        _process: function (doFlush) {
            // Shortcuts
            var data = this._data;
            var dataWords = data.words;
            var dataSigBytes = data.sigBytes;
            var blockSize = this.blockSize;
            var blockSizeBytes = blockSize * 4;

            // Count blocks ready
            var nBlocksReady = dataSigBytes / blockSizeBytes;
            if (doFlush) {
                // Round up to include partial blocks
                nBlocksReady = Math.ceil(nBlocksReady);
            } else {
                // Round down to include only full blocks,
                // less the number of blocks that must remain in the buffer
                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
            }

            // Count words ready
            var nWordsReady = nBlocksReady * blockSize;

            // Count bytes ready
            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

            // Process blocks
            if (nWordsReady) {
                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
                    // Perform concrete-algorithm logic
                    this._doProcessBlock(dataWords, offset);
                }

                // Remove processed words
                var processedWords = dataWords.splice(0, nWordsReady);
                data.sigBytes -= nBytesReady;
            }

            // Return processed words
            return new WordArray.init(processedWords, nBytesReady);
        },

        /**
         * Creates a copy of this object.
         *
         * @return {Object} The clone.
         *
         * @example
         *
         *     var clone = bufferedBlockAlgorithm.clone();
         */
        clone: function () {
            var clone = Base.clone.call(this);
            clone._data = this._data.clone();

            return clone;
        },

        _minBufferSize: 0
    });

    /**
     * Abstract hasher template.
     *
     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
     */
    var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
        /**
         * Configuration options.
         */
        cfg: Base.extend(),

        /**
         * Initializes a newly created hasher.
         *
         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
         *
         * @example
         *
         *     var hasher = CryptoJS.algo.SHA256.create();
         */
        init: function (cfg) {
            // Apply config defaults
            this.cfg = this.cfg.extend(cfg);

            // Set initial values
            this.reset();
        },

        /**
         * Resets this hasher to its initial state.
         *
         * @example
         *
         *     hasher.reset();
         */
        reset: function () {
            // Reset data buffer
            BufferedBlockAlgorithm.reset.call(this);

            // Perform concrete-hasher logic
            this._doReset();
        },

        /**
         * Updates this hasher with a message.
         *
         * @param {WordArray|string} messageUpdate The message to append.
         *
         * @return {Hasher} This hasher.
         *
         * @example
         *
         *     hasher.update('message');
         *     hasher.update(wordArray);
         */
        update: function (messageUpdate) {
            // Append
            this._append(messageUpdate);

            // Update the hash
            this._process();

            // Chainable
            return this;
        },

        /**
         * Finalizes the hash computation.
         * Note that the finalize operation is effectively a destructive, read-once operation.
         *
         * @param {WordArray|string} messageUpdate (Optional) A final message update.
         *
         * @return {WordArray} The hash.
         *
         * @example
         *
         *     var hash = hasher.finalize();
         *     var hash = hasher.finalize('message');
         *     var hash = hasher.finalize(wordArray);
         */
        finalize: function (messageUpdate) {
            // Final message update
            if (messageUpdate) {
                this._append(messageUpdate);
            }

            // Perform concrete-hasher logic
            var hash = this._doFinalize();

            return hash;
        },

        blockSize: 512/32,

        /**
         * Creates a shortcut function to a hasher's object interface.
         *
         * @param {Hasher} hasher The hasher to create a helper for.
         *
         * @return {Function} The shortcut function.
         *
         * @static
         *
         * @example
         *
         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
         */
        _createHelper: function (hasher) {
            return function (message, cfg) {
                return new hasher.init(cfg).finalize(message);
            };
        },

        /**
         * Creates a shortcut function to the HMAC's object interface.
         *
         * @param {Hasher} hasher The hasher to use in this HMAC helper.
         *
         * @return {Function} The shortcut function.
         *
         * @static
         *
         * @example
         *
         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
         */
        _createHmacHelper: function (hasher) {
            return function (message, key) {
                return new C_algo.HMAC.init(hasher, key).finalize(message);
            };
        }
    });

    /**
     * Algorithm namespace.
     */
    var C_algo = C.algo = {};

    return C;
}(Math));

exports.CryptoJS = CryptoJS;

},{}],29:[function(require,module,exports){
var CryptoJS = require('./core').CryptoJS;

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var WordArray = C_lib.WordArray;
    var C_enc = C.enc;

    /**
     * Base64 encoding strategy.
     */
    var Base64 = C_enc.Base64 = {
        /**
         * Converts a word array to a Base64 string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The Base64 string.
         *
         * @static
         *
         * @example
         *
         *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
         */
        stringify: function (wordArray) {
            // Shortcuts
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;
            var map = this._map;

            // Clamp excess bits
            wordArray.clamp();

            // Convert
            var base64Chars = [];
            for (var i = 0; i < sigBytes; i += 3) {
                var byte1 = (words[i >>> 2]       >>> (24 - (i % 4) * 8))       & 0xff;
                var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
                var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

                var triplet = (byte1 << 16) | (byte2 << 8) | byte3;

                for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
                    base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
                }
            }

            // Add padding
            var paddingChar = map.charAt(64);
            if (paddingChar) {
                while (base64Chars.length % 4) {
                    base64Chars.push(paddingChar);
                }
            }

            return base64Chars.join('');
        },

        /**
         * Converts a Base64 string to a word array.
         *
         * @param {string} base64Str The Base64 string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
         */
        parse: function (base64Str) {
            // Shortcuts
            var base64StrLength = base64Str.length;
            var map = this._map;

            // Ignore padding
            var paddingChar = map.charAt(64);
            if (paddingChar) {
                var paddingIndex = base64Str.indexOf(paddingChar);
                if (paddingIndex != -1) {
                    base64StrLength = paddingIndex;
                }
            }

            // Convert
            var words = [];
            var nBytes = 0;
            for (var i = 0; i < base64StrLength; i++) {
                if (i % 4) {
                    var bits1 = map.indexOf(base64Str.charAt(i - 1)) << ((i % 4) * 2);
                    var bits2 = map.indexOf(base64Str.charAt(i)) >>> (6 - (i % 4) * 2);
                    words[nBytes >>> 2] |= (bits1 | bits2) << (24 - (nBytes % 4) * 8);
                    nBytes++;
                }
            }

            return WordArray.create(words, nBytes);
        },

        _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    };
}());

},{"./core":28}],30:[function(require,module,exports){
var CryptoJS = require('./core').CryptoJS;

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var Base = C_lib.Base;
    var WordArray = C_lib.WordArray;
    var C_algo = C.algo;
    var MD5 = C_algo.MD5;

    /**
     * This key derivation function is meant to conform with EVP_BytesToKey.
     * www.openssl.org/docs/crypto/EVP_BytesToKey.html
     */
    var EvpKDF = C_algo.EvpKDF = Base.extend({
        /**
         * Configuration options.
         *
         * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
         * @property {Hasher} hasher The hash algorithm to use. Default: MD5
         * @property {number} iterations The number of iterations to perform. Default: 1
         */
        cfg: Base.extend({
            keySize: 128/32,
            hasher: MD5,
            iterations: 1
        }),

        /**
         * Initializes a newly created key derivation function.
         *
         * @param {Object} cfg (Optional) The configuration options to use for the derivation.
         *
         * @example
         *
         *     var kdf = CryptoJS.algo.EvpKDF.create();
         *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8 });
         *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8, iterations: 1000 });
         */
        init: function (cfg) {
            this.cfg = this.cfg.extend(cfg);
        },

        /**
         * Derives a key from a password.
         *
         * @param {WordArray|string} password The password.
         * @param {WordArray|string} salt A salt.
         *
         * @return {WordArray} The derived key.
         *
         * @example
         *
         *     var key = kdf.compute(password, salt);
         */
        compute: function (password, salt) {
            // Shortcut
            var cfg = this.cfg;

            // Init hasher
            var hasher = cfg.hasher.create();

            // Initial values
            var derivedKey = WordArray.create();

            // Shortcuts
            var derivedKeyWords = derivedKey.words;
            var keySize = cfg.keySize;
            var iterations = cfg.iterations;

            // Generate key
            while (derivedKeyWords.length < keySize) {
                if (block) {
                    hasher.update(block);
                }
                var block = hasher.update(password).finalize(salt);
                hasher.reset();

                // Iterations
                for (var i = 1; i < iterations; i++) {
                    block = hasher.finalize(block);
                    hasher.reset();
                }

                derivedKey.concat(block);
            }
            derivedKey.sigBytes = keySize * 4;

            return derivedKey;
        }
    });

    /**
     * Derives a key from a password.
     *
     * @param {WordArray|string} password The password.
     * @param {WordArray|string} salt A salt.
     * @param {Object} cfg (Optional) The configuration options to use for this computation.
     *
     * @return {WordArray} The derived key.
     *
     * @static
     *
     * @example
     *
     *     var key = CryptoJS.EvpKDF(password, salt);
     *     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8 });
     *     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8, iterations: 1000 });
     */
    C.EvpKDF = function (password, salt, cfg) {
        return EvpKDF.create(cfg).compute(password, salt);
    };
}());

},{"./core":28}],31:[function(require,module,exports){
var CryptoJS = require('./core').CryptoJS;

// create custom json serialization format
var JsonFormatter = {
	stringify: function (cipherParams) {
		// create json object with ciphertext
		var jsonObj = {
			ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
		};
		
		// optionally add iv and salt
		if (cipherParams.iv) {
			jsonObj.iv = cipherParams.iv.toString();
		}
		
		if (cipherParams.salt) {
			jsonObj.s = cipherParams.salt.toString();
		}

		// stringify json object
		return JSON.stringify(jsonObj)
	},

	parse: function (jsonStr) {
		// parse json string
		var jsonObj = JSON.parse(jsonStr);
		
		// extract ciphertext from json object, and create cipher params object
		var cipherParams = CryptoJS.lib.CipherParams.create({
			ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
		});
		
		// optionally extract iv and salt
		if (jsonObj.iv) {
			cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
		}
            
		if (jsonObj.s) {
			cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
		}
		
		return cipherParams;
	}
};

exports.JsonFormatter = JsonFormatter;
},{"./core":28}],32:[function(require,module,exports){
var CryptoJS = require('./core').CryptoJS;

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function (Math) {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var WordArray = C_lib.WordArray;
    var Hasher = C_lib.Hasher;
    var C_algo = C.algo;

    // Constants table
    var T = [];

    // Compute constants
    (function () {
        for (var i = 0; i < 64; i++) {
            T[i] = (Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;
        }
    }());

    /**
     * MD5 hash algorithm.
     */
    var MD5 = C_algo.MD5 = Hasher.extend({
        _doReset: function () {
            this._hash = new WordArray.init([
                0x67452301, 0xefcdab89,
                0x98badcfe, 0x10325476
            ]);
        },

        _doProcessBlock: function (M, offset) {
            // Swap endian
            for (var i = 0; i < 16; i++) {
                // Shortcuts
                var offset_i = offset + i;
                var M_offset_i = M[offset_i];

                M[offset_i] = (
                    (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
                    (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
                );
            }

            // Shortcuts
            var H = this._hash.words;

            var M_offset_0  = M[offset + 0];
            var M_offset_1  = M[offset + 1];
            var M_offset_2  = M[offset + 2];
            var M_offset_3  = M[offset + 3];
            var M_offset_4  = M[offset + 4];
            var M_offset_5  = M[offset + 5];
            var M_offset_6  = M[offset + 6];
            var M_offset_7  = M[offset + 7];
            var M_offset_8  = M[offset + 8];
            var M_offset_9  = M[offset + 9];
            var M_offset_10 = M[offset + 10];
            var M_offset_11 = M[offset + 11];
            var M_offset_12 = M[offset + 12];
            var M_offset_13 = M[offset + 13];
            var M_offset_14 = M[offset + 14];
            var M_offset_15 = M[offset + 15];

            // Working varialbes
            var a = H[0];
            var b = H[1];
            var c = H[2];
            var d = H[3];

            // Computation
            a = FF(a, b, c, d, M_offset_0,  7,  T[0]);
            d = FF(d, a, b, c, M_offset_1,  12, T[1]);
            c = FF(c, d, a, b, M_offset_2,  17, T[2]);
            b = FF(b, c, d, a, M_offset_3,  22, T[3]);
            a = FF(a, b, c, d, M_offset_4,  7,  T[4]);
            d = FF(d, a, b, c, M_offset_5,  12, T[5]);
            c = FF(c, d, a, b, M_offset_6,  17, T[6]);
            b = FF(b, c, d, a, M_offset_7,  22, T[7]);
            a = FF(a, b, c, d, M_offset_8,  7,  T[8]);
            d = FF(d, a, b, c, M_offset_9,  12, T[9]);
            c = FF(c, d, a, b, M_offset_10, 17, T[10]);
            b = FF(b, c, d, a, M_offset_11, 22, T[11]);
            a = FF(a, b, c, d, M_offset_12, 7,  T[12]);
            d = FF(d, a, b, c, M_offset_13, 12, T[13]);
            c = FF(c, d, a, b, M_offset_14, 17, T[14]);
            b = FF(b, c, d, a, M_offset_15, 22, T[15]);

            a = GG(a, b, c, d, M_offset_1,  5,  T[16]);
            d = GG(d, a, b, c, M_offset_6,  9,  T[17]);
            c = GG(c, d, a, b, M_offset_11, 14, T[18]);
            b = GG(b, c, d, a, M_offset_0,  20, T[19]);
            a = GG(a, b, c, d, M_offset_5,  5,  T[20]);
            d = GG(d, a, b, c, M_offset_10, 9,  T[21]);
            c = GG(c, d, a, b, M_offset_15, 14, T[22]);
            b = GG(b, c, d, a, M_offset_4,  20, T[23]);
            a = GG(a, b, c, d, M_offset_9,  5,  T[24]);
            d = GG(d, a, b, c, M_offset_14, 9,  T[25]);
            c = GG(c, d, a, b, M_offset_3,  14, T[26]);
            b = GG(b, c, d, a, M_offset_8,  20, T[27]);
            a = GG(a, b, c, d, M_offset_13, 5,  T[28]);
            d = GG(d, a, b, c, M_offset_2,  9,  T[29]);
            c = GG(c, d, a, b, M_offset_7,  14, T[30]);
            b = GG(b, c, d, a, M_offset_12, 20, T[31]);

            a = HH(a, b, c, d, M_offset_5,  4,  T[32]);
            d = HH(d, a, b, c, M_offset_8,  11, T[33]);
            c = HH(c, d, a, b, M_offset_11, 16, T[34]);
            b = HH(b, c, d, a, M_offset_14, 23, T[35]);
            a = HH(a, b, c, d, M_offset_1,  4,  T[36]);
            d = HH(d, a, b, c, M_offset_4,  11, T[37]);
            c = HH(c, d, a, b, M_offset_7,  16, T[38]);
            b = HH(b, c, d, a, M_offset_10, 23, T[39]);
            a = HH(a, b, c, d, M_offset_13, 4,  T[40]);
            d = HH(d, a, b, c, M_offset_0,  11, T[41]);
            c = HH(c, d, a, b, M_offset_3,  16, T[42]);
            b = HH(b, c, d, a, M_offset_6,  23, T[43]);
            a = HH(a, b, c, d, M_offset_9,  4,  T[44]);
            d = HH(d, a, b, c, M_offset_12, 11, T[45]);
            c = HH(c, d, a, b, M_offset_15, 16, T[46]);
            b = HH(b, c, d, a, M_offset_2,  23, T[47]);

            a = II(a, b, c, d, M_offset_0,  6,  T[48]);
            d = II(d, a, b, c, M_offset_7,  10, T[49]);
            c = II(c, d, a, b, M_offset_14, 15, T[50]);
            b = II(b, c, d, a, M_offset_5,  21, T[51]);
            a = II(a, b, c, d, M_offset_12, 6,  T[52]);
            d = II(d, a, b, c, M_offset_3,  10, T[53]);
            c = II(c, d, a, b, M_offset_10, 15, T[54]);
            b = II(b, c, d, a, M_offset_1,  21, T[55]);
            a = II(a, b, c, d, M_offset_8,  6,  T[56]);
            d = II(d, a, b, c, M_offset_15, 10, T[57]);
            c = II(c, d, a, b, M_offset_6,  15, T[58]);
            b = II(b, c, d, a, M_offset_13, 21, T[59]);
            a = II(a, b, c, d, M_offset_4,  6,  T[60]);
            d = II(d, a, b, c, M_offset_11, 10, T[61]);
            c = II(c, d, a, b, M_offset_2,  15, T[62]);
            b = II(b, c, d, a, M_offset_9,  21, T[63]);

            // Intermediate hash value
            H[0] = (H[0] + a) | 0;
            H[1] = (H[1] + b) | 0;
            H[2] = (H[2] + c) | 0;
            H[3] = (H[3] + d) | 0;
        },

        _doFinalize: function () {
            // Shortcuts
            var data = this._data;
            var dataWords = data.words;

            var nBitsTotal = this._nDataBytes * 8;
            var nBitsLeft = data.sigBytes * 8;

            // Add padding
            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);

            var nBitsTotalH = Math.floor(nBitsTotal / 0x100000000);
            var nBitsTotalL = nBitsTotal;
            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = (
                (((nBitsTotalH << 8)  | (nBitsTotalH >>> 24)) & 0x00ff00ff) |
                (((nBitsTotalH << 24) | (nBitsTotalH >>> 8))  & 0xff00ff00)
            );
            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
                (((nBitsTotalL << 8)  | (nBitsTotalL >>> 24)) & 0x00ff00ff) |
                (((nBitsTotalL << 24) | (nBitsTotalL >>> 8))  & 0xff00ff00)
            );

            data.sigBytes = (dataWords.length + 1) * 4;

            // Hash final blocks
            this._process();

            // Shortcuts
            var hash = this._hash;
            var H = hash.words;

            // Swap endian
            for (var i = 0; i < 4; i++) {
                // Shortcut
                var H_i = H[i];

                H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
                       (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
            }

            // Return final computed hash
            return hash;
        },

        clone: function () {
            var clone = Hasher.clone.call(this);
            clone._hash = this._hash.clone();

            return clone;
        }
    });

    function FF(a, b, c, d, x, s, t) {
        var n = a + ((b & c) | (~b & d)) + x + t;
        return ((n << s) | (n >>> (32 - s))) + b;
    }

    function GG(a, b, c, d, x, s, t) {
        var n = a + ((b & d) | (c & ~d)) + x + t;
        return ((n << s) | (n >>> (32 - s))) + b;
    }

    function HH(a, b, c, d, x, s, t) {
        var n = a + (b ^ c ^ d) + x + t;
        return ((n << s) | (n >>> (32 - s))) + b;
    }

    function II(a, b, c, d, x, s, t) {
        var n = a + (c ^ (b | ~d)) + x + t;
        return ((n << s) | (n >>> (32 - s))) + b;
    }

    /**
     * Shortcut function to the hasher's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     *
     * @return {WordArray} The hash.
     *
     * @static
     *
     * @example
     *
     *     var hash = CryptoJS.MD5('message');
     *     var hash = CryptoJS.MD5(wordArray);
     */
    C.MD5 = Hasher._createHelper(MD5);

    /**
     * Shortcut function to the HMAC's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     * @param {WordArray|string} key The secret key.
     *
     * @return {WordArray} The HMAC.
     *
     * @static
     *
     * @example
     *
     *     var hmac = CryptoJS.HmacMD5(message, key);
     */
    C.HmacMD5 = Hasher._createHmacHelper(MD5);
}(Math));

},{"./core":28}],33:[function(require,module,exports){
/*!
  * Reqwest! A general purpose XHR connection manager
  * license MIT (c) Dustin Diaz 2014
  * https://github.com/ded/reqwest
  */

!function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else if (typeof define == 'function' && define.amd) define(definition)
  else context[name] = definition()
}('reqwest', this, function () {

  var win = window
    , doc = document
    , httpsRe = /^http/
    , protocolRe = /(^\w+):\/\//
    , twoHundo = /^(20\d|1223)$/ //http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
    , byTag = 'getElementsByTagName'
    , readyState = 'readyState'
    , contentType = 'Content-Type'
    , requestedWith = 'X-Requested-With'
    , head = doc[byTag]('head')[0]
    , uniqid = 0
    , callbackPrefix = 'reqwest_' + (+new Date())
    , lastValue // data stored by the most recent JSONP callback
    , xmlHttpRequest = 'XMLHttpRequest'
    , xDomainRequest = 'XDomainRequest'
    , noop = function () {}

    , isArray = typeof Array.isArray == 'function'
        ? Array.isArray
        : function (a) {
            return a instanceof Array
          }

    , defaultHeaders = {
          'contentType': 'application/x-www-form-urlencoded'
        , 'requestedWith': xmlHttpRequest
        , 'accept': {
              '*':  'text/javascript, text/html, application/xml, text/xml, */*'
            , 'xml':  'application/xml, text/xml'
            , 'html': 'text/html'
            , 'text': 'text/plain'
            , 'json': 'application/json, text/javascript'
            , 'js':   'application/javascript, text/javascript'
          }
      }

    , xhr = function(o) {
        // is it x-domain
        if (o['crossOrigin'] === true) {
          var xhr = win[xmlHttpRequest] ? new XMLHttpRequest() : null
          if (xhr && 'withCredentials' in xhr) {
            return xhr
          } else if (win[xDomainRequest]) {
            return new XDomainRequest()
          } else {
            throw new Error('Browser does not support cross-origin requests')
          }
        } else if (win[xmlHttpRequest]) {
          return new XMLHttpRequest()
        } else {
          return new ActiveXObject('Microsoft.XMLHTTP')
        }
      }
    , globalSetupOptions = {
        dataFilter: function (data) {
          return data
        }
      }

  function succeed(r) {
    var protocol = protocolRe.exec(r.url);
    protocol = (protocol && protocol[1]) || window.location.protocol;
    return httpsRe.test(protocol) ? twoHundo.test(r.request.status) : !!r.request.response;
  }

  function handleReadyState(r, success, error) {
    return function () {
      // use _aborted to mitigate against IE err c00c023f
      // (can't read props on aborted request objects)
      if (r._aborted) return error(r.request)
      if (r._timedOut) return error(r.request, 'Request is aborted: timeout')
      if (r.request && r.request[readyState] == 4) {
        r.request.onreadystatechange = noop
        if (succeed(r)) success(r.request)
        else
          error(r.request)
      }
    }
  }

  function setHeaders(http, o) {
    var headers = o['headers'] || {}
      , h

    headers['Accept'] = headers['Accept']
      || defaultHeaders['accept'][o['type']]
      || defaultHeaders['accept']['*']

    var isAFormData = typeof FormData === 'function' && (o['data'] instanceof FormData);
    // breaks cross-origin requests with legacy browsers
    if (!o['crossOrigin'] && !headers[requestedWith]) headers[requestedWith] = defaultHeaders['requestedWith']
    if (!headers[contentType] && !isAFormData) headers[contentType] = o['contentType'] || defaultHeaders['contentType']
    for (h in headers)
      headers.hasOwnProperty(h) && 'setRequestHeader' in http && http.setRequestHeader(h, headers[h])
  }

  function setCredentials(http, o) {
    if (typeof o['withCredentials'] !== 'undefined' && typeof http.withCredentials !== 'undefined') {
      http.withCredentials = !!o['withCredentials']
    }
  }

  function generalCallback(data) {
    lastValue = data
  }

  function urlappend (url, s) {
    return url + (/\?/.test(url) ? '&' : '?') + s
  }

  function handleJsonp(o, fn, err, url) {
    var reqId = uniqid++
      , cbkey = o['jsonpCallback'] || 'callback' // the 'callback' key
      , cbval = o['jsonpCallbackName'] || reqwest.getcallbackPrefix(reqId)
      , cbreg = new RegExp('((^|\\?|&)' + cbkey + ')=([^&]+)')
      , match = url.match(cbreg)
      , script = doc.createElement('script')
      , loaded = 0
      , isIE10 = navigator.userAgent.indexOf('MSIE 10.0') !== -1

    if (match) {
      if (match[3] === '?') {
        url = url.replace(cbreg, '$1=' + cbval) // wildcard callback func name
      } else {
        cbval = match[3] // provided callback func name
      }
    } else {
      url = urlappend(url, cbkey + '=' + cbval) // no callback details, add 'em
    }

    win[cbval] = generalCallback

    script.type = 'text/javascript'
    script.src = url
    script.async = true
    if (typeof script.onreadystatechange !== 'undefined' && !isIE10) {
      // need this for IE due to out-of-order onreadystatechange(), binding script
      // execution to an event listener gives us control over when the script
      // is executed. See http://jaubourg.net/2010/07/loading-script-as-onclick-handler-of.html
      script.htmlFor = script.id = '_reqwest_' + reqId
    }

    script.onload = script.onreadystatechange = function () {
      if ((script[readyState] && script[readyState] !== 'complete' && script[readyState] !== 'loaded') || loaded) {
        return false
      }
      script.onload = script.onreadystatechange = null
      script.onclick && script.onclick()
      // Call the user callback with the last value stored and clean up values and scripts.
      fn(lastValue)
      lastValue = undefined
      head.removeChild(script)
      loaded = 1
    }

    // Add the script to the DOM head
    head.appendChild(script)

    // Enable JSONP timeout
    return {
      abort: function () {
        script.onload = script.onreadystatechange = null
        err({}, 'Request is aborted: timeout', {})
        lastValue = undefined
        head.removeChild(script)
        loaded = 1
      }
    }
  }

  function getRequest(fn, err) {
    var o = this.o
      , method = (o['method'] || 'GET').toUpperCase()
      , url = typeof o === 'string' ? o : o['url']
      // convert non-string objects to query-string form unless o['processData'] is false
      , data = (o['processData'] !== false && o['data'] && typeof o['data'] !== 'string')
        ? reqwest.toQueryString(o['data'])
        : (o['data'] || null)
      , http
      , sendWait = false

    // if we're working on a GET request and we have data then we should append
    // query string to end of URL and not post data
    if ((o['type'] == 'jsonp' || method == 'GET') && data) {
      url = urlappend(url, data)
      data = null
    }

    if (o['type'] == 'jsonp') return handleJsonp(o, fn, err, url)

    // get the xhr from the factory if passed
    // if the factory returns null, fall-back to ours
    http = (o.xhr && o.xhr(o)) || xhr(o)

    http.open(method, url, o['async'] === false ? false : true)
    setHeaders(http, o)
    setCredentials(http, o)
    if (win[xDomainRequest] && http instanceof win[xDomainRequest]) {
        http.onload = fn
        http.onerror = err
        // NOTE: see
        // http://social.msdn.microsoft.com/Forums/en-US/iewebdevelopment/thread/30ef3add-767c-4436-b8a9-f1ca19b4812e
        http.onprogress = function() {}
        sendWait = true
    } else {
      http.onreadystatechange = handleReadyState(this, fn, err)
    }
    o['before'] && o['before'](http)
    if (sendWait) {
      setTimeout(function () {
        http.send(data)
      }, 200)
    } else {
      http.send(data)
    }
    return http
  }

  function Reqwest(o, fn) {
    this.o = o
    this.fn = fn

    init.apply(this, arguments)
  }

  function setType(header) {
    // json, javascript, text/plain, text/html, xml
    if (header.match('json')) return 'json'
    if (header.match('javascript')) return 'js'
    if (header.match('text')) return 'html'
    if (header.match('xml')) return 'xml'
  }

  function init(o, fn) {

    this.url = typeof o == 'string' ? o : o['url']
    this.timeout = null

    // whether request has been fulfilled for purpose
    // of tracking the Promises
    this._fulfilled = false
    // success handlers
    this._successHandler = function(){}
    this._fulfillmentHandlers = []
    // error handlers
    this._errorHandlers = []
    // complete (both success and fail) handlers
    this._completeHandlers = []
    this._erred = false
    this._responseArgs = {}

    var self = this

    fn = fn || function () {}

    if (o['timeout']) {
      this.timeout = setTimeout(function () {
        timedOut()
      }, o['timeout'])
    }

    if (o['success']) {
      this._successHandler = function () {
        o['success'].apply(o, arguments)
      }
    }

    if (o['error']) {
      this._errorHandlers.push(function () {
        o['error'].apply(o, arguments)
      })
    }

    if (o['complete']) {
      this._completeHandlers.push(function () {
        o['complete'].apply(o, arguments)
      })
    }

    function complete (resp) {
      o['timeout'] && clearTimeout(self.timeout)
      self.timeout = null
      while (self._completeHandlers.length > 0) {
        self._completeHandlers.shift()(resp)
      }
    }

    function success (resp) {
      var type = o['type'] || resp && setType(resp.getResponseHeader('Content-Type')) // resp can be undefined in IE
      resp = (type !== 'jsonp') ? self.request : resp
      // use global data filter on response text
      var filteredResponse = globalSetupOptions.dataFilter(resp.responseText, type)
        , r = filteredResponse
      try {
        resp.responseText = r
      } catch (e) {
        // can't assign this in IE<=8, just ignore
      }
      if (r) {
        switch (type) {
        case 'json':
          try {
            resp = win.JSON ? win.JSON.parse(r) : eval('(' + r + ')')
          } catch (err) {
            return error(resp, 'Could not parse JSON in response', err)
          }
          break
        case 'js':
          resp = eval(r)
          break
        case 'html':
          resp = r
          break
        case 'xml':
          resp = resp.responseXML
              && resp.responseXML.parseError // IE trololo
              && resp.responseXML.parseError.errorCode
              && resp.responseXML.parseError.reason
            ? null
            : resp.responseXML
          break
        }
      }

      self._responseArgs.resp = resp
      self._fulfilled = true
      fn(resp)
      self._successHandler(resp)
      while (self._fulfillmentHandlers.length > 0) {
        resp = self._fulfillmentHandlers.shift()(resp)
      }

      complete(resp)
    }

    function timedOut() {
      self._timedOut = true
      self.request.abort()      
    }

    function error(resp, msg, t) {
      resp = self.request
      self._responseArgs.resp = resp
      self._responseArgs.msg = msg
      self._responseArgs.t = t
      self._erred = true
      while (self._errorHandlers.length > 0) {
        self._errorHandlers.shift()(resp, msg, t)
      }
      complete(resp)
    }

    this.request = getRequest.call(this, success, error)
  }

  Reqwest.prototype = {
    abort: function () {
      this._aborted = true
      this.request.abort()
    }

  , retry: function () {
      init.call(this, this.o, this.fn)
    }

    /**
     * Small deviation from the Promises A CommonJs specification
     * http://wiki.commonjs.org/wiki/Promises/A
     */

    /**
     * `then` will execute upon successful requests
     */
  , then: function (success, fail) {
      success = success || function () {}
      fail = fail || function () {}
      if (this._fulfilled) {
        this._responseArgs.resp = success(this._responseArgs.resp)
      } else if (this._erred) {
        fail(this._responseArgs.resp, this._responseArgs.msg, this._responseArgs.t)
      } else {
        this._fulfillmentHandlers.push(success)
        this._errorHandlers.push(fail)
      }
      return this
    }

    /**
     * `always` will execute whether the request succeeds or fails
     */
  , always: function (fn) {
      if (this._fulfilled || this._erred) {
        fn(this._responseArgs.resp)
      } else {
        this._completeHandlers.push(fn)
      }
      return this
    }

    /**
     * `fail` will execute when the request fails
     */
  , fail: function (fn) {
      if (this._erred) {
        fn(this._responseArgs.resp, this._responseArgs.msg, this._responseArgs.t)
      } else {
        this._errorHandlers.push(fn)
      }
      return this
    }
  , 'catch': function (fn) {
      return this.fail(fn)
    }
  }

  function reqwest(o, fn) {
    return new Reqwest(o, fn)
  }

  // normalize newline variants according to spec -> CRLF
  function normalize(s) {
    return s ? s.replace(/\r?\n/g, '\r\n') : ''
  }

  function serial(el, cb) {
    var n = el.name
      , t = el.tagName.toLowerCase()
      , optCb = function (o) {
          // IE gives value="" even where there is no value attribute
          // 'specified' ref: http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-862529273
          if (o && !o['disabled'])
            cb(n, normalize(o['attributes']['value'] && o['attributes']['value']['specified'] ? o['value'] : o['text']))
        }
      , ch, ra, val, i

    // don't serialize elements that are disabled or without a name
    if (el.disabled || !n) return

    switch (t) {
    case 'input':
      if (!/reset|button|image|file/i.test(el.type)) {
        ch = /checkbox/i.test(el.type)
        ra = /radio/i.test(el.type)
        val = el.value
        // WebKit gives us "" instead of "on" if a checkbox has no value, so correct it here
        ;(!(ch || ra) || el.checked) && cb(n, normalize(ch && val === '' ? 'on' : val))
      }
      break
    case 'textarea':
      cb(n, normalize(el.value))
      break
    case 'select':
      if (el.type.toLowerCase() === 'select-one') {
        optCb(el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null)
      } else {
        for (i = 0; el.length && i < el.length; i++) {
          el.options[i].selected && optCb(el.options[i])
        }
      }
      break
    }
  }

  // collect up all form elements found from the passed argument elements all
  // the way down to child elements; pass a '<form>' or form fields.
  // called with 'this'=callback to use for serial() on each element
  function eachFormElement() {
    var cb = this
      , e, i
      , serializeSubtags = function (e, tags) {
          var i, j, fa
          for (i = 0; i < tags.length; i++) {
            fa = e[byTag](tags[i])
            for (j = 0; j < fa.length; j++) serial(fa[j], cb)
          }
        }

    for (i = 0; i < arguments.length; i++) {
      e = arguments[i]
      if (/input|select|textarea/i.test(e.tagName)) serial(e, cb)
      serializeSubtags(e, [ 'input', 'select', 'textarea' ])
    }
  }

  // standard query string style serialization
  function serializeQueryString() {
    return reqwest.toQueryString(reqwest.serializeArray.apply(null, arguments))
  }

  // { 'name': 'value', ... } style serialization
  function serializeHash() {
    var hash = {}
    eachFormElement.apply(function (name, value) {
      if (name in hash) {
        hash[name] && !isArray(hash[name]) && (hash[name] = [hash[name]])
        hash[name].push(value)
      } else hash[name] = value
    }, arguments)
    return hash
  }

  // [ { name: 'name', value: 'value' }, ... ] style serialization
  reqwest.serializeArray = function () {
    var arr = []
    eachFormElement.apply(function (name, value) {
      arr.push({name: name, value: value})
    }, arguments)
    return arr
  }

  reqwest.serialize = function () {
    if (arguments.length === 0) return ''
    var opt, fn
      , args = Array.prototype.slice.call(arguments, 0)

    opt = args.pop()
    opt && opt.nodeType && args.push(opt) && (opt = null)
    opt && (opt = opt.type)

    if (opt == 'map') fn = serializeHash
    else if (opt == 'array') fn = reqwest.serializeArray
    else fn = serializeQueryString

    return fn.apply(null, args)
  }

  reqwest.toQueryString = function (o, trad) {
    var prefix, i
      , traditional = trad || false
      , s = []
      , enc = encodeURIComponent
      , add = function (key, value) {
          // If value is a function, invoke it and return its value
          value = ('function' === typeof value) ? value() : (value == null ? '' : value)
          s[s.length] = enc(key) + '=' + enc(value)
        }
    // If an array was passed in, assume that it is an array of form elements.
    if (isArray(o)) {
      for (i = 0; o && i < o.length; i++) add(o[i]['name'], o[i]['value'])
    } else {
      // If traditional, encode the "old" way (the way 1.3.2 or older
      // did it), otherwise encode params recursively.
      for (prefix in o) {
        if (o.hasOwnProperty(prefix)) buildParams(prefix, o[prefix], traditional, add)
      }
    }

    // spaces should be + according to spec
    return s.join('&').replace(/%20/g, '+')
  }

  function buildParams(prefix, obj, traditional, add) {
    var name, i, v
      , rbracket = /\[\]$/

    if (isArray(obj)) {
      // Serialize array item.
      for (i = 0; obj && i < obj.length; i++) {
        v = obj[i]
        if (traditional || rbracket.test(prefix)) {
          // Treat each array item as a scalar.
          add(prefix, v)
        } else {
          buildParams(prefix + '[' + (typeof v === 'object' ? i : '') + ']', v, traditional, add)
        }
      }
    } else if (obj && obj.toString() === '[object Object]') {
      // Serialize object item.
      for (name in obj) {
        buildParams(prefix + '[' + name + ']', obj[name], traditional, add)
      }

    } else {
      // Serialize scalar item.
      add(prefix, obj)
    }
  }

  reqwest.getcallbackPrefix = function () {
    return callbackPrefix
  }

  // jQuery and Zepto compatibility, differences can be remapped here so you can call
  // .ajax.compat(options, callback)
  reqwest.compat = function (o, fn) {
    if (o) {
      o['type'] && (o['method'] = o['type']) && delete o['type']
      o['dataType'] && (o['type'] = o['dataType'])
      o['jsonpCallback'] && (o['jsonpCallbackName'] = o['jsonpCallback']) && delete o['jsonpCallback']
      o['jsonp'] && (o['jsonpCallback'] = o['jsonp'])
    }
    return new Reqwest(o, fn)
  }

  reqwest.ajaxSetup = function (options) {
    options = options || {}
    for (var k in options) {
      globalSetupOptions[k] = options[k]
    }
  }

  return reqwest
});

},{}],34:[function(require,module,exports){
(function (process){
/*!
 * @overview RSVP - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/tildeio/rsvp.js/master/LICENSE
 * @version   3.0.17
 */

(function() {
    "use strict";
    function lib$rsvp$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$rsvp$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$rsvp$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$rsvp$utils$$_isArray;
    if (!Array.isArray) {
      lib$rsvp$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$rsvp$utils$$_isArray = Array.isArray;
    }

    var lib$rsvp$utils$$isArray = lib$rsvp$utils$$_isArray;

    var lib$rsvp$utils$$now = Date.now || function() { return new Date().getTime(); };

    function lib$rsvp$utils$$F() { }

    var lib$rsvp$utils$$o_create = (Object.create || function (o) {
      if (arguments.length > 1) {
        throw new Error('Second argument not supported');
      }
      if (typeof o !== 'object') {
        throw new TypeError('Argument must be an object');
      }
      lib$rsvp$utils$$F.prototype = o;
      return new lib$rsvp$utils$$F();
    });
    function lib$rsvp$events$$indexOf(callbacks, callback) {
      for (var i=0, l=callbacks.length; i<l; i++) {
        if (callbacks[i] === callback) { return i; }
      }

      return -1;
    }

    function lib$rsvp$events$$callbacksFor(object) {
      var callbacks = object._promiseCallbacks;

      if (!callbacks) {
        callbacks = object._promiseCallbacks = {};
      }

      return callbacks;
    }

    var lib$rsvp$events$$default = {

      /**
        `RSVP.EventTarget.mixin` extends an object with EventTarget methods. For
        Example:

        ```javascript
        var object = {};

        RSVP.EventTarget.mixin(object);

        object.on('finished', function(event) {
          // handle event
        });

        object.trigger('finished', { detail: value });
        ```

        `EventTarget.mixin` also works with prototypes:

        ```javascript
        var Person = function() {};
        RSVP.EventTarget.mixin(Person.prototype);

        var yehuda = new Person();
        var tom = new Person();

        yehuda.on('poke', function(event) {
          console.log('Yehuda says OW');
        });

        tom.on('poke', function(event) {
          console.log('Tom says OW');
        });

        yehuda.trigger('poke');
        tom.trigger('poke');
        ```

        @method mixin
        @for RSVP.EventTarget
        @private
        @param {Object} object object to extend with EventTarget methods
      */
      'mixin': function(object) {
        object['on']      = this['on'];
        object['off']     = this['off'];
        object['trigger'] = this['trigger'];
        object._promiseCallbacks = undefined;
        return object;
      },

      /**
        Registers a callback to be executed when `eventName` is triggered

        ```javascript
        object.on('event', function(eventInfo){
          // handle the event
        });

        object.trigger('event');
        ```

        @method on
        @for RSVP.EventTarget
        @private
        @param {String} eventName name of the event to listen for
        @param {Function} callback function to be called when the event is triggered.
      */
      'on': function(eventName, callback) {
        var allCallbacks = lib$rsvp$events$$callbacksFor(this), callbacks;

        callbacks = allCallbacks[eventName];

        if (!callbacks) {
          callbacks = allCallbacks[eventName] = [];
        }

        if (lib$rsvp$events$$indexOf(callbacks, callback) === -1) {
          callbacks.push(callback);
        }
      },

      /**
        You can use `off` to stop firing a particular callback for an event:

        ```javascript
        function doStuff() { // do stuff! }
        object.on('stuff', doStuff);

        object.trigger('stuff'); // doStuff will be called

        // Unregister ONLY the doStuff callback
        object.off('stuff', doStuff);
        object.trigger('stuff'); // doStuff will NOT be called
        ```

        If you don't pass a `callback` argument to `off`, ALL callbacks for the
        event will not be executed when the event fires. For example:

        ```javascript
        var callback1 = function(){};
        var callback2 = function(){};

        object.on('stuff', callback1);
        object.on('stuff', callback2);

        object.trigger('stuff'); // callback1 and callback2 will be executed.

        object.off('stuff');
        object.trigger('stuff'); // callback1 and callback2 will not be executed!
        ```

        @method off
        @for RSVP.EventTarget
        @private
        @param {String} eventName event to stop listening to
        @param {Function} callback optional argument. If given, only the function
        given will be removed from the event's callback queue. If no `callback`
        argument is given, all callbacks will be removed from the event's callback
        queue.
      */
      'off': function(eventName, callback) {
        var allCallbacks = lib$rsvp$events$$callbacksFor(this), callbacks, index;

        if (!callback) {
          allCallbacks[eventName] = [];
          return;
        }

        callbacks = allCallbacks[eventName];

        index = lib$rsvp$events$$indexOf(callbacks, callback);

        if (index !== -1) { callbacks.splice(index, 1); }
      },

      /**
        Use `trigger` to fire custom events. For example:

        ```javascript
        object.on('foo', function(){
          console.log('foo event happened!');
        });
        object.trigger('foo');
        // 'foo event happened!' logged to the console
        ```

        You can also pass a value as a second argument to `trigger` that will be
        passed as an argument to all event listeners for the event:

        ```javascript
        object.on('foo', function(value){
          console.log(value.name);
        });

        object.trigger('foo', { name: 'bar' });
        // 'bar' logged to the console
        ```

        @method trigger
        @for RSVP.EventTarget
        @private
        @param {String} eventName name of the event to be triggered
        @param {Any} options optional value to be passed to any event handlers for
        the given `eventName`
      */
      'trigger': function(eventName, options) {
        var allCallbacks = lib$rsvp$events$$callbacksFor(this), callbacks, callback;

        if (callbacks = allCallbacks[eventName]) {
          // Don't cache the callbacks.length since it may grow
          for (var i=0; i<callbacks.length; i++) {
            callback = callbacks[i];

            callback(options);
          }
        }
      }
    };

    var lib$rsvp$config$$config = {
      instrument: false
    };

    lib$rsvp$events$$default['mixin'](lib$rsvp$config$$config);

    function lib$rsvp$config$$configure(name, value) {
      if (name === 'onerror') {
        // handle for legacy users that expect the actual
        // error to be passed to their function added via
        // `RSVP.configure('onerror', someFunctionHere);`
        lib$rsvp$config$$config['on']('error', value);
        return;
      }

      if (arguments.length === 2) {
        lib$rsvp$config$$config[name] = value;
      } else {
        return lib$rsvp$config$$config[name];
      }
    }

    var lib$rsvp$instrument$$queue = [];

    function lib$rsvp$instrument$$scheduleFlush() {
      setTimeout(function() {
        var entry;
        for (var i = 0; i < lib$rsvp$instrument$$queue.length; i++) {
          entry = lib$rsvp$instrument$$queue[i];

          var payload = entry.payload;

          payload.guid = payload.key + payload.id;
          payload.childGuid = payload.key + payload.childId;
          if (payload.error) {
            payload.stack = payload.error.stack;
          }

          lib$rsvp$config$$config['trigger'](entry.name, entry.payload);
        }
        lib$rsvp$instrument$$queue.length = 0;
      }, 50);
    }

    function lib$rsvp$instrument$$instrument(eventName, promise, child) {
      if (1 === lib$rsvp$instrument$$queue.push({
          name: eventName,
          payload: {
            key: promise._guidKey,
            id:  promise._id,
            eventName: eventName,
            detail: promise._result,
            childId: child && child._id,
            label: promise._label,
            timeStamp: lib$rsvp$utils$$now(),
            error: lib$rsvp$config$$config["instrument-with-stack"] ? new Error(promise._label) : null
          }})) {
            lib$rsvp$instrument$$scheduleFlush();
          }
      }
    var lib$rsvp$instrument$$default = lib$rsvp$instrument$$instrument;

    function  lib$rsvp$$internal$$withOwnPromise() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$rsvp$$internal$$noop() {}

    var lib$rsvp$$internal$$PENDING   = void 0;
    var lib$rsvp$$internal$$FULFILLED = 1;
    var lib$rsvp$$internal$$REJECTED  = 2;

    var lib$rsvp$$internal$$GET_THEN_ERROR = new lib$rsvp$$internal$$ErrorObject();

    function lib$rsvp$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$rsvp$$internal$$GET_THEN_ERROR.error = error;
        return lib$rsvp$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$rsvp$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$rsvp$$internal$$handleForeignThenable(promise, thenable, then) {
      lib$rsvp$config$$config.async(function(promise) {
        var sealed = false;
        var error = lib$rsvp$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$rsvp$$internal$$resolve(promise, value);
          } else {
            lib$rsvp$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$rsvp$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$rsvp$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$rsvp$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$rsvp$$internal$$FULFILLED) {
        lib$rsvp$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$rsvp$$internal$$REJECTED) {
        thenable._onError = null;
        lib$rsvp$$internal$$reject(promise, thenable._result);
      } else {
        lib$rsvp$$internal$$subscribe(thenable, undefined, function(value) {
          if (thenable !== value) {
            lib$rsvp$$internal$$resolve(promise, value);
          } else {
            lib$rsvp$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          lib$rsvp$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$rsvp$$internal$$handleMaybeThenable(promise, maybeThenable) {
      if (maybeThenable.constructor === promise.constructor) {
        lib$rsvp$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        var then = lib$rsvp$$internal$$getThen(maybeThenable);

        if (then === lib$rsvp$$internal$$GET_THEN_ERROR) {
          lib$rsvp$$internal$$reject(promise, lib$rsvp$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$rsvp$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$rsvp$utils$$isFunction(then)) {
          lib$rsvp$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$rsvp$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$rsvp$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$rsvp$$internal$$fulfill(promise, value);
      } else if (lib$rsvp$utils$$objectOrFunction(value)) {
        lib$rsvp$$internal$$handleMaybeThenable(promise, value);
      } else {
        lib$rsvp$$internal$$fulfill(promise, value);
      }
    }

    function lib$rsvp$$internal$$publishRejection(promise) {
      if (promise._onError) {
        promise._onError(promise._result);
      }

      lib$rsvp$$internal$$publish(promise);
    }

    function lib$rsvp$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$rsvp$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$rsvp$$internal$$FULFILLED;

      if (promise._subscribers.length === 0) {
        if (lib$rsvp$config$$config.instrument) {
          lib$rsvp$instrument$$default('fulfilled', promise);
        }
      } else {
        lib$rsvp$config$$config.async(lib$rsvp$$internal$$publish, promise);
      }
    }

    function lib$rsvp$$internal$$reject(promise, reason) {
      if (promise._state !== lib$rsvp$$internal$$PENDING) { return; }
      promise._state = lib$rsvp$$internal$$REJECTED;
      promise._result = reason;
      lib$rsvp$config$$config.async(lib$rsvp$$internal$$publishRejection, promise);
    }

    function lib$rsvp$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onError = null;

      subscribers[length] = child;
      subscribers[length + lib$rsvp$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$rsvp$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$rsvp$config$$config.async(lib$rsvp$$internal$$publish, parent);
      }
    }

    function lib$rsvp$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (lib$rsvp$config$$config.instrument) {
        lib$rsvp$instrument$$default(settled === lib$rsvp$$internal$$FULFILLED ? 'fulfilled' : 'rejected', promise);
      }

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$rsvp$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$rsvp$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$rsvp$$internal$$TRY_CATCH_ERROR = new lib$rsvp$$internal$$ErrorObject();

    function lib$rsvp$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$rsvp$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$rsvp$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$rsvp$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$rsvp$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$rsvp$$internal$$tryCatch(callback, detail);

        if (value === lib$rsvp$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$rsvp$$internal$$reject(promise, lib$rsvp$$internal$$withOwnPromise());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$rsvp$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$rsvp$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$rsvp$$internal$$reject(promise, error);
      } else if (settled === lib$rsvp$$internal$$FULFILLED) {
        lib$rsvp$$internal$$fulfill(promise, value);
      } else if (settled === lib$rsvp$$internal$$REJECTED) {
        lib$rsvp$$internal$$reject(promise, value);
      }
    }

    function lib$rsvp$$internal$$initializePromise(promise, resolver) {
      var resolved = false;
      try {
        resolver(function resolvePromise(value){
          if (resolved) { return; }
          resolved = true;
          lib$rsvp$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          if (resolved) { return; }
          resolved = true;
          lib$rsvp$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$rsvp$$internal$$reject(promise, e);
      }
    }

    function lib$rsvp$enumerator$$makeSettledResult(state, position, value) {
      if (state === lib$rsvp$$internal$$FULFILLED) {
        return {
          state: 'fulfilled',
          value: value
        };
      } else {
        return {
          state: 'rejected',
          reason: value
        };
      }
    }

    function lib$rsvp$enumerator$$Enumerator(Constructor, input, abortOnReject, label) {
      this._instanceConstructor = Constructor;
      this.promise = new Constructor(lib$rsvp$$internal$$noop, label);
      this._abortOnReject = abortOnReject;

      if (this._validateInput(input)) {
        this._input     = input;
        this.length     = input.length;
        this._remaining = input.length;

        this._init();

        if (this.length === 0) {
          lib$rsvp$$internal$$fulfill(this.promise, this._result);
        } else {
          this.length = this.length || 0;
          this._enumerate();
          if (this._remaining === 0) {
            lib$rsvp$$internal$$fulfill(this.promise, this._result);
          }
        }
      } else {
        lib$rsvp$$internal$$reject(this.promise, this._validationError());
      }
    }

    var lib$rsvp$enumerator$$default = lib$rsvp$enumerator$$Enumerator;

    lib$rsvp$enumerator$$Enumerator.prototype._validateInput = function(input) {
      return lib$rsvp$utils$$isArray(input);
    };

    lib$rsvp$enumerator$$Enumerator.prototype._validationError = function() {
      return new Error('Array Methods must be provided an Array');
    };

    lib$rsvp$enumerator$$Enumerator.prototype._init = function() {
      this._result = new Array(this.length);
    };

    lib$rsvp$enumerator$$Enumerator.prototype._enumerate = function() {
      var length  = this.length;
      var promise = this.promise;
      var input   = this._input;

      for (var i = 0; promise._state === lib$rsvp$$internal$$PENDING && i < length; i++) {
        this._eachEntry(input[i], i);
      }
    };

    lib$rsvp$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var c = this._instanceConstructor;
      if (lib$rsvp$utils$$isMaybeThenable(entry)) {
        if (entry.constructor === c && entry._state !== lib$rsvp$$internal$$PENDING) {
          entry._onError = null;
          this._settledAt(entry._state, i, entry._result);
        } else {
          this._willSettleAt(c.resolve(entry), i);
        }
      } else {
        this._remaining--;
        this._result[i] = this._makeResult(lib$rsvp$$internal$$FULFILLED, i, entry);
      }
    };

    lib$rsvp$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var promise = this.promise;

      if (promise._state === lib$rsvp$$internal$$PENDING) {
        this._remaining--;

        if (this._abortOnReject && state === lib$rsvp$$internal$$REJECTED) {
          lib$rsvp$$internal$$reject(promise, value);
        } else {
          this._result[i] = this._makeResult(state, i, value);
        }
      }

      if (this._remaining === 0) {
        lib$rsvp$$internal$$fulfill(promise, this._result);
      }
    };

    lib$rsvp$enumerator$$Enumerator.prototype._makeResult = function(state, i, value) {
      return value;
    };

    lib$rsvp$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$rsvp$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$rsvp$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$rsvp$$internal$$REJECTED, i, reason);
      });
    };
    function lib$rsvp$promise$all$$all(entries, label) {
      return new lib$rsvp$enumerator$$default(this, entries, true /* abort on reject */, label).promise;
    }
    var lib$rsvp$promise$all$$default = lib$rsvp$promise$all$$all;
    function lib$rsvp$promise$race$$race(entries, label) {
      /*jshint validthis:true */
      var Constructor = this;

      var promise = new Constructor(lib$rsvp$$internal$$noop, label);

      if (!lib$rsvp$utils$$isArray(entries)) {
        lib$rsvp$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
      }

      var length = entries.length;

      function onFulfillment(value) {
        lib$rsvp$$internal$$resolve(promise, value);
      }

      function onRejection(reason) {
        lib$rsvp$$internal$$reject(promise, reason);
      }

      for (var i = 0; promise._state === lib$rsvp$$internal$$PENDING && i < length; i++) {
        lib$rsvp$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
      }

      return promise;
    }
    var lib$rsvp$promise$race$$default = lib$rsvp$promise$race$$race;
    function lib$rsvp$promise$resolve$$resolve(object, label) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$rsvp$$internal$$noop, label);
      lib$rsvp$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$rsvp$promise$resolve$$default = lib$rsvp$promise$resolve$$resolve;
    function lib$rsvp$promise$reject$$reject(reason, label) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$rsvp$$internal$$noop, label);
      lib$rsvp$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$rsvp$promise$reject$$default = lib$rsvp$promise$reject$$reject;

    var lib$rsvp$promise$$guidKey = 'rsvp_' + lib$rsvp$utils$$now() + '-';
    var lib$rsvp$promise$$counter = 0;

    function lib$rsvp$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$rsvp$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise’s eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class RSVP.Promise
      @param {function} resolver
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @constructor
    */
    function lib$rsvp$promise$$Promise(resolver, label) {
      this._id = lib$rsvp$promise$$counter++;
      this._label = label;
      this._state = undefined;
      this._result = undefined;
      this._subscribers = [];

      if (lib$rsvp$config$$config.instrument) {
        lib$rsvp$instrument$$default('created', this);
      }

      if (lib$rsvp$$internal$$noop !== resolver) {
        if (!lib$rsvp$utils$$isFunction(resolver)) {
          lib$rsvp$promise$$needsResolver();
        }

        if (!(this instanceof lib$rsvp$promise$$Promise)) {
          lib$rsvp$promise$$needsNew();
        }

        lib$rsvp$$internal$$initializePromise(this, resolver);
      }
    }

    var lib$rsvp$promise$$default = lib$rsvp$promise$$Promise;

    // deprecated
    lib$rsvp$promise$$Promise.cast = lib$rsvp$promise$resolve$$default;
    lib$rsvp$promise$$Promise.all = lib$rsvp$promise$all$$default;
    lib$rsvp$promise$$Promise.race = lib$rsvp$promise$race$$default;
    lib$rsvp$promise$$Promise.resolve = lib$rsvp$promise$resolve$$default;
    lib$rsvp$promise$$Promise.reject = lib$rsvp$promise$reject$$default;

    lib$rsvp$promise$$Promise.prototype = {
      constructor: lib$rsvp$promise$$Promise,

      _guidKey: lib$rsvp$promise$$guidKey,

      _onError: function (reason) {
        lib$rsvp$config$$config.async(function(promise) {
          setTimeout(function() {
            if (promise._onError) {
              lib$rsvp$config$$config['trigger']('error', reason);
            }
          }, 0);
        }, this);
      },

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise}
    */
      then: function(onFulfillment, onRejection, label) {
        var parent = this;
        var state = parent._state;

        if (state === lib$rsvp$$internal$$FULFILLED && !onFulfillment || state === lib$rsvp$$internal$$REJECTED && !onRejection) {
          if (lib$rsvp$config$$config.instrument) {
            lib$rsvp$instrument$$default('chained', this, this);
          }
          return this;
        }

        parent._onError = null;

        var child = new this.constructor(lib$rsvp$$internal$$noop, label);
        var result = parent._result;

        if (lib$rsvp$config$$config.instrument) {
          lib$rsvp$instrument$$default('chained', parent, child);
        }

        if (state) {
          var callback = arguments[state - 1];
          lib$rsvp$config$$config.async(function(){
            lib$rsvp$$internal$$invokeCallback(state, child, callback, result);
          });
        } else {
          lib$rsvp$$internal$$subscribe(parent, child, onFulfillment, onRejection);
        }

        return child;
      },

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection, label) {
        return this.then(null, onRejection, label);
      },

    /**
      `finally` will be invoked regardless of the promise's fate just as native
      try/catch/finally behaves

      Synchronous example:

      ```js
      findAuthor() {
        if (Math.random() > 0.5) {
          throw new Error();
        }
        return new Author();
      }

      try {
        return findAuthor(); // succeed or fail
      } catch(error) {
        return findOtherAuther();
      } finally {
        // always runs
        // doesn't affect the return value
      }
      ```

      Asynchronous example:

      ```js
      findAuthor().catch(function(reason){
        return findOtherAuther();
      }).finally(function(){
        // author was either found, or not
      });
      ```

      @method finally
      @param {Function} callback
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise}
    */
      'finally': function(callback, label) {
        var constructor = this.constructor;

        return this.then(function(value) {
          return constructor.resolve(callback()).then(function(){
            return value;
          });
        }, function(reason) {
          return constructor.resolve(callback()).then(function(){
            throw reason;
          });
        }, label);
      }
    };

    function lib$rsvp$all$settled$$AllSettled(Constructor, entries, label) {
      this._superConstructor(Constructor, entries, false /* don't abort on reject */, label);
    }

    lib$rsvp$all$settled$$AllSettled.prototype = lib$rsvp$utils$$o_create(lib$rsvp$enumerator$$default.prototype);
    lib$rsvp$all$settled$$AllSettled.prototype._superConstructor = lib$rsvp$enumerator$$default;
    lib$rsvp$all$settled$$AllSettled.prototype._makeResult = lib$rsvp$enumerator$$makeSettledResult;
    lib$rsvp$all$settled$$AllSettled.prototype._validationError = function() {
      return new Error('allSettled must be called with an array');
    };

    function lib$rsvp$all$settled$$allSettled(entries, label) {
      return new lib$rsvp$all$settled$$AllSettled(lib$rsvp$promise$$default, entries, label).promise;
    }
    var lib$rsvp$all$settled$$default = lib$rsvp$all$settled$$allSettled;
    function lib$rsvp$all$$all(array, label) {
      return lib$rsvp$promise$$default.all(array, label);
    }
    var lib$rsvp$all$$default = lib$rsvp$all$$all;
    var lib$rsvp$asap$$len = 0;
    var lib$rsvp$asap$$toString = {}.toString;
    var lib$rsvp$asap$$vertxNext;
    function lib$rsvp$asap$$asap(callback, arg) {
      lib$rsvp$asap$$queue[lib$rsvp$asap$$len] = callback;
      lib$rsvp$asap$$queue[lib$rsvp$asap$$len + 1] = arg;
      lib$rsvp$asap$$len += 2;
      if (lib$rsvp$asap$$len === 2) {
        // If len is 1, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        lib$rsvp$asap$$scheduleFlush();
      }
    }

    var lib$rsvp$asap$$default = lib$rsvp$asap$$asap;

    var lib$rsvp$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$rsvp$asap$$browserGlobal = lib$rsvp$asap$$browserWindow || {};
    var lib$rsvp$asap$$BrowserMutationObserver = lib$rsvp$asap$$browserGlobal.MutationObserver || lib$rsvp$asap$$browserGlobal.WebKitMutationObserver;
    var lib$rsvp$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$rsvp$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$rsvp$asap$$useNextTick() {
      var nextTick = process.nextTick;
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // setImmediate should be used instead instead
      var version = process.versions.node.match(/^(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)$/);
      if (Array.isArray(version) && version[1] === '0' && version[2] === '10') {
        nextTick = setImmediate;
      }
      return function() {
        nextTick(lib$rsvp$asap$$flush);
      };
    }

    // vertx
    function lib$rsvp$asap$$useVertxTimer() {
      return function() {
        lib$rsvp$asap$$vertxNext(lib$rsvp$asap$$flush);
      };
    }

    function lib$rsvp$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$rsvp$asap$$BrowserMutationObserver(lib$rsvp$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$rsvp$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$rsvp$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$rsvp$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$rsvp$asap$$flush, 1);
      };
    }

    var lib$rsvp$asap$$queue = new Array(1000);
    function lib$rsvp$asap$$flush() {
      for (var i = 0; i < lib$rsvp$asap$$len; i+=2) {
        var callback = lib$rsvp$asap$$queue[i];
        var arg = lib$rsvp$asap$$queue[i+1];

        callback(arg);

        lib$rsvp$asap$$queue[i] = undefined;
        lib$rsvp$asap$$queue[i+1] = undefined;
      }

      lib$rsvp$asap$$len = 0;
    }

    function lib$rsvp$asap$$attemptVertex() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$rsvp$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$rsvp$asap$$useVertxTimer();
      } catch(e) {
        return lib$rsvp$asap$$useSetTimeout();
      }
    }

    var lib$rsvp$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$rsvp$asap$$isNode) {
      lib$rsvp$asap$$scheduleFlush = lib$rsvp$asap$$useNextTick();
    } else if (lib$rsvp$asap$$BrowserMutationObserver) {
      lib$rsvp$asap$$scheduleFlush = lib$rsvp$asap$$useMutationObserver();
    } else if (lib$rsvp$asap$$isWorker) {
      lib$rsvp$asap$$scheduleFlush = lib$rsvp$asap$$useMessageChannel();
    } else if (lib$rsvp$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$rsvp$asap$$scheduleFlush = lib$rsvp$asap$$attemptVertex();
    } else {
      lib$rsvp$asap$$scheduleFlush = lib$rsvp$asap$$useSetTimeout();
    }
    function lib$rsvp$defer$$defer(label) {
      var deferred = { };

      deferred['promise'] = new lib$rsvp$promise$$default(function(resolve, reject) {
        deferred['resolve'] = resolve;
        deferred['reject'] = reject;
      }, label);

      return deferred;
    }
    var lib$rsvp$defer$$default = lib$rsvp$defer$$defer;
    function lib$rsvp$filter$$filter(promises, filterFn, label) {
      return lib$rsvp$promise$$default.all(promises, label).then(function(values) {
        if (!lib$rsvp$utils$$isFunction(filterFn)) {
          throw new TypeError("You must pass a function as filter's second argument.");
        }

        var length = values.length;
        var filtered = new Array(length);

        for (var i = 0; i < length; i++) {
          filtered[i] = filterFn(values[i]);
        }

        return lib$rsvp$promise$$default.all(filtered, label).then(function(filtered) {
          var results = new Array(length);
          var newLength = 0;

          for (var i = 0; i < length; i++) {
            if (filtered[i]) {
              results[newLength] = values[i];
              newLength++;
            }
          }

          results.length = newLength;

          return results;
        });
      });
    }
    var lib$rsvp$filter$$default = lib$rsvp$filter$$filter;

    function lib$rsvp$promise$hash$$PromiseHash(Constructor, object, label) {
      this._superConstructor(Constructor, object, true, label);
    }

    var lib$rsvp$promise$hash$$default = lib$rsvp$promise$hash$$PromiseHash;

    lib$rsvp$promise$hash$$PromiseHash.prototype = lib$rsvp$utils$$o_create(lib$rsvp$enumerator$$default.prototype);
    lib$rsvp$promise$hash$$PromiseHash.prototype._superConstructor = lib$rsvp$enumerator$$default;
    lib$rsvp$promise$hash$$PromiseHash.prototype._init = function() {
      this._result = {};
    };

    lib$rsvp$promise$hash$$PromiseHash.prototype._validateInput = function(input) {
      return input && typeof input === 'object';
    };

    lib$rsvp$promise$hash$$PromiseHash.prototype._validationError = function() {
      return new Error('Promise.hash must be called with an object');
    };

    lib$rsvp$promise$hash$$PromiseHash.prototype._enumerate = function() {
      var promise = this.promise;
      var input   = this._input;
      var results = [];

      for (var key in input) {
        if (promise._state === lib$rsvp$$internal$$PENDING && input.hasOwnProperty(key)) {
          results.push({
            position: key,
            entry: input[key]
          });
        }
      }

      var length = results.length;
      this._remaining = length;
      var result;

      for (var i = 0; promise._state === lib$rsvp$$internal$$PENDING && i < length; i++) {
        result = results[i];
        this._eachEntry(result.entry, result.position);
      }
    };

    function lib$rsvp$hash$settled$$HashSettled(Constructor, object, label) {
      this._superConstructor(Constructor, object, false, label);
    }

    lib$rsvp$hash$settled$$HashSettled.prototype = lib$rsvp$utils$$o_create(lib$rsvp$promise$hash$$default.prototype);
    lib$rsvp$hash$settled$$HashSettled.prototype._superConstructor = lib$rsvp$enumerator$$default;
    lib$rsvp$hash$settled$$HashSettled.prototype._makeResult = lib$rsvp$enumerator$$makeSettledResult;

    lib$rsvp$hash$settled$$HashSettled.prototype._validationError = function() {
      return new Error('hashSettled must be called with an object');
    };

    function lib$rsvp$hash$settled$$hashSettled(object, label) {
      return new lib$rsvp$hash$settled$$HashSettled(lib$rsvp$promise$$default, object, label).promise;
    }
    var lib$rsvp$hash$settled$$default = lib$rsvp$hash$settled$$hashSettled;
    function lib$rsvp$hash$$hash(object, label) {
      return new lib$rsvp$promise$hash$$default(lib$rsvp$promise$$default, object, label).promise;
    }
    var lib$rsvp$hash$$default = lib$rsvp$hash$$hash;
    function lib$rsvp$map$$map(promises, mapFn, label) {
      return lib$rsvp$promise$$default.all(promises, label).then(function(values) {
        if (!lib$rsvp$utils$$isFunction(mapFn)) {
          throw new TypeError("You must pass a function as map's second argument.");
        }

        var length = values.length;
        var results = new Array(length);

        for (var i = 0; i < length; i++) {
          results[i] = mapFn(values[i]);
        }

        return lib$rsvp$promise$$default.all(results, label);
      });
    }
    var lib$rsvp$map$$default = lib$rsvp$map$$map;

    function lib$rsvp$node$$Result() {
      this.value = undefined;
    }

    var lib$rsvp$node$$ERROR = new lib$rsvp$node$$Result();
    var lib$rsvp$node$$GET_THEN_ERROR = new lib$rsvp$node$$Result();

    function lib$rsvp$node$$getThen(obj) {
      try {
       return obj.then;
      } catch(error) {
        lib$rsvp$node$$ERROR.value= error;
        return lib$rsvp$node$$ERROR;
      }
    }


    function lib$rsvp$node$$tryApply(f, s, a) {
      try {
        f.apply(s, a);
      } catch(error) {
        lib$rsvp$node$$ERROR.value = error;
        return lib$rsvp$node$$ERROR;
      }
    }

    function lib$rsvp$node$$makeObject(_, argumentNames) {
      var obj = {};
      var name;
      var i;
      var length = _.length;
      var args = new Array(length);

      for (var x = 0; x < length; x++) {
        args[x] = _[x];
      }

      for (i = 0; i < argumentNames.length; i++) {
        name = argumentNames[i];
        obj[name] = args[i + 1];
      }

      return obj;
    }

    function lib$rsvp$node$$arrayResult(_) {
      var length = _.length;
      var args = new Array(length - 1);

      for (var i = 1; i < length; i++) {
        args[i - 1] = _[i];
      }

      return args;
    }

    function lib$rsvp$node$$wrapThenable(then, promise) {
      return {
        then: function(onFulFillment, onRejection) {
          return then.call(promise, onFulFillment, onRejection);
        }
      };
    }

    function lib$rsvp$node$$denodeify(nodeFunc, options) {
      var fn = function() {
        var self = this;
        var l = arguments.length;
        var args = new Array(l + 1);
        var arg;
        var promiseInput = false;

        for (var i = 0; i < l; ++i) {
          arg = arguments[i];

          if (!promiseInput) {
            // TODO: clean this up
            promiseInput = lib$rsvp$node$$needsPromiseInput(arg);
            if (promiseInput === lib$rsvp$node$$GET_THEN_ERROR) {
              var p = new lib$rsvp$promise$$default(lib$rsvp$$internal$$noop);
              lib$rsvp$$internal$$reject(p, lib$rsvp$node$$GET_THEN_ERROR.value);
              return p;
            } else if (promiseInput && promiseInput !== true) {
              arg = lib$rsvp$node$$wrapThenable(promiseInput, arg);
            }
          }
          args[i] = arg;
        }

        var promise = new lib$rsvp$promise$$default(lib$rsvp$$internal$$noop);

        args[l] = function(err, val) {
          if (err)
            lib$rsvp$$internal$$reject(promise, err);
          else if (options === undefined)
            lib$rsvp$$internal$$resolve(promise, val);
          else if (options === true)
            lib$rsvp$$internal$$resolve(promise, lib$rsvp$node$$arrayResult(arguments));
          else if (lib$rsvp$utils$$isArray(options))
            lib$rsvp$$internal$$resolve(promise, lib$rsvp$node$$makeObject(arguments, options));
          else
            lib$rsvp$$internal$$resolve(promise, val);
        };

        if (promiseInput) {
          return lib$rsvp$node$$handlePromiseInput(promise, args, nodeFunc, self);
        } else {
          return lib$rsvp$node$$handleValueInput(promise, args, nodeFunc, self);
        }
      };

      fn.__proto__ = nodeFunc;

      return fn;
    }

    var lib$rsvp$node$$default = lib$rsvp$node$$denodeify;

    function lib$rsvp$node$$handleValueInput(promise, args, nodeFunc, self) {
      var result = lib$rsvp$node$$tryApply(nodeFunc, self, args);
      if (result === lib$rsvp$node$$ERROR) {
        lib$rsvp$$internal$$reject(promise, result.value);
      }
      return promise;
    }

    function lib$rsvp$node$$handlePromiseInput(promise, args, nodeFunc, self){
      return lib$rsvp$promise$$default.all(args).then(function(args){
        var result = lib$rsvp$node$$tryApply(nodeFunc, self, args);
        if (result === lib$rsvp$node$$ERROR) {
          lib$rsvp$$internal$$reject(promise, result.value);
        }
        return promise;
      });
    }

    function lib$rsvp$node$$needsPromiseInput(arg) {
      if (arg && typeof arg === 'object') {
        if (arg.constructor === lib$rsvp$promise$$default) {
          return true;
        } else {
          return lib$rsvp$node$$getThen(arg);
        }
      } else {
        return false;
      }
    }
    function lib$rsvp$race$$race(array, label) {
      return lib$rsvp$promise$$default.race(array, label);
    }
    var lib$rsvp$race$$default = lib$rsvp$race$$race;
    function lib$rsvp$reject$$reject(reason, label) {
      return lib$rsvp$promise$$default.reject(reason, label);
    }
    var lib$rsvp$reject$$default = lib$rsvp$reject$$reject;
    function lib$rsvp$resolve$$resolve(value, label) {
      return lib$rsvp$promise$$default.resolve(value, label);
    }
    var lib$rsvp$resolve$$default = lib$rsvp$resolve$$resolve;
    function lib$rsvp$rethrow$$rethrow(reason) {
      setTimeout(function() {
        throw reason;
      });
      throw reason;
    }
    var lib$rsvp$rethrow$$default = lib$rsvp$rethrow$$rethrow;

    // default async is asap;
    lib$rsvp$config$$config.async = lib$rsvp$asap$$default;
    var lib$rsvp$$cast = lib$rsvp$resolve$$default;
    function lib$rsvp$$async(callback, arg) {
      lib$rsvp$config$$config.async(callback, arg);
    }

    function lib$rsvp$$on() {
      lib$rsvp$config$$config['on'].apply(lib$rsvp$config$$config, arguments);
    }

    function lib$rsvp$$off() {
      lib$rsvp$config$$config['off'].apply(lib$rsvp$config$$config, arguments);
    }

    // Set up instrumentation through `window.__PROMISE_INTRUMENTATION__`
    if (typeof window !== 'undefined' && typeof window['__PROMISE_INSTRUMENTATION__'] === 'object') {
      var lib$rsvp$$callbacks = window['__PROMISE_INSTRUMENTATION__'];
      lib$rsvp$config$$configure('instrument', true);
      for (var lib$rsvp$$eventName in lib$rsvp$$callbacks) {
        if (lib$rsvp$$callbacks.hasOwnProperty(lib$rsvp$$eventName)) {
          lib$rsvp$$on(lib$rsvp$$eventName, lib$rsvp$$callbacks[lib$rsvp$$eventName]);
        }
      }
    }

    var lib$rsvp$umd$$RSVP = {
      'race': lib$rsvp$race$$default,
      'Promise': lib$rsvp$promise$$default,
      'allSettled': lib$rsvp$all$settled$$default,
      'hash': lib$rsvp$hash$$default,
      'hashSettled': lib$rsvp$hash$settled$$default,
      'denodeify': lib$rsvp$node$$default,
      'on': lib$rsvp$$on,
      'off': lib$rsvp$$off,
      'map': lib$rsvp$map$$default,
      'filter': lib$rsvp$filter$$default,
      'resolve': lib$rsvp$resolve$$default,
      'reject': lib$rsvp$reject$$default,
      'all': lib$rsvp$all$$default,
      'rethrow': lib$rsvp$rethrow$$default,
      'defer': lib$rsvp$defer$$default,
      'EventTarget': lib$rsvp$events$$default,
      'configure': lib$rsvp$config$$configure,
      'async': lib$rsvp$$async
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$rsvp$umd$$RSVP; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$rsvp$umd$$RSVP;
    } else if (typeof this !== 'undefined') {
      this['RSVP'] = lib$rsvp$umd$$RSVP;
    }
}).call(this);


}).call(this,require('_process'))

},{"_process":4}],35:[function(require,module,exports){
//     Underscore.js 1.8.2
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.2';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var isArrayLike = function(collection) {
    var length = collection && collection.length;
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, target, fromIndex) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    return _.indexOf(obj, target, typeof fromIndex == 'number' && fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = input && input.length; i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (array == null) return [];
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    if (array == null) return [];
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = array.length; i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, 'length').length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = list && list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    var i = 0, length = array && array.length;
    if (typeof isSorted == 'number') {
      i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
    } else if (isSorted && length) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (item !== item) {
      return _.findIndex(slice.call(array, i), _.isNaN);
    }
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  _.lastIndexOf = function(array, item, from) {
    var idx = array ? array.length : 0;
    if (typeof from == 'number') {
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
    }
    if (item !== item) {
      return _.findLastIndex(slice.call(array, 0, idx), _.isNaN);
    }
    while (--idx >= 0) if (array[idx] === item) return idx;
    return -1;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = array != null && array.length;
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createIndexFinder(1);

  _.findLastIndex = createIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    
    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of 
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;
  
  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],36:[function(require,module,exports){
'use strict';
var Constants = {};
Constants.DefaultTakeItemsCount = 50;
Constants.ExpandExpressionName = 'Expand';
Constants.ReturnAsFieldName = 'ReturnAs';
Constants.FieldsExpressionName = 'Fields';
Constants.SingleFieldExpressionName = 'SingleField';
Constants.SortExpressionName = 'Sort';
Constants.FilterExpressionName = 'Filter';
Constants.SkipExpressionName = 'Skip';
Constants.TakeExpressionName = 'Take';
Constants.ParentRelationFieldName = 'ParentRelationField';
Constants.IdFieldNameClient = 'Id';
Constants.TargetTypeNameFieldName = 'TargetTypeName';

module.exports = Constants;
},{}],37:[function(require,module,exports){
'use strict';
var Constants = require('./Constants');

/**
 * A class that is used to get all required information in order to process a set of relations.
 * @param parent - An ExecutionNode instance used to supply the tree like data structure.
 * @param relationNode - The relation node used to created the ExecutionNode instance (ExecutionNode instance should contain one or many relations
 * if they can be combined for batch execution).
 * @constructor
 */
var ExecutionNode = function (parent, relationNode) {
    var parentPath = '';
    if (parent) {
        parentPath = parent.path;
    }
    this.parent = parentPath;
    this.relations = [relationNode.path];
    this.name = relationNode.path;
    this.targetTypeName = relationNode.targetTypeName;
    this.canAddOtherRelations = !relationNode.filterExpression && !relationNode.sortExpression && !relationNode.take && !relationNode.skip;
    this.children = [];
    var path = '';
    if (parentPath) {
        path += parentPath + '.';
    }
    path += relationNode.targetTypeName;
    this.path = path;
};

/**
 * Inserts a RelationNode to an ExecutionNode.
 * @param relation - A Relation instance.
 */
ExecutionNode.prototype.insertRelationNode = function (relation) {
    this.relations.push(relation.path);
};

/**
 * Inserts a child node (which relations) depends from parent node result.
 * @param child - ExecutionNode instance representing child node.
 */
ExecutionNode.prototype.insertChildrenNode = function (child) {
    this.children.push(child.name);
};

/**
 * Helper method that checks if some relations could be combined (for example have same TargetType).
 * @param relation
 * @returns {boolean}
 */
ExecutionNode.prototype.canCombineWithRelation = function (relation) {
    if (!this.canAddOtherRelations) {
        return false;
    }

    return this.targetTypeName === relation.targetTypeName && !relation.filterExpression && !relation.sortExpression && !relation.take && !relation.skip;
};

/** ExecutionTree
 * Class that allows the creation of an execution tree from a relationTree. Used to process all queries (master and child) in a correct order.
 * @param relationTree - An instance of relation tree.
 * @constructor
 */
var ExecutionTree = function (relationTree) {
    this._relationTree = relationTree;
    this._map = {};
};

/**
 * Adds execution node to the ExecutionTree.
 * @param executionNode
 */
ExecutionTree.prototype.addExecutionNode = function (executionNode) {
    this._map[executionNode.name] = executionNode;
};

/**
 * Finds the ExecutionNode which contains the requested relation.
 * @param relation - A Relation instance.
 * @returns {*}
 */
ExecutionTree.prototype.getExecutionNodeOfRelation = function (relation) {
    for (var execNode in this._map) {
        if (this._map.hasOwnProperty(execNode)) {
            if (this._map[execNode].relations.indexOf(relation) > -1) {
                return this._map[execNode];
            }
        }
    }
    return null;
};

/**
 * Finds a RelationNode within the RelationTree.
 * @param relation - String that represents the relation within the RelationTree (for example: Activities.Likes.Role).
 * @returns {*}
 */
ExecutionTree.prototype.getRelationNode = function (relation) {
    if (relation) {
        return this._relationTree[relation] || null;
    } else {
        return null;
    }
};

ExecutionTree.prototype.getRootRelationNode = function () {
    return this._relationTree[this._relationTree.$root] || null;
};
/**
 * Builds the ExecutionTree from a RelationTree.
 */
ExecutionTree.prototype.build = function () {
    //build beginning from the root
    var relationRoot = this.getRelationNode(this._relationTree.$root);
    //Setup the root of the execution tree.
    var rootExecutionNode = new ExecutionNode(null, relationRoot);//no parent node
    this.addExecutionNode(rootExecutionNode);
    this.buildInternal(relationRoot);
};

/**
 * Traverse the relation tree and build the execution tree.
 * @param relationRoot - The root node of the RelationTree.
 */
ExecutionTree.prototype.buildInternal = function (relationRoot) {
    relationRoot.children.forEach(function (child) {
        var childRelationNode = this.getRelationNode(child);
        this.insertRelationNodeInExecutionTree(childRelationNode);
        this.buildInternal(childRelationNode);
    }, this);
};

/**
 * Inserts a relation node within the execution tree (based on its dependencies).
 * @param relation - The relation that will be inserted.
 */
ExecutionTree.prototype.insertRelationNodeInExecutionTree = function (relation) {
    var rootExecutionNode = this.getExecutionNodeOfRelation(relation.parent);
    var childToCombine = this.tryGetChildNodeToCombine(rootExecutionNode, relation);
    if (childToCombine) {//if there is a child that we combine the relation
        childToCombine.insertRelationNode(relation);
    } else {
        var newExecutionNode = new ExecutionNode(rootExecutionNode, relation);//create a separate execution node that will host the relation
        rootExecutionNode.insertChildrenNode(newExecutionNode);
        this.addExecutionNode(newExecutionNode);
    }
};

/**
 * Tries to find an ExecutionNode which could be combined with a relation.
 * @param rootExecutionNode - The root node of the ExecutionTree.
 * @param relation - Relation that will be added to the ExecutionTree.
 * @returns {*}
 */
ExecutionTree.prototype.tryGetChildNodeToCombine = function (rootExecutionNode, relation) {
    if (rootExecutionNode.canCombineWithRelation(relation)) {
        return rootExecutionNode;
    }
    var children = rootExecutionNode.children;
    for (var i = 0; i < children.length; i++) {
        var child = this._map[children[i]];
        var childToCombine = this.tryGetChildNodeToCombine(child, relation);
        if (childToCombine) {
            return childToCombine;
        }
    }
    return null;
};

/**
 * Gets the filter expression from all relations inside an ExecutionNode.
 * @param executionNode - The ExecutionNode instance.
 * @returns {{}}
 */
ExecutionTree.prototype.getFilterFromExecutionNode = function (executionNode, includeArrays) {
    var filter = {};
    var subRelationsFilter = [];
    for (var i = 0; i < executionNode.relations.length; i++) {
        var innerFilter = this.getFilterFromSingleRelation(this._relationTree[executionNode.relations[i]], includeArrays);
        if (innerFilter) {
            subRelationsFilter.push(innerFilter);
        }
    }

    if (subRelationsFilter.length > 1) {
        filter.$or = subRelationsFilter;
    } else if (subRelationsFilter.length > 0) {
        filter = subRelationsFilter[0];
    } else {
        filter = null;
    }
    return filter;
};

/**
 * Gets filter expression from a single relation. Traverse the relation tree in order to get the "Id"s from the result of parent relation
 * along with user defined filters.
 * @param relation - A Relation instance.
 * @returns {*}
 */
ExecutionTree.prototype.getFilterFromSingleRelation = function (relation, includeArrays) {
    var userDefinedFilter = relation.filterExpression;
    var parentRelationFilter = {};
    var parentRelationIds = this.getRelationFieldValues(relation, includeArrays);
    var parentRelationFieldName = (relation.isInvertedRelation ? relation.relationField : Constants.IdFieldNameClient);

    if (parentRelationIds.length > 0) {
        parentRelationFilter[parentRelationFieldName] = {'$in': parentRelationIds};
    } else {
        return null;
    }

    if (userDefinedFilter !== undefined) {
        var filters = [];
        filters.push(parentRelationFilter);
        filters.push(userDefinedFilter);
        return {'$and': filters};
    } else {
        return parentRelationFilter;
    }
};

/**
 * Get relation field values of parent relation in order to construct a proper filter (to create a relation).
 * @param relation - A relation instance which will get the filter.
 * @param includeArrays - Whether to include array valus of the parent items when calculating the items that will be expanded on the current level.
 * @returns {Array} - An array of relation field values.
 */
ExecutionTree.prototype.getRelationFieldValues = function (relation, includeArrays) {
    var parentRelationIds = [];
    var parentRelation = this._relationTree[relation.parent];
    // parentRelationResult actually is an Activity or Array of Activities
    var parentRelationResult = Array.isArray(parentRelation.result) ? parentRelation.result : [parentRelation.result];
    if (relation.isInvertedRelation) {
        for (var p = 0; p < parentRelationResult.length; p++) {
            parentRelationIds.push(parentRelationResult[p][relation.parentRelationField]);
        }
    } else {
        // all comments are related to expand of type content type Activities expand: {"Likes": true}
        if (parentRelation && parentRelation.result) {
            relation.parentRelationIds = relation.parentRelationIds || {};
            for (var i = 0; i < parentRelationResult.length; i++) {
                // itemFromParentRelation is single Activity
                var itemFromParentRelation = parentRelationResult[i];

                // parentRelationFieldValue is Activity.Likes
                var parentRelationFieldValue = itemFromParentRelation[relation.relationField];
                if (Array.isArray(parentRelationFieldValue)) {
                    relation.hasArrayValues = true;
                    if (includeArrays) {
                        for (var j = 0; j < parentRelationFieldValue.length; j++) {
                            // itemToExpandId is current value in Activity.Likes array or just a single "Id"
                            var itemToExpandId = parentRelationFieldValue[j];
                            if(itemToExpandId !== undefined && itemToExpandId !== null) {
                                parentRelationIds.push(itemToExpandId);
                                // we set any value just to create a map of Ids
                                relation.parentRelationIds[itemToExpandId] = 1;
                            }
                        }
                    }
                } else {
                    if(parentRelationFieldValue !== undefined && parentRelationFieldValue !== null) {
                        parentRelationIds.push(parentRelationFieldValue);
                        relation.parentRelationIds[parentRelationFieldValue] = 1;
                    }
                }
            }
        }
    }

    return parentRelationIds;
};

module.exports = ExecutionTree;

},{"./Constants":36}],38:[function(require,module,exports){
'use strict';
function ExpandError(message) {
    this.name = 'ExpandError';
    this.message = message;
    this.stack = (new Error()).stack;
}
ExpandError.prototype = new Error;
module.exports = ExpandError;
},{}],39:[function(require,module,exports){
'use strict';
var async = require('async');
var RelationTreeBuilder = require('./RelationTreeBuilder');
var ExecutionTree = require('./ExecutionTree');
var Constants = require('./Constants');
var ExpandError = require('./ExpandError');

function Processor(options) {
    this._executionNodeFunction = options.executionNodeFunction;
    this._metadataProviderFunction = options.metadataProviderFunction;
}

Processor.prototype._getExecutionTreeRoot = function (executionTree) {
    var executionTreeRoot = null;
    for (var exNode in executionTree) {
        if (executionTree.hasOwnProperty(exNode)) {
            if (executionTree[exNode].parent === '') {
                executionTreeRoot = executionTree[exNode];
                break;
            }
        }
    }
    return executionTreeRoot;
};

Processor.prototype._createExecuteNodeExecutor = function (relationsTree, executionTree, executionNode, expandContext) {
    var self = this;
    var relationsTreeMap = relationsTree.map;
    return function (done) {
        var relationNode = executionTree.getRelationNode(executionNode.relations[0]);//get the relation node for the only relation of the execution node.
        var parentRelationNode = executionTree.getRelationNode(relationNode.parent);
        var includeArrays = !(parentRelationNode.parent && parentRelationNode.hasArrayValues); //only expand array fields if the parent relation is not an array. This means that if we have expanded a Likes (multiple to Users), we won't expand any array relations that are nested in it such as the UserComments (multiple relation to Comments).
        var filter = executionTree.getFilterFromExecutionNode(executionNode, includeArrays);

        var errorMessage = relationsTree.validateSingleRelation(relationNode);
        if (errorMessage) {
            return done(new ExpandError(errorMessage));
        }

        // if we have such options executionNode should have only one relation.
        var node = {};
        node.select = relationNode.fieldsExpression;
        node.sort = relationNode.sortExpression;
        node.skip = relationNode.skip;
        node.take = relationNode.take;
        node.filter = filter;
        node.targetTypeName = relationNode.targetTypeName;

        self._executionNodeFunction.call(null, node, expandContext, function onProcessExecutionNode(err, result) {
            if (err) {
                return done(err);
            }

            for (var i = 0; i < executionNode.relations.length; i++) {
                var childRelation = relationsTreeMap[executionNode.relations[i]];
                childRelation.result = self._extractResultForRelation(relationsTreeMap[executionNode.relations[i]], result);
            }
            executionNode.result = childRelation.result;
            var arr = [];
            for (var j = 0; j < executionNode.children.length; j++) {
                var executionTreeMap = executionTree._map;
                arr.push(self._createExecuteNodeExecutor(relationsTree, executionTree, executionTreeMap[executionNode.children[j]], expandContext));
            }
            async.parallel(arr, done);
        });
    };
};

Processor.prototype._getSingleResult = function (relationsTree, relation, singleObject) {
    if (!singleObject) {
        return null;
    }

    var childRelation;
    var childItem;

    // if relation has singleFieldName option we just replace the parent id with a single value
    if (relation.singleFieldName) {
        if (relation.children && relation.children.length > 0) {
            childRelation = relationsTree[relation.children[0]];
            childItem = this._getObjectByIdFromArray(childRelation.result, singleObject[relation.singleFieldName]);
            return this._getSingleResult(relationsTree, childRelation, childItem);
        }
        return singleObject[relation.singleFieldName];
    }

    var result = {};
    var passedProperties = {};

    if (relation.children && relation.children.length > 0) {
        for (var j = 0; j < relation.children.length; j++) {
            childRelation = relationsTree[relation.children[j]];
            var childRelationField = childRelation.relationField;
            var userDefinedRelName = childRelation.userDefinedName;
            if (!childRelation.isInvertedRelation) {
                passedProperties[childRelationField] = 1;
            }

            var innerRelationResult = childRelation.result;

            if (childRelation.isInvertedRelation) {
                for (var k = 0; k < innerRelationResult.length; k++) {
                    this._addSingleResultToParentArray(relationsTree, childRelation, innerRelationResult[k], result, userDefinedRelName);
                }
            } else {
                result[userDefinedRelName] = childRelation.isArray() ? [] : null;

                if (singleObject[childRelationField]) {
                    if (Array.isArray(singleObject[childRelationField])) {
                        if (childRelation.sortExpression) {
                            // if there is a sorting we replace items using order of the query result
                            for (var p = 0; p < innerRelationResult.length; p++) {
                                if (singleObject[childRelationField].indexOf(innerRelationResult[p].Id) > -1) {
                                    childItem = innerRelationResult[p];
                                    this._addSingleResultToParentArray(relationsTree, childRelation, childItem, result, userDefinedRelName);
                                }
                            }
                        } else {
                            // we just replace items getting them by id which we have
                            for (var i = 0; i < singleObject[childRelationField].length; i++) {
                                childItem = this._getObjectByIdFromArray(innerRelationResult, singleObject[childRelationField][i]);
                                this._addSingleResultToParentArray(relationsTree, childRelation, childItem, result, userDefinedRelName);
                            }
                        }
                    } else {
                        childItem = this._getObjectByIdFromArray(innerRelationResult, singleObject[childRelationField]);
                        result[userDefinedRelName] = this._getSingleResult(relationsTree, childRelation, childItem);
                    }
                }
            }
        }
    }

    // add all other fields to the result (except the relation fields which we have already replaced).
    for (var prop in singleObject) {
        var propertyShouldBeAddedToResult = singleObject.hasOwnProperty(prop) && !passedProperties[prop] &&
            this._fieldExistInFieldsExpression(prop, relation.originalFieldsExpression);
        if (propertyShouldBeAddedToResult) {
            result[prop] = singleObject[prop];
        }
    }

    return result;
};

Processor.prototype._addSingleResultToParentArray = function (relationsTree, childRelation, childItem, result, userDefinedRelName) {
    var singleResult = this._getSingleResult(relationsTree, childRelation, childItem);
    result[userDefinedRelName] = result[userDefinedRelName] || [];
    if (singleResult) {
        result[userDefinedRelName].push(singleResult);
    }
};

/**
 * Checks if a field will be returned via given fields expression.
 * @param field - The name of the field.
 * @param fieldsExpression - The Fields expression which is checked.
 * @returns {*}
 */
Processor.prototype._fieldExistInFieldsExpression = function (field, fieldsExpression) {
    if (fieldsExpression === undefined || Object.keys(fieldsExpression).length === 0) {
        return true;
    }

    if (field === Constants.IdFieldNameClient) {
        if (fieldsExpression[field] === undefined) {
            return true;
        }
        return fieldsExpression[field];
    }

    var isExclusive = RelationTreeBuilder.getIsFieldsExpressionExclusive(fieldsExpression);

    if (isExclusive === undefined) {
        return true;
    }

    if (isExclusive) {
        return !fieldsExpression.hasOwnProperty(field);
    } else {
        return fieldsExpression.hasOwnProperty(field);
    }
};

/**
 * Extracts the result for a single relation (in cases when ExecutionNode contains more than one relations).
 * @param relation - The relation object.
 * @param queryResult - Result of the combined query.
 * @returns {Array}
 */
Processor.prototype._extractResultForRelation = function (relation, queryResult) {
    var result = [];
    for (var i = 0; i < queryResult.length; i++) {
        if (relation.parentRelationIds) {
            if (relation.parentRelationIds.hasOwnProperty(queryResult[i].Id)) {
                result.push(queryResult[i]);
            }
        }
        if (relation.isInvertedRelation) {
            result.push(queryResult[i]);
        }
    }
    return result;
};

/**
 * Gets an object with a given Id from Array.
 * @param array
 * @param id
 * @returns {*}
 */
Processor.prototype._getObjectByIdFromArray = function (array, id) {
    if (array) {
        for (var i = 0; i < array.length; i++) {
            if (array[i].Id === id) {
                return array[i];
            }
        }
    }
    return null;
};

/**
 * @public
 * @param expandExpression
 * @param mainTypeName
 * @param isArray
 * @param fieldsExpression
 * @param maxTakeValue
 * @param prepareContext
 * @param done
 */
Processor.prototype.prepare = function (expandExpression, mainTypeName, isArray, fieldsExpression, maxTakeValue, prepareContext, done) {
    var rtb = new RelationTreeBuilder(expandExpression, mainTypeName, isArray, fieldsExpression, maxTakeValue, this._metadataProviderFunction, prepareContext);
    rtb.build(function (err, map) {
        var mainQueryFieldsExpression;
        if (map) {
            mainQueryFieldsExpression = map[map.$root].fieldsExpression;
            var prepareResult = {
                relationsTree: rtb,
                mainQueryFieldsExpression: mainQueryFieldsExpression
            }
        }
        done(err, prepareResult);
    });
};

/**
 * @public
 * @param relationsTree
 * @param mainQueryResult
 * @param expandContext
 * @param done
 */
Processor.prototype.expand = function (relationsTree, mainQueryResult, expandContext, done) {
    var relationsTreeMap = relationsTree.map;
    var self = this;
    var executionTree = new ExecutionTree(relationsTreeMap);
    executionTree.build();
    relationsTreeMap[relationsTreeMap.$root].result = mainQueryResult;
    var executionTreeMap = executionTree._map;

    var executionTreeRoot = this._getExecutionTreeRoot(executionTreeMap);

    var maxQueriesCount = 20;
    if (Object.keys(executionTreeMap).length > maxQueriesCount) {
        done(new ExpandError('Expand expression results in more than ' + maxQueriesCount + ' inner queries!'));
    }

    if (executionTreeRoot) {
        var execFuncs = [];
        for (var i = 0; i < executionTreeRoot.children.length; i++) {
            execFuncs.push(this._createExecuteNodeExecutor(relationsTree, executionTree, executionTreeMap[executionTreeRoot.children[i]], expandContext));
        }
        // execFuncs are functions created for every single execution note
        // we execute them in async, since the result of the parent relation is used to get correct filter.
        async.series(execFuncs, function onProcessExecutionTree(err) {
            if (err) {
                done(err);
            } else {
                var output;
                var rootRelation = relationsTreeMap[relationsTreeMap.$root];
                if (Array.isArray(mainQueryResult)) {
                    output = [];
                    for (var i = 0; i < mainQueryResult.length; i++) {
                        var singleResult = self._getSingleResult(relationsTreeMap, rootRelation, mainQueryResult[i]);
                        if (singleResult) {
                            output.push(singleResult);
                        }
                    }
                } else {
                    output = self._getSingleResult(relationsTreeMap, rootRelation, mainQueryResult);
                }
                done(null, output);
            }
        });
    }
};

Processor.Constants = Constants;

module.exports = Processor;

},{"./Constants":36,"./ExecutionTree":37,"./ExpandError":38,"./RelationTreeBuilder":41,"async":42}],40:[function(require,module,exports){
'use strict';
var Constants = require('./Constants');
var _ = require('underscore');
var ExpandError = require('./ExpandError');

function RelationNode(options) {
    this.parent = options.parent;
    this.relationField = options.relationField;
    this.path = options.path || options.parent + '.' + options.relationField;
    this.fieldsExpression = options.fieldsExpression || {};
    this.targetTypeName = options.targetTypeName;
    this.children = [];
    this.isInvertedRelation = options.isInvertedRelation;
    this.isArrayRoot = options.isArrayRoot; //used for validation of cases where various expand features are disabled for a GetAll scenario.
    this.hasArrayValues = false;//set when we have executed the query. Used in validation scenarios where we do not have metadata about whether the relation is an array or not.

    var expandExpression = options.expandExpression || {};

    this.parentRelationField = expandExpression[Constants.ParentRelationFieldName] || Constants.IdFieldNameClient;
    var relationField = this.isInvertedRelation ? this.path : this.relationField; //inverted relations appear with the full path - ContentType.Field - in the result when expanding.
    this.userDefinedName = expandExpression[Constants.ReturnAsFieldName] || relationField;
    _.extend(this.fieldsExpression, expandExpression[Constants.FieldsExpressionName]);
    this.originalFieldsExpression = {};
    _.extend(this.originalFieldsExpression, this.fieldsExpression);
    this.singleFieldName = expandExpression[Constants.SingleFieldExpressionName];
    this.filterExpression = expandExpression[Constants.FilterExpressionName];
    this.sortExpression = expandExpression[Constants.SortExpressionName];
    this.skip = expandExpression[Constants.SkipExpressionName];
    this.take = this._getTakeLimit(expandExpression[Constants.TakeExpressionName], options.maxTakeValue);
}


/**
 * Gets the take limit depending on the application and the take value that the user has provided.
 * @param clientTakeValue
 * @param maxTakeValue
 * @returns {number}
 */
RelationNode.prototype._getTakeLimit = function (clientTakeValue, maxTakeValue) {
    maxTakeValue = maxTakeValue || Constants.DefaultTakeItemsCount;
    if (clientTakeValue) {
        if (clientTakeValue > maxTakeValue) {
            throw new ExpandError('The maximum allowed take value when expanding relations is ' + maxTakeValue + '!');
        }
        return clientTakeValue;
    } else {
        return maxTakeValue;
    }
};

/**
 * Anyone using the bs-expand-processor module can set whether the relation is a multiple relation in the prepare phase.
 * This will allow for certain restrictions to be enforced directly on the prepare phase instead of the execution phase.
 */
RelationNode.prototype.setIsArrayFromMetadata = function () {
    this.isArrayFromMetadata = true;
};

RelationNode.prototype.isArray = function () {
    // We can find out if a relation is an array in the following cases:
    // From metadata in the API Server.
    // All inverted relations are array.
    // Once values have been received we can find out. This is used for scenarios where we do not have metadata about the relation (offline storage in SDK).
    return this.isArrayFromMetadata || this.isInvertedRelation || this.hasArrayValues;
};

module.exports = RelationNode;

},{"./Constants":36,"./ExpandError":38,"underscore":43}],41:[function(require,module,exports){
'use strict';
var RelationNode = require('./RelationNode');
var _ = require('underscore');
var Constants = require('./Constants');
var ExpandError = require('./ExpandError');

//var relationFieldPropertyName = Constants.RelationExpressionName;

var possibleExpandOptions = [
    Constants.ExpandExpressionName,
    Constants.ReturnAsFieldName,
    Constants.FieldsExpressionName,
    Constants.SingleFieldExpressionName,
    Constants.SortExpressionName,
    Constants.FilterExpressionName,
    Constants.SkipExpressionName,
    Constants.TakeExpressionName,
    Constants.ParentRelationFieldName,
    Constants.TargetTypeNameFieldName
];


/**
 * A class used to parse Expand expression and build a corresponding relation tree.
 * In a process of creating the relation tree are performed several checks in order to force some limitations -
 * 50 items both for master and child queries and entire amount of all queries limited to 20.
 * Checks if the relation field given by the customer is valid (for example: user gives "Like" while the relation field is "Likes").
 * Checks for possible expand options.
 * @constructor
 */
var RelationTreeBuilder = function (expandExpression, mainTypeName, isArray, fieldsExpression, maxTakeValue, metadataProviderFunction, context) {
    this.maxTakeValue = maxTakeValue;
    this._metadataProviderFunction = metadataProviderFunction;
    this.context = context;
    this.expandExpression = this.processExpandExpression(expandExpression);
    // mark the main query in order to avoid some duplication issues.
    this.map = {};
    this.map[mainTypeName] = new RelationNode({
        targetTypeName: mainTypeName,
        isArrayRoot: isArray,
        fieldsExpression: fieldsExpression,
        validated: true,
        path: mainTypeName,
        maxTakeValue: maxTakeValue
    });
    this.map[mainTypeName].originalFieldsExpression = {};
    _.extend(this.map[mainTypeName].originalFieldsExpression, fieldsExpression);
    this.map.$root = mainTypeName;
};

/**
 * Creates fully qualified expand expression from shorthand usages:
 * {"Likes": true} -> {"Likes": {"ReturnAs": "Likes"}}
 * {"Likes": "LikesExpanded"} -> {"Likes": {"ReturnAs": "LikesExpanded"}}
 * @param expandExpression
 * @returns {*}
 */
RelationTreeBuilder.prototype.processExpandExpression = function (expandExpression) {
    for (var property in expandExpression) {
        if (expandExpression.hasOwnProperty(property)) {
            if (typeof expandExpression[property] === 'boolean') {
                expandExpression[property] = {};
                expandExpression[property][Constants.ReturnAsFieldName] = property;
            }
            if (typeof expandExpression[property] === 'string') {
                var relationField = expandExpression[property];
                expandExpression[property] = {};
                expandExpression[property][Constants.ReturnAsFieldName] = relationField;
            }
        }
    }
    return expandExpression;
};

/**
 * Builds the relation tree.
 * @param done
 */
RelationTreeBuilder.prototype.build = function (done) {
    try {
        this.buildMapInternal(this.expandExpression, this.map.$root);
    } catch (e) {
        return done(e);
    }
    var self = this;
    require('async').series([
        this.configureRelationTree.bind(this),
        this.validateRelationTree.bind(this)
    ], function (err) {
        done(err, self.map);
    });
};

/**
 *
 * @param relationName - A path to the external relation collection (Comments.ActivityId)
 * @param expandExpression - The expand expression that contains all information about the relation
 * @param rootName - Name of the parent relation.
 * @returns {RelationNode}
 */
RelationTreeBuilder.prototype.createInvertedRelation = function (relationName, expandExpression, rootName) {
    var options = {};
    var relationNameParts = relationName.split('.');
    options.parent = rootName;
    options.relationField = relationNameParts[1];
    options.isInvertedRelation = true;
    options.targetTypeName = relationNameParts[0];
    options.expandExpression = expandExpression;
    options.path = relationName;
    options.maxTakeValue = this.maxTakeValue;
    options.validated = false;

    return new RelationNode(options);
};

/**
 * An internal method which parses the expand expression and produces a basic relation tree (only names and parent relations).
 * @param expandExpression - The expand expression which will be processed.
 * @param rootName - The name of the root relation (master query) usually the name of the requested content type (Activities).
 */
RelationTreeBuilder.prototype.buildMapInternal = function (expandExpression, rootName) {
    for (var relationName in expandExpression) {
        if (expandExpression.hasOwnProperty(relationName)) {
            var currentExpression = expandExpression[relationName];

            for (var option in currentExpression) {
                if (currentExpression.hasOwnProperty(option) && possibleExpandOptions.indexOf(option) === -1) {
                    throw new ExpandError('\"' + option + '\"' + ' is not a valid option for Expand expression');
                }
            }

            if (relationName.indexOf('.') > -1) {
                var invertedRelation = this.createInvertedRelation(relationName, currentExpression, rootName);
                this.map[invertedRelation.path] = invertedRelation;
                this.map[invertedRelation.parent].children.push(invertedRelation.path);
                // adds a field expression in the original fields expression in order to get the result for that field
                RelationTreeBuilder.addFieldToFieldsExpression(this.map[invertedRelation.parent].originalFieldsExpression, invertedRelation.userDefinedName);

                if (expandExpression[relationName][Constants.ExpandExpressionName]) {
                    var processedExpandExpression = this.processExpandExpression(expandExpression[relationName][Constants.ExpandExpressionName]);
                    this.buildMapInternal(processedExpandExpression, invertedRelation.path);
                }
            } else {
                var options = {};
                options.relationField = relationName;
                options.parent = rootName;
                options.expandExpression = currentExpression;
                options.maxTakeValue = this.maxTakeValue;
                options.targetTypeName = currentExpression[Constants.TargetTypeNameFieldName];
                var relationNode = new RelationNode(options);
                var parentNode = this.map[options.parent];
                parentNode.children.push(relationNode.path);
                this.map[relationNode.path] = relationNode;

                if (currentExpression.hasOwnProperty(Constants.ExpandExpressionName)) {
                    if (typeof(currentExpression[Constants.ExpandExpressionName]) === 'object') {
                        this.buildMapInternal(this.processExpandExpression(currentExpression.Expand), relationNode.path);
                    } else {
                        throw new ExpandError(relationNode.path + '.Expand must be a valid expand expression!');
                    }
                }
            }
        }
    }
};

/**
 * Adds additional metadata which is necessary to execute a query.
 * Name of the content type of the child relation get via relation field.
 * @param done
 */
RelationTreeBuilder.prototype.configureRelationTree = function (done) {
    if (this._metadataProviderFunction) {
        var relationNames = [];
        var self = this;

        for (var rel in this.map) {
            if (this.map.hasOwnProperty(rel)) {
                if (this.map[rel].parent !== null) {
                    relationNames.push(this.map[rel].relationField);
                }
            }
        }

        this._metadataProviderFunction(relationNames, this.map, this.context, function (err, result) {
            done(err);
        });
    } else {
        return done();
    }
};

/**
 * Performs several checks like:
 * Validity of the relation field.
 * To not use filter or sorting expression within a "GetByFilter" scenario.
 * Does not allow to nest (expand multiple relation field) after a multiple relation.
 * Does not allow to use both "Fields" and "SingleField" options.
 * @param done
 * @returns {*}
 */
RelationTreeBuilder.prototype.validateRelationTree = function (done) {
    var errorMessage = '';
    var EOL = '\r\n';
    for (var relationPath in this.map) {
        if (relationPath !== '$root' && this.map.hasOwnProperty(relationPath)) {
            var relation = this.map[relationPath];
            errorMessage += this.validateSingleRelation(relation);
            this.configureFieldsExpressionsForRelation(relation);
        }
    }
    if (errorMessage !== '') {
        var finalErrorMessage = errorMessage.substr(0, errorMessage.lastIndexOf(EOL));
        var error = new ExpandError(finalErrorMessage);
        return done(error);
    } else {
        done();
    }
};

/**
 * Add relation fields to parent relation fields expression if needed (otherwise relation cannot be established).
 * @param relation - A relation which will be configured.
 */
RelationTreeBuilder.prototype.configureFieldsExpressionsForRelation = function (relation) {
    if (relation.parent) {
        var parentRelationFieldsExpression = this.map[relation.parent].fieldsExpression;
        if (relation.isInvertedRelation) {
            RelationTreeBuilder.addFieldToFieldsExpression(parentRelationFieldsExpression, relation.parentRelationField);
        } else {
            RelationTreeBuilder.addFieldToFieldsExpression(parentRelationFieldsExpression, relation.relationField);
        }
    }
    if (relation.isInvertedRelation) {
        RelationTreeBuilder.addFieldToFieldsExpression(relation.fieldsExpression, relation.relationField);
    } else {
        RelationTreeBuilder.addFieldToFieldsExpression(relation.fieldsExpression, Constants.IdFieldNameClient);
    }
    RelationTreeBuilder.adjustParentRelationFieldsExpression(this.map[relation.parent], relation);
};

/**
 * Validates a single relation for all build-in limitations.
 * @param relation - A relation which will be validated.
 * @returns {string} - Returns an error message with all errors or empty string if there is no errors.
 */
RelationTreeBuilder.prototype.validateSingleRelation = function (relation) {
    var errorMessage = '';
    var EOL = '\r\n';
    var isGetByFilterQuery = this.map[this.map.$root].isArrayRoot;

    if (relation.path === relation.parent) {
        errorMessage += relation.path + ' has same parent which will cause an infinite loop.' + EOL;
        return errorMessage;
    }

    if (relation.isArray()) {
        var multipleQueriesCount = this.getParentMultipleRelationsCount(relation);
        if (multipleQueriesCount > 0) {
            errorMessage += 'Expand expression has multiple relation \"' + relation.path + '\" inside a multiple relation.';
            errorMessage += EOL;
        }

        if (this.map[relation.parent] === this.map[this.map.$root] &&
            isGetByFilterQuery &&
            (relation.filterExpression || relation.sortExpression)) {
            errorMessage += 'Filter and Sort expressions are not allowed with GetByFilter scenario.';
            errorMessage += EOL;
        }

        if (isGetByFilterQuery && relation.isInvertedRelation) {
            errorMessage += 'Expanding an external content type is not allowed with GetByFilter scenario.';
            errorMessage += EOL;
        }
    }
    if (!relation.targetTypeName) {
        errorMessage += 'Expanding relation \"' + relation.relationField + '\" has no target type name specified. You should use \"TargetTypeName\" to specify it.';
        errorMessage += EOL;
    }
    if (relation.fieldsExpression && Object.keys(relation.fieldsExpression).length && relation.singleFieldName) {
        errorMessage += relation.path + ' ';
        errorMessage += 'expand expression contains both \"Fields\" and \"SingleField\" expressions.';
        errorMessage += EOL;
    }
    if (relation.singleFieldName) {
        if (relation.children) {
            if (relation.children.length > 1) {
                errorMessage += relation.path + ' has multiple expand expressions with a single field option.' + EOL;
            }
            if (relation.children.length === 1 && this.map[relation.children[0]].relationField !== relation.singleFieldName) {
                errorMessage += 'Expand expression ' + relation.path;
                errorMessage += ' single field \"' + relation.singleFieldName + '\"';
                errorMessage += ' does not match child relation field \"' + this.map[relation.children[0]].relationField + '\".';
                errorMessage += EOL;
            }
        }
    }

    return errorMessage;
};

/**
 * Gets the count of parent multiple relations.
 * @param relation - Starting relation.
 * @returns {number} - count of all parent multiple relations
 */
RelationTreeBuilder.prototype.getParentMultipleRelationsCount = function (relation) {
    var result = 0;
    var relationForLoop = relation;
    while (relationForLoop.parent) {
        var parentRelation = this.map[relationForLoop.parent];
        if (parentRelation.isArray() && parentRelation.parent) {
            result += 1;
        }
        relationForLoop = parentRelation;
    }
    return result;
};


/**
 * Adjusts fields expression of the parent relation based on paging setting of a relation (skip, take).
 * In that case we put a "$slice" option within the parent relation fields expression.
 * @param parentRelation
 * @param relation
 */
RelationTreeBuilder.adjustParentRelationFieldsExpression = function (parentRelation, relation) {
    if (!relation.isInvertedRelation && relation.take && typeof relation.take === 'number') {
        // when relation has filter or sorting skip and take should not be transferred to the parent relation as $slice.
        var shouldTransferPagingToParentRelation = relation.isArray() && !relation.filterExpression && !relation.sortExpression && parentRelation;
        if (shouldTransferPagingToParentRelation) {
            if (parentRelation.fieldsExpression === undefined) {
                parentRelation.fieldsExpression = {};
            }

            if (relation.skip && typeof relation.skip === 'number') {
                parentRelation.fieldsExpression[relation.relationField] = {
                    '$slice': [relation.skip, relation.take]
                };
            } else {
                parentRelation.fieldsExpression[relation.relationField] = {
                    '$slice': relation.take
                };
            }
            relation.take = null;
            relation.skip = null;
            relation.movedSkipTakeAsSlice = true;
        }
    }
};

/**
 * Adds field to parent relation fields expression. For example if the relation field is excluded from the master request.
 * @param fieldsExpression - Fields expression of the parent relation.
 * @param relationField - Name of the field which should be returned.
 */
RelationTreeBuilder.addFieldToFieldsExpression = function (fieldsExpression, relationField) {
    if (fieldsExpression === undefined || Object.keys(fieldsExpression).length === 0) {
        return;
    }
    var isExclusive = RelationTreeBuilder.getIsFieldsExpressionExclusive(fieldsExpression);

    if (isExclusive === undefined) {
        return;
    }

    if (isExclusive) {
        delete fieldsExpression[relationField];
    } else {
        fieldsExpression[relationField] = 1;
    }
};

/**
 * Gets if the fields expression is exclusive ("FieldName" : 0)
 * @param fieldsExpression - Fields expression to check.
 * @returns {*}
 */
RelationTreeBuilder.getIsFieldsExpressionExclusive = function (fieldsExpression) {
    var isExclusive;
    for (var fieldName in fieldsExpression) {
        if (fieldName !== Constants.IdFieldNameClient && fieldsExpression.hasOwnProperty(fieldName)) {
            if (isExclusive === undefined) {
                if (fieldsExpression[fieldName] === 0) {
                    isExclusive = true;
                    break;
                } else {
                    if (typeof fieldsExpression[fieldName] === 'object') {
                        continue;
                    } else {
                        // fieldsExpression[fieldName] === 1
                        isExclusive = false;
                        break;
                    }
                }
            }
        }
    }
    return isExclusive;
};

module.exports = RelationTreeBuilder;

},{"./Constants":36,"./ExpandError":38,"./RelationNode":40,"async":42,"underscore":43}],42:[function(require,module,exports){
(function (process){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
/*jshint onevar: false, indent:4 */
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(done) );
        });
        function done(err) {
          if (err) {
              callback(err);
              callback = function () {};
          }
          else {
              completed += 1;
              if (completed >= arr.length) {
                  callback();
              }
          }
        }
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        if (!callback) {
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err) {
                    callback(err);
                });
            });
        } else {
            var results = [];
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err, v) {
                    results[x.index] = v;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        var remainingTasks = keys.length
        if (!remainingTasks) {
            return callback();
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            remainingTasks--
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (!remainingTasks) {
                var theCallback = callback;
                // prevent final callback from calling itself if it errors
                callback = function () {};

                theCallback(null, results);
            }
        });

        _each(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var attempts = [];
        // Use defaults if times not passed
        if (typeof times === 'function') {
            callback = task;
            task = times;
            times = DEFAULT_TIMES;
        }
        // Make sure times is a number
        times = parseInt(times, 10) || DEFAULT_TIMES;
        var wrappedTask = function(wrappedCallback, wrappedResults) {
            var retryAttempt = function(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            };
            while (times) {
                attempts.push(retryAttempt(task, !(times-=1)));
            }
            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || callback)(data.err, data.result);
            });
        }
        // If a callback is passed, run this as a controll flow
        return callback ? wrappedTask() : wrappedTask
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!_isArray(tasks)) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (test.apply(null, args)) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (!test.apply(null, args)) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            started: false,
            paused: false,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            kill: function () {
              q.drain = null;
              q.tasks = [];
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                if (q.paused === true) { return; }
                q.paused = true;
                q.process();
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                q.process();
            }
        };
        return q;
    };
    
    async.priorityQueue = function (worker, concurrency) {
        
        function _compareTasks(a, b){
          return a.priority - b.priority;
        };
        
        function _binarySearch(sequence, item, compare) {
          var beg = -1,
              end = sequence.length - 1;
          while (beg < end) {
            var mid = beg + ((end - beg + 1) >>> 1);
            if (compare(item, sequence[mid]) >= 0) {
              beg = mid;
            } else {
              end = mid - 1;
            }
          }
          return beg;
        }
        
        function _insert(q, data, priority, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  priority: priority,
                  callback: typeof callback === 'function' ? callback : null
              };
              
              q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }
        
        // Start with a normal queue
        var q = async.queue(worker, concurrency);
        
        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
          _insert(q, data, priority, callback);
        };
        
        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            drained: true,
            push: function (data, callback) {
                if (!_isArray(data)) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    cargo.drained = false;
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain && !cargo.drained) cargo.drain();
                    cargo.drained = true;
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0, tasks.length);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.nextTick(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    async.compose = function (/* functions... */) {
      return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'))

},{"_process":4}],43:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],44:[function(require,module,exports){
var EverliveError = require('./EverliveError').EverliveError;
var constants = require('./constants');
var _ = require('underscore');

module.exports = (function () {

    function AutoQueue(maxConcurrentTasks) {
        maxConcurrentTasks = parseInt(maxConcurrentTasks || constants.MaxConcurrentDownloadTasks);

        if (isNaN(maxConcurrentTasks) || maxConcurrentTasks <= 0) {
            throw new EverliveError('The maxConcurrentTasks must be a number larger than 0');
        }

        this.maxConcurrentTasks = maxConcurrentTasks;
        this.runningTasksCount = 0;
        this.tasks = [];
    }

    AutoQueue.prototype = {
        /**
         * @param {Function} task
         * @param {Function} taskSuccess
         * @param {Function} taskError
         */
        enqueue: function (task, taskSuccess, taskError) {
            if (!_.isFunction(taskSuccess) || !_.isFunction(taskError)) {
                throw new EverliveError('taskSuccess and taskError functions must be provided');
            }

            var args = [].splice.call(arguments, 3);

            this.tasks.push({
                task: task,
                args: args,
                success: taskSuccess,
                error: taskError
            });

            this._runNext();
        },

        _runNext: function () {
            var self = this;

            if (self.runningTasksCount === self.maxConcurrentTasks || !self.tasks.length) {
                return;
            }

            self.runningTasksCount++;

            var nextTask = this.tasks.shift();
            var task = nextTask.task;
            var args = nextTask.args;
            var taskSuccess = nextTask.success;
            var taskError = nextTask.error;

            args.unshift(function executedCallback(err) {
                self.runningTasksCount--;

                if (err) {
                    taskError(err);
                } else {
                    taskSuccess.apply(null, [].splice.call(arguments, 1));
                }

                self._runNext();
            });

            task.apply(null, args);
        }
    };

    return AutoQueue;
}());
},{"./EverliveError":47,"./constants":59,"underscore":35}],45:[function(require,module,exports){
'use strict';

var EventEmitter = require('events').EventEmitter;

var apply = function apply(obj) {
    obj._emitter = new EventEmitter();

    obj._emitterProxy = function (event, args) {
        obj._emitter[event].apply(obj._emitter, args);
    };

    obj.addListener = function () {
        obj._emitterProxy('addListener', arguments);
    };

    obj.on = obj.addListener;

    obj.removeListener = function () {
        obj._emitterProxy('removeListener', arguments);
    };

    obj.off = obj.removeListener;

    obj.once = function () {
        obj._emitterProxy('once', arguments);
    };

    obj.removeAllListeners = function () {
        obj._emitterProxy('removeAllListeners', arguments);
    };
};

module.exports = {
    apply: apply
};
},{"events":1}],46:[function(require,module,exports){
var Setup = require('./Setup');
var Data = require('./types/Data');
var usersModule = require('./types/Users');
var filesModule = require('./types/Files');
var constants = require('./constants');
var utils = require('./utils');
var buildAuthHeader = utils.buildAuthHeader;
var Push = require('./Push');
var Authentication = require('./auth/Authentication');
var offlineModule = require('./offline/offline');
var caching = require('./caching/caching');
var Request = require('./Request');
var common = require('./common');
var rsvp = common.rsvp;
var _ = common._;
var EverliveError = require('./EverliveError').EverliveError;
var EverliveErrors = require('./EverliveError').EverliveErrors;
var helpers = require('./helpers/helpers');
var EventEmitterProxy = require('./EventEmitterProxy');

// Registering mixins:
var mixins = require('./mixins/mixins');

module.exports = (function () {

    // The constructor of Everlive instances.
    // The entry point for the SDK.

    /**
     * @class Everlive
     * @classdesc The constructor of the {{site.bs}} (Everlive) JavaScript SDK. This is the entry point for the SDK.
     * @param {object|string} options - An object containing configuration options for the Setup object. Alternatively, you can pass a string representing your App ID.
     * @param {string} options.apiKey - Your API Key. *Deprecated*: use options.appId instead.
     * @param {string} options.appId - Your app's App ID.
     * @param {string} [options.url=//api.everlive.com/v1/] - The {{site.TelerikBackendServices}} URL.
     * @param {string} [options.token] - An authentication token. The instance will be associated with the provided previously obtained token.
     * @param {string} [options.tokenType=bearer] - The type of the token that is used for authentication.
     * @param {string} [options.scheme=http] - The URI scheme used to make requests. Supported values: http, https
     * @param {boolean} [options.parseOnlyCompleteDateTimeObjects=false] - If set to true, the SDK will parse only complete date strings (according to the ISO 8601 standard).
     * @param {boolean} [options.emulatorMode=false] - Set this option to true to set the SDK in emulator mode.
     * @param {object|boolean} [options.offline] - Set this option to true to enable Offline Support using the default offline settings.
     * @param {boolean} [options.offline.enabled=false] - When using an object to initialize Offline Support with non-default settings, set this option to enable or disable Offline Support.
     * @param {boolean} [options.offline.isOnline=true] - Whether the storage is in online mode initially.
     * @param {ConflictResolutionStrategy|function} [options.offline.conflicts.strategy=ConflictResolutionStrategy.ClientWins] - A constant specifying the conflict resolution strategy or a function used to resolve the conflicts.
     * @param {object} [options.offline.storage] - An object specifying settings for the offline storage.
     * @param {string} [options.offline.storage.provider=_platform dependant_] - Allows you to select an offline storage provider. Possible values: Everlive.Constants.StorageProvider.LocalStorage, Everlive.Constants.StorageProvider.FileSystem, Everlive.Constants.StorageProvider.Custom. Default value: Cordova, Web: Everlive.Constants.StorageProvider.LocalStorage; NativeScript, Node.js: Everlive.Constants.StorageProvider.FileSystem.
     * @param {string} [options.offline.storage.storagePath=el_store] - A relative path specifying where data will be saved if the FileSystem provider is used.
     * @param {number} [options.offline.storage.requestedQuota=10485760] - How much memory (in bytes) to be requested when using FileSystem for persistence. This option is only valid for Chrome as the other platforms use all the available space.
     * @param {object} [options.offline.storage.implementation] - When storage.provider is set to custom, use this object to specify your custom offline storage implementation.
     * @param {string} [options.offline.encryption.key] - A key that will be used to encrypt the data stored offline.
     * @param {string} [options.offline.files.storagePath=el_file_store] - A relative path specifying where the files will be saved if file system is used for persistence of files in offline mode.
     * @param {string} [options.offline.files.metaPath=el_file_mapping] - A relative path specifying where the metadata file will be saved if file system is used for persistence of files in offline mode.
     * @param {object|boolean} [options.offline.files] - Set this option to true to enable support for files in offline mode.
     * @param {number} [options.offline.files.maxConcurrentDownloads] - The maximum amount of files that can be downloaded simultaneously.
     * @param {boolean} [options.authentication.persist=false] - Indicates whether the current user's authentication will be persisted.
     * @param {Function} [options.authentication.onAuthenticationRequired] - Invoked when the user's credentials have expired. Allowing you to perform custom logic.
     * @param {object} [options.helpers] - An object holding options for all Everlive helper components.
     * @param {object} [options.helpers.html] - HTML Helper configuration objects.
     * @param {boolean} [options.helpers.html.processOnLoad=false] - Whether to process all HTML elements when the window loads.
     * @param {boolean} [options.helpers.html.processOnResize=false] - Whether to process all HTML elements when the window resizes.
     * @param {string} [options.helpers.html.loadingImageUrl] - The image to be displayed while the original image is being processed.
     * @param {string} [options.helpers.html.errorImageUrl] - The image to be displayed when the original image processing fails.
     * @param {object} [options.helpers.html.attributes] - HTML Helper attributes configuration object.
     * @param {object} [options.helpers.html.attributes.loadingImage=data-loading-image] - A custom name for the attribute to be used to set a loading image.
     * @param {object} [options.helpers.html.attributes.errorImage=data-error-image] - A custom name for the attribute to be used to set an error image.
     * @param {object} [options.helpers.html.attributes.dpi=data-dpi] - A custom name for the attribute to be used to specify DPI settings.
     * @param {object} [options.helpers.html.attributes.imageSource=data-src] - A custom name for the attribute to be used to set the image source.
     * @param {object} [options.helpers.html.attributes.fileSource=data-href] - A custom name for the attribute to be used to set the anchor source.
     * @param {object} [options.helpers.html.attributes.enableOffline=data-offline] - A custom name for the attribute to be used to control offline processing.
     * @param {object} [options.helpers.html.attributes.enableResponsive=data-responsive] - A custom name for the attribute to be used to control Responsive Images processing.
     * @param {object|boolean} [options.caching=false] - Set this option to true to enable caching using the default cache settings.
     * @param {number} [options.caching.maxAge=60] - Global setting for maximum age of cached items in minutes.
     * @param {boolean} [options.caching.enabled=false] - Global setting for enabling or disabling cache.
     * @param {object} [options.caching.typeSettings] - Specify per-content-type settings that override the global settings.
     */
    function Everlive(options) {
        var self = this;
        this.setup = new Setup(options);
        _.each(initializations, function (init) {
            init.func.call(self, options);
        });

        if (Everlive.$ === null) {
            Everlive.$ = self;
        }

        EventEmitterProxy.apply(this);
    }

    /**
     * Adds an event listener to the SDK.
     * @method addListener
     * @param {String} eventName The name of the event to which to subscribe.
     * @param {Function} eventListener An event listener which will be called once the event is raised.
     * @memberOf Everlive.prototype
     */

    /**
     * Adds an event listener to the SDK.
     * @method on
     * @param {String} eventName The name of the event to which to subscribe.
     * @param {Function} eventListener An event listener which will be called once the event is raised.
     * @memberOf Everlive.prototype
     */

    /**
     * Removes an SDK event listener.
     * @method removeListener
     * @param {String} eventName The name of the event for which to stop listening.
     * @param {Function} eventListener The event listener to remove.
     * @memberOf Everlive.prototype
     */

    /**
     * Removes an SDK event listener.
     * @method off
     * @param {Function} eventListener
     * @memberOf Everlive.prototype
     */

    /**
     * Adds an event listener to the SDK which will be called only the first time the event is emitted.
     * @method once
     * @param {String} eventName The name of the event to which to subscribe.
     * @param {Function} eventListener An event listener which will be called once the event is raised.
     * @memberOf Everlive.prototype
     */

    /**
     * Removes all SDK event listeners.
     * @memberOf Everlive.prototype
     * @method removeAllListeners
     */

    /** Reference to the current {{site.TelerikBackendServices}} (Everlive) JavaScript SDK.
     * @memberOf Everlive
     * @type {Everlive}
     * @static
     */
    Everlive.$ = null;
    Everlive.idField = constants.idField;


    // An array keeping initialization functions called by the Everlive constructor.
    // These functions will be used to extend the functionality of an Everlive instance.
    var initializations = [];

    /** An array of functions that are invoked during instantiation of the {{site.TelerikBackendServices}} (Everlive) JavaScript SDK.
     * @memberOf Everlive
     * @type {Function[]}
     * @static
     * @private
     */
    Everlive.initializations = initializations;

    Everlive.init = function (options) {
        Everlive.$ = null;
        return new Everlive(options);
    };

    /**
     * Creates a new {@link Data} class.
     * @memberOf Everlive.prototype
     * @instance
     * @param {String} collectionName The name of the collection to be used.
     * @returns {Data}
     */
    Everlive.prototype.data = function (collectionName) {
        return new Data(this.setup, collectionName, this.offlineStorage, this);
    };

    /**
     * Returns the URL to the {{site.bs}} application endpoint that the SDK uses.
     * @memberOf Everlive.prototype
     * @method buildUrl
     * @returns {string} The generated URL.
     */
    Everlive.prototype.buildUrl = function () {
        return utils.buildUrl(this.setup);
    };

    /**
     * Generates the Authorization headers that are used by the {{site.TelerikBackendServices}} (Everlive) JavaScript SDK to make requests to the {{site.bs}} servers.
     * @memberOf Everlive
     * @returns {Object} AuthorizationHeaders The generated Authorization headers object.
     */
    Everlive.prototype.buildAuthHeader = function () {
        return buildAuthHeader(this.setup);
    };

    Everlive.disableRequestCache = utils.disableRequestCache;

    Everlive.AuthStatus = constants.AuthStatus;

    /**
     * Gets the current authentication status of the {{site.TelerikBackendServices}} JavaScript SDK instance.
     * @memberOf Everlive.prototype
     * @method authInfo
     * @name authInfo
     * @deprecated
     * @see {@link Authentication.getAuthenticationStatus}
     * @returns {Promise} A promise to the authentication status.
     */
    /**
     * Gets the current authentication status of the {{site.TelerikBackendServices}} JavaScript SDK instance.
     * @memberOf Everlive.prototype
     * @method authInfo
     * @name authInfo
     * @deprecated
     * @see {@link Authentication.getAuthenticationStatus}
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Everlive.prototype.authInfo = function (success, error) {
        var self = this;
        return utils.buildPromise(function (success, error) {
            var setup = self.setup;
            if (setup.masterKey) {
                return success({status: Everlive.AuthStatus.masterKey});
            }

            if (!setup.token) {
                return success({status: Everlive.AuthStatus.unauthenticated});
            }

            if (self.authentication && self.authentication.isAuthenticationInProgress()) {
                return success({status: Everlive.AuthStatus.authenticating});
            }

            self.Users
                .skipAuth(true)
                .currentUser()
                .then(function (res) {
                    return success({status: Everlive.AuthStatus.authenticated, user: res.result});
                }, function (err) {
                    if (self.authentication && self.authentication.isAuthenticationInProgress()) {
                        return success({status: Everlive.AuthStatus.authenticating});
                    } else if (err.code === EverliveErrors.invalidRequest.code || err.code === EverliveErrors.expiredToken.code) { // invalid request, i.e. the access token is invalid or missing
                        return success({status: Everlive.AuthStatus.invalidAuthentication});
                    } else {
                        return error(err);
                    }
                });
        }, success, error);
    };

    /**
     * Make a request to the current {{site.bs}} JavaScript SDK instance.
     * @method request
     * @memberOf Everlive.prototype
     * @param {object} options Object used to configure the request.
     * @param {object} [options.endpoint] The endpoint of the {{site.bs}} JavaScript API relative to the App ID section. (For example, options.endpoint = MyType will make a request to the MyType type.)
     * @param {HttpMethod} [options.method] HTTP request method.
     * @param {object} [options.data] Data to be sent with the request.
     * @param {Function} [options.success] Success callback that will be called when the request finishes successfully.
     * @param {Function} [options.error] Error callback to be called in case of an error.
     * @param {object} [options.headers] Additional headers to be included in the request.
     * @param {Query|object} [options.filter] This is either a {@link Query} or a [filter](http://docs.telerik.com/platform/backend-services/rest/queries/queries-filtering) expression.
     * @param {boolean} [options.authHeaders=true] When set to false, no Authorization headers will be sent with the request.
     * @returns {function} The request configuration object containing the `send` function that sends the request.
     */
    Everlive.prototype.request = function (options) {
        return new Request(this.setup, options);
    };

    function protectOfflineEnabled() {
        if (!this._isOfflineStorageEnabled()) {
            throw new EverliveError('You have instantiated the SDK without support for offline storage');
        }
    }

    Everlive.prototype._isOfflineStorageEnabled = function () {
        var offlineStorageOptions = this.setup.offlineStorage || this.setup.offline;
        return offlineStorageOptions && offlineStorageOptions.enabled !== false;
    };

    /**
     * Sets the SDK to work in offline mode.
     * @method offline
     * @memberOf Everlive.prototype
     * @param {boolean} [isOffline = true] Boolean parameter for setting the SDK to online or offline mode.
     */
    Everlive.prototype.offline = function () {
        protectOfflineEnabled.call(this);

        var isOffline;
        if (arguments.length === 0) {
            isOffline = true;
        } else {
            isOffline = arguments[0] == true;
        }
        this.offlineStorage._setOffline(isOffline);
    };

    /**
     * Sets the SDK to work in online mode.
     * @method online
     * @memberOf Everlive.prototype
     * @param {boolean} [isOnline = true] Boolean parameter for setting the SDK to online or offline mode.
     */
    Everlive.prototype.online = function () {
        protectOfflineEnabled.call(this);

        var isOnline;
        if (arguments.length === 0) {
            isOnline = true;
        } else {
            isOnline = arguments[0] == true;
        }
        this.offlineStorage._setOffline(!isOnline);
    };

    /**
     * Check if the SDK is in offline mode.
     * @method isOffline
     * @memberOf Everlive.prototype
     * @returns {boolean} Returns true if the SDK is in offline mode.
     */
    Everlive.prototype.isOffline = function () {
        protectOfflineEnabled.call(this);
        return !this.isOnline();
    };

    /**
     * Check if the SDK is in online mode.
     * @method isOnline
     * @memberOf Everlive.prototype
     * @returns {boolean} Returns true if the SDK is in online mode.
     */
    Everlive.prototype.isOnline = function () {
        return this.offlineStorage.isOnline();
    };

    /**
     * Starts the synchronization procedure. Emits the 'syncStart' event when started and the 'syncEnd' event when the procedure finishes. 'syncEnd' contains information about the completed sync operation that you can use to find out how many items were synchronized.
     * @method sync
     * @memberOf Everlive.prototype
     */
    Everlive.prototype.sync = function () {
        protectOfflineEnabled.call(this);
        return this.offlineStorage.sync.apply(this.offlineStorage, arguments);
    };

    var initDefault = function initDefault() {
        var users = this.data('Users');
        usersModule.addUsersFunctions(users, this);

        /**
         * @memberOf Everlive
         * @instance
         * @deprecated
         * @see {@link Everlive.users}
         * @description An instance of the [Users]{@link Users} class for working with users.
         * @member {Users} Users
         */
        this.Users = users;

        /**
         * @memberOf Everlive
         * @instance
         * @description An instance of the [Users]{@link Users} class for working with users.
         * @member {Users} users
         */
        this.users = users;

        var files = this.data('Files');
        filesModule.addFilesFunctions(files);

        /**
         * @memberOf Everlive
         * @instance
         * @deprecated Use everlive.files instead
         * @see {@link Everlive.files}
         * @description An instance of the [Files]{@link Files} class for working with files.
         * @member {Files} Files
         */
        this.Files = files;

        /**
         * @memberOf Everlive
         * @instance
         * @description An instance of the [Files]{@link Files} class for working with files.
         * @member {Files} files
         */
        this.files = files;

        /**
         * @memberOf Everlive
         * @instance
         * @description An instance of the [Push]{@link Push} class for working with push notifications.
         * @member {Push} push
         */
        this.push = new Push(this);
    };

    var initAuthentication = function initAuthentication() {
        /**
         * @memberOf Everlive
         * @instance
         * @description An instance of the [Authentication]{@link Authentication} class for working with the authentication of the SDK.
         * @member {Authentication} authentication
         */
        /**
         * @memberOf Everlive
         * @instance
         * @description An instance of the [Authentication]{@link Authentication} class for working with the authentication of the SDK.
         * @member {authentication} authentication
         */
        this.authentication = this.Authentication = new Authentication(this, this.setup.authentication);
    };

    var initializeHelpers = function initializeHelpers(options) {
        var self = this;
        self.helpers = {};

        _.each(helpers, function (helper) {
            var helperOptions = options.helpers ? options.helpers[helper.name] : null;
            self.helpers[helper.name] = new helper.ctor(self, helperOptions);
        });
    };

    initializations.push({name: 'caching', func: caching.initCaching});
    initializations.push({name: 'offlineStorage', func: offlineModule.initOfflineStorage});
    initializations.push({name: 'cacheStore', func: caching._initStore});
    initializations.push({name: 'default', func: initDefault});
    initializations.push({name: 'authentication', func: initAuthentication});
    initializations.push({name: 'helpers', func: initializeHelpers});

    return Everlive;
}());

},{"./EventEmitterProxy":45,"./EverliveError":47,"./Push":51,"./Request":52,"./Setup":53,"./auth/Authentication":54,"./caching/caching":57,"./common":58,"./constants":59,"./helpers/helpers":62,"./mixins/mixins":68,"./offline/offline":76,"./types/Data":97,"./types/Files":98,"./types/Users":99,"./utils":100}],47:[function(require,module,exports){
var EverliveErrors = {
    itemNotFound: {
        code: 801,
        message: 'Item not found.'
    },
    syncConflict: {
        code: 10001,
        message: 'A conflict occurred while syncing data.'
    },
    syncError: {
        code: 10002,
        message: 'Synchronization failed for item.'
    },
    syncInProgress: {
        code: 10003,
        message: 'Cannot perform operation while synchronization is in progress.'
    },
    syncCancelledByUser: {
        code: 10004,
        message: 'Synchronization cancelled by user.'
    },
    operationNotSupportedOffline: {
        code: 20000 // the error message is created dynamically based on the query filter for offline storage
    },
    invalidId: {
        code: 20001,
        message: 'Invalid or missing Id in model.'
    },
    generalDatabaseError: {
        code: 107,
        message: 'General database error.'
    },
    invalidToken: {
        code: 301,
        message: 'Invalid access token.'
    },
    expiredToken: {
        code: 302,
        message: 'Expired access token.'
    },
    invalidExpandExpression: {
        code: 618,
        message: 'Invalid expand expression.'
    },
    invalidRequest: {
        code: 601,
        message: 'Invalid request.'
    },
    missingContentType: {
        code: 701,
        message: 'ContentType not specified.'
    },
    missingOrInvalidFileContent: {
        code: 702,
        message: 'Missing or invalid file content.'
    },
    customFileSyncNotSupported: {
        code: 703,
        message: 'Custom ConflictResolution for files is not allowed.'
    },
    cannotDownloadOffline: {
        code: 704,
        message: 'Cannot download a file while offline.'
    },
    cannotForceCacheWhenDisabled: {
        code: 705,
        message: 'Cannot use forceCache while the caching is disabled.'
    },
    filesNotSupportedInBrowser: {
        code: 706,
        message: 'Offline files are not supported in web browsers.'
    }
};

var EverliveError = (function () {
    function EverliveError(message, code) {
        var tmpError = Error.apply(this);

        if (typeof message === 'object') {
            var err = message;
            message = err.message;
            code = err.code;
        }

        tmpError.message = message;
        tmpError.code = code || 0;
        tmpError.name = this.name = 'EverliveError';

        this.message = tmpError.message;
        this.code = code;

        Object.defineProperty(this, 'stack', {
            get: function () {
                return tmpError.stack
            }
        });

        return this;
    }

    EverliveError.prototype = Object.create(Error.prototype);
    EverliveError.prototype.toJSON = function () {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            stack: this.stack
        };
    };

    return EverliveError;
}());

var DeviceRegistrationError = (function () {
    var DeviceRegistrationError = function (errorType, message, additionalInformation) {
        EverliveError.call(this, message);
        this.errorType = errorType;
        this.message = message;
        if (additionalInformation !== undefined) {
            this.additionalInformation = additionalInformation;
        }
    };

    DeviceRegistrationError.prototype = Object.create(EverliveError.prototype);

    DeviceRegistrationError.fromEverliveError = function (everliveError) {
        var deviceRegistrationError = new DeviceRegistrationError(DeviceRegistrationErrorTypes.EverliveError, everliveError.message, everliveError);
        return deviceRegistrationError;
    };

    DeviceRegistrationError.fromPluginError = function (errorObj) {
        var message = 'A plugin error occurred';
        if (errorObj) {
            if (typeof errorObj.error === 'string') {
                message = errorObj.error;
            } else if (typeof errorObj.message === 'string') {
                message = errorObj.message;
            }
        }

        var deviceRegistrationError = new DeviceRegistrationError(DeviceRegistrationErrorTypes.PluginError, message, errorObj);
        return deviceRegistrationError;
    };

    var DeviceRegistrationErrorTypes = {
        EverliveError: 1,
        PluginError: 2
    };

    return DeviceRegistrationError;
}());

module.exports = {
    EverliveError: EverliveError,
    EverliveErrors: EverliveErrors,
    DeviceRegistrationError: DeviceRegistrationError
};
},{}],48:[function(require,module,exports){
var Processor = require('./common').Processor;
var DataQuery = require('./query/DataQuery');
var Query = require('./query/Query');
var EverliveError = require('./EverliveError').EverliveError;
var constants = require('./constants');

module.exports = (function () {
    return new Processor({
        executionNodeFunction: function (node, expandContext, done) {
            var targetTypeName = node.targetTypeName.toLowerCase() === constants.FilesTypeNameLegacy ? constants.FilesTypeName : node.targetTypeName;

            var query = new DataQuery({
                operation: DataQuery.operations.Read,
                collectionName: targetTypeName,
                filter: new Query(node.filter, node.select, node.sort, node.skip, node.take)
            });

            expandContext.offlineModule.processQuery(query).then(function (data) {
                done(null, data.result);
            }, done);
        }
    });
}());

},{"./EverliveError":47,"./common":58,"./constants":59,"./query/DataQuery":85,"./query/Query":87}],49:[function(require,module,exports){
module.exports = (function () {
    function Expression(operator, operands) {
        this.operator = operator;
        this.operands = operands || [];
    }

    Expression.prototype = {
        addOperand: function (operand) {
            this.operands.push(operand);
        }
    };

    return Expression;
}());
},{}],50:[function(require,module,exports){
module.exports = (function () {
    //TODO add a function for calculating the distances in geospatial queries

    /**
     * @classdesc A class representing a value for the {{site.TelerikBackendServices}} GeoPoint field.
     * @class GeoPoint
     * @param longitude Longitude of the GeoPoint in decimal degrees (range: -180 to 180). Example: `123.3239467`
     * @param latitude Latitude of the GeoPoint in decimal degrees (range: -90 to 90). Example: `42.6954322`
     */
    function GeoPoint(longitude, latitude) {
        this.longitude = longitude || 0;
        this.latitude = latitude || 0;
    }

    return GeoPoint;
}());
},{}],51:[function(require,module,exports){
var utils = require('./utils');
var buildPromise = utils.buildPromise;
var DeviceRegistrationResult = utils.DeviceRegistrationResult;
var everliveErrorModule = require('./EverliveError');
var DeviceRegistrationError = everliveErrorModule.DeviceRegistrationError;
var EverliveError = everliveErrorModule.EverliveError;
var CurrentDevice = require('./push/CurrentDevice');
var Platform = require('./constants').Platform;

module.exports = (function () {
    /**
     * @class Push
     * @classdesc A class for managing push notifications in your application. Supported are push notifications for hybrid apps on Android and iOS.
     * @protected
     * @param el {Everlive} Everlive Object
     */
    function Push(el) {
        this._el = el;
        this.notifications = el.data('Push/Notifications');
        this.devices = el.data('Push/Devices');
    }

    Push.prototype = {

        /**
         * Ensures that the Telerik Push Notifications plug-in has been loaded and is ready to use. An {EverliveError} is returned if the plug-in is not available.
         * @method ensurePushIsAvailable
         * @memberOf Push.prototype
         */
        ensurePushIsAvailable: function () {
            CurrentDevice.ensurePushIsAvailable();
        },
        /**
         * Returns the current device for sending push notifications
         * @deprecated since version 1.2.7
         * @see [Push.register]{@link push.register}
         * @memberOf Push.prototype
         * @method currentDevice
         * @name currentDevice
         * @param [emulatorMode] {Boolean} If set to true, emulator mode is enabled meaning you cannot send push notifications.
         * @returns {CurrentDevice} Returns an instance of CurrentDevice.
         */
        currentDevice: function (emulatorMode) {
            this.ensurePushIsAvailable();

            if (arguments.length === 0) {
                emulatorMode = this._el.setup._emulatorMode;
            }

            if (!this._currentDevice) {
                this._currentDevice = new CurrentDevice(this);
            }

            this._currentDevice.emulatorMode = emulatorMode || utils._inAppBuilderSimulator();

            return this._currentDevice;
        },

        /**
         * Enables push notifications on the device and registers it for the feature with {{site.TelerikBackendServices}} if it hasn't already been registered. If it has been registered, the registration details are updated.
         * @method register
         * @name register
         * @memberOf Push.prototype
         * @param {Object} settings An object containing settings for the registration. It can include custom parameters to be stored by {{site.bs}}.
         * @param {Object} settings.iOS=null iOS-specific settings.
         * @param {Boolean} settings.iOS.alert=true If set to true, the push notification will display as a standard iOS alert.
         * @param {String|Number} settings.iOS.badge='+1' Specifies the badge counter to be displayed on the device.
         * @param {Boolean} settings.iOS.clearBadge=false Specifies whether to reset the badge count to 0.
         * @param {Boolean} settings.iOS.sound=true If set to true, the device will play a notification sound.
         * @param {Object} settings.android=null Android-specific settings.
         * @param {String} settings.android.senderID=null Your Google API project number. It is required when obtaining a push token for an Android device.
         * @param {String} settings.android.projectNumber=null Synonym for android.senderID. Available in JavaScript SDK versions 1.2.7 and later.
         * @param {Object} settings.wp8=null Windows Phone specific settings.
         * @param {String} settings.wp8.channelName=null The name of the push channel that the device is registering to.
         * @param {Function} settings.notificationCallbackIOS Specifies a custom callback to be used when a push notification is received on iOS.
         * @param {Function} settings.notificationCallbackAndroid Specifies a custom callback to be used when a push notification is received on Android.
         * @param {Function} settings.notificationCallbackWP8 Specifies a custom callback to be used when a push notification is received on Windows Phone 8.
         * @param {Object} settings.customParameters=null Specifies optional custom registration parameters that will be saved in Telerik Backend Services.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Enables push notifications on the device and registers it for the feature with {{site.TelerikBackendServices}} if it hasn't already been registered. If it has been registered, the registration details are updated.
         * Telerik Backend Services if it hasn't already been registered.
         * If it was registered the registration details are updated.
         * @method register
         * @name register
         * @memberOf Push.prototype
         * @param {Object} settings Settings for the registration. Can include custom parameters to be saved in backend services.
         * @param {Object} settings.iOS=null iOS specific settings
         * @param {Boolean} settings.iOS.alert=true Specifies whether the device will display an alert message.
         * @param {String|Number} settings.iOS.badge='+1' Specifies the badge counter to be displayed on the device.
         * @param {Boolean} settings.iOS.clearBadge=false Specifies whether to reset the badge count to 0.
         * @param {Boolean} settings.iOS.sound=true Specifies whether the device will play a sound.
         * @param {Object} settings.android=null Android specific settings
         * @param {String} settings.android.senderID=null This is your Google API project number. It is required when obtaining a push token for an Android device.
         * @param {String} settings.android.projectNumber=null Synonym for android.senderID. Available in JavaScript SDK versions 1.2.7 and later.
         * @param {Object} settings.wp8=null Windows Phone specific settings
         * @param {String} settings.wp8.channelName=null The name of the push channel that the device is registering to.
         * @param {Function} settings.notificationCallbackIOS Specifies a custom callback to be used when a push notification is received on iOS.
         * @param {Function} settings.notificationCallbackAndroid Specifies a custom callback to be used when a push notification is received on Android.
         * @param {Function} settings.notificationCallbackWP8 Specifies a custom callback to be used when a push notification is received on Windows Phone 8.
         * @param {Object} settings.customParameters=null Specifies optional custom registration parameters that will be saved in Telerik Backend Services.
         * @param {Function} [success] Callback to invoke on success.
         * @param {Function} [error] Callback to invoke on error.
         */
        register: function (settings, success, error) {
            this.ensurePushIsAvailable();

            var currentDevice = this.currentDevice();
            var self = this;
            settings = settings || {};

            if (settings.android) {
                settings.android.senderID = settings.android.projectNumber || settings.android.senderID;
            }

            var successCallback = function (token, callback) {
                var result = new DeviceRegistrationResult(token);
                callback(result);
            };

            var errorCallback = function (err, callback) {
                var registrationError = DeviceRegistrationError.fromEverliveError(err);
                callback(registrationError);
            };

            var clearBadgeIfNeeded = function (token, successCb, errorCb) {
                var platformType = currentDevice._getPlatformType();
                var clearBadge = platformType === Platform.iOS;

                if (clearBadge && settings.iOS) {
                    clearBadge = settings.iOS.clearBadge !== false;
                }

                if (clearBadge) {
                    self.clearBadgeNumber().then(function () {
                        successCallback(token, successCb);
                    }, function (err) {
                        errorCallback(err, errorCb);
                    });
                } else {
                    successCallback(token, successCb);
                }
            };

            return buildPromise(function (successCb, errorCb) {
                currentDevice.enableNotifications(settings, function (response) {
                    var token = response.token;
                    var customParameters = settings.customParameters;
                    currentDevice.getRegistration()
                        .then(function () {
                            currentDevice.updateRegistration(customParameters, function () {
                                clearBadgeIfNeeded(token, successCb, errorCb);
                            }, function (err) {
                                errorCallback(err, errorCb);
                            });
                        }, function (err) {
                            if (err.code === 801) { //Not registered
                                currentDevice.register(customParameters, function () {
                                    clearBadgeIfNeeded(token, successCb, errorCb);
                                }, errorCb);
                            } else {
                                errorCallback(err, errorCb);
                            }
                        });
                }, function (err) {
                    var deviceRegistrationError = DeviceRegistrationError.fromPluginError(err);
                    errorCb(deviceRegistrationError);
                });
            }, success, error);
        },

        /**
         * Disables push notifications for the current device. This method invalidates any push tokens that were obtained for the device from the current application. The device will also be unregistered from {{site.TelerikBackendServices}}.
         * @method unregister
         * @name unregister
         * @memberOf Push.prototype
         * @returns {Promise} The promise for the request.
         */
        /**
         * Disables push notifications for the current device. This method invalidates any push tokens that were obtained for the device from the current application. The device will also be unregistered from {{site.TelerikBackendServices}}.
         * This method invalidates any push tokens that were obtained for the device from the current application.
         * The device will also be unregistered from Telerik Backend Services.
         * @method unregister
         * @name unregister
         * @memberOf Push.prototype
         * @param {Function} [onSuccess] Callback to invoke on success.
         * @param {Function} [onError] Callback to invoke on error.
         */
        unregister: function (onSuccess, onError) {
            this.ensurePushIsAvailable();

            var currentDevice = this.currentDevice();
            return currentDevice.disableNotifications.apply(currentDevice, arguments);
        },

        /**
         * Updates the registration of the current device.
         * @method updateRegistration
         * @name updateRegistration
         * @memberOf Push.prototype
         * @param {Object} customParameters Custom parameters for the registration. If {undefined}, customParameters are not updated.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Updates the registration for the current device.
         * @method updateRegistration
         * @name updateRegistration
         * @memberOf Push.prototype
         * @param {Object} customParameters Custom parameters for the registration. If {undefined}, customParameters are not updated.
         * @param {Function} [onSuccess] Callback to invoke on success.
         * @param {Function} [onError] Callback to invoke on error.
         */
        updateRegistration: function (customParameters, onSuccess, onError) {
            this.ensurePushIsAvailable();

            var currentDevice = this.currentDevice();
            return currentDevice.updateRegistration.apply(currentDevice, arguments);
        },

        /**
         * Sets the badge number on the {{site.TelerikBackendServices}} server.
         * @method setBadgeNumber
         * @name setBadgeNumber
         * @memberOf Push.prototype
         * @param {Number|String} badge The number to be set as a badge.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Sets the badge number on the server
         * @method setBadgeNumber
         * @name setBadgeNumber
         * @memberOf Push.prototype
         * @param {Number|String} badge The number to be set as a badge.
         * @param {Function} [onSuccess] Callback to invoke on success.
         * @param {Function} [onError] Callback to invoke on error.
         */
        setBadgeNumber: function (badge, onSuccess, onError) {
            var self = this;

            this.ensurePushIsAvailable();

            badge = parseInt(badge);
            if (isNaN(badge)) {
                return buildPromise(function (success, error) {
                    error(new EverliveError('The badge must have a numeric value'));
                }, onSuccess, onError);
            }

            var deviceRegistration = {};
            var currentDevice = this.currentDevice();
            var deviceId = currentDevice._getDeviceId();
            deviceRegistration.Id = 'HardwareId/' + encodeURIComponent(deviceId);
            deviceRegistration.BadgeCounter = badge;
            return buildPromise(function (successCb, errorCb) {
                currentDevice._pushHandler.devices.updateSingle(deviceRegistration).then(
                    function () {
                        if (window.plugins && window.plugins.pushNotification && !utils._inAppBuilderSimulator()) {
                            return window.plugins.pushNotification.setApplicationIconBadgeNumber(successCb, errorCb, badge);
                        } else {
                            return successCb();
                        }
                    }, errorCb)
            }, onSuccess, onError);
        },

        /**
         * Resets the badge number on the {{site.TelerikBackendServices}} server to 0.
         * @method clearBadgeNumber
         * @name clearBadgeNumber
         * @memberOf Push.prototype
         * @returns {Promise} The promise for the request.
         */
        /**
         * Clears the badge number on the server by setting it to 0
         * @method clearBadgeNumber
         * @name clearBadgeNumber
         * @memberOf Push.prototype
         * @param {Function} [onSuccess] Callback to invoke on success.
         * @param {Function} [onError] Callback to invoke on error.
         */
        clearBadgeNumber: function (onSuccess, onError) {
            this.ensurePushIsAvailable();

            return this.setBadgeNumber(0, onSuccess, onError);
        },

        /**
         * Returns the push notifications registration for the current device.
         * @method getRegistration
         * @name getRegistration
         * @memberOf Push.prototype
         * @returns {Promise} The promise for the request.
         */
        /**
         * Returns the push registration for the current device.
         * @method getRegistration
         * @name getRegistration
         * @memberOf Push.prototype
         * @param {Function} [onSuccess] Callback to invoke on success.
         * @param {Function} [onError] Callback to invoke on error.
         */
        getRegistration: function (onSuccess, onError) {
            this.ensurePushIsAvailable();

            var currentDevice = this.currentDevice();
            return currentDevice.getRegistration.apply(currentDevice, arguments);
        },

        /**
         * Sends a push notification.
         * @method send
         * @name send
         * @memberOf Push.prototype
         * @param {Object} notification The push notification object
         * @returns {Promise} The promise for request.
         */
        /**
         * Sends a push message
         * @method send
         * @name send
         * @memberOf Push.prototype
         * @param {Object} notification The push notification object
         * @param {Function} [onSuccess] Callback to invoke on success.
         * @param {Function} [onError] Callback to invoke on error.
         */
        send: function (notification, onSuccess, onError) {
            return this.notifications.create.apply(this.notifications, arguments);
        },

        /**
         * This method provides a different operation on each supported platform:
         *
         * - On iOS: Checks if Notifications is enabled for this application in the device's Notification Center.
         * - On Windows Phone: Checks if the application has an active open channel for communication with the Microsoft Push Notification Service. The outcome does not depend on the device's notification settings.
         * - On Android: Checks if the application has established a connection with Google Cloud Messaging. The outcome does not depend on the device's notification settings.
         * @method areNotificationsEnabled
         * @name areNotificationsEnabled
         * @memberOf Push.prototype
         * @param {Object} options An object passed to the Push Notification plugin's areNotificationsEnabled method
         * @returns {Promise} The promise for the request.
         */
        /**
         * iOS: Checks if the Notifications are enabled for this Application in the Device's Notification Center.
         * Windows Phone: Checks if the Application has an active opened Channel for communication with the Notification Service. Not relying on the device notification settings.
         * Android: Checks if the Application has established connection with the Notification Service. Not relying on the device notification settings.
         * @method areNotificationsEnabled
         * @name areNotificationsEnabled
         * @memberOf Push.prototype
         * @param {Object} options an object passed to the Push Notification plugin's areNotificationsEnabled method.
         * @param {Function} [onSuccess] Callback to invoke on successful check. Passes a single boolean value: true or false.
         * @param {Function} [onError] Callback to invoke when an error in the push plugin has occurred.
         */
        areNotificationsEnabled: function (options, onSuccess, onError) {
            this.ensurePushIsAvailable();

            var currentDevice = this.currentDevice();
            return currentDevice.areNotificationsEnabled(options, onSuccess, onError);
        }
    };

    return Push;
}());
},{"./EverliveError":47,"./constants":59,"./push/CurrentDevice":83,"./utils":100}],52:[function(require,module,exports){
var utils = require('./utils');
var rsvp = require('./common').rsvp;
var buildAuthHeader = utils.buildAuthHeader;
var parseUtilities = utils.parseUtilities;
var guardUnset = utils.guardUnset;
var common = require('./common');
var reqwest = common.reqwest;
var _ = common._;
var Headers = require('./constants').Headers;
var isNodejs = require('./everlive.platform').isNodejs;
var Query = require('./query/Query');

module.exports = (function () {
    var _self;

    // The Request type is an abstraction over Ajax libraries
    // A Request object needs information about the Everlive connection and initialization options

    function Request(setup, options) {
        guardUnset(setup, 'setup');
        guardUnset(options, 'options');
        this.setup = setup;
        this.method = null;
        this.endpoint = null;
        this.data = null;
        // TODO success and error callbacks should be uniformed for all ajax libs
        this.success = null;
        this.error = null;
        this.parse = Request.parsers.simple;

        var _headers = {};
        //make sure that the headers are always normalized
        Object.defineProperty(this, 'headers', {
            get: function () {
                return _headers;
            },
            set: function (val) {
                // If we let two identical headers with different casing slip into a request
                // the browser concatenates them which brings chaos to earth
                _headers = utils.normalizeKeys(val);
            }
        });

        _.extend(this, options);
        _self = this;
        this._init(options);
    }

    Request.prototype = {
        // Calls the underlying Ajax library
        send: function () {
            Request.sendRequest(this);
        },
        // Returns an authorization header used by the request.
        // If there is a logged in user for the Everlive instance then her/his authentication will be used.
        buildAuthHeader: buildAuthHeader,
        // Builds the URL of the target Everlive service
        buildUrl: function buildUrl(setup) {
            return utils.buildUrl(setup);
        },
        // Processes the given query to return appropriate headers to be used by the request
        buildQueryHeaders: function buildQueryHeaders(query) {
            if (query) {
                if (query instanceof Query) {
                    return Request.prototype._buildQueryHeaders(query);
                }
                else {
                    return Request.prototype._buildFilterHeader(query);
                }
            }
            else {
                return {};
            }
        },
        // Initialize the Request object by using the passed options
        _init: function (options) {
            _.extend(this.headers, this.buildAuthHeader(this.setup, options), this.buildQueryHeaders(options.filter), options.headers);
        },
        // Translates an Everlive.Query to request headers
        _buildQueryHeaders: function (query) {
            query = query.build();
            var headers = {};
            if (query.$where !== null) {
                headers[Headers.filter] = JSON.stringify(query.$where);
            }
            if (query.$select !== null) {
                headers[Headers.select] = JSON.stringify(query.$select);
            }
            if (query.$sort !== null) {
                headers[Headers.sort] = JSON.stringify(query.$sort);
            }
            if (query.$skip !== null) {
                headers[Headers.skip] = query.$skip;
            }
            if (query.$take !== null) {
                headers[Headers.take] = query.$take;
            }
            if (query.$expand !== null) {
                headers[Headers.expand] = JSON.stringify(query.$expand);
            }
            return headers;
        },
        // Creates a header from a simple filter
        _buildFilterHeader: function (filter) {
            var headers = {};
            headers[Headers.filter] = JSON.stringify(filter);
            return headers;
        }
    };

    var parseOnlyCompleteDateTimeString = _self && _self.setup && _self.setup.parseOnlyCompleteDateTimeObjects;

    var reviver = parseUtilities.getReviver(parseOnlyCompleteDateTimeString);

    Request.parsers = {
        simple: {
            result: parseUtilities.parseResult.bind(null, reviver),
            error: parseUtilities.parseError.bind(null, reviver)
        },
        single: {
            result: parseUtilities.parseSingleResult.bind(null, reviver),
            error: parseUtilities.parseError.bind(null, reviver)
        },
        update: {
            result: parseUtilities.parseUpdateResult.bind(null, reviver),
            error: parseUtilities.parseError.bind(null, reviver)
        }
    };

    if (typeof Request.sendRequest === 'undefined') {
        Request.sendRequest = function (request) {
            var url = request.buildUrl(request.setup) + request.endpoint;
            url = utils.disableRequestCache(url, request.method);
            request.method = request.method || 'GET';
            var data = request.method === 'GET' ? request.data : JSON.stringify(request.data);

            var requestParams = {
                url: url,
                method: request.method,
                data: data,
                headers: request.headers,
                contentType: 'application/json'
            };

            if (isNodejs) {
                requestParams.success = function (data, response) {
                    request.success.call(request, request.parse.result(data), response);
                };

                requestParams.error = function (jqXHR) {
                    request.error.call(request, request.parse.error(jqXHR.responseText || jqXHR.statusText));
                };
            } else {
                requestParams.type = 'json';
                requestParams.crossOrigin = true;
                requestParams.success = function (data, textStatus, jqXHR) {
                    var result = request.parse.result(data);
                    request.success.call(request, result);
                };

                requestParams.error = function (jqXHR, textStatus, errorThrown) {
                    var error = request.parse.error(jqXHR.responseText || jqXHR.statusText);
                    request.error.call(request, error);
                };
            }

            reqwest(requestParams);
        };
    }

    return Request;
}());
},{"./common":58,"./constants":59,"./everlive.platform":61,"./query/Query":87,"./utils":100}],53:[function(require,module,exports){
var _ = require('./common')._;
var constants = require('./constants');
var AuthenticationSetup = require('./auth/AuthenticationSetup');

module.exports = (function () {
    var everliveUrl = constants.everliveUrl;

    // An object that keeps information about an Everlive connection
    function Setup(options) {
        this.url = everliveUrl;
        this.appId = null;
        this.masterKey = null;
        this.token = null;
        this.tokenType = null;
        this.principalId = null;
        this.scheme = 'http'; // http or https
        this.parseOnlyCompleteDateTimeObjects = false;
        if (typeof options === 'string') {
            this.appId = options;
        } else {
            this._emulatorMode = options.emulatorMode;
            _.extend(this, options);
            if(options.apiKey)
                this.appId = options.apiKey; // backward compatibility
        }

        this.authentication = new AuthenticationSetup(this, options.authentication);
    }

    Setup.prototype.setAuthorizationProperties = function (token, tokenType, principalId) {
        this.token = token;
        this.tokenType = tokenType;
        this.principalId = principalId;
    };

    Setup.prototype.getAuthorizationProperties = function () {
        return {
            token: this.token,
            tokenType: this.tokenType,
            principalId: this.principalId
        };
    };

    return Setup;

}());
},{"./auth/AuthenticationSetup":55,"./common":58,"./constants":59}],54:[function(require,module,exports){
'use strict';
var utils = require('../utils');
var DataQuery = require('../query/DataQuery');
var Request = require('../Request');
var Everlive = require('../Everlive');
var constants = require('../constants');
var usersCollectionName = 'Users';
var buildPromise = utils.buildPromise;
var LocalStore = require('../storages/LocalStore');
var EverliveErrors = require('../EverliveError').EverliveErrors;

module.exports = (function () {
    /**
     * @class Authentication
     * @classdesc A class for managing authentication of a user in your application.
     * @protected
     * @param el {Everlive} Everlive Object
     * @param setup {AuthSetup} the authentication setup object
     */
    var Authentication = function (el, setup) {
        this.authSetup = setup || {};
        this._el = el;
        this._authenticationCallbacks = null;
        if (this.authSetup.persist) {
            this._localStore = new LocalStore(el);
            var localStoreKey = this._getLocalStoreKey();
            var authOptions = this._localStore.getItem(localStoreKey);
            var authInfo;
            if (authOptions) {
                authInfo = JSON.parse(this._localStore.getItem(localStoreKey));
            }
            if (authInfo) {
                this._el.setup.setAuthorizationProperties(authInfo.token, authInfo.tokenType, authInfo.principalId);
            }
        }
    };

    /**
     *
     * Logs in a user using a username and a password to the current {{site.bs}} JavaScript SDK instance. All requests initiated by the current {{site.bs}} JavaScript SDK instance will be authenticated with that user's credentials.
     * @memberOf Authentication.prototype
     * @method login
     * @name login
     * @param {string} username The user's username.
     * @param {string} password The user's password.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Logs in a user using a username and a password to the current {{site.bs}} JavaScript SDK instance. All requests initiated by the current {{site.bs}} JavaScript SDK instance will be authenticated with that user's credentials.
     * @memberOf Authentication.prototype
     * @method login
     * @name login
     * @param {string} username The user's username.
     * @param {string} password The user's password.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Authentication.prototype.login = function (username, password, success, error) {
        var self = this;
        return buildPromise(function (success, error) {
            var successFunc = function () {
                self._loginSuccess.apply(self, arguments);
                success.apply(null, arguments);
            };

            var query = new DataQuery({
                operation: DataQuery.operations.UserLogin,
                collectionName: usersCollectionName,
                data: {
                    username: username,
                    password: password,
                    grant_type: 'password'
                },
                skipAuth: true,
                onSuccess: successFunc,
                onError: error
            });

            return self._el.Users.processDataQuery(query);
        }, success, error);
    };

    /**
     * Log out the user who is currently logged in.
     * @memberOf Authentication.prototype
     * @method logout
     * @name logout
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log out the user who is currently logged in.
     * @memberOf Authentication.prototype
     * @method logout
     * @name logout
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Authentication.prototype.logout = function (success, error) {
        var self = this;
        return buildPromise(function (success, error) {
            var successFunc = function () {
                self._logoutSuccess.apply(self, arguments);
                success.apply(null, arguments);
            };

            var errorFunc = function (err) {
                if (err.code === 301) { //invalid token
                    self.clearAuthorization();
                }

                error.apply(null, arguments);
            };

            var query = new DataQuery({
                operation: DataQuery.operations.UserLogout,
                collectionName: usersCollectionName,
                skipAuth: true,
                onSuccess: successFunc,
                onError: errorFunc
            });

            return self._el.Users.processDataQuery(query);
        }, success, error);
    };

    Authentication.prototype._getLocalStoreKey = function () {
        return constants.AuthStoreKey + this._el.setup.apiKey + '$authentication';
    };

    /**
     * Log in a user using an Facebook access token.
     * @memberOf Authentication.prototype
     * @method loginWithFacebook
     * @name loginWithFacebook
     * @param {string} accessToken Facebook access token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user using an Facebook access token.
     * @memberOf Authentication.prototype
     * @method loginWithFacebook
     * @name loginWithFacebook
     * @param {string} accessToken Facebook access token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Authentication.prototype.loginWithFacebook = function (accessToken, success, error) {
        var identity = {
            Provider: 'Facebook',
            Token: accessToken
        };
        return this._loginWithProvider(identity, success, error);
    };

    /**
     * Log in a user using an ADFS access token.
     * @memberOf Authentication.prototype
     * @method loginWithADFS
     * @name loginWithADFS
     * @param {string} accessToken ADFS access token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user using an ADFS access token.
     * @memberOf Authentication.prototype
     * @method loginWithADFS
     * @name loginWithADFS
     * @param {string} accessToken ADFS access token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Authentication.prototype.loginWithADFS = function (accessToken, success, error) {
        var identity = {
            Provider: 'ADFS',
            Token: accessToken
        };
        return this._loginWithProvider(identity, success, error);
    };

    /**
     * Log in a user using a LiveID access token.
     * @memberOf Authentication.prototype
     * @method loginWithLiveID
     * @name loginWithLiveID
     * @param {string} accessToken LiveID access token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user using a LiveID access token.
     * @memberOf Authentication.prototype
     * @method loginWithLiveID
     * @name loginWithLiveID
     * @param {string} accessToken LiveID access token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Authentication.prototype.loginWithLiveID = function (accessToken, success, error) {
        var identity = {
            Provider: 'LiveID',
            Token: accessToken
        };
        return this._loginWithProvider(identity, success, error);
    };

    /**
     * Log in a user using a Google access token.
     * @memberOf Authentication.prototype
     * @method loginWithGoogle
     * @name loginWithGoogle
     * @param {string} accessToken Google access token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user using a Google access token.
     * @memberOf Authentication.prototype
     * @method loginWithGoogle
     * @name loginWithGoogle
     * @param {string} accessToken Google access token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Authentication.prototype.loginWithGoogle = function (accessToken, success, error) {
        var identity = {
            Provider: 'Google',
            Token: accessToken
        };

        return this._loginWithProvider(identity, success, error);
    };

    /**
     * Log in a user with a Twitter token. A secret token needs to be provided.
     * @memberOf Authentication.prototype
     * @method loginWithTwitter
     * @name loginWithTwitter
     * @param {string} token Twitter token.
     * @param {string} tokenSecret Twitter secret token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user with a Twitter token. A secret token needs to be provided.
     * @memberOf Authentication.prototype
     * @method loginWithTwitter
     * @name loginWithTwitter
     * @param {string} token Twitter token.
     * @param {string} tokenSecret Twitter secret token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Authentication.prototype.loginWithTwitter = function (token, tokenSecret, success, error) {
        var identity = {
            Provider: 'Twitter',
            Token: token,
            TokenSecret: tokenSecret
        };

        return this._loginWithProvider(identity, success, error);
    };

    /**
     * Sets the token and token type that the {{site.TelerikBackendServices}} JavaScript SDK will use for authorization.
     * @memberOf Authentication.prototype
     * @method setAuthorization
     * @param {string} token Token that will be used for authorization.
     * @param {Everlive.TokenType} tokenType Token type. Currently only 'bearer' token is supported.
     * @param {string} principalId The id of the user that is logged in.
     */
    Authentication.prototype.setAuthorization = function setAuthorization(token, tokenType, principalId) {
        this._el.setup.setAuthorizationProperties(token, tokenType, principalId);

        if (this.authSetup.persist) {
            var localStoreKey = this._getLocalStoreKey();
            var authorizationProperties = this._el.setup.getAuthorizationProperties();
            this._localStore.setItem(localStoreKey, JSON.stringify(authorizationProperties));
        }

        if (this._authenticationCallbacks) {
            this._authenticationCallbacks.success();
            this._authenticationCallbacks = null;
        }
    };

    /**
     * Clears the authentication token that the {{site.bs}} JavaScript SDK currently uses. Note that this is different than logging out, because the authorization token that was used, will not be invalidated.
     * @method clearAuthorization
     * @memberOf Authentication.prototype
     */
    Authentication.prototype.clearAuthorization = function clearAuthorization() {
        this.setAuthorization(null, null, null);
        this.clearPersistedAuthentication();
    };

    /**
     * Clears the current persisted authentication from the local store for the current {{site.bs}} JavaScript SDK instance. Will not logout or modify the current authentication of the Javascript SDK.
     * @method clearPersistedAuthentication
     * @memberOf Authentication.prototype
     */
    Authentication.prototype.clearPersistedAuthentication = function () {
        if (this._localStore) {
            var localStoreKey = this._getLocalStoreKey();
            this._localStore.removeItem(localStoreKey);
            this._el.setup.setAuthorizationProperties(null, null, null);
        }
    };

    /**
     * @memberOf Authentication.prototype
     * Returns whether authentication requirement is enabled for the current instance of the {{site.bs}} JavaScript SDK.
     * @returns {boolean} whether an onAuthenticationRequired function is provided
     */
    Authentication.prototype.isAuthenticationInProgress = function () {
        return typeof this.authSetup.onAuthenticationRequired === 'function';
    };

    /** Ensures that authentication is completed before continuing.
     * @memberOf Authentication.prototype
     * @private
     * @returns {Promise} A promise that will be resolved when the authentication is complete. See {{@link Everlive.prototype.completeAuthentication}}.
     * @throws throws an error if no onAuthenticationRequired handler is provided to the setup.
     */
    Authentication.prototype._ensureAuthentication = function () {
        if (!this.isAuthenticationInProgress()) {
            throw new Error('onAuthenticationRequired option of Everlive.Setup.Authentication is required.');
        }
        if (this.isAuthenticating()) {
            return this._authenticationCallbacks.promise;
        }

        this.clearAuthorization();
        this.authSetup.onAuthenticationRequired.call(this);
        this._authenticationCallbacks = utils.getCallbacks();
        return this._authenticationCallbacks.promise;
    };

    /**
     * A method that should be called with the authentication result.
     * @memberOf Authentication.prototype
     * @param authentication authentication object containing information about the
     * @param authentication.access_token
     * @param authentication.token_type
     * @param authentication.principal_id
     */
    Authentication.prototype.completeAuthentication = function (authentication) {
        this._el.setAuthorization(authentication.access_token, authentication.token_type, authentication.principal_id);
    };
    /**
     * Gets the current authentication status of the {{site.TelerikBackendServices}} JavaScript SDK instance.
     * @memberOf Authentication.prototype
     * @method getAuthenticationStatus
     * @name getAuthenticationStatus
     * @returns {Promise} A promise to the authentication status.
     */
    /**
     * Gets the current authentication status of the {{site.TelerikBackendServices}} JavaScript SDK instance.
     * @memberOf Authentication.prototype
     * @method getAuthenticationStatus
     * @name getAuthenticationStatus
     * @param {Everlive.Callbacks.authenticationStatusSuccess} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Authentication.prototype.getAuthenticationStatus = function (success, error) {
        var self = this;
        return utils.buildPromise(function (success, error) {
            var setup = self._el.setup;
            if (setup.masterKey) {
                return success({status: constants.AuthStatus.masterKey});
            }

            if (!setup.token) {
                return success({status: constants.AuthStatus.unauthenticated});
            }

            if (self.isAuthenticationInProgress()) {
                return success({status: constants.AuthStatus.authenticating});
            }

            self._el.Users
                .skipAuth(true)
                .currentUser()
                .then(function (res) {
                    return success({status: constants.AuthStatus.authenticated, user: res.result});
                }, function (err) {
                    if (self.isAuthenticationInProgress()) {
                        return success({status: constants.AuthStatus.authenticating});
                    } else if (err.code === EverliveErrors.invalidRequest.code || err.code === EverliveErrors.invalidToken.code) { // invalid request, i.e. the access token is invalid or missing
                        return success({status: constants.AuthStatus.invalidAuthentication});
                    } else if (err.code === EverliveErrors.expiredToken.code) {
                        return success({status: constants.AuthStatus.expiredAuthentication});
                    } else {
                        return error(err);
                    }
                });
        }, success, error);
    };

    /** Returns whether the {{site.TelerikBackendServices}} is currently waiting for authentication to be completed. See {{@link Everlive.prototype.completeAuthentication}}.
     * @memberOf Everlive.prototype
     * @returns {boolean}
     */
    Authentication.prototype.isAuthenticating = function () {
        return !!this._authenticationCallbacks;
    };

    Authentication.prototype._loginSuccess = function (data) {
        var result = data.result;
        this.setAuthorization(result.access_token, result.token_type, result.principal_id);
    };

    Authentication.prototype._logoutSuccess = function () {
        this.clearAuthorization();
    };

    Authentication.prototype._loginWithProvider = function (identity, success, error) {
        var user = {
            Identity: identity
        };
        var self = this;
        return buildPromise(function (success, error) {
            var successFunc = function () {
                self._loginSuccess.apply(self, arguments);
                success.apply(null, arguments);
            };

            var query = new DataQuery({
                operation: DataQuery.operations.UserLoginWithProvider,
                collectionName: usersCollectionName,
                data: user,
                authHeaders: false,
                skipAuth: true,
                parse: Request.parsers.single,
                onSuccess: successFunc,
                onError: error
            });

            self._el.Users.processDataQuery(query);
        }, success, error);
    };

    return Authentication;
}());

},{"../Everlive":46,"../EverliveError":47,"../Request":52,"../constants":59,"../query/DataQuery":85,"../storages/LocalStore":94,"../utils":100}],55:[function(require,module,exports){
'use strict';
module.exports = (function () {
    var AuthenticationSetup = function (everlive, options) {
        options = options || {};
        this.onAuthenticationRequired = options.onAuthenticationRequired;
        this.persist = options.persist;
    };

    return AuthenticationSetup;
}());
},{}],56:[function(require,module,exports){
'use strict';

var constants = require('../constants');
var common = require('../common');
var utils = require('../utils');
var buildPromise = utils.buildPromise;
var jsonStringify = common.jsonStringify;
var rsvp = common.rsvp;
var _ = require('underscore');

var persisters = require('../offline/offlinePersisters');
var EverliveError = require('../EverliveError').EverliveError;
var Query = require('../query/Query');
var DataQuery = require('../query/DataQuery');
var buildOfflineStorageOptions = require('../offline/offline').buildOfflineStorageOptions;

var CacheModule = function (options, everlive) {
    this.options = options;
    this.typeSettings = this.options.typeSettings;
    this.maxAgeInMs = this.options.maxAge * 60 * 1000;
    this._everlive = everlive;
};

var cacheableOperations = [
    DataQuery.operations.Read,
    DataQuery.operations.ReadById,
    DataQuery.operations.Count
];

/**
 * @class CacheModule
 * @classDesc A class providing access to the various caching features.
 */

/**
 * Represents the {@link CacheModule} class.
 * @memberOf Everlive.prototype
 * @member {CacheModule} cache
 */
CacheModule.prototype = {
    _hash: function (obj) {
        return jsonStringify(obj);
    },

    // using the offline storage options to initialize the same type of storage
    _initStore: function (sdkOptions) {
        if (!this.persister) {
            var offlineStorageOptions = buildOfflineStorageOptions(sdkOptions);
            var storageKey = this.options.storage.storagePath + '_' + sdkOptions.apiKey;

            this.persister = persisters.getPersister(storageKey, offlineStorageOptions);
        }
    },

    _getCacheData: function () {
        var self = this;

        if (!this.cacheData) {
            return this._persisterGetAllDataWrap()
                .then(function (cacheData) {
                    self.cacheData = cacheData;
                    return self.cacheData;
                });
        }

        return utils.successfulPromise(this.cacheData);
    },

    _persisterGetAllDataWrap: function () {
        var self = this;

        return new rsvp.Promise(function (resolve, reject) {
            return self.persister.getAllData(resolve, reject);
        });
    },

    _persisterSaveDataWrap: function (contentType, data) {
        var self = this;
        return new rsvp.Promise(function (resolve, reject) {
            return self.persister.saveData(contentType, JSON.stringify(data), resolve, reject);
        });
    },

    _getCacheDataForContentType: function (contentType) {
        return this._getCacheData()
            .then(function (cacheData) {
                if (typeof cacheData[contentType] === 'string') {
                    cacheData[contentType] = JSON.parse(cacheData[contentType]);
                } else {
                    cacheData[contentType] = cacheData[contentType] || {};
                }

                return _.clone(cacheData[contentType]);
            })
    },

    _persistCacheData: function (contentType, cacheData) {
        var self = this;

        return this._getCacheDataForContentType(contentType)
            .then(function () {
                var dataToCache = _.extend({}, self.cacheData[contentType], cacheData);
                self.cacheData[contentType] = _.compactObject(dataToCache);
                return self._persisterSaveDataWrap(contentType, self.cacheData[contentType]);
            });
    },

    isQueryUnsupportedOffline: function (dataQuery) {
        var hasPowerfieldsExpression = !!dataQuery.getHeader(constants.Headers.powerFields);
        var queryParams = dataQuery.getQueryParameters();
        var dataQueryFilter = queryParams.filter;
        var unsupportedDbOperators = utils.getUnsupportedOperators(dataQueryFilter);
        var hasUnsupportedOperators = unsupportedDbOperators.length !== 0;
        return hasPowerfieldsExpression || hasUnsupportedOperators;
    },

    _shouldSkipCache: function (dataQuery) {
        var operationShouldSkipCache = cacheableOperations.indexOf(dataQuery.operation) === -1;
        var collectionName = dataQuery.collectionName;
        var typeSettings = this.typeSettings;
        var cacheDisabledForContentType = typeSettings && typeSettings && typeSettings[collectionName] && typeSettings[collectionName].enabled === false;
        var ignoreCacheForQuery = dataQuery.ignoreCache;

        var isUnsupportedOffline = this.isQueryUnsupportedOffline(dataQuery);

        return operationShouldSkipCache || cacheDisabledForContentType || ignoreCacheForQuery || isUnsupportedOffline;
    },

    _cacheDataQuery: function (dataQuery) {
        if (this._shouldSkipCache(dataQuery)) {
            if (dataQuery.ignoreCache && !this.isQueryUnsupportedOffline(dataQuery)) {
                var hash = this._getHashForQuery(dataQuery);
                this._cacheQuery(dataQuery, hash);
            } else {
                this._everlive.data(dataQuery.collectionName)._sendRequest(dataQuery);
            }
        } else {
            dataQuery.useCache = false;
            this._processCacheItem(dataQuery);
        }
    },

    _processCacheItem: function (dataQuery) {
        var self = this;

        var contentType = dataQuery.collectionName;
        var hash = this._getHashForQuery(dataQuery);
        return this._getCacheDataForContentType(contentType)
            .then(function (cacheData) {
                if (cacheData[hash]) {
                    return self._isHashExpired(contentType, hash, dataQuery.maxAge)
                        .then(function (isExpired) {
                            if (isExpired && !dataQuery.forceCache) {
                                return self._purgeForHash(contentType, hash)
                                    .then(function () {
                                        return self._cacheQuery(dataQuery, hash);
                                    });
                            } else {
                                //If cache is used, change 'me' to the ID of the logged in user (only for currentUser() requests).
                                if (dataQuery.operation === DataQuery.operations.ReadById && dataQuery.additionalOptions.id === 'me') {
                                    dataQuery.additionalOptions.id = self._everlive.setup.principalId;
                                }

                                return self._everlive.offlineStorage.processQuery(dataQuery)
                                    .then(function (result) {
                                        dataQuery.onSuccess(result);
                                    })
                                    .catch(dataQuery.onError);
                            }
                        });
                } else {
                    return self._cacheQuery(dataQuery, hash);
                }
            });
    },

    _addObjectToCache: function (obj, contentType, maxAge) {
        var itemHash = obj.Id;
        return this._cacheResultFromDataQuery(contentType, itemHash, maxAge);
    },

    _cacheQuery: function (dataQuery, hash) {
        var self = this;
        var contentType = dataQuery.collectionName;

        var originalSuccess = dataQuery.onSuccess;
        dataQuery.onSuccess = function (response) {
            var args = arguments;

            return self._getCacheData()
                .then(function () {
                    var cacheForItems = [];
                    var result = response.result;

                    if (dataQuery.operation !== DataQuery.operations.Count) {
                        if (Array.isArray(result)) {
                            _.each(result, function (singleResult) {
                                var cacheItemPromise = self._addObjectToCache(singleResult, dataQuery.collectionName);
                                cacheForItems.push(cacheItemPromise);
                            });
                        } else if (_.isObject(result)) {
                            var cacheItemPromise = self._addObjectToCache(result, dataQuery.collectionName);
                            cacheForItems.push(cacheItemPromise);
                        }
                    }

                    return rsvp.all(cacheForItems)
                        .then(function () {
                            if (dataQuery.operation !== DataQuery.operations.Count) {
                                return self._cacheResultFromDataQuery(contentType, hash);
                            }
                        })
                        .then(function () {
                            return originalSuccess.apply(this, args);
                        });
                });
        };

        this._everlive.data(dataQuery.collectionName)._sendRequest(dataQuery);
    },

    _cacheResultFromDataQuery: function (contentType, hash) {
        var cacheData = {};
        cacheData[hash] = {
            cachedAt: Date.now()
        };

        return this._persistCacheData(contentType, cacheData);
    },

    _getExpirationForHash: function (contentType, hash) {
        return this._getCacheDataForContentType(contentType)
            .then(function (cacheData) {
                return cacheData[hash].cachedAt;
            });
    },

    _isHashExpired: function (contentType, hash, maxAge) {
        var self = this;

        return this._getExpirationForHash(contentType, hash)
            .then(function (cachedAt) {
                var maxAgeForContentType = self.typeSettings && self.typeSettings[contentType] ? self.typeSettings[contentType].maxAge * 60 * 1000 : null;
                var cacheAge = maxAge || maxAgeForContentType || self.maxAgeInMs;
                return (cachedAt + cacheAge) < Date.now();
            });
    },

    _purgeForHash: function (contentType, hash) {
        var cacheData = {};
        cacheData[hash] = null;

        return this._persistCacheData(contentType, cacheData);
    },

    _getHashForQuery: function (dataQuery) {
        if (dataQuery.operation === DataQuery.operations.ReadById) {
            return dataQuery.additionalOptions.id;
        }

        var queryParams = dataQuery.getQueryParameters();
        return this._hash(queryParams);
    },

    /**
     * Clears the cached data for a specified content type.
     * @method clear
     * @name clear
     * @param {string} contentType The content type to clear.
     * @memberOf CacheModule.prototype
     * @returns {Promise}
     */
    /**
     * Clears the cached data for a specified content type.
     * @method clear
     * @name clear
     * @param {string} contentType The content type to clear.
     * @memberOf CacheModule.prototype
     * @param {function} [success] A success callback.
     * @param {function} [error] An error callback.
     */
    clear: function (contentType, success, error) {
        var self = this;

        return buildPromise(function (success, error) {
            return self.persister.purge(contentType, function () {
                delete self.cacheData[contentType];
                if (self._everlive.offlineStorage.setup.enabled) {
                    success();
                } else {
                    self._everlive.offlineStorage._queryProcessor._persister.purge(contentType, success, error);
                }
            }, error);
        }, success, error);
    },

    /**
     * Clears all data from the cache.
     * @method clearAll
     * @name clearAll
     * @memberOf CacheModule.prototype
     * @returns {Promise}
     */
    /**
     * Clears all data from the cache.
     * @method clearAll
     * @name clearAll
     * @memberOf CacheModule.prototype
     * @param {function} [success] A success callback.
     * @param {function} [error] An error callback.
     */
    clearAll: function (success, error) {
        var self = this;
        self.cacheData = null;

        return buildPromise(function (success, error) {
            return self.persister.purgeAll(function () {
                if (self._everlive.offlineStorage.setup.enabled) {
                    success();
                } else {
                    self._everlive.offlineStorage._queryProcessor._persister.purgeAll(success, error);
                }
            }, error)
        }, success, error);
    }
};

module.exports = CacheModule;
},{"../EverliveError":47,"../common":58,"../constants":59,"../offline/offline":76,"../offline/offlinePersisters":77,"../query/DataQuery":85,"../query/Query":87,"../utils":100,"underscore":35}],57:[function(require,module,exports){
'use strict';

var CacheModule = require('./CacheModule');
var _ = require('../common')._;

var getDefaultOptions = function () {
    return {
        maxAge: 60,
        enabled: false,
        storage: {
            storagePath: 'el_cache'
        }
    }
};

module.exports = {
    initCaching: function (options) {
        var cachingOptions;
        var defaultOptions = getDefaultOptions();
        if (options.caching === true) {
            cachingOptions = _.deepExtend({}, defaultOptions);
            cachingOptions.enabled = true;
        } else {
            cachingOptions = _.deepExtend(defaultOptions, options.caching);
        }

        if (options.caching !== false) {
            this.setup.caching = cachingOptions;
        }

        this.cache = new CacheModule(cachingOptions, this);
    },
    _initStore: function (options) {
        this.cache._initStore(options);
    }
};
},{"../common":58,"./CacheModule":56}],58:[function(require,module,exports){
(function (global){
module.exports = (function () {
    var common = {};
    var dependencyStore = {};

    var platform = require('./everlive.platform');
    var isNativeScript = platform.isNativeScript;
    var isNodejs = platform.isNodejs;

    if (!isNodejs && !isNativeScript) {
        dependencyStore.reqwest = require('reqwest');
    } else if (isNativeScript) {
        common.root = global;
        dependencyStore.reqwest = require('./reqwest.nativescript');
    } else if (isNodejs) {
        common.root = global;
        dependencyStore.reqwest = require('./reqwest.nodejs');
    }

    if (!common.root) {
        //browser/requirejs/cordova
        common.root = window;
    }

    var exportDependency = function exportDependency(globalName, localName) {
        if (!localName) {
            localName = globalName;
        }

        //for the everlive bundle without dependencies included, browserify replaces them with empty objects
        //we need to make sure that these dependencies are marked as undefined
        if (dependencyStore[localName] &&
            typeof dependencyStore[localName] === 'object' && !Object.keys(dependencyStore[localName]).length) {

            dependencyStore[localName] = undefined;
        }

        Object.defineProperty(common, localName, {
            get: function () {
                return dependencyStore[localName] || this.root[globalName];
            }
        });
    };

    dependencyStore._ = require('underscore');
    exportDependency('_');

    dependencyStore.jstz = require('jstimezonedetect').jstz;
    exportDependency('jstz');

    dependencyStore.mongoQuery = require('mongo-query');
    exportDependency('mongoQuery');

    dependencyStore.Mingo = require('mingo');
    exportDependency('Mingo');

    dependencyStore.Processor = require('../scripts/bs-expand-processor');
    exportDependency('Processor');

    dependencyStore.rsvp = require('rsvp');
    exportDependency('RSVP', 'rsvp');

    exportDependency('reqwest');

    dependencyStore.jsonStringify = require('json-stable-stringify');
    exportDependency('json-stable-stringify', 'jsonStringify');

    return common;
}());
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../scripts/bs-expand-processor":39,"./everlive.platform":61,"./reqwest.nativescript":91,"./reqwest.nodejs":92,"json-stable-stringify":7,"jstimezonedetect":11,"mingo":12,"mongo-query":14,"reqwest":33,"rsvp":34,"underscore":35}],59:[function(require,module,exports){
/**
 * Constants used by the SDK* @typedef {Object} Everlive.Constants
 */

var constants = {
    idField: 'Id',
    guidEmpty: '00000000-0000-0000-0000-000000000000',
    everliveUrl: '//api.everlive.com/v1/',
    /**
     * A class used to represent the conflict resolution strategies.
     * @property {string} ClientWins
     * @property {string} ServerWins
     * @property {string} Custom
     * @typedef {string} Everlive.Constants.ConflictResolutionStrategy
     */
    ConflictResolutionStrategy: {
        ClientWins: 'clientWins',
        ServerWins: 'serverWins',
        Custom: 'custom'
    },
    ConflictResolution: {
        KeepServer: 'keepServer',
        KeepClient: 'keepClient',
        Custom: 'custom',
        Skip: 'skip'
    },
    /**
     * A class used to represent the available storage providers.
     * @property {string} LocalStorage
     * @property {string} FileSystem
     * @property {string} Custom
     * @typedef {string} Everlive.Constants.StorageProvider
     */
    StorageProvider: {
        LocalStorage: 'localStorage',
        FileSystem: 'fileSystem',
        Custom: 'custom'
    },

    DefaultStoragePath: 'el_store',

    // the default location for storing files offline
    DefaultFilesStoragePath: 'el_file_store',

    // the default location for storing offline to online location map
    DefaultFilesMetadataPath: 'el_file_mapping',

    EncryptionProvider: {
        Default: 'default',
        Custom: 'custom'
    },

    // The headers used by the Everlive services
    Headers: {
        filter: 'x-everlive-filter',
        select: 'x-everlive-fields',
        sort: 'x-everlive-sort',
        skip: 'x-everlive-skip',
        take: 'x-everlive-take',
        expand: 'x-everlive-expand',
        singleField: 'x-everlive-single-field',
        includeCount: 'x-everlive-include-count',
        powerFields: 'x-everlive-power-fields',
        debug: 'x-everlive-debug',
        overrideSystemFields: 'x-everlive-override-system-fields',
        sdk: 'x-everlive-sdk',
        sync: 'x-everlive-sync'
    },
    //Constants for different platforms in Everlive
    Platform: {
        WindowsPhone: 1,
        Windows: 2,
        Android: 3,
        iOS: 4,
        OSX: 5,
        Blackberry: 6,
        Nokia: 7,
        Unknown: 100
    },
    OperatorType: {
        query: 1,

        where: 100,
        filter: 101,

        and: 110,
        or: 111,
        not: 112,

        equal: 120,
        not_equal: 121,
        lt: 122,
        lte: 123,
        gt: 124,
        gte: 125,
        isin: 126,
        notin: 127,
        all: 128,
        size: 129,
        regex: 130,
        contains: 131,
        startsWith: 132,
        endsWith: 133,

        nearShpere: 140,
        withinBox: 141,
        withinPolygon: 142,
        withinShpere: 143,

        select: 200,
        exclude: 201,

        order: 300,
        order_desc: 301,

        skip: 400,
        take: 401,
        expand: 402
    },

    /**
     * A class used to represent the current authentication status of the {{site.TelerikBackendServices}} JavaScript SDK instance.
     * @property {string} unauthenticated Indicates that no user is authenticated.
     * @property {string} masterKey Indicates that a master key authentication is used.
     * @property {string} invalidAuthentication Indicates an authentication has been attempted, but it was invalid.
     * @property {string} authenticated Indicates that a user is authenticated.
     * @property {string} authenticating Indicates that a user is currently authenticating. Some requests might be pending and waiting for the user to authenticate.
     * @property {string} expiredAuthentication Indicates that a user's authentication has expired and that the user must log back in.
     * @typedef {string} Everlive.AuthStatus
     */
    AuthStatus: {
        unauthenticated: 'unauthenticated',
        masterKey: 'masterKey',
        invalidAuthentication: 'invalidAuthentication',
        authenticated: 'authenticated',
        expiredAuthentication: 'expiredAuthentication',
        authenticating: 'authenticating'
    },
    offlineItemStates: {
        created: 'create',
        modified: 'update',
        deleted: 'delete'
    },

    /**
     * HTTP Methods
     * @enum {string}
     */
    HttpMethod: {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT',
        DELETE: 'DELETE'
    },
    maxDistanceConsts: {
        radians: '$maxDistance',
        km: '$maxDistanceInKilometers',
        miles: '$maxDistanceInMiles'
    },
    radiusConsts: {
        radians: 'radius',
        km: 'radiusInKilometers',
        miles: 'radiusInMiles'
    }
};

// using an invalid field name in the context of Everlive
// to ensure no naming collisions can occur
constants.offlineItemsStateMarker = '__everlive_offline_state';

constants.SyncErrors = {
    generalError: 'generalError',
    itemSyncError: 'itemSyncError'
};

constants.syncBatchSize = 10;

constants.AuthStoreKey = '__everlive_auth_key';

constants.CachingStoreKey = '__everlive_cache';

// the minimum interval between sync requests
constants.defaultSyncInterval = 1000 * 60 * 10; // 10 minutes
constants.fileUploadKey = 'fileUpload';
constants.fileUploadDelimiter = '_';

constants.FilesTypeNameLegacy = 'system.files';
constants.FilesTypeName = 'Files';

constants.MaxConcurrentDownloadTasks = 3;

constants.Events = {
    SyncStart: 'syncStart',
    SyncEnd: 'syncEnd',
    Processed: 'processed',
    ItemProcessed: 'itemProcessed',
    BeforeExecute: 'beforeExecute'
};

constants.DataQueryOperations = {
    Read: 'read',
    Create: 'create',
    Update: 'update',
    Delete: 'destroy',
    DeleteById: 'destroySingle',
    ReadById: 'readById',
    Count: 'count',
    RawUpdate: 'rawUpdate',
    SetAcl: 'setAcl',
    SetOwner: 'setOwner',
    UpdateById: 'updateSingle', // used only by the event query
    UserLogin: 'login',
    UserLogout: 'logout',
    UserChangePassword: 'changePassword',
    UserLoginWithProvider: 'loginWith',
    UserLinkWithProvider: 'linkWith',
    UserUnlinkFromProvider: 'unlinkFrom',
    UserResetPassword: 'resetPassword',
    UserSetPassword: 'setPassword',
    FilesUpdateContent: 'updateContent',
    FilesGetDownloadUrlById: 'downloadUrlById'
};

module.exports = constants;

},{}],60:[function(require,module,exports){
var CryptoJS = require('node-cryptojs-aes').CryptoJS;
var AES = CryptoJS.AES;

module.exports = (function () {

    function CryptographicProvider(options) {
        this.options = options;
    }

    CryptographicProvider.prototype = {
        _getKey: function () {
            return this.options.encryption.key;
        },

        _canEncryptDecrypt: function (content) {
            return this._getKey() && content !== null && content !== undefined;
        },

        encrypt: function (content) {
            if (!this._canEncryptDecrypt(content)) {
                return content;
            }

            return AES.encrypt(content, this._getKey()).toString();
        },

        decrypt: function (content) {
            if (!this._canEncryptDecrypt(content)) {
                return content;
            }

            return AES.decrypt(content, this._getKey()).toString(CryptoJS.enc.Utf8);
        }
    };

    return CryptographicProvider;
}());
},{"node-cryptojs-aes":25}],61:[function(require,module,exports){
(function (global){
var isNativeScript = Boolean(((typeof android !== 'undefined' && android && android.widget && android.widget.Button)
|| (typeof UIButton !== 'undefined' && UIButton)));

var platform;
var isCordova = false;
var isWindowsPhone = false;
var isAndroid = false;

if (isNativeScript) {
    global.window = {
        localStorage: {
            removeItem: function () {
            } //shim for mongo-query under nativescript
        }
    };

} else if (typeof window !== 'undefined') {
    isCordova = /^file:\/{3}[^\/]|x-wmapp/i.test(window.location.href) && /ios|iphone|ipod|ipad|android|iemobile/i.test(navigator.userAgent);
    isWindowsPhone = isCordova && /iemobile/i.test(navigator.userAgent);
    isAndroid = isCordova && cordova.platformId === 'android';
}

var isNodejs = typeof exports === 'object' && typeof window === 'undefined';
var isRequirejs = typeof define === 'function' && define.amd;
var isDesktop = !isNativeScript && !isCordova && !isNodejs;

if (isNativeScript) {
    platform = 'ns';
} else if (isNodejs) {
    platform = 'nodejs';
} else if (isDesktop) {
    platform = 'desktop';
} else if (isCordova) {
    platform = 'cordova';
}

module.exports = {
    isCordova: isCordova,
    isNativeScript: isNativeScript,
    isDesktop: isDesktop,
    isWindowsPhone: isWindowsPhone,
    isAndroid: isAndroid,
    isNodejs: isNodejs,
    isRequirejs: isRequirejs,
    platform: platform
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],62:[function(require,module,exports){
'use strict';

/**
 * @class Helpers
 * @classdesc Everlive helper classes
 */

var platform = require('../everlive.platform');

var helpers = [];

var htmlHelper = require('./html/htmlHelper');

if (platform.isCordova || platform.isDesktop) {
    helpers.push({
        name: 'html',
        ctor: htmlHelper
    });
}

module.exports = helpers;
},{"../everlive.platform":61,"./html/htmlHelper":63}],63:[function(require,module,exports){
'use strict';

var platform = require('../../everlive.platform');
var common = require('../../common');
var _ = common._;
var utils = require('../../utils');
var rsvp = common.rsvp;
var HtmlHelperResponsiveModule = require('./htmlHelperResponsiveModule');
var HtmlHelperOfflineModule = require('./htmlHelperOfflineModule');
var constants = require('../../constants');
var EverliveError = require('../../EverliveError').EverliveError;
var EventEmitterProxy = require('../../EventEmitterProxy');

module.exports = (function () {
    var defaults = {
        processOnLoad: false,
        processOnResize: false,
        loadingImageUrl: '',
        errorImageUrl: '',
        attributes: {
            loadingImage: 'data-loading-image',
            errorImage: 'data-error-image',
            dpi: 'data-dpi',
            imageSource: 'data-src',
            fileSource: 'data-href',
            enableOffline: 'data-offline',
            enableResponsive: 'data-responsive'
        }
    };

    /**
     * @typedef Helpers.html
     * @description Everlive helper for html related operations, such as processing html elements with specific tags.
     */

    function HtmlHelper(everlive, config) {
        EventEmitterProxy.apply(this);

        this._everlive = everlive;
        this._settings = {
            urlTemplate: '[protocol][hostname][appid]/[operations][url]',
            server: 'bs1.cdn.telerik.com/image/v1/'
        };

        config = config || {};

        this.options = _.extend({}, defaults, config);
        this.options.attributes = _.extend({}, defaults.attributes, config.attributes);

        this._responsive = new HtmlHelperResponsiveModule(this);
        this._offline = new HtmlHelperOfflineModule(this);

        this._init();
    }

    HtmlHelper.prototype = {
        _init: function _init() {
            var self = this;
            if (self.options.processOnLoad) {
                window.addEventListener('load', this.processAll.bind(this), false);
            }

            if (this.options.processOnResize) {
                window.addEventListener('resize', _.debounce(this.processAll.bind(this), 300), false);
            }
        },

        _triggerOnProcessed: function _triggerOnProcessed(args) {
            this._emitter.emit(constants.Events.Processed, args);
        },

        _defaultProcessSettings: function _defaultProcessSettings(settings) {
            return _.defaults({}, settings, {
                responsive: true,
                offline: true
            });
        },

        _setLoadingUrl: function _setLoadingUrl(element) {
            var loadingImageUri = element.getAttribute(this.options.attributes.loadingImage) || this.options.loadingImageUrl;
            if (!loadingImageUri || utils.isElement.anchor(element)) {
                return utils.successfulPromise();
            }

            return this._setUrl(element, loadingImageUri, true);
        },

        _getBackgroundSrc: function _getBackgroundSrc(el) {
            var elStyle = window.getComputedStyle(el, null);
            var backgrImage = elStyle.getPropertyValue('background-image');

            var img = backgrImage !== 'none' ? backgrImage : false;
            if (img) {
                img = img.replace(/url\(('?"?)(.*?)\1\)/gi, '$2');
            }

            return img;
        },

        _setErrorUrl: function (element) {
            var errorImageUrl = element.getAttribute(this.options.attributes.errorImage) || this.options.errorImageUrl;
            if (!errorImageUrl || utils.isElement.anchor(element)) {
                return utils.successfulPromise();
            }

            return this._setUrl(element, errorImageUrl, true);
        },

        _setUrl: function _setUrl(element, url, apply) {
            var self = this;
            return new rsvp.Promise(function (resolve, reject) {
                var elAttr = self._getAttr(element);
                if (utils.isElement.image(element) && elAttr === self.options.attributes.imageSource) {
                    if (apply) {
                        element.src = url;
                        element.style.visibility = 'visible';
                    } else {
                        var img = new Image();

                        img.onerror = function () {
                            img = null;
                            reject(new EverliveError('Can\'t be loaded: ' + url));
                        };

                        img.onload = function () {
                            img = null;
                            self._setUrl(element, url, true)
                                .then(resolve)
                                .catch(reject);
                        };

                        img.src = url;
                    }
                } else {
                    apply = true;
                    if (elAttr) {
                        var attr;
                        if (elAttr === self.options.attributes.imageSource) {
                            attr = 'src';
                        } else if (elAttr === self.options.attributes.fileSource) {
                            attr = 'href';
                        } else {
                            attr = _.last(elAttr.split('-'));
                        }

                        element.setAttribute(attr, url);
                    } else {
                        element.style.backgroundImage = 'url(' + url + ')';
                    }
                }

                if (apply) {
                    resolve();
                }
            });
        },

        _getAttr: function _getAttr(element) {
            if (element.getAttribute(this.options.attributes.imageSource)) {
                return this.options.attributes.imageSource;
            }

            if (element.getAttribute(this.options.attributes.fileSource)) {
                return this.options.attributes.fileSource;
            }
        },

        _getUrl: function _getUrl(element) {
            var url = element.getAttribute(this.options.attributes.imageSource)
                || element.getAttribute(this.options.attributes.fileSource)
                || this._getBackgroundSrc(element);

            return url;
        },

        _wrapElements: function _wrapElements(elements) {
            var self = this;

            var results = _.map(elements, function (element) {
                var tag = element.tagName.toLowerCase();

                var evaluateDataAttr = function evaluateDataAttr(attr) {
                    // data-a - true
                    // data-a="" - true
                    // data-a="true" - true
                    // data-a="anything" - true
                    // data-a="false" - false
                    // missing - false
                    var val;
                    var dataVal = (element.attributes[attr] || {value: null}).value;
                    if (dataVal === '') {
                        val = true;
                    } else if (!dataVal) {
                        val = false;
                    } else {
                        try {
                            val = JSON.parse(dataVal);
                        } catch (e) {
                            val = true;
                        }
                    }

                    return val;
                };

                var canResponsive = evaluateDataAttr(self.options.attributes.enableResponsive);
                var canOffline = evaluateDataAttr(self.options.attributes.enableOffline);

                return {
                    item: element,
                    tag: tag,
                    operations: {
                        responsive: canResponsive,
                        offline: canOffline
                    }
                };
            });

            return results;
        },

        /**
         * @method process
         * @memberOf Helpers.html
         * @param {HtmlElement|HtmlElement[]} elements
         * @param {Object} settings A settings specifying custom behavior.
         * @param {boolean} [settings.responsive] Whether to process the data-responsive attributes that help implement Responsive Images.
         * @param {boolean} [settings.offline] Whether to process the data-offline attributes that help implement offline files.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */

        /**
         * @method process
         * @memberOf Helpers.html
         * @param {HtmlElement|HtmlElement[]} elements
         * @param {Object} settings A settings specifying custom behavior.
         * @param {boolean} [settings.responsive] Whether to process the data-responsive attributes that help implement Responsive Images.
         * @param {boolean} [settings.offline] Whether to process the data-offline attributes that help implement offline files.
         * @returns {Promise} A promise to the process state.
         */
        process: function process(elements, settings, success, error) {
            var self = this;

            return utils.buildPromise(function (resolve) {
                settings = self._defaultProcessSettings(settings);
                if (_.isArray(elements) || elements instanceof NodeList || elements.length) {
                    elements = _.flatten(elements);
                } else {
                    elements = [elements];
                }

                var wrappedElements = self._wrapElements(elements);
                var promises = [];
                _.each(wrappedElements, function (element) {
                    var result = {
                        element: element.item,
                        responsive: false,
                        offline: false
                    };

                    var dataUrl = self._getUrl(result.element);

                    if (!dataUrl) {
                        return promises.push(utils.successfulPromise(result));
                    }

                    var canResponsive = settings.responsive ? element.operations.responsive : false;
                    var canOffline = settings.offline ? element.operations.offline : false;

                    if (!canResponsive && !canOffline) {
                        return promises.push(self._setUrl(result.element, dataUrl, true)
                            .then(function () {
                                return result;
                            }));
                    }

                    var promise = self._setLoadingUrl(result.element);
                    var handleOperation = function handleOperation(operation, url) {
                        if (url) {
                            result[operation] = true;
                            return url;
                        }
                    };

                    if (canResponsive) {
                        promise = promise.then(function () {
                            return self._responsive.responsiveImage(element, dataUrl)
                                .then(handleOperation.bind(this, 'responsive'));
                        });
                    }

                    if (canOffline) {
                        promise = promise.then(function (responsiveSrc) {
                            return self._offline.processOffline(responsiveSrc || dataUrl)
                                .then(handleOperation.bind(this, 'offline'));
                        });
                    }

                    promise = promise.then(function (finalUrl) {
                        return self._setUrl(result.element, finalUrl)
                            .then(function () {
                                return result;
                            });
                    }).catch(function (err) {
                        return self._setErrorUrl(result.element)
                            .then(function () {
                                throw {
                                    element: result.element,
                                    error: err
                                }
                            });
                    });

                    promises.push(promise);
                });

                rsvp.allSettled(promises)
                    .then(function (results) {
                        var processed = [];
                        var failed = [];

                        _.each(results, function (result) {
                            if (result.state === 'fulfilled') {
                                processed.push(result.value);
                            } else {
                                failed.push(result.reason);
                            }
                        });

                        var result = {
                            processed: processed,
                            failed: failed
                        };

                        self._triggerOnProcessed(result);
                        resolve(result);
                    });
            }, success, error);
        },

        /**
         * @method processAll
         * @memberOf Helpers.html
         * @param {Object} settings A settings specifying custom behavior.
         * @param {boolean} [settings.responsive] Whether to process the data-responsive attributes that help implement Responsive Images.
         * @param {boolean} [settings.offline] Whether to process the data-offline attributes that help implement offline files.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */

        /**
         * @method processAll
         * @memberOf Helpers.html
         * @param {Object} settings A settings specifying custom behavior.
         * @param {boolean} [settings.responsive] Whether to process the data-responsive attributes that help implement Responsive Images.
         * @param {boolean} [settings.offline] Whether to process the data-offline attributes that help implement offline files.
         * @returns {Promise} A promise to the process state.
         */
        processAll: function processAll(settings, success, error) {
            settings = this._defaultProcessSettings(settings);
            var responsiveSelector = '[' + this.options.attributes.enableResponsive + ']';
            var offlineSelector = '[' + this.options.attributes.enableOffline + ']';

            var responsiveElements = [];
            if (settings.responsive) {
                responsiveElements = document.querySelectorAll(responsiveSelector);
            }

            var offlineElements = [];
            if (settings.offline) {
                offlineElements = document.querySelectorAll(offlineSelector);
            }

            var slice = [].slice;
            var elements = _.unique(slice.call(responsiveElements).concat(slice.call(offlineElements)));


            return this.process(elements, settings, success, error);
        }
    };

    return HtmlHelper;
}());

},{"../../EventEmitterProxy":45,"../../EverliveError":47,"../../common":58,"../../constants":59,"../../everlive.platform":61,"../../utils":100,"./htmlHelperOfflineModule":64,"./htmlHelperResponsiveModule":65}],64:[function(require,module,exports){
'use strict';

var utils = require('../../utils');
var EverliveErrorModule = require('../../EverliveError');
var EverliveErrors = EverliveErrorModule.EverliveErrors;
var EverliveError = EverliveErrorModule.EverliveError;
var constants = require('../../constants');
var path = require('path');
var common = require('../../common');
var _ = common._;

module.exports = (function () {
    function HtmlHelperOfflineModule(htmlHelper) {
        this.htmlHelper = htmlHelper;
    }

    HtmlHelperOfflineModule.prototype = {
        processOffline: function (url) {
            var self = this;

            if (!self.htmlHelper._everlive.offlineStorage.files) {
                return utils.rejectedPromise(new EverliveError('Offline storage must be enabled in order to use the offline features of the images component.'));
            }

            return self.htmlHelper._everlive.offlineStorage.files.downloadOffline(url)
                .then(function (localUrl) {
                    return localUrl;
                })
                .catch(function (err) {
                    if (err.code !== EverliveErrors.cannotDownloadOffline.code) {
                        throw err;
                    }

                    return self.htmlHelper._everlive.offlineStorage._offlineFilesProcessor
                        .getOfflineFilesData()
                        .then(function (offlineFilesData) {
                            var basename = path.basename(url);
                            var oldFile = _.find(offlineFilesData, function (entry) {
                                if (entry.onlineLocation && entry.offlineLocation) {
                                    var onlineLocation = entry.onlineLocation;
                                    var basenameIndex = onlineLocation.lastIndexOf(basename);
                                    return basenameIndex !== -1;
                                }
                            });

                            if (oldFile) {
                                return oldFile.offlineLocation;
                            }

                            throw new EverliveError('Cannot find offline image ' + url, EverliveErrors.missingOrInvalidFileContent.code);
                        });
                });
        }
    };

    return HtmlHelperOfflineModule;
}());
},{"../../EverliveError":47,"../../common":58,"../../constants":59,"../../utils":100,"path":3}],65:[function(require,module,exports){
'use strict';

var common = require('../../common');
var _ = common._;
var rsvp = common.rsvp;
var EverliveError = require('../../EverliveError').EverliveError;
var constants = require('../../constants');
var utils = require('../../utils');

module.exports = (function () {
    function HtmlHelperResponsiveModule(htmlHelper) {
        this.htmlHelper = htmlHelper;
    }

    HtmlHelperResponsiveModule.prototype = {
        getBackgroundWidth: function getBackgroundWidth(el) {
            return Math.ceil(el.offsetWidth);
        },

        parseParamsString: function parseParamsString(str) {
            if (!str || typeof str === 'undefined' || str.length <= 1) {
                return false;
            }

            var isUserResize = false;
            var params = [];
            var tmp = str.split('/');
            var ii = tmp.length;

            for (var i = 0; i < ii; i++) {
                var item = tmp[i].split('='),
                    tmpObj = {};
                if (typeof item[1] === 'undefined') {
                    item[1] = false;
                } else {
                    item[1] = unescape(item[1].replace(/\+/g, ' '));
                }

                tmpObj[item[0]] = item[1];
                params.push(tmpObj);
                if (item[0] === 'resize') {
                    isUserResize = true;
                }
            }
            return {
                params: params,
                isUserResize: isUserResize
            };
        },

        getImgParams: function getImgParams(src) {
            var operations;
            var imgUrl = src.replace(/.*?resize=[^//]*\//gi, '');
            var protocolRe = new RegExp('https?://', 'gi');
            var serverRe = new RegExp(this.htmlHelper._settings.server, 'gi');
            var apiIdRe = new RegExp(this.htmlHelper._everlive.appId + '/', 'gi');

            operations = src.replace(imgUrl, '').replace(protocolRe, '').replace(serverRe, '').replace(apiIdRe, '').toLowerCase();
            if (operations !== '') {
                operations = operations.indexOf('/') ? operations.substring(0, operations.length - 1) : operations;
            } else {
                operations = false;
            }

            operations = this.parseParamsString(operations);
            // If it's a user resize operation, use the passed url in the data-src property
            if (operations.isUserResize) {
                imgUrl = src;
            }

            return {
                imgUrl: imgUrl,
                operations: operations.params,
                isUserResize: operations.isUserResize
            };
        },

        hasClass: function hasClass(el, cl) {
            var regex = new RegExp('(?:\\s|^)' + cl + '(?:\\s|$)');
            return !!el.className.match(regex);
        },

        getImageWidth: function getImageWidth(el) {
            var parentEl = el.parentNode;
            var parentWidth = parentEl.offsetWidth;
            var itemStyle = window.getComputedStyle(parentEl, null);
            var pl = parseFloat(itemStyle.getPropertyValue('padding-left'));
            var pr = parseFloat(itemStyle.getPropertyValue('padding-right'));
            var bl = parseFloat(itemStyle.getPropertyValue('border-left-width'));
            var br = parseFloat(itemStyle.getPropertyValue('border-right-width'));

            return Math.abs(parentWidth - Math.ceil(pl + pr + bl + br));
        },

        getDevicePixelRatio: function getDevicePixelRatio() {
            return window.devicePixelRatio ? window.devicePixelRatio : 1;
        },

        getPixelRatio:function getPixelRatio(el) {
            var pixelDensity = el.getAttribute(this.htmlHelper.options.attributes.dpi) || '';
            return pixelDensity !== '' ? _.isNumber(pixelDensity) ? parseFloat(pixelDensity) : false : this.getDevicePixelRatio();
        },

        getImgParamsString: function getImgParamsString(image, params) {
            var paramsStr = '';
            var i = 0;
            var ii = params.length;
            for (; i < ii; i++) {
                var item = params[i];
                var key = _.keys(item)[0];
                var value;

                if (!utils.isElement.image(image) && key === 'resize') {
                    continue;
                }

                var pixelDensity = this.getPixelRatio(image.item);
                pixelDensity = (pixelDensity) ? ',pd:' + pixelDensity : '';
                for (var k in item) {
                    value = (key === 'resize') ? item[k] + pixelDensity : item[k];
                }

                paramsStr += key + '=' + value + '/';
            }

            return paramsStr;
        },

        responsiveImage: function responsiveImage(item, dataSrc) {
            var self = this;
            var image = _.extend({}, item);
            var element = image.item;
            var tag = image.tag;

            var isImage = utils.isElement.image(tag);
            var imgWidth;

            image = _.extend({}, image, self.getImgParams(dataSrc));

            if (!image.isUserResize) {
                imgWidth = (!isImage) ? self.getBackgroundWidth(element) : self.getImageWidth(element);
            }

            imgWidth = imgWidth ? imgWidth : false;
            var src = image.isUserResize ? image.imgUrl : self.getImgSrc(image, imgWidth);

            return new rsvp.Promise(function (resolve) {
                if (!imgWidth && !image.isUserResize) { // we don't have the width of the user image either.
                    // if this element is not visible, we don't have to process it.

                    return resolve();
                }

                return resolve(src);
            });
        },

        getImgSrc: function getImgSrc(image, imgWidth) {
            var protocol = this.htmlHelper._everlive.setup.scheme + '://';
            var appId = this.htmlHelper._everlive.setup.appId;
            var server = this.htmlHelper._settings.server;
            var url = this.htmlHelper._settings.urlTemplate;
            var pixelDensity = this.getPixelRatio(image.item);

            pixelDensity = pixelDensity ? ',pd:' + pixelDensity : '';

            url = url.replace('[protocol]', protocol);
            url = url.replace('[appid]', appId ? appId : '');
            url = url.replace('[hostname]', server);

            var params = image.operations || false;
            if (params) {
                var operations = '';
                params = this.getImgParamsString(image, params);
                if (utils.isElement.image(image.tag)) {
                    operations = imgWidth ? 'resize=w:' + imgWidth + pixelDensity + '/' + params : params;
                } else {
                    operations = 'resize=w:' + imgWidth + pixelDensity + '/' + params;
                }
                url = url.replace('[operations]', operations);
            } else {
                url = url.replace('[operations]', 'resize=w:' + imgWidth + pixelDensity + '/');
            }

            url = url.replace('[url]', image.imgUrl);
            return url;
        }
    };

    return HtmlHelperResponsiveModule;
}());
},{"../../EverliveError":47,"../../common":58,"../../constants":59,"../../utils":100}],66:[function(require,module,exports){
/*!
 The MIT License (MIT)
 Copyright (c) 2013 Telerik AD
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.y distributed under the MIT license.
 */
/*!
 Everlive SDK
 Version 1.6.0
 */
(function () {
    var Everlive = require('./Everlive');
    var platform = require('./everlive.platform');
    var common = require('./common');

    if (!platform.isNativeScript && !platform.isNodejs) {
        var kendo = require('./kendo/kendo.everlive');
        Everlive.createDataSource = kendo.createDataSource;
        Everlive.createHierarchicalDataSource = kendo.createHierarchicalDataSource;
    }

    //Global event handlers for push notification events. Required by the cordova PushNotifications plugin that we use.
    Everlive.PushCallbacks = {};
    Everlive.Offline = {};

    Everlive.Query = require('./query/Query');
    Everlive.QueryBuilder = require('./query/QueryBuilder');
    Everlive.GeoPoint = require('./GeoPoint');
    Everlive.Constants = require('./constants');
    Everlive.Request = require('./Request');
    Everlive.Data = require('./types/Data');
    Everlive._utils = require('./utils');
    Everlive._traverseAndRevive = Everlive._utils.parseUtilities.traverseAndRevive;
    Everlive._common = require('./common');

    var persistersModule = require('./offline/offlinePersisters');
    Everlive.persister = {
        LocalStorage: persistersModule.LocalStoragePersister,
        FileSystem: persistersModule.FileSystemPersister
    };

    module.exports = Everlive;
}());

},{"./Everlive":46,"./GeoPoint":50,"./Request":52,"./common":58,"./constants":59,"./everlive.platform":61,"./kendo/kendo.everlive":67,"./offline/offlinePersisters":77,"./query/Query":87,"./query/QueryBuilder":88,"./types/Data":97,"./utils":100}],67:[function(require,module,exports){
var QueryBuilder = require('../query/QueryBuilder');
var Query = require('../query/Query');
var Request = require('../Request');
var constants = require('../constants');
var _ = require('../common')._;
var Everlive = require('../Everlive');
var EverliveError = require('../EverliveError').EverliveError;

var operations = {
    read: 'read',
    update: 'update',
    destroy: 'destroy',
    create: 'create'
};

(function () {
    'use strict';

    if (typeof window !== 'undefined' && typeof window.jQuery === 'undefined' || typeof window.kendo === 'undefined' || _.isEmpty(window.kendo.data)) {
        return;
    }

    var $ = window.jQuery;
    var kendo = window.kendo;

    var extend = $.extend;

    var everliveTransport = kendo.data.RemoteTransport.extend({
        init: function (options) {
            this.everlive$ = options.dataProvider || Everlive.$;

            this._subscribeToSdkEvents(options);
            if (!this.everlive$) {
                throw new Error('An instance of the Backend services sdk must be provided.');
            }

            if (!options.typeName) {
                throw new Error('A type name must be provided.');
            }

            this.headers = options.headers;

            this.dataCollection = this.everlive$.data(options.typeName);
            kendo.data.RemoteTransport.fn.init.call(this, options);
        },

        read: function (options) {
            var methodOption = this.options['read'];
            if (methodOption && methodOption.url) {
                return kendo.data.RemoteTransport.fn.read.call(this, options);
            }
            var methodHeaders;
            if (methodOption && methodOption.headers) {
                methodHeaders = methodOption.headers;
            }
            var query = translateKendoQuery(options.data);
            var everliveQuery = new Query(query.$where, null, query.$sort, query.$skip, query.$take);
            var id = options.data.Id;

            if (id) {
                this.dataCollection.withHeaders(this.headers).withHeaders(methodHeaders).getById(id).then(options.success, options.error).catch(options.error);
            } else {
                this.dataCollection.withHeaders(this.headers).withHeaders(methodHeaders).get(everliveQuery).then(options.success, options.error).catch(options.error);
            }
        },

        update: function (options) {
            var methodOption = this.options['update'];
            if (methodOption && methodOption.url) {
                return kendo.data.RemoteTransport.fn.read.call(this, options);
            }
            var methodHeaders;
            if (methodOption && methodOption.headers) {
                methodHeaders = methodOption.headers;
            }
            var isMultiple = _.isArray(options.data.models);
            if (isMultiple) {
                throw new Error('Batch update is not supported.');
            } else {
                var itemForUpdate = options.data;
                return this.dataCollection.withHeaders(this.headers).withHeaders(methodHeaders).updateSingle(itemForUpdate)
                    .then(options.success.bind(this, itemForUpdate), options.error).catch(options.error);
            }
        },

        create: function (options) {
            var methodOption = this.options['create'];
            if (methodOption && methodOption.url) {
                return kendo.data.RemoteTransport.fn.read.call(this, options);
            }
            var methodHeaders;
            if (methodOption && methodOption.headers) {
                methodHeaders = methodOption.headers;
            }
            var isMultiple = _.isArray(options.data.models);
            var createData = isMultiple ? options.data.models : options.data;

            return this.dataCollection.withHeaders(this.headers).withHeaders(methodHeaders).create(createData)
                .then(options.success.bind(this, createData), options.error).catch(options.error);
        },

        destroy: function (options) {
            var methodOption = this.options['destroy'];
            if (methodOption && methodOption.url) {
                return kendo.data.RemoteTransport.fn.read.call(this, options);
            }
            var methodHeaders;
            if (methodOption && methodOption.headers) {
                methodHeaders = methodOption.headers;
            }
            var isMultiple = _.isArray(options.data.models);
            if (isMultiple) {
                throw new Error('Batch destroy is not supported.');
            }

            var removeFilter = {
                Id: options.data.Id
            };

            return this.dataCollection.withHeaders(this.headers).withHeaders(methodHeaders).destroySingle(removeFilter)
                .then(options.success, options.error).catch(options.error);
        },

        _subscribeToSdkEvents: function (options) {
            var self = this;

            _.map(operations, function (op) {
                if (options && options[op] && typeof options[op].beforeSend === 'function') {
                    var listener = options[op].beforeSend;
                    self.everlive$.on(Everlive.Constants.Events.BeforeExecute, listener);
                }
            });
        }
    });

    $.extend(true, kendo.data, {
        transports: {
            everlive: everliveTransport
        },
        schemas: {
            everlive: {
                type: 'json',
                total: function (data) {
                    return data.hasOwnProperty('count') ? data.count : data.Count;
                },
                data: function (data) {
                    return data.result || Everlive._traverseAndRevive(data.Result) || data;
                },
                model: {
                    id: constants.idField
                }
            }
        }
    });

    function translateKendoQuery(data) {
        var result = {};
        if (data) {
            if (data.skip) {
                result.$skip = data.skip;
                delete data.skip;
            }
            if (data.take) {
                result.$take = data.take;
                delete data.take;
            }
            if (data.sort) {
                var sortExpressions = data.sort;
                var sort = {};
                if (!$.isArray(sortExpressions)) {
                    sortExpressions = [sortExpressions];
                }
                $.each(sortExpressions, function (idx, value) {
                    sort[value.field] = value.dir === 'asc' ? 1 : -1;
                });
                result.$sort = sort;
                delete data.sort;
            }
            if (data.filter) {
                var filter = filterBuilder.build(data.filter);
                result.$where = filter;
                delete data.filter;
            }
        }
        return result;
    }

    var regexOperations = ['startswith', 'startsWith', 'endswith', 'endsWith', 'contains'];

    var filterBuilder = {
        build: function (filter) {
            return filterBuilder._build(filter);
        },
        _build: function (filter) {
            if (filterBuilder._isRaw(filter)) {
                return filterBuilder._raw(filter);
            }
            else if (filterBuilder._isSimple(filter)) {
                return filterBuilder._simple(filter);
            }
            else if (filterBuilder._isRegex(filter)) {
                return filterBuilder._regex(filter);
            }
            else if (filterBuilder._isAnd(filter)) {
                return filterBuilder._and(filter);
            }
            else if (filterBuilder._isOr(filter)) {
                return filterBuilder._or(filter);
            }
        },
        _isRaw: function (filter) {
            return filter.operator === '_raw';
        },
        _raw: function (filter) {
            var fieldTerm = {};
            fieldTerm[filter.field] = filter.value;
            return fieldTerm;
        },
        _isSimple: function (filter) {
            return typeof filter.logic === 'undefined' && !filterBuilder._isRegex(filter);
        },
        _simple: function (filter) {
            var term = {}, fieldTerm = {};
            var operator = filterBuilder._translateoperator(filter.operator);
            if (operator) {
                term[operator] = filter.value;
            }
            else {
                term = filter.value;
            }
            fieldTerm[filter.field] = term;
            return fieldTerm;
        },
        _isRegex: function (filter) {
            return $.inArray(filter.operator, regexOperations) !== -1;
        },
        _regex: function (filter) {
            var fieldTerm = {};
            var regex = filterBuilder._getRegex(filter);
            fieldTerm[filter.field] = filterBuilder._getRegexValue(regex);
            return fieldTerm;
        },
        _getRegex: function (filter) {
            var pattern = filter.value;
            var filterOperator = filter.operator;
            switch (filterOperator) {
                case 'contains':
                    return new RegExp(".*" + pattern + ".*", "i");
                case 'startsWith': // removing the camel case operators will be a breaking change
                case 'startswith': // the Kendo UI operators are in lower case
                    return new RegExp("^" + pattern, "i");
                case 'endsWith':
                case 'endswith':
                    return new RegExp(pattern + "$", "i");
            }
            throw new Error("Unknown operator type.");
        },
        _getRegexValue: function (regex) {
            return QueryBuilder.prototype._getRegexValue.call(this, regex);
        },
        _isAnd: function (filter) {
            return filter.logic === 'and';
        },
        _and: function (filter) {
            var i, l, term, result = {};
            var operands = filter.filters;
            for (i = 0, l = operands.length; i < l; i++) {
                term = filterBuilder._build(operands[i]);
                result = filterBuilder._andAppend(result, term);
            }
            return result;
        },
        _andAppend: function (andObj, newObj) {
            return QueryBuilder.prototype._andAppend.call(this, andObj, newObj);
        },
        _isOr: function (filter) {
            return filter.logic === 'or';
        },
        _or: function (filter) {
            var i, l, term, result = [];
            var operands = filter.filters;
            for (i = 0, l = operands.length; i < l; i++) {
                term = filterBuilder._build(operands[i]);
                result.push(term);
            }
            return {$or: result};
        },
        _translateoperator: function (operator) {
            switch (operator) {
                case 'eq':
                    return null;
                case 'neq':
                    return "$ne";
                case 'gt':
                    return "$gt";
                case 'lt':
                    return "$lt";
                case 'gte':
                    return "$gte";
                case 'lte':
                    return "$lte";
            }
            throw new Error("Unknown operator type.");
        }
    };

    /**
     * Creates a new Kendo UI [DataSource](http://docs.telerik.com/kendo-ui/api/javascript/data/datasource) that manages a certain Backend Services content type.
     * Kendo UI [DataSource](http://docs.telerik.com/kendo-ui/api/javascript/data/datasource) is used in conjunction with other Kendo UI widgets (such as [ListView](http://docs.telerik.com/kendo-ui/web/listview/overview) and [Grid](http://docs.telerik.com/kendo-ui/web/grid/overview)) to provide an easy way to render data from Backend Services.
     * *including Kendo UI scripts is required*.
     * @param options data source options. See the Kendo UI documentation for [DataSource](http://docs.telerik.com/kendo-ui/api/javascript/data/datasource) for more information.
     * @param options.transport.typeName The content type name in Backend Services that will be managed.
     * @returns {DataSource} A new instance of Kendo UI DataSource. See the Kendo UI documentation for [DataSource](http://docs.telerik.com/kendo-ui/api/javascript/data/datasource) for more information.
     * @example ```js
     * var booksDataSource = Everlive.createDataSource({
     *   transport: {
     *     typeName: 'Books'
     *   }
     * });
     * ```
     */
    var createDataSource = function (options) {
        options = options || {};
        var typeName = options.typeName;
        var everlive$ = options.dataProvider || Everlive.$;
        if (!everlive$) {
            throw new Error("You need to instantiate an Everlive instance in order to create a Kendo UI DataSource.");
        }

        if (!typeName) {
            throw new Error("You need to specify a 'typeName' in order to create a Kendo UI DataSource.");
        }

        return everlive$.getKendoDataSource(typeName, options);
    };

    /**
     * Creates a new Kendo UI [HierarchicalDataSource](http://docs.telerik.com/kendo-ui/api/javascript/data/hierarchicaldatasource) that manages a certain Backend Services content type and can expand a chain of relations.
     * Kendo UI [HierarchicalDataSource](http://docs.telerik.com/kendo-ui/api/javascript/data/hierarchicaldatasource) is used in conjunction with other Kendo UI widgets (such as [TreeView](http://docs.telerik.com/kendo-ui/web/treeview/overview)) to render data from Backend Services in a structured way.
     * The chain of relations is defined by specifying the field names that contain the relation on each level. For example a generic hierarchy chain is a content type 'Continents' with relation to 'Countries', which in turn contains a relation to 'Towns'.
     * *including Kendo UI scripts is required*.
     * @param options data source Options for [HierarchicalDataSource](http://docs.telerik.com/kendo-ui/api/javascript/data/hierarchicaldatasource).
     * @param options.typeName Name of the main content type for the data source.
     * @param {ExpandDefinition[]} options.expand An array of expand definitions. It defines the levels of hierarchy by specifying the relation fields. An expand definition can either be the field name as a **string**, or an **object** that allows additional options.
     * @param {string} ExpandDefinition - The field name of the relation that will be expanded. Only supported in online mode.
     * @param {string} ExpandDefinition.relation - *Required*. The field name of the relation that will be expanded.
     * @param {string} ExpandDefinition.typeName - *Required in offline mode*. The type name of the relation that will be expanded.
     * @param {object} ExpandDefinition.filter - An object specifying the filter expression.
     * @param {object} ExpandDefinition.sort - An object specifying the sort expression.
     * @param {object} ExpandDefinition.skip - A number specifying the skip value.
     * @param {object} ExpandDefinition.take - A number specifying the take value.
     * @param {object} ExpandDefinition.fields - An object specifying the fields expression.
     * @returns {HierarchicalDataSource} A new instance of Kendo UI HierarchicalDataSource. See the Kendo UI documentation for [HierarchicalDataSource](http://docs.telerik.com/kendo-ui/api/javascript/data/hierarchicaldatasource).
     * @example ```js
     * var el = new Everlive('your-api-key-here');
     * var continents = Everlive.createHierarchicalDataSource({
     *   "typeName": "Continents",
     *   "expand": ["Countries", "Towns"]
     * });
     *
     * ...
     * ("#treeview").kendoTreeView({
     *   dataSource: continents,
     *   dataTextField: ["ContinentName", "CountryName", "TownName"]
     * });
     * ```
     */
    var createHierarchicalDataSource = function (options) {
        var typeName = options.typeName;
        var everlive$ = options.dataProvider || Everlive.$;
        if (!everlive$) {
            throw new Error("You need to instantiate an Everlive instance in order to create a Kendo UI DataSource.");
        }
        if (!typeName) {
            throw new Error("You need to specify a 'typeName' in order to create a Kendo UI DataSource.");
        }
        return everlive$.getHierarchicalDataSource(typeName, options);

    };

    /**
     * Get a Kendo UI DataSource that is attached to the current instance of the SDK with default options.
     * @method getKendoDataSource
     * @memberOf Everlive.prototype
     * @param {String} typeName The corresponding type name for the DataSource.
     * @param {Object} [datasourceOptions] Additional DataSource options.
     * @returns {DataSource}
     */
    Everlive.prototype.getKendoDataSource = function (typeName, datasourceOptions) {
        datasourceOptions = _.extend({}, datasourceOptions);
        if (datasourceOptions.hasOwnProperty('serverGrouping') && datasourceOptions.serverGrouping === true) {
            throw new EverliveError('Server Grouping is not supported.');
        }

        var defaultEverliveOptions = {
            type: 'everlive',
            transport: {
                typeName: typeName,
                dataProvider: this
            }
        };

        var options = _.defaults(defaultEverliveOptions, datasourceOptions);
        return new kendo.data.DataSource(options);
    };


    var getUrlGeneratorForNode = function (baseUrl, expandArray) {
        var expandField = getRelationFieldForExpandNode(expandArray[expandArray.length - 1]);
        var pathArray = expandArray.slice(0, expandArray.length - 1);
        var pathUrl = '/_expand';
        for (var i = 0; i < pathArray.length; i++) {
            pathUrl += '/' + getRelationFieldForExpandNode(pathArray[i]);
        }
        return (function (pathUrl, expandField) {
            return function (options) {
                var url = baseUrl + '';
                if (options.Id && expandField) {//if we are expanding
                    url += pathUrl + '/' + options.Id + '/' + expandField;
                }
                return url;
            }
        }(pathUrl, expandField));
    };

    var getHeadersForExpandNode = function (expandNode) {
        if (typeof expandNode === "string") {
            return {};
        } else {
            return {
                'X-Everlive-Filter': JSON.stringify(expandNode.filter),
                'X-Everlive-Sort': JSON.stringify(expandNode.sort),
                'X-Everlive-Single-Field': expandNode.singleField,
                'X-Everlive-Skip': expandNode.skip,
                'X-Everlive-Take': expandNode.take,
                'X-Everlive-Fields': JSON.stringify(expandNode.fields)
            }
        }
    };

    var getRelationFieldForExpandNode = function (expandNode) {
        if (typeof expandNode === "string") {
            return expandNode;
        } else {
            if (expandNode.relation) {
                return expandNode.relation;
            } else {
                throw new Error("You need to specify a 'relation' for an expand node when using the object notation");
            }
        }
    };

    /**
     * Get a Kendo UI HierarchicalDataSource that is attached to the current instance of the SDK with default options.
     * @method getHierarchicalDataSource
     * @memberOf Everlive.prototype
     * @param {String} typeName The corresponding type name for the DataSource.
     * @param {Object} dataSourceOptions Additional DataSource options that describe the hierarchical structure.
     * @returns {HierarchicalDataSource}
     */
    Everlive.prototype.getHierarchicalDataSource = function (typeName, dataSourceOptions) {
        dataSourceOptions = dataSourceOptions || {};
        if (dataSourceOptions.hasOwnProperty('serverGrouping') && dataSourceOptions.serverGrouping === true) {
            throw new EverliveError('Server Grouping is not supported.');
        }
        var expand = dataSourceOptions.expand || dataSourceOptions;
        delete dataSourceOptions.expand;
        if (!typeName) {
            throw new Error("You need to specify a 'typeName' in order to create a Kendo UI HierarchicalDataSource.");
        }
        if (!$.isArray(expand)) {
            throw new Error("You need to set 'expand' array option in order to create a Kendo UI HierarchicalDataSource");
        }
        var baseUrl = this.buildUrl() + typeName;

        var expandSchema;
        var isOfflineStorageEnabled = this._isOfflineStorageEnabled();
        for (var i = expand.length - 1; i >= 0; i--) { //recursively build the hierarchical data source
            var expandNode = expand[i];
            if (isOfflineStorageEnabled) {
                if (!$.isPlainObject(expandNode)) {
                    throw new Error("When offline is enabled, each member of the expand array option must be an object. (Expand node index: " + i + ")");
                }
                if (!expandNode.relation) {
                    throw new Error("When offline is enabled, each member of the expand array option must have a `relation` option set.  (Expand node index: " + i + ")");
                }
                if (!expandNode.typeName) {
                    throw new Error("When offline is enabled, each member of the expand array option must have a `typeName` option set.  (Expand node index: " + i + ")");
                }

                var headers;
                var expandExpression = {};
                expandExpression[expandNode.relation] = {
                    TargetTypeName: expandNode.typeName,
                    Filter: expandNode.filter,
                    Sort: expandNode.sort,
                    Take: expandNode.take,
                    Skip: expandNode.skip,
                    Fields: expandNode.fields,
                    SingleField: expandNode.singleField
                };
                headers = {
                    'X-Everlive-Expand': JSON.stringify(expandExpression),
                    'X-Everlive-Single-Field': expandNode.relation
                };
                var parentType;
                if (i === 0) {
                    parentType = typeName;
                } else {
                    parentType = expand[i - 1].typeName;
                }
                expandSchema = {
                    model: {
                        hasChildren: expandNode.relation,
                        children: {
                            type: "everlive",
                            transport: {
                                typeName: parentType,
                                read: {
                                    headers: headers
                                }
                            },
                            schema: expandSchema
                        }
                    }
                };
            } else {
                expandSchema = {
                    model: {
                        hasChildren: getRelationFieldForExpandNode(expandNode),
                        children: {
                            type: "everlive",
                            transport: {
                                read: {
                                    url: getUrlGeneratorForNode(baseUrl, expand.slice(0, i + 1)),
                                    headers: getHeadersForExpandNode(expandNode)
                                }
                            },
                            schema: expandSchema
                        }
                    }
                }
            }
        }
        var options = {};
        options.type = 'everlive';
        options.transport = {
            typeName: typeName,
            dataProvider: this
        };
        options.schema = expandSchema;
        if ($.isPlainObject(dataSourceOptions)) {
            extend(true, options, dataSourceOptions);
        }
        return new kendo.data.HierarchicalDataSource(options);
    };


    module.exports = {
        createDataSource: createDataSource,
        createHierarchicalDataSource: createHierarchicalDataSource
    };
}());
},{"../Everlive":46,"../EverliveError":47,"../Request":52,"../common":58,"../constants":59,"../query/Query":87,"../query/QueryBuilder":88}],68:[function(require,module,exports){
var _ = require('../common')._;

var deepExtend = require('./underscoreDeepExtend');
var compactObject = require('./underscoreCompactObject');
var isObjectEmpty = require('./underscoreIsObjectEmpty');

_.mixin({'deepExtend': deepExtend});
_.mixin({'compactObject': compactObject});
_.mixin({'isEmptyObject': isObjectEmpty});
},{"../common":58,"./underscoreCompactObject":69,"./underscoreDeepExtend":70,"./underscoreIsObjectEmpty":71}],69:[function(require,module,exports){
var _ = require('underscore');

//http://stackoverflow.com/questions/14058193/remove-empty-properties-falsy-values-from-object-with-underscore-js
module.exports = function compactObject(o) {
    var newObject = {};
    _.each(o, function(v, k) {
        if(v !== null && v !== undefined) {
            newObject[k] = v
        }
    });

    return newObject;
};

},{"underscore":35}],70:[function(require,module,exports){
/*  Copyright (C) 2012-2014  Kurt Milam - http://xioup.com | Source: https://gist.github.com/1868955
 *   
 *  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 **/

// Based conceptually on the _.extend() function in underscore.js ( see http://documentcloud.github.com/underscore/#extend for more details )

var _ = require('../common')._;

module.exports = function deepExtend(obj) {
    var parentRE = /#{\s*?_\s*?}/,
        slice = Array.prototype.slice;

    _.each(slice.call(arguments, 1), function (source) {
        for (var prop in source) {
            if (_.isUndefined(obj[prop]) || _.isFunction(obj[prop]) || _.isNull(source[prop]) || _.isDate(source[prop])) {
                obj[prop] = source[prop];
            }
            else if (_.isString(source[prop]) && parentRE.test(source[prop])) {
                if (_.isString(obj[prop])) {
                    obj[prop] = source[prop].replace(parentRE, obj[prop]);
                }
            }
            else if (_.isArray(obj[prop]) || _.isArray(source[prop])) {
                if (!_.isArray(obj[prop]) || !_.isArray(source[prop])) {
                    throw new Error('Trying to combine an array with a non-array (' + prop + ')');
                } else {
                    obj[prop] = _.reject(_.deepExtend(_.clone(obj[prop]), source[prop]), function (item) {
                        return _.isNull(item);
                    });
                }
            }
            else if (_.isObject(obj[prop]) || _.isObject(source[prop])) {
                if (!_.isObject(obj[prop]) || !_.isObject(source[prop])) {
                    throw new Error('Trying to combine an object with a non-object (' + prop + ')');
                } else {
                    obj[prop] = _.deepExtend(_.clone(obj[prop]), source[prop]);
                }
            } else {
                obj[prop] = source[prop];
            }
        }
    });
    return obj;
};

/**
 * Dependency: underscore.js ( http://documentcloud.github.com/underscore/ )
 *
 * Mix it in with underscore.js:
 * _.mixin({deepExtend: deepExtend});
 *
 * Call it like this:
 * var myObj = _.deepExtend(grandparent, child, grandchild, greatgrandchild)
 *
 * Notes:
 * Keep it DRY.
 * This function is especially useful if you're working with JSON config documents. It allows you to create a default
 * config document with the most common settings, then override those settings for specific cases. It accepts any
 * number of objects as arguments, giving you fine-grained control over your config document hierarchy.
 *
 * Special Features and Considerations:
 * - parentRE allows you to concatenate strings. example:
 *   var obj = _.deepExtend({url: "www.example.com"}, {url: "http://#{_}/path/to/file.html"});
 *   console.log(obj.url);
 *   output: "http://www.example.com/path/to/file.html"
 *
 * - parentRE also acts as a placeholder, which can be useful when you need to change one value in an array, while
 *   leaving the others untouched. example:
 *   var arr = _.deepExtend([100,    {id: 1234}, true,  "foo",  [250, 500]],
 *                          ["#{_}", "#{_}",     false, "#{_}", "#{_}"]);
 *   console.log(arr);
 *   output: [100, {id: 1234}, false, "foo", [250, 500]]
 *
 * - The previous example can also be written like this:
 *   var arr = _.deepExtend([100,    {id:1234},   true,  "foo",  [250, 500]],
 *                          ["#{_}", {},          false, "#{_}", []]);
 *   console.log(arr);
 *   output: [100, {id: 1234}, false, "foo", [250, 500]]
 *
 * - And also like this:
 *   var arr = _.deepExtend([100,    {id:1234},   true,  "foo",  [250, 500]],
 *                          ["#{_}", {},          false]);
 *   console.log(arr);
 *   output: [100, {id: 1234}, false, "foo", [250, 500]]
 *
 * - Array order is important. example:
 *   var arr = _.deepExtend([1, 2, 3, 4], [1, 4, 3, 2]);
 *   console.log(arr);
 *   output: [1, 4, 3, 2]
 *
 * - You can remove an array element set in a parent object by setting the same index value to null in a child object.
 *   example:
 *   var obj = _.deepExtend({arr: [1, 2, 3, 4]}, {arr: ["#{_}", null]});
 *   console.log(obj.arr);
 *   output: [1, 3, 4]
 *
 **/
},{"../common":58}],71:[function(require,module,exports){
// http://stackoverflow.com/questions/4994201/is-object-empty
'use strict';

var hasOwnProperty = Object.prototype.hasOwnProperty;

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

module.exports = isEmpty;
},{}],72:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var buildPromise = utils.buildPromise;
var Request = require('../Request');
var common = require('../common');
var rsvp = common.rsvp;
var _ = common._;
var reqwest = common.reqwest;
var uuid = common.uuid;
var path = require('path');
var CryptoJS = require('node-cryptojs-aes').CryptoJS;
var errors = require('../EverliveError');
var EverliveErrors = errors.EverliveErrors;
var EverliveError = errors.EverliveError;
var AutoQueue = require('../AutoQueue');

var OfflineFilesModule = function (offlineFilesProcessor, everlive, downloadsConcurrency) {
    this._offlineFilesProcessor = offlineFilesProcessor;
    this._everlive = everlive;
    this._downloadsQueue = new AutoQueue(downloadsConcurrency);
};

/**
 * @class OfflineFilesModule
 * @classdesc A class that provides the means to operate with files in offline mode.
 * @protected
 */
OfflineFilesModule.prototype = {
    _getFilenameMetadata: function (location, offlineFileInfo) {
        return new rsvp.Promise(function (resolve, reject) {
            reqwest({
                url: location,
                method: 'HEAD',
                async: true,
                crossDomain: true
            }).then(function (xmlResponse) {
                var contentDispositionHeader = xmlResponse.getResponseHeader('Content-Disposition');
                if (contentDispositionHeader) {
                    var matches = /filename="?([^"\\]*(?:\\.[^"\\]*)*)"?/i.exec(contentDispositionHeader);
                    if (_.isArray(matches)) {
                        offlineFileInfo.filename = matches[1];
                    }
                } else {
                    offlineFileInfo.filename = path.basename(xmlResponse.responseURL);
                }

                resolve(xmlResponse.responseURL);
            }).catch(reject);
        });
    },

    /**
     * Updates a file's content.
     * @memberof OfflineFilesModule.prototype
     * @method downloadOffline
     * @param {string} location A file location or the id of a file stored in Backend Services.
     * @param {boolean} overwrite Boolean option that indicates whether the file should be overwritten if it already exists offline.
     * @returns {Promise} The promise for the request
     */
    /**
     * Updates a file's content.
     * @memberof OfflineFilesModule.prototype
     * @method downloadOffline
     * @param {string} location A file location or the id of a file stored in Backend Services.
     * @param {boolean} overwrite Boolean option that indicates whether the file should be overwritten if it already exists offline.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    downloadOffline: function (location, overwrite, success, error) {
        var self = this;

        return buildPromise(function (success, error) {
            self._downloadsQueue.enqueue(function (cb) {
                var offlineFileInfo;
                return self._getOfflineFileInfo(location)
                    .then(function (_offlineFileInfo) {
                        offlineFileInfo = _offlineFileInfo;
                        if (overwrite) {
                            return false;
                        }

                        return self.existsOffline(location);
                    })
                    .then(function (exists) {
                        if (!exists) {
                            if (self._everlive.isOnline()) {
                                return utils.successfulPromise()
                                    .then(function () {
                                        if (!offlineFileInfo.filename) {
                                            return self._getFilenameMetadata(location, offlineFileInfo);
                                        }
                                    })
                                    .then(function (locationAfterRedirect) {
                                        var location = locationAfterRedirect || offlineFileInfo.location;
                                        return self._saveFile(location, offlineFileInfo.filename, null, offlineFileInfo.location);
                                    });
                            }

                            error(new EverliveError(EverliveErrors.cannotDownloadOffline));
                        } else {
                            return self._getOfflineFileInfo(location)
                                .then(function (fileInfo) {
                                    return self._getOfflineLocation(fileInfo);
                                });
                        }
                    })
                    .then(function (result) {
                        cb(null, result);
                    })
                    .catch(cb);
            }, success, error);
        }, success, error);
    },

    _saveFile: function (location, filename, id, cacheKey) {
        var self = this;
        var actualLocation;

        return self._downloadFile(location, filename)
            .then(function (_actualLocation) {
                actualLocation = _actualLocation;
                return self._offlineFilesProcessor.getOfflineFilesData();
            })
            .then(function (offlineFilesData) {
                offlineFilesData.push({
                    offlineLocation: actualLocation,
                    onlineLocation: cacheKey || location,
                    id: id
                });

                return self._offlineFilesProcessor.saveOfflineFilesData();
            })
            .then(function () {
                return actualLocation;
            });
    },

    /**
     * Physically deletes the offline copies of all files.
     * @memberof OfflineFilesModule.prototype
     * @method purgeAll
     * @returns {Promise} The promise for the request.
     */
    /**
     * Physically deletes the offline copies of all files.
     * @memberof OfflineFilesModule.prototype
     * @method purgeAll
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    purgeAll: function (success, error) {
        var self = this;

        return utils.buildPromise(function (success, error) {
            self._offlineFilesProcessor.fileStore.removeFilesDirectory()
                .then(function () {
                    return self._offlineFilesProcessor.filesMetaStore.removeFilesDirectory();
                })
                .then(function () {
                    self._offlineFilesProcessor._offlineFilesData = null;
                })
                .then(success)
                .catch(error);
        }, success, error);
    },

    _getOfflineLocation: function (fileInfo) {
        var self = this;
        var url = fileInfo.location;
        var filename = fileInfo.filename;
        var id = fileInfo.Id;

        return self._offlineFilesProcessor.getOfflineLocation(url, id)
            .then(function (offlineUrl) {
                if (offlineUrl) {
                    return offlineUrl;
                }

                // if no url is provided this means that the file exists only offline
                // the Uri field has not been populated by the server
                if (id && !url) {
                    return self._getFileUrlForId(id, filename);
                }

                return null;
            });
    },

    _downloadFile: function (url, name) {
        var self = this;

        // TODO: [offline] this will not work in NativeScript at the moment
        return new rsvp.Promise(function (resolve, reject) {
            var fileTransfer = new FileTransfer();
            var sanitizedUrl = self._sanitizeUrl(url);
            var fileId = path.basename(sanitizedUrl);
            var extension = path.extname(name);
            var filename = fileId;
            if (path.extname(sanitizedUrl) !== extension) {
                filename += extension;
            }

            var fileParentDirectory = '';
            if (!utils.isGuid(url)) {
                var fileIdIndex = url.lastIndexOf(fileId);
                var baseUrl = url.substr(0, fileIdIndex);
                fileParentDirectory = CryptoJS.MD5(baseUrl).toString();
            }

            return self._offlineFilesProcessor.fileStore.getDataDirectory()
                .then(function (dataDir) {
                    return utils.joinPath(dataDir.nativeURL, self._offlineFilesProcessor.fileStore.filesDirectoryPath,
                        fileParentDirectory, filename);
                })
                .then(function (location) {
                    fileTransfer.download(url, location, function () {
                        resolve(location);
                    }, reject, true, {
                        headers: self._everlive.buildAuthHeader()
                    });
                })
                .catch(reject);
        });
    },

    _sanitizeUrl: function (url) {
        if (!url) {
            return url;
        }

        var sanitizedUrl = encodeURI(url);
        var questionMarkIndex = sanitizedUrl.lastIndexOf('?');
        if (questionMarkIndex !== -1) {
            sanitizedUrl = sanitizedUrl.substr(0, questionMarkIndex); //linux does not allow question marks in its filenames
        }

        return sanitizedUrl;
    },

    _getFileUrlForId: function (fileId, filename) {
        var self = this;

        return this._offlineFilesProcessor.fileStore.getDataDirectory()
            .then(function (dataDirectory) {
                var fileExtension = path.extname(filename);
                return utils.joinPath(dataDirectory.nativeURL, self._offlineFilesProcessor.fileStore.filesDirectoryPath, fileId + fileExtension);
            });
    },

    /**
     * Checks if a file exists offline.
     * @memberof OfflineFilesModule.prototype
     * @method exists
     * @param {String} location The location or file id to check.
     * @returns {Promise} The promise for the request
     */
    /**
     * Checks if a file exists offline.
     * @memberof OfflineFilesModule.prototype
     * @method exists
     * @param {String} location The location or file id to check.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    existsOffline: function (location, success, error) {
        var self = this;

        return buildPromise(function (success, error) {
            self._getOfflineFileInfo(location)
                .then(function (fileInfo) {
                    return self._getOfflineLocation(fileInfo);
                })
                .then(function (offlineUrl) {
                    if (offlineUrl) {
                        return self._offlineFilesProcessor.fileStore.getFileByAbsolutePath(offlineUrl);
                    }
                })
                .then(function (offlineFile) {
                    return !!offlineFile;
                })
                .then(success)
                .catch(function (err) {
                    if (err.code === EverliveErrors.itemNotFound.code) {
                        return success(false);
                    }

                    return error.apply(this, arguments);
                });
        }, success, error);
    },


    /**
     * Physically deletes the offline copy of a file.
     * @memberof OfflineFilesModule.prototype
     * @method purge
     * @param {String} location The location or file id to remove.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Physically deletes the offline copy of a file.
     * @memberof OfflineFilesModule.prototype
     * @method purge
     * @param {String} location The location or file id to check.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    purge: function (location, success, error) {
        var self = this;

        return buildPromise(function (success, error) {
            self._getOfflineFileInfo(location)
                .then(function (fileInfo) {
                    return self._getOfflineLocation(fileInfo);
                })
                .then(function (location) {
                    if (location) {
                        return self._offlineFilesProcessor.purge(location);
                    }
                })
                .then(success)
                .catch(error);
        }, success, error);
    },

    /**
     * Gets the native URL for a file that is stored offline.
     * @memberof OfflineFilesModule.prototype
     * @method getOfflineLocation
     * @param {String} location The location or file id to process.
     * @returns {Promise} The promise for the request
     */
    /**
     * Gets the native URL for a file that is stored offline.
     * @memberof OfflineFilesModule.prototype
     * @method getOfflineLocation
     * @param {String} location The location or file id to process.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    getOfflineLocation: function (location, success, error) {
        var self = this;

        return buildPromise(function (success, error) {
            self._getOfflineFileInfo(location)
                .then(self._getOfflineLocation.bind(self))
                .then(function (offlineLocation) {
                    if (offlineLocation) {
                        return self.existsOffline(offlineLocation)
                            .then(function (exists) {
                                if (exists) {
                                    return offlineLocation;
                                }

                                return null;
                            });
                    }

                    return null;
                })
                .then(success)
                .catch(error);
        }, success, error);
    },

    _getOfflineFileInfo: function (location) {
        var self = this;
        var sanitizedUrl = this._sanitizeUrl(location);

        return new rsvp.Promise(function (resolve, reject) {
            self._everlive.Files
                .isSync(true)
                .useOffline(true)
                .getById(sanitizedUrl)
                .then(function (response) {
                    var file = response.result;
                    resolve({
                        location: file.Uri,
                        filename: file.Filename,
                        Id: sanitizedUrl
                    });
                })
                .catch(function (err) {
                    if (err && err.code === EverliveErrors.itemNotFound.code) {
                        resolve({
                            location: location
                        });
                    } else {
                        reject(err);
                    }
                });
        });
    },

    changeFileExtensionById: function (id, extension) {
        var self = this;

        if (typeof extension !== 'string') {
            return new rsvp.Promise(function (resolve) {
                resolve();
            });
        }

        return self._changeExtension(id, extension);
    },

    _changeExtension: function (id, newExtension) {
        var self = this;

        var dataDir;

        var fileStore = self._offlineFilesProcessor.fileStore;
        var fileName = id + newExtension;
        return fileStore.getFilesDirectory()
            .then(function (directoryEntry) {
                dataDir = directoryEntry;
                return self.getOfflineLocation(id);
            })
            .then(function (localPath) {

                var existingFileName = path.basename(localPath);
                if (existingFileName !== fileName) {
                    return fileStore.getFileByAbsolutePath(localPath)
                        .then(function (fileEntry) {
                            return fileStore.renameFile(dataDir, fileEntry, fileName);
                        })
                        .then(function () {
                            return self._offlineFilesProcessor.getOfflineFilesData();
                        })
                        .then(function (offlineFilesData) {
                            var mappedEntry = _.findWhere(offlineFilesData, {offlineLocation: localPath});
                            if (!mappedEntry) {
                                throw new EverliveError('Could not find a cached location for the specified file.');
                            }

                            var previousLocation = mappedEntry.offlineLocation;
                            var previousExtension = path.extname(previousLocation);
                            var actualLocation = previousLocation.slice(0, previousLocation.length - previousExtension.length) + newExtension;
                            mappedEntry.offlineLocation = actualLocation;

                            return self._offlineFilesProcessor.saveOfflineFilesData();
                        });
                }
            });
    }
};

module.exports = OfflineFilesModule;
},{"../AutoQueue":44,"../EverliveError":47,"../Request":52,"../common":58,"../utils":100,"node-cryptojs-aes":25,"path":3}],73:[function(require,module,exports){
'use strict';

var EverliveErrorModule = require('../EverliveError');
var EverliveError = EverliveErrorModule.EverliveError;
var EverliveErrors = EverliveErrorModule.EverliveErrors;
var FileStore = require('../storages/FileStore');
var platform = require('../everlive.platform');
var constants = require('../constants');
var common = require('../common');
var rsvp = common.rsvp;
var utils = require('../utils');
var _ = common._;
var path = require('path');

var FILES_METADATA_FILE_NAME = 'filesMetadataMap';

var OfflineFilesProcessor = function (setup, everlive) {
    this.fileStore = new FileStore(setup.files.storagePath, setup);
    this.filesMetaStore = new FileStore(setup.files.metaPath, setup);
    this._everlive = everlive;
};

OfflineFilesProcessor.prototype = {
    validateFileCreateObject: function (obj, isSync) {
        return new rsvp.Promise(function (resolve, reject) {
            if (!obj.base64 && !isSync) {
                return reject(new EverliveError(EverliveErrors.missingOrInvalidFileContent));
            } else if (!obj.ContentType) {
                return reject(new EverliveError(EverliveErrors.missingContentType));
            } else if (!obj.Filename) {
                //TODO: [offline] add an appropriate error
                return reject(new EverliveError(EverliveErrors.invalidRequest));
            }

            resolve();
        });
    },

    getOfflineFilesData: function () {
        var self = this;

        return new rsvp.Promise(function (resolve, reject) {
            if (!self._offlineFilesData) {
                return self.filesMetaStore.getFile(FILES_METADATA_FILE_NAME)
                    .then(function (metadataFileHandle) {
                        return self.filesMetaStore.readFileAsText(metadataFileHandle);
                    })
                    .then(function (metadataText) {
                        if (!metadataText) {
                            metadataText = '[]';
                        }

                        self._offlineFilesData = JSON.parse(metadataText);
                        resolve(self._offlineFilesData);
                    }).catch(reject);
            } else {
                resolve(self._offlineFilesData);
            }
        });
    },

    saveOfflineFilesData: function () {
        var self = this;

        return self.getOfflineFilesData()
            .then(function (offlineFilesData) {
                return self.filesMetaStore.writeText(FILES_METADATA_FILE_NAME, JSON.stringify(offlineFilesData));
            });
    },

    upsertFileFromObject: function (obj, isCreate, isSync) {
        var self = this;

        if (!isSync) {
            if (isCreate) {
                if (!obj.base64) {
                    return utils.rejectedPromise(new EverliveError(EverliveErrors.missingOrInvalidFileContent));
                }

                if (!obj.ContentType) {
                    return utils.rejectedPromise(new EverliveError(EverliveErrors.missingContentType));
                }
            } else {
                if (!obj.base64) {
                    return utils.successfulPromise();
                }
            }
        }

        if (!obj.base64) {
            var id = utils.getId(obj);
            var uri;
            var downloadFilePromise = obj.Uri ? utils.successfulPromise(obj.Uri) :
                self._everlive.files
                    .isSync(isSync)
                    .applyOffline(false)
                    .getDownloadUrlById(id);

            return downloadFilePromise.then(function (_uri) {
                uri = _uri;
                return self._everlive.offlineStorage.files.existsOffline(id);
            }).then(function (exists) {
                if (!exists) {
                    return self._everlive.offlineStorage.files._saveFile(uri, obj.Filename);
                }
            });
        }

        obj.Storage = 'internal';
        return utils.successfulPromise().then(function () {
            if (!isSync) {
                return self.validateFileCreateObject(obj, isSync);
            }
        }).then(function () {
            var onlineLocation = obj.Uri;
            var filename = self.getFilenameForObject(obj);

            var offlineFileInfo;
            var base64Contents = obj.base64;
            delete obj.base64;

            var contents = utils.b64toBlob(base64Contents, obj.ContentType);

            return self.writeFile(filename, contents)
                .then(function (fileInfo) {
                    offlineFileInfo = fileInfo;
                    return self.getOfflineFilesData();
                })
                .then(function (offlineFilesData) {
                    offlineFilesData.push({
                        offlineLocation: offlineFileInfo.offlineLocation,
                        onlineLocation: onlineLocation,
                        id: obj._id
                    });

                    obj.Length = offlineFileInfo.size;
                    return self.saveOfflineFilesData();
                });
        });
    },

    purge: function (localLocation) {
        var self = this;

        return this.getOfflineFilesData()
            .then(function (offlineFilesData) {
                var offlineFile = _.where(offlineFilesData, {offlineLocation: localLocation});

                // TODO: [offline] check if the length of offlineFile === 0
                var offlineInfoIndex = offlineFilesData.indexOf(offlineFile[0]);
                if (offlineInfoIndex !== -1) {
                    offlineFilesData.splice(offlineInfoIndex, 1);
                }

                return self.saveOfflineFilesData();
            })
            .then(function () {
                return self.fileStore.getFileByAbsolutePath(localLocation);
            }).then(function (file) {
                if (file) {
                    return self.fileStore.removeFile(file);
                }
            });
    },

    writeFile: function (filename, contents, folder) {
        var self = this;
        var offlineLocation;

        return self.fileStore.writeText(filename, contents, folder)
            .then(function (locationOnDisk) {
                offlineLocation = locationOnDisk;
                return self.saveOfflineFilesData();
            })
            .then(function () {
                return self.fileStore.getFileSize(filename, folder);
            })
            .then(function (size) {
                return {
                    size: size,
                    offlineLocation: offlineLocation
                };
            });
    },

    getFilenameForObject: function (obj) {
        var extension = path.extname(obj.Filename);
        return obj._id + extension;
    },

    getOfflineLocation: function (url, id) {
        return this.getOfflineFilesData()
            .then(function (offlineFilesData) {
                if (!url && !id) {
                    return;
                }

                for (var i = 0; i < offlineFilesData.length; i++) {
                    var fileEntry = offlineFilesData[i];
                    var urlMatches = (url && (fileEntry.offlineLocation === url || fileEntry.onlineLocation === url));
                    var idMatches = (id && fileEntry.id === id);
                    if (urlMatches || idMatches) {
                        return fileEntry.offlineLocation;
                    }
                }
            });
    }
};

module.exports = OfflineFilesProcessor;
},{"../EverliveError":47,"../common":58,"../constants":59,"../everlive.platform":61,"../storages/FileStore":93,"../utils":100,"path":3}],74:[function(require,module,exports){
'use strict';

var DataQuery = require('../query/DataQuery');
var utils = require('../utils');
var offlineTransformations = require('./offlineTransformations');
var expandProcessor = require('../ExpandProcessor');
var platform = require('../everlive.platform');

var everliveErrorModule = require('../EverliveError');
var EverliveError = everliveErrorModule.EverliveError;
var EverliveErrors = everliveErrorModule.EverliveErrors;

var buildPromise = require('../utils').buildPromise;
var common = require('../common');
var _ = common._;
var rsvp = common.rsvp;
var mingo = common.Mingo;
var mongoQuery = common.mongoQuery;
var Query = require('../query/Query');

var path = require('path');

var constants = require('../constants');
var Headers = constants.Headers;
var offlineItemStates = constants.offlineItemStates;

var unsupportedOfflineHeaders = [Headers.powerFields];

var unsupportedUsersOperations = {};
unsupportedUsersOperations[DataQuery.operations.Create] = true;
unsupportedUsersOperations[DataQuery.operations.Update] = true;
unsupportedUsersOperations[DataQuery.operations.Delete] = true;
unsupportedUsersOperations[DataQuery.operations.DeleteById] = true;
unsupportedUsersOperations[DataQuery.operations.RawUpdate] = true;
unsupportedUsersOperations[DataQuery.operations.SetAcl] = true;
unsupportedUsersOperations[DataQuery.operations.SetOwner] = true;
unsupportedUsersOperations[DataQuery.operations.UserLoginWithProvider] = true;
unsupportedUsersOperations[DataQuery.operations.UserLinkWithProvider] = true;
unsupportedUsersOperations[DataQuery.operations.UserUnlinkFromProvider] = true;
unsupportedUsersOperations[DataQuery.operations.UserLogin] = true;
unsupportedUsersOperations[DataQuery.operations.UserLogout] = true;
unsupportedUsersOperations[DataQuery.operations.UserChangePassword] = true;
unsupportedUsersOperations[DataQuery.operations.UserResetPassword] = true;

function buildUsersErrorMessage(dataQuery) {
    var unsupportedUserSocialProviderOperations = [
        DataQuery.operations.UserLoginWithProvider,
        DataQuery.operations.UserLinkWithProvider,
        DataQuery.operations.UserUnlinkFromProvider
    ];

    var operation = dataQuery.operation;
    if (unsupportedUserSocialProviderOperations.indexOf(operation) !== -1) {
        operation += dataQuery.data.Provider || dataQuery.data.Identity.Provider;
    }

    return 'The Users operation ' + operation + ' is not supported in offline mode';
}

function buildFilesErrorMessage(dataQuery) {
    return 'The Files operation ' + dataQuery.operation + ' is not supported in offline mode';
}

function OfflineQueryProcessor(persister, encryptionProvider, offlineFilesProcessor, everlive, setup) {
    this._collectionCache = {};
    this.offlineFilesProcessor = offlineFilesProcessor;
    this._persister = persister;
    this._encryptionProvider = encryptionProvider;
    this.everlive = everlive;
    this.setup = setup;
}

OfflineQueryProcessor.prototype = {
    processQuery: function (dataQuery) {
        if (utils.isContentType.files(dataQuery.collectionName) && platform.isDesktop) {
            if (this.everlive.isOnline()) {
                return utils.successfulPromise();
            } else {
                return utils.rejectedPromise(new EverliveError(EverliveErrors.filesNotSupportedInBrowser));
            }
        }

        var unsupportedClientOpMessage = this.getUnsupportedClientOpMessage(dataQuery);
        if (unsupportedClientOpMessage && !dataQuery.isSync) {
            return new rsvp.Promise(function (resolve, reject) {
                reject(new EverliveError(unsupportedClientOpMessage));
            });
        }

        var queryParams = dataQuery.getQueryParameters();
        var unsupportedOperators = utils.getUnsupportedOperators(queryParams.filter);
        var unsupportedOperatorCount = unsupportedOperators.length;
        if (unsupportedOperatorCount) {
            return new rsvp.Promise(function (resolve, reject) {
                var errorMessage;
                if (unsupportedOperatorCount === 1) {
                    errorMessage = 'The operator ' + unsupportedOperators[0] + ' is not supported in offline mode.';
                } else {
                    errorMessage = 'The operators ' + unsupportedOperators.join(',') + 'are not supported in offline mode.';
                }

                reject(new EverliveError(errorMessage, EverliveErrors.operationNotSupportedOffline.code));
            });
        }

        offlineTransformations.traverseAndTransformFilterId(queryParams.filter);

        switch (dataQuery.operation) {
            case DataQuery.operations.Read:
                return this.read(dataQuery, queryParams.filter, queryParams.sort, queryParams.skip, queryParams.limit, queryParams.select, queryParams.expand);
            case DataQuery.operations.ReadById:
                return this.readById(dataQuery, queryParams.expand);
            case DataQuery.operations.FilesGetDownloadUrlById:
                return this.getDownloadUrlById(dataQuery);
            case DataQuery.operations.Count:
                return this.count(dataQuery, queryParams.filter);
            case DataQuery.operations.Create:
                return this.create(dataQuery);
            case DataQuery.operations.RawUpdate:
            case DataQuery.operations.Update:
                return this.update(dataQuery, queryParams.filter);
            case DataQuery.operations.FilesUpdateContent:
                return this.updateFileContent(dataQuery, queryParams.filter);
            case DataQuery.operations.Delete:
                return this.remove(dataQuery, queryParams.filter);
            case DataQuery.operations.DeleteById:
                queryParams.filter._id = dataQuery.additionalOptions.id;
                return this.remove(dataQuery, queryParams.filter);
            default:
                return new rsvp.Promise(function (resolve, reject) {
                    if (dataQuery.isSync) {
                        resolve();
                    } else {
                        reject(new EverliveError(dataQuery.operation + ' is not supported in offline mode'));
                    }
                });
        }
    },

    getDownloadUrlById: function (dataQuery) {
        var self = this;
        var id = dataQuery.additionalOptions.id;
        var offlineFilePath;

        return self.everlive
            .files
            .useOffline(true)
            .isSync(dataQuery.isSync)
            .getById(id)
            .then(function (res) {
                var file = res.result;
                return self.everlive.offlineStorage.files._getFileUrlForId(file.Id, file.Filename);
            })
            .then(function (filePath) {
                offlineFilePath = filePath;
                return self.everlive.offlineStorage._offlineFilesProcessor.fileStore.getFileByAbsolutePath(filePath);
            })
            .then(function (fileEntry) {
                if (fileEntry) {
                    return {
                        result: {
                            Uri: offlineFilePath
                        }
                    }
                }

                return {
                    result: {}
                }
            });
    },

    getUnsupportedClientOpMessage: function (dataQuery) {
        for (var i = 0; i < unsupportedOfflineHeaders.length; i++) {
            var header = unsupportedOfflineHeaders[i];
            if (dataQuery.getHeader(header)) {
                return 'The header ' + header + ' is not supported in offline mode';
            }
        }

        if (utils.isContentType.users(dataQuery.collectionName) && unsupportedUsersOperations[dataQuery.operation]) {
            return buildUsersErrorMessage(dataQuery);
        }

        var isSingle = dataQuery.additionalOptions && dataQuery.additionalOptions.id;
        var isUpdateByFilter = dataQuery.operation === DataQuery.operations.Update && !isSingle;
        var isRawUpdate = dataQuery.operation === DataQuery.operations.RawUpdate;
        if (utils.isContentType.files(dataQuery.collectionName) && (isRawUpdate || isUpdateByFilter)) {
            return buildFilesErrorMessage(dataQuery);
        }
    },

    _getCreateResult: function (createdItems, returnFullItem) {
        if (createdItems.length === 1) {
            var result;
            if (returnFullItem) {
                var item = _.extend({}, createdItems[0]);
                result = offlineTransformations.idTransform(item);
            } else {
                result = {
                    CreatedAt: utils.cloneDate(createdItems[0].CreatedAt),
                    Id: createdItems[0]._id
                }
            }

            return {
                result: result
            };
        } else {
            var multipleCreateResult = [];
            _.each(createdItems, function (createdItem) {
                var item;
                if (returnFullItem) {
                    var itemCopy = _.extend({}, createdItem);
                    item = offlineTransformations.idTransform(itemCopy);
                } else {
                    item = {
                        CreatedAt: utils.cloneDate(createdItem.CreatedAt),
                        Id: createdItem._id
                    };
                }
                multipleCreateResult.push(item);
            });

            return {
                result: multipleCreateResult
            };
        }
    },

    create: function (dataQuery) {
        var self = this;

        return self._createItems(dataQuery.collectionName, dataQuery.data, dataQuery.isSync, dataQuery.preserveState)
            .then(function (createdItems) {
                var isFilesQuery = utils.isContentType.files(dataQuery.collectionName);
                return self._getCreateResult(createdItems, isFilesQuery);
            });
    },

    read: function (dataQuery, filter, sort, skip, limit, select, expand) {
        var self = this;
        var expandResult;

        return new rsvp.Promise(function (resolve, reject) {
            var collectionLength;

            self._prepareExpand(expand, dataQuery, true)
                .then(function (prepareExpandResult) {
                    expandResult = prepareExpandResult;
                    if (prepareExpandResult) {
                        select = prepareExpandResult.mainQueryFieldsExpression;
                    }

                    return self._getCollection(dataQuery.collectionName);
                })
                .then(function (collection) {
                    var result = self._readInternal(collection, filter, sort, skip, limit, select);

                    if (skip || limit) {
                        var all = self._readInternal(collection);
                        collectionLength = all.length;
                    }

                    if (!self._shouldAutogenerateIdForContentType(dataQuery.collectionName)) {
                        result = offlineTransformations.removeIdTransform(result, true);
                    } else {
                        result = offlineTransformations.idTransform(result);
                    }

                    return self._expandResult(expandResult, result);
                })
                .then(function (result) {
                    var response = self._transformOfflineResult(result, collectionLength, dataQuery);
                    resolve(response);
                })
                .catch(reject);
        });
    },

    _readInternal: function (collection, filter, sort, skip, limit, select) {
        var filterCopy = _.extend({}, filter);
        var actualFilter = this._getWithoutDeletedFilter(filterCopy);
        offlineTransformations.traverseAndTransformFilterId(actualFilter);
        var query = mingo.Query(actualFilter);
        var cursor = mingo.Cursor(collection, query, select);
        if (sort) {
            cursor = cursor.sort(sort);
        }

        if (skip) {
            cursor.skip(skip);
        }

        if (limit) {
            cursor.limit(limit);
        }

        return _.map(cursor.all(), function (item) {
            return _.extend({}, item);
        });
    },

    readById: function (dataQuery, expand) {
        var self = this;
        var expandResult;
        return self._prepareExpand(expand, dataQuery, false)
            .then(function (prepareExpandResult) {
                expandResult = prepareExpandResult;
                return self._getCollection(dataQuery.collectionName);
            })
            .then(function (collection) {
                return new rsvp.Promise(function (resolve, reject) {
                    var item = self._getById(collection, dataQuery.additionalOptions.id);

                    if (!item) {
                        return reject(new EverliveError(EverliveErrors.itemNotFound));
                    }

                    item = offlineTransformations.idTransform(item);
                    return self._expandResult(expandResult, item).then(resolve).catch(reject);
                });
            })
            .then(function (result) {
                return self._transformOfflineResult(result, null, dataQuery);
            });
    },

    _getById: function (collection, id) {
        if (!id) {
            throw new EverliveError('Id field is mandatory when using offline storage');
        }

        if (collection[id]) {
            var item = _.extend({}, collection[id]);
            var isDeleted = item && item[constants.offlineItemsStateMarker] === offlineItemStates.deleted;

            return isDeleted ? undefined : item;
        }
    },

    _prepareExpand: function (expand, dataQuery, isArray) {
        return new rsvp.Promise(function (resolve, reject) {
            if (expand) {
                expandProcessor.prepare(expand, dataQuery.collectionName, isArray, dataQuery.fields, null, null, function (err, prepareResult) {
                    if (err) {
                        if (err.name === 'ExpandError') {
                            err.code = EverliveErrors.invalidExpandExpression.code;
                        }
                        return reject(err);
                    }
                    resolve(prepareResult);
                });
            } else {
                resolve();
            }
        });
    },

    _expandResult: function (prepareExpandResult, result) {
        var self = this;
        return new rsvp.Promise(function (resolve, reject) {
            if (prepareExpandResult) {
                expandProcessor.expand(prepareExpandResult.relationsTree, result, {
                    offlineModule: self
                }, function (err, result) {
                    if (err) {
                        if (err.name === 'ExpandError') {
                            err.code = EverliveErrors.invalidExpandExpression.code;
                        }
                        return reject(err);
                    }
                    resolve(result);
                });
            } else {
                resolve(result);
            }
        });
    },

    _getWithoutDeletedFilter: function (filter) {
        var withoutDeletedFilter = {
            $and: []
        };
        withoutDeletedFilter.$and.push(filter);
        var deleteOfflineFilter = {};
        deleteOfflineFilter[constants.offlineItemsStateMarker] = {$ne: offlineItemStates.deleted};
        withoutDeletedFilter.$and.push(deleteOfflineFilter);
        return withoutDeletedFilter;
    },

    _getUpdateItemsResult: function (updateItems) {
        var updatedItemCount = updateItems.length;
        var modifiedAtResult = updatedItemCount ? updateItems[0].ModifiedAt : new Date();

        return {
            ModifiedAt: modifiedAtResult,
            result: updatedItemCount
        };
    },

    update: function (dataQuery, filter) {
        var self = this;

        return this._updateItems(dataQuery, dataQuery.data, filter, dataQuery.isSync).then(function (updateItems) {
            return self._getUpdateItemsResult(updateItems);
        });
    },

    remove: function (dataQuery, filter) {
        return this._removeItems(dataQuery, filter, dataQuery.isSync);
    },

    count: function (dataQuery, filter) {
        var self = this;

        return new rsvp.Promise(function (resolve, reject) {
            self._getCollection(dataQuery.collectionName)
                .then(function (collection) {
                    var filterResult = self._readInternal(collection, filter);
                    resolve({result: filterResult.length});
                }).catch(reject);
        });
    },

    _setItemDates: function (currentItem, itemToCreate, contentType) {
        // we need to manually clone the dates in order to dereference them from the original object as
        // _.extends will pass a reference to the original date instead of creating a new instance
        if (currentItem.CreatedAt && currentItem.CreatedAt instanceof Date) {
            itemToCreate.CreatedAt = utils.cloneDate(currentItem.CreatedAt);
        } else {
            itemToCreate.CreatedAt = new Date();
        }

        if (currentItem.ModifiedAt && currentItem.ModifiedAt instanceof Date) {
            itemToCreate.ModifiedAt = utils.cloneDate(currentItem.ModifiedAt);
        } else {
            itemToCreate.ModifiedAt = utils.cloneDate(itemToCreate.CreatedAt);
        }

        itemToCreate.CreatedBy = itemToCreate.CreatedBy || this.everlive.setup.principalId || constants.guidEmpty;
        itemToCreate.ModifiedBy = itemToCreate.ModifiedBy || itemToCreate.CreatedBy;
        if (contentType === 'Users') {
            itemToCreate.Owner = itemToCreate._id;
        } else {
            itemToCreate.Owner = itemToCreate.CreatedBy || constants.guidEmpty;
        }
    },

    _mapCreateItem: function (currentItem, collection, isSync, preserveState, contentType) {
        var self = this;

        var itemToCreate = _.extend({}, currentItem);
        itemToCreate._id = itemToCreate.Id || utils.uuid();
        delete itemToCreate.Id;

        var existingItem = self._getById(collection, itemToCreate._id);
        var itemExists = !!existingItem;
        var state;
        if (itemExists && (!isSync && !preserveState)) {
            // TODO: [offline] return the same error as the server does
            throw new EverliveError('An item with the specified id already exists');
        } else {
            if (isSync && preserveState && itemExists) {
                state = existingItem[constants.offlineItemsStateMarker];
            } else {
                state = isSync ? undefined : offlineItemStates.created; // set the state to created only if not syncing
            }
        }

        function processItemResult() {
            self._setItemDates(currentItem, itemToCreate, contentType);
            self._setItem(collection, _.extend({}, itemToCreate), state);
            return itemToCreate;
        }

        if (utils.isContentType.files(contentType)) {
            return self.offlineFilesProcessor.upsertFileFromObject(itemToCreate, true, isSync).then(processItemResult);
        } else {
            return processItemResult();
        }
    },

    _createItems: function (contentType, items, isSync, preserveState) {
        var self = this;
        return this._getCollection(contentType)
            .then(function (collection) {
                var itemsForCreate = _.isArray(items) ? items : [items];
                var createdItems = _.map(itemsForCreate, function (currentItem) {
                    return self._mapCreateItem(currentItem, collection, isSync, preserveState, contentType);
                });

                return rsvp.all(createdItems)
                    .then(function (items) {
                        return self._persistData(contentType)
                            .then(function () {
                                // Ids are generated regardless of the autoGenerateId option. However the Id's are omitted when returning
                                // the items to the client if autoGenerateId is false
                                if (!self._shouldAutogenerateIdForContentType(contentType) && !isSync) {
                                    createdItems = offlineTransformations.removeIdTransform(items);
                                }

                                return items;
                            });
                    });
            });
    },

    _applyUpdateOperation: function (originalUpdateExpression, itemToUpdate, collection, isSync, modifiedAt) {
        var dbOperators = utils.getDbOperators(originalUpdateExpression, true);
        var hasDbOperator = dbOperators.length !== 0;

        var updateExpression;
        if (hasDbOperator) {
            updateExpression = originalUpdateExpression;
        } else {
            updateExpression = {
                $set: originalUpdateExpression
            };
        }
        var updateExpressionForUser = {
            ModifiedBy: this.everlive.setup.principalId || constants.guidEmpty
        };
        updateExpression.$set = _.extend(updateExpressionForUser, updateExpression.$set);

        if (isSync) {
            updateExpression.$set.ModifiedAt = utils.cloneDate(originalUpdateExpression.ModifiedAt || modifiedAt);
        }

        mongoQuery(itemToUpdate, {}, updateExpression, {strict: true}); // Setting strict to true so only exact matches would be updated

        itemToUpdate._id = itemToUpdate._id || updateExpression._id || updateExpression.Id;
        delete itemToUpdate.Id;

        var newState;
        if (isSync) {
            newState = undefined;
        } else if (itemToUpdate[constants.offlineItemsStateMarker] === offlineItemStates.created) {
            newState = offlineItemStates.created;
        } else {
            newState = offlineItemStates.modified;
        }

        this._setItem(collection, itemToUpdate, newState);
    },

    updateFileContent: function (dataQuery) {
        var isSync = dataQuery.isSync;
        var updateExpression = dataQuery.data;
        var self = this;
        var itemId = dataQuery.additionalOptions.id;
        var updateItems;
        var typeName = dataQuery.collectionName;
        return this._getCollection(typeName)
            .then(function (collection) {
                var singleItemForUpdate = self._getById(collection, itemId);
                updateItems = [singleItemForUpdate];
                singleItemForUpdate.base64 = updateExpression.base64;
                singleItemForUpdate.Filename = updateExpression.Filename;
                singleItemForUpdate.ContentType = updateExpression.ContentType;
                delete singleItemForUpdate.Uri;

                return self._overwriteFile(itemId, singleItemForUpdate, isSync)
                    .then(function () {
                        self._applyUpdateOperation(updateExpression, singleItemForUpdate, collection);
                        self._setItem(collection, singleItemForUpdate, constants.offlineItemStates.modified);
                        return self._persistData(typeName);
                    })
                    .then(function () {
                        return self._getUpdateItemsResult(updateItems);
                    })
            });
    },

    _overwriteFile: function (itemId, itemForUpdate, isSync) {
        var self = this;

        return self.everlive.offlineStorage.files.purge(itemId)
            .then(function () {
                return self.offlineFilesProcessor.upsertFileFromObject(itemForUpdate, true, isSync);
            })
    },

    _updateItems: function (dataQuery, updateExpression, filter, isSync) {
        var self = this;
        var collectionName = dataQuery.collectionName;

        return self._getCollection(collectionName)
            .then(function (collection) {
                var updateItems;

                if (dataQuery.additionalOptions && dataQuery.additionalOptions.id) {
                    var itemId = dataQuery.additionalOptions.id;
                    var singleItemForUpdate = self._getById(collection, itemId);
                    updateItems = [singleItemForUpdate];

                    if (utils.isContentType.files(collectionName) && updateExpression.$set && updateExpression.$set.Filename || updateExpression.Filename) {
                        var filename = updateExpression.Filename || updateExpression.$set.Filename;
                        var extension = path.extname(filename);
                        return self.everlive.offlineStorage.files.changeFileExtensionById(itemId, extension)
                            .then(function () {
                                self._applyUpdateOperation(updateExpression, singleItemForUpdate, collection, isSync, dataQuery.ModifiedAt);
                                return self._persistData(collectionName);
                            })
                            .then(function () {
                                return updateItems;
                            });
                    } else {
                        self._applyUpdateOperation(updateExpression, singleItemForUpdate, collection, isSync, dataQuery.ModifiedAt);
                    }
                } else {
                    updateItems = self._readInternal(collection, filter);
                    for (var i = 0; i < updateItems.length; i++) {
                        var itemToUpdate = updateItems[i];
                        var itemExists = !!self._getById(collection, itemToUpdate._id.toString());

                        if (!itemExists && !isSync) {
                            // TODO: [offline] return the correct error
                            throw new EverliveError(EverliveErrors.itemNotFound);
                        }

                        self._applyUpdateOperation(updateExpression, itemToUpdate, collection, isSync, dataQuery.ModifiedAt);
                    }
                }

                return self._persistData(collectionName)
                    .then(function () {
                        return updateItems;
                    });
            });
    },

    _getAllCollections: function () {
        var self = this;
        return new rsvp.Promise(function (resolve, reject) {
            self._persister.getAllData(function (allData) {
                _.each(allData, function (value, key) {
                    var decryptedData = self._encryptionProvider.decrypt(value);
                    allData[key] = JSON.parse(decryptedData || '{}', utils.parseUtilities.getReviver());
                });

                resolve(allData);
            }, reject);
        });
    },

    _getCollection: function (contentType) {
        var self = this;

        return new rsvp.Promise(function (resolve, reject) {
            // check the persister if there is no data in the collection cache for this content type
            if (!self._collectionCache[contentType]) {
                self._persister.getData(contentType, function (data) {
                    var decryptedDataRaw = self._encryptionProvider.decrypt(data);
                    var decryptedData = JSON.parse(decryptedDataRaw || '{}', utils.parseUtilities.getReviver());
                    self._collectionCache[contentType] = decryptedData;

                    resolve(self._collectionCache[contentType]);
                }, reject);
            } else {
                resolve(self._collectionCache[contentType]);
            }
        });
    },

    _setItem: function (collection, item, state) {
        if (!state) {
            delete item[constants.offlineItemsStateMarker];
        } else {
            item[constants.offlineItemsStateMarker] = state;
        }

        collection[item._id] = item;
    },


    _getDirtyItems: function (collection) {
        var filter = {};
        filter[constants.offlineItemsStateMarker] = {$exists: true};
        var query = mingo.Query(filter);
        var cursor = mingo.Cursor(collection, query);
        return cursor.all();
    },

    _persistData: function (contentType) {
        var self = this;

        return new rsvp.Promise(function (resolve, reject) {
            var contentTypeData = self._collectionCache[contentType] || {};
            self._transformPersistedData(contentType, contentTypeData);
            var contentTypeDataRaw = JSON.stringify(contentTypeData);
            var contentTypeDataRawEncrypted = self._encryptionProvider.encrypt(contentTypeDataRaw);
            self._persister.saveData(contentType, contentTypeDataRawEncrypted, resolve, reject);
        });
    },

    _shouldAutogenerateIdForContentType: function (contentType) {
        return !(this.setup && this.setup.typeSettings && this.setup.typeSettings[contentType] && this.setup.typeSettings[contentType].autoGenerateId === false);
    },

    _clearItem: function (collection, item) {
        delete collection[item._id];
    },

    _mapRemoveItem: function (itemToRemove, collection, isSync, collectionName) {
        var self = this;

        return new rsvp.Promise(function (resolve, reject) {
            if (utils.isContentType.files(collectionName)) {
                return self.everlive.offlineStorage.files.purge(itemToRemove._id).then(resolve, reject);
            } else {
                return resolve();
            }
        }).then(function () {
                itemToRemove._id = itemToRemove._id || itemToRemove.Id;

                var itemExists = !!self._getById(collection, itemToRemove._id.toString());
                if (!itemExists && !isSync) {
                    throw new EverliveError('Cannot delete item - item with id ' + itemToRemove._id + ' does not exist.');
                }

                // if the item has existed only offline or the data is syncing
                // and the item was deleted by the conflict resolution strategy
                var removeFromMemory = itemToRemove[constants.offlineItemsStateMarker] === offlineItemStates.created || isSync;
                if (removeFromMemory) {
                    self._clearItem(collection, itemToRemove);
                } else {
                    self._setItem(collection, itemToRemove, offlineItemStates.deleted);
                }
            });
    },

    _removeItems: function (dataQuery, filter, isSync) {
        var self = this;
        var collectionName = dataQuery.collectionName;

        return self._getCollection(collectionName)
            .then(function (collection) {
                var itemsToRemove = self._readInternal(collection, filter);

                var removedItemsPromises = _.map(itemsToRemove, function (itemToRemove) {
                    return self._mapRemoveItem(itemToRemove, collection, isSync, collectionName);
                });

                return rsvp.all(removedItemsPromises);
            })
            .then(function (itemsToRemove) {
                return self._persistData(collectionName)
                    .then(function () {
                        return itemsToRemove;
                    });
            })
            .then(function (itemsToRemove) {
                return self._transformOfflineResult(itemsToRemove.length);
            });
    },

    _applyTransformations: function (transformedResult, transformations) {
        if (Array.isArray(transformedResult.result)) {
            _.each(transformations, function (transformation) {
                transformedResult.result.map(function (value, key) {
                    transformedResult.result[key] = transformation(value);
                });
            });
        } else {
            _.each(transformations, function (transformation) {
                transformedResult.result = transformation(transformedResult.result);
            });
        }
    },

    _transformOfflineResult: function (resultSet, count, dataQuery, additionalTransformations) {
        var transformedResult = {
            result: resultSet,
            count: count || (resultSet || []).length
        };

        if ((count !== undefined && count !== null) || Array.isArray(resultSet)) {
            transformedResult.count = count || resultSet.length;
        }

        var transformations = [];

        transformations.push(offlineTransformations.idTransform);
        transformations.push(offlineTransformations.removeMarkersTransform);

        if (dataQuery) {
            var includeCount = dataQuery.getHeader(Headers.includeCount);
            if (includeCount === false) {
                delete transformedResult.count;
            }

            var singleFieldExpression = dataQuery.getHeader(Headers.singleField);
            if (typeof singleFieldExpression === 'string') {
                transformations.push(offlineTransformations.singleFieldTransform.bind(this, singleFieldExpression));
            }
        }

        if (additionalTransformations) {
            transformations = transformations.concat(additionalTransformations);
        }

        this._applyTransformations(transformedResult, transformations);

        if (transformedResult.count === undefined) {
            delete transformedResult.count;
        }

        return transformedResult;
    },

    _transformPersistedData: function (contentType, contentTypeData) {
        var transformFields = [];

        if (contentType === 'Users') {
            transformFields = transformFields.concat(['Password', 'SecretQuestionId', 'SecretAnswer']);
        }

        if (transformFields.length) {
            _.each(contentTypeData, function (contentTypeObject) {
                offlineTransformations.removeFieldsTransform(contentTypeObject, transformFields);
            });
        }
    },

    purgeAll: function (success, error) {
        var self = this;
        this._collectionCache = {};
        return buildPromise(function (success, error) {
            self._collectionCache = {};

            self._persister.purgeAll(function () {
                if (self.everlive.setup.caching) {
                    self.everlive.cache.clearAll(success, error);
                } else {
                    success();
                }
            }, error);
        }, success, error);
    },

    purge: function (contentType, success, error) {
        var self = this;
        return buildPromise(function (success, error) {
            delete self._collectionCache[contentType];

            self._persister.purge(contentType, function () {
                if (self.everlive.setup.caching) {
                    self.everlive.cache.clear(contentType, success, error);
                } else {
                    success();
                }
            }, error);
        }, success, error);
    }
};

module.exports = OfflineQueryProcessor;
},{"../EverliveError":47,"../ExpandProcessor":48,"../common":58,"../constants":59,"../everlive.platform":61,"../query/DataQuery":85,"../query/Query":87,"../utils":100,"./offlineTransformations":78,"path":3}],75:[function(require,module,exports){
var DataQuery = require('../query/DataQuery');
var everliveErrorModule = require('../EverliveError');
var EverliveError = everliveErrorModule.EverliveError;
var EverliveErrors = everliveErrorModule.EverliveErrors;
var constants = require('../constants');
var offlineItemStates = constants.offlineItemStates;
var RequestOptionsBuilder = require('../query/RequestOptionsBuilder');
var common = require('../common');
var _ = common._;
var rsvp = common.rsvp;
var utils = require('../utils');
var Request = require('../Request');
var offlineTransformations = require('./offlineTransformations');
var buildPromise = require('../utils').buildPromise;
var OfflineQueryProcessor = require('./OfflineQueryProcessor');
var OfflineFilesProcessor = require('./OfflineFilesProcessor');
var OfflineFilesModule = require('./OfflineFilesModule');
var path = require('path');

var syncLocation = {
    server: 'server',
    client: 'client'
};

/**
 * @class OfflineModule
 * @classDesc A class providing access to the various offline storage features.
 */

/**
 * Represents the {@link OfflineModule} class.
 * @memberOf Everlive.prototype
 * @member {OfflineModule} offlineStorage
 */

module.exports = (function () {
    function OfflineModule(everlive, options, persister, encryptionProvider) {
        this._everlive = everlive;
        this.setup = options;
        this._isSynchronizing = false;
        this._encryptionProvider = encryptionProvider;

        this._offlineFilesProcessor = new OfflineFilesProcessor(this.setup, this._everlive);
        this._queryProcessor = new OfflineQueryProcessor(persister, encryptionProvider,
            this._offlineFilesProcessor, this._everlive, this.setup);

        /**
         * @memberOf OfflineModule.prototype
         * @instance
         * @description An instance of the [OfflineFilesModule]{@link OfflineFilesModule} class for working with files in offline mode.
         * @member {OfflineFilesModule} files
         */
        this.files = new OfflineFilesModule(this._offlineFilesProcessor,
            this._everlive, this.setup.files.maxConcurrentDownloads);
    }

    var getSyncFilterForItem = function (item) {
        var filter = getSyncFilterNoModifiedAt(item);
        filter.ModifiedAt = item.ModifiedAt;
        return filter;
    };

    var getSyncFilterNoModifiedAt = function (item) {
        return {
            Id: item.Id
        }
    };


    OfflineModule.prototype = {
        /**
         * Removes all data from the offline storage. If caching is enabled clears the entire cache as well.
         * @method purgeAll
         * @name purgeAll
         * @memberOf OfflineModule.prototype
         * @param {function} [success] A success callback.
         * @param {function} [error] An error callback.
         */
        /**
         * Removes all data from the offline storage. If caching is enabled clears the entire cache as well.
         * @method purgeAll
         * @name purgeAll
         * @memberOf OfflineModule.prototype
         * @returns {Promise}
         */
        purgeAll: function (success, error) {
            return this._queryProcessor.purgeAll(success, error);
        },

        /**
         * Removes all data for a specific content type from the offline storage. If caching is enabled clears the cache
         * for the specified content type as well.
         * @method purge
         * @name purge
         * @memberOf OfflineModule.prototype
         * @param {string} contentType The content type to purge.
         * @param {function} [success] A success callback.
         * @param {function} [error] An error callback.
         */
        /**
         * Removes all data for a specific content type from the offline storage. If caching is enabled clears the cache
         * for the specified content type as well.
         * @method purge
         * @name purge
         * @memberOf OfflineModule.prototype
         * @param {string} contentType The content type to purge.
         * @returns {Promise}
         */
        purge: function (contentType, success, error) {
            return this._queryProcessor.purge(contentType, success, error);
        },

        processQuery: function (query) {
            return this._queryProcessor.processQuery(query);
        },

        _setOffline: function (offline) {
            this.setup.offline = offline;
        },

        isOnline: function () {
            return !this.setup.offline;
        },

        _prepareSyncData: function (contentTypesForSync) {
            var self = this;

            var contentTypesSyncData = {};
            var conflicts = [];
            _.each(contentTypesForSync, function (contentType, typeName) {
                var syncItems = offlineTransformations.idTransform(contentType.offlineItemsToSync);
                var syncData = self._getSyncItemStates(typeName, syncItems, contentType.serverItems);
                conflicts.push(syncData.conflicts);
                contentTypesSyncData[typeName] = syncData.itemsForSync;
            });

            return {
                conflicts: conflicts,
                contentTypesSyncData: contentTypesSyncData
            };
        },

        _resolveConflicts: function (syncData) {
            var self = this;
            return this._applyResolutionStrategy(syncData.conflicts)
                .then(function () {
                    return self._mergeResolvedConflicts(syncData.conflicts, syncData.contentTypesSyncData);
                })
                .then(function () {
                    return syncData.contentTypesSyncData;
                });
        },

        isSynchronizing: function () {
            return this._isSynchronizing;
        },

        _fireSyncStart: function () {
            var self = this;

            return new rsvp.Promise(function (resolve) {
                if (!self._isSynchronizing) {
                    self._isSynchronizing = true;
                    self._everlive._emitter.emit(constants.Events.SyncStart);
                    resolve();
                } else {
                    resolve();
                }
            });
        },

        _fireSyncEnd: function () {
            this._isSynchronizing = false;
            this._everlive._emitter.emit(constants.Events.SyncEnd, this._syncResultInfo);
            delete this._syncResultInfo;
        },

        _eachSyncItem: function (items, getFilterFunction, contentTypeName, operation) {
            var self = this;

            _.each(items, function (item) {
                var itemFilter = getFilterFunction(item.remoteItem);
                // if we already have an error for this item we do not want to try and sync it again
                var resultItem = item.resultingItem;
                var isCustom = item.isCustom;
                var resolutionType = item.resolutionType;
                if (_.some(self._syncResultInfo.failedItems[contentTypeName], {itemId: resultItem.Id})) {
                    return;
                }

                operation(resultItem, itemFilter, isCustom, resolutionType);
            });
        },

        _shouldAutogenerateIdForContentType: function (collectionName) {
            return this._queryProcessor._shouldAutogenerateIdForContentType(collectionName);
        },

        _addCreatedFileToSyncPromises: function (resultingItemsForCreate, syncPromises, collectionName) {
            var self = this;

            _.each(resultingItemsForCreate, function (item) {
                var filesCollection = self._everlive.files;
                syncPromises[item.Id] = new rsvp.Promise(function (resolve, reject) {
                    self.files.getOfflineLocation(item.Id)
                        .then(function (location) {
                            if (location) {
                                return self._transferFile(false, item, location);
                            }
                        }, function (err) {
                            reject({
                                type: offlineItemStates.created,
                                items: item,
                                contentType: collectionName,
                                error: err,
                                storage: syncLocation.server
                            });
                        })
                        .then(function (res) {
                            var mergedWithServerResponseItem = _.extend({}, item, res.result);
                            self._onItemProcessed(mergedWithServerResponseItem, collectionName, syncLocation.server, offlineItemStates.created);
                            return filesCollection
                                .isSync(true)
                                .useOffline(true)
                                .updateSingle(mergedWithServerResponseItem);
                        }, function (err) {
                            reject({
                                type: offlineItemStates.created,
                                items: item,
                                contentType: collectionName,
                                error: err,
                                storage: syncLocation.server
                            });
                        })
                        .then(resolve, function (err) {
                            reject({
                                type: offlineItemStates.modified,
                                items: item,
                                contentType: collectionName,
                                error: err,
                                storage: syncLocation.client
                            });
                        });
                });
            });
        },

        _transferFile: function (isUpdate, item, location) {
            var sdk = this._everlive;

            return new rsvp.Promise(function (resolve, reject) {
                var self = this;
                var uploadUrl = sdk.files.getUploadUrl();
                var fileExistsPromise = utils.successfulPromise();

                if (isUpdate) {
                    fileExistsPromise = new rsvp.Promise(function (resolve) {
                        sdk.files
                            .isSync(true)
                            .applyOffline(false)
                            .getById(item.Id)
                            .then(function () {
                                resolve(true);
                            }).catch(function () {
                                resolve(false);
                            });
                    });
                }

                fileExistsPromise.then(function (fileExistsOnServer) {
                    var canUpdate = isUpdate && fileExistsOnServer;
                    if (canUpdate) {
                        uploadUrl += '/' + item.Id + '/Content';
                    }

                    var fileTransfer = new FileTransfer();
                    var fileKey = constants.fileUploadKey;
                    var options = {
                        fileKey: fileKey,
                        httpMethod: canUpdate ? 'PUT' : 'POST',
                        mimeType: item.ContentType,
                        fileName: item.Filename,
                        headers: sdk.buildAuthHeader()
                    };

                    options.params = {};

                    _.each(item, function (value, key) {
                        if (key.toLowerCase() !== 'base64') {
                            var prefixedKey = constants.fileUploadKey + constants.fileUploadDelimiter + key;
                            options.params[prefixedKey] = value;
                        }
                    });

                    fileTransfer.upload(location, uploadUrl, function (result) {
                        var parsedResult = utils.parseUtilities.parseJSON(result.response);
                        if (parsedResult.Result === false) {
                            reject.apply(self, arguments);
                        } else if (_.isArray(parsedResult.Result)) {
                            resolve({
                                result: parsedResult.Result[0]
                            })
                        } else {
                            resolve(parsedResult);
                        }
                    }, reject, options, true);
                });
            });
        },

        _addCreatedObjectToSyncPromises: function (syncPromises, dataCollection, resultingItemsForCreate, contentTypeData, collectionName, ids) {
            var self = this;

            var promise = new rsvp.Promise(function (resolve, reject) {
                dataCollection
                    .isSync(true)
                    .applyOffline(false)
                    .create(resultingItemsForCreate)
                    .then(function (res) {
                        resultingItemsForCreate = _.map(resultingItemsForCreate, function (item, index) {
                            item.Id = res.result[index].Id;
                            item.CreatedAt = item.ModifiedAt = res.result[index].CreatedAt;
                            var resultingItem = _.find(contentTypeData.createdItems, function (createdItem) {
                                return createdItem.resultingItem.Id === item.Id;
                            });

                            if (resultingItem.isCustom) {
                                self._onItemProcessed(item, collectionName, syncLocation.client, offlineItemStates.modified);
                            }

                            return item;
                        });
                    }, function (err) {
                        throw {
                            type: offlineItemStates.created,
                            items: resultingItemsForCreate,
                            contentType: collectionName,
                            error: err,
                            storage: syncLocation.server
                        };
                    })
                    .then(function () {
                        return dataCollection
                            .isSync(true)
                            .useOffline(true)
                            .create(resultingItemsForCreate)
                            .then(function () {
                                _.each(resultingItemsForCreate, function (createdItem) {
                                    self._onItemProcessed(createdItem, collectionName, syncLocation.server,
                                        offlineItemStates.created);
                                });
                            }, function (err) {
                                throw {
                                    type: offlineItemStates.created,
                                    items: resultingItemsForCreate,
                                    contentType: collectionName,
                                    error: err,
                                    storage: syncLocation.client
                                };
                            });
                    })
                    .then(function () {
                        if (ids && ids.length) {
                            var filter = {Id: {$in: ids}};
                            return dataCollection
                                .isSync(true)
                                .useOffline(true)
                                .destroy(filter)
                                .catch(function (err) {
                                    throw {
                                        type: offlineItemStates.created,
                                        items: resultingItemsForCreate,
                                        contentType: collectionName,
                                        error: err,
                                        storage: syncLocation.client
                                    };
                                });
                        }
                    })
                    .then(resolve)
                    .catch(function (err) {
                        reject(err);
                    });
            });

            _.each(resultingItemsForCreate, function (item) {
                syncPromises[item.Id] = promise;
            });

            return resultingItemsForCreate;
        },

        _addCreatedItemsForSync: function (contentTypeData, syncPromises, dataCollection) {
            var collectionName = dataCollection.collectionName;

            var resultingItemsForCreate = _.pluck(contentTypeData.createdItems, 'resultingItem');
            var ids;
            if (!this._shouldAutogenerateIdForContentType(collectionName)) {
                ids = _.pluck(resultingItemsForCreate, 'Id');
                resultingItemsForCreate = offlineTransformations.removeIdTransform(resultingItemsForCreate);
            }

            if (utils.isContentType.files(collectionName)) {
                return this._addCreatedFileToSyncPromises(resultingItemsForCreate, syncPromises, collectionName);
            } else {
                return this._addCreatedObjectToSyncPromises(syncPromises, dataCollection, resultingItemsForCreate, contentTypeData, collectionName, ids);
            }
        },

        _addUpdatedItemsForSync: function (contentTypeData, getFilterOperation, syncPromises, dataCollection, itemUpdateOperation) {
            var self = this;
            var collectionName = dataCollection.collectionName;
            self._eachSyncItem(contentTypeData.modifiedItems, getFilterOperation, collectionName, itemUpdateOperation);
        },

        _addDeletedItemsForSync: function (contentTypeData, getFilterOperation, syncPromises, dataCollection, itemDeleteOperation) {
            var self = this;

            var collectionName = dataCollection.collectionName;
            self._eachSyncItem(contentTypeData.deletedItems, getFilterOperation, collectionName, itemDeleteOperation);
        },

        _onSyncResponse: function (res, item, collectionName, operation, isCustomItem) {
            var self = this;

            if (res.result !== 1) {
                return new rsvp.Promise(function (resolve, reject) {
                    reject(_.extend({}, EverliveErrors.syncConflict, {
                        contentType: collectionName
                    }));
                });
            } else {
                if (operation === DataQuery.operations.Update) {
                    self._onItemProcessed(item, collectionName, syncLocation.server, offlineItemStates.modified);
                    var updatedItem = _.extend({}, item, {
                        ModifiedAt: res.ModifiedAt
                    });

                    var updateQuery = new DataQuery({
                        operation: operation,
                        data: updatedItem,
                        additionalOptions: {
                            id: item.Id
                        },
                        collectionName: collectionName,
                        isSync: true
                    });

                    return this.processQuery(updateQuery)
                        .then(function () {
                            if (isCustomItem) {
                                var existingItem = _.find(self._syncResultInfo.syncedItems[collectionName], function (syncedItem) {
                                    return syncedItem.itemId === item.Id;
                                });

                                if (!existingItem) {
                                    self._onItemProcessed(item, collectionName, syncLocation.client, offlineItemStates.modified);
                                }
                            }
                        });
                } else if (operation === DataQuery.operations.Delete) {
                    self._onItemProcessed(item, collectionName, syncLocation.server, offlineItemStates.deleted);
                    return this._purgeById(collectionName, item.Id)
                        .then(function () {
                            if (isCustomItem) {
                                self._onItemProcessed(item, collectionName, syncLocation.client, offlineItemStates.deleted);
                            }
                        });
                }
            }
        },

        _purgeById: function (contentType, itemId) {
            var self = this;

            return this._queryProcessor._getCollection(contentType)
                .then(function (collection) {
                    delete collection[itemId];
                    return self._queryProcessor._persistData(contentType);
                });
        },

        sync: function () {
            var self = this;
            self._syncResultInfo = self._syncResultInfo || {
                syncedItems: {},
                syncedToServer: 0,
                syncedToClient: 0,
                failedItems: {},
                error: undefined // added for visibility
            };

            if (!this.isOnline()) {
                throw new EverliveError('Cannot synchronize while offline');
            }

            self._fireSyncStart()
                .then(function () {
                    return self._applySync();
                })
                .then(function (syncResults) {
                    var conflictsWhileSync = [];
                    _.each(syncResults, function (syncResult, itemId) {
                        if (syncResult && syncResult.state === 'rejected') {
                            if (syncResult.reason && syncResult.reason.code === EverliveErrors.syncConflict.code) {
                                conflictsWhileSync.push(syncResult);
                            } else {
                                // to save time and traffic we are using a single create request for all items
                                // this is why if there is an error we need to split the items we tried to create
                                // and set the same error for all items.
                                self._onItemFailed(syncResult, itemId);
                            }
                        }
                    });

                    if (conflictsWhileSync.length) {
                        return self.sync();
                    } else {
                        self._fireSyncEnd();
                    }
                })
                .catch(function (err) {
                    self._syncResultInfo.error = err;
                    self._fireSyncEnd();
                });
        },

        _handleKeepServer: function (typeName, conflictingItem, offlineSyncOperations, contentTypeSyncData) {
            var self = this;

            var serverItem = conflictingItem.serverItem;
            var clientItem = conflictingItem.clientItem;
            var syncQuery;
            if (serverItem && clientItem) {
                // update the item offline
                syncQuery = new DataQuery({
                    collectionName: typeName,
                    operation: DataQuery.operations.Update,
                    additionalOptions: {
                        id: serverItem.Id
                    },
                    data: serverItem
                });
            } else if (serverItem && !clientItem) {
                // create item offline
                syncQuery = new DataQuery({
                    collectionName: typeName,
                    operation: DataQuery.operations.Create,
                    data: serverItem
                });
            } else if (!serverItem && clientItem) {
                // delete item offline
                syncQuery = new DataQuery({
                    collectionName: typeName,
                    operation: DataQuery.operations.DeleteById,
                    additionalOptions: {
                        id: clientItem.Id
                    }
                });
            } else {
                throw new EverliveError('Both serverItem and clientItem are not set when syncing data with "KeepServer" resolution strategy.');
            }

            syncQuery.isSync = true;
            offlineSyncOperations.push(new rsvp.Promise(function (resolve, reject) {
                self.processQuery(syncQuery)
                    .then(function () {
                        switch (syncQuery.operation) {
                            case DataQuery.operations.Update:
                                self._onItemProcessed(serverItem, typeName, syncLocation.client, offlineItemStates.modified);
                                // the files content type is special and needs to enable the file contents offline, so we cannot only
                                // update the data
                                if (utils.isContentType.files(typeName)) {
                                    contentTypeSyncData.modifiedItems.push({
                                        remoteItem: conflictingItem.serverItem,
                                        resultingItem: serverItem,
                                        resolutionType: constants.ConflictResolution.KeepServer
                                    });
                                }
                                break;
                            case DataQuery.operations.Create:
                                self._onItemProcessed(serverItem, typeName, syncLocation.client, offlineItemStates.created);
                                break;
                            case DataQuery.operations.DeleteById:
                                self._onItemProcessed(clientItem, typeName, syncLocation.client, offlineItemStates.deleted);
                                break;
                        }
                        resolve();
                    }, function (err) {
                        var itemId;
                        var operation;
                        switch (syncQuery.operation) {
                            case DataQuery.operations.Update:
                                itemId = serverItem.Id;
                                operation = offlineItemStates.modified;
                                break;
                            case DataQuery.operations.Create:
                                itemId = serverItem.Id;
                                operation = offlineItemStates.created;
                                break;
                            case DataQuery.operations.DeleteById:
                                itemId = clientItem.Id;
                                operation = offlineItemStates.deleted;
                                break;
                        }

                        reject({
                            itemId: itemId,
                            type: operation,
                            contentType: syncQuery.collectionName,
                            error: err,
                            storage: syncLocation.client
                        })
                    })
            }));
        },

        _handleKeepClient: function (conflictingItem, contentTypeSyncData) {
            var serverItem = conflictingItem.serverItem;
            var clientItem = conflictingItem.clientItem;
            var resultingItem;
            var collection;

            if (serverItem && clientItem) {
                resultingItem = _.extend(clientItem, {ModifiedAt: new Date(serverItem.ModifiedAt)});
                collection = contentTypeSyncData.modifiedItems;
            } else if (serverItem && !clientItem) {
                resultingItem = serverItem;
                collection = contentTypeSyncData.deletedItems;
            } else if (!serverItem && clientItem) {
                resultingItem = clientItem;
                collection = contentTypeSyncData.createdItems;
            } else {
                throw new EverliveError('Both serverItem and clientItem are not set when syncing data with "KeepClient" resolution strategy.');
            }

            collection.push({
                remoteItem: conflictingItem.serverItem,
                resultingItem: resultingItem,
                resolutionType: constants.ConflictResolution.KeepClient
            });
        },

        _handleCustom: function (conflictingItem, typeName, offlineSyncOperations, contentTypeSyncData) {
            var serverItem = conflictingItem.serverItem;
            var clientItem = conflictingItem.clientItem;
            var customItem = _.omit(conflictingItem.result.item, 'CreatedAt', 'ModifiedAt');
            if (serverItem && customItem) {
                var createItemOfflineQuery = new DataQuery({
                    collectionName: typeName,
                    operation: DataQuery.operations.Create,
                    data: serverItem // create the server item offline and it will be updated when sync finishes
                });

                createItemOfflineQuery.preserveState = true;
                createItemOfflineQuery.isSync = true;

                offlineSyncOperations.push(this.processQuery(createItemOfflineQuery));

                this._onItemProcessed(serverItem, typeName, syncLocation.client, offlineItemStates.created);
            }

            if (serverItem && customItem && !clientItem) {
                customItem.Id = serverItem.Id;
                contentTypeSyncData.modifiedItems.push({
                    remoteItem: serverItem,
                    resultingItem: customItem,
                    isCustom: true
                });
            } else if (serverItem && !customItem) {
                contentTypeSyncData.deletedItems.push({
                    remoteItem: conflictingItem.serverItem,
                    resultingItem: serverItem,
                    isCustom: true
                });
            } else if (!serverItem && customItem && clientItem) {
                var updateItemOfflineQuery = new DataQuery({
                    collectionName: typeName,
                    operation: DataQuery.operations.Update,
                    data: customItem,
                    additionalOptions: {
                        id: clientItem.Id
                    }
                });

                offlineSyncOperations.push(this.processQuery(updateItemOfflineQuery));
                customItem.Id = clientItem.Id;

                contentTypeSyncData.createdItems.push({
                    remoteItem: serverItem,
                    resultingItem: customItem,
                    isCustom: true
                });
            } else {
                customItem.Id = serverItem.Id;
                contentTypeSyncData.modifiedItems.push({
                    remoteItem: serverItem,
                    resultingItem: customItem,
                    isCustom: true
                });
            }
        },

        _mergeResolvedConflicts: function (conflicts, syncData) {
            var self = this;

            var offlineSyncOperations = [];
            _.each(conflicts, function (conflict) {
                var typeName = conflict.contentTypeName;
                _.each(conflict.conflictingItems, function (conflictingItem) {
                    var contentTypeSyncData = syncData[typeName];
                    switch (conflictingItem.result.resolutionType) {
                        case constants.ConflictResolution.KeepServer:
                            self._handleKeepServer(typeName, conflictingItem, offlineSyncOperations, contentTypeSyncData);
                            break;
                        case constants.ConflictResolution.KeepClient:
                            self._handleKeepClient(conflictingItem, contentTypeSyncData);
                            break;
                        case constants.ConflictResolution.Custom:
                            if (utils.isContentType.files(typeName)) {
                                var err = EverliveErrors.customFileSyncNotSupported;
                                throw new EverliveError(err.message, err.code);
                            }

                            self._handleCustom(conflictingItem, typeName, offlineSyncOperations, contentTypeSyncData);
                            break;
                        case constants.ConflictResolution.Skip:
                            break;
                    }
                });
            });

            return rsvp.all(offlineSyncOperations);
        },

        _getSyncItemStates: function (contentType, offlineItems, serverItems) {
            var self = this;

            var contentTypeSyncData = {
                itemsForSync: {
                    createdItems: [],
                    modifiedItems: [],
                    deletedItems: []
                },
                conflicts: {
                    contentTypeName: contentType,
                    conflictingItems: []
                }
            };

            _.each(offlineItems, function (offlineItem) {
                var serverItem = _.findWhere(serverItems, {Id: offlineItem.Id});
                if (serverItem) {
                    if (serverItem.Id === offlineItem.Id && offlineItem[constants.offlineItemsStateMarker] === offlineItemStates.created) {
                        if (self.setup.conflicts.strategy === constants.ConflictResolutionStrategy.Custom) {
                            self._onItemFailed({
                                type: offlineItemStates.modified,
                                storage: syncLocation.client,
                                error: new EverliveError(EverliveErrors.syncError),
                                contentType: contentType
                            }, offlineItem.Id);

                            return self._onItemFailed({
                                type: offlineItemStates.modified,
                                storage: syncLocation.server,
                                error: new EverliveError(EverliveErrors.syncError),
                                contentType: contentType
                            }, serverItem.Id);
                        } else {
                            return self._onItemFailed({
                                type: offlineItemStates.created,
                                storage: syncLocation.client,
                                error: new EverliveError(EverliveErrors.syncError),
                                contentType: contentType
                            }, serverItem.Id);
                        }
                    }

                    var clientItemChanged = !!offlineItem[constants.offlineItemsStateMarker];
                    var hasUpdateConflict = false;

                    if (clientItemChanged) {
                        hasUpdateConflict = serverItem.ModifiedAt.getTime() !== offlineItem.ModifiedAt.getTime()
                        || offlineItem[constants.offlineItemsStateMarker] === offlineItemStates.deleted;
                        //TODO: when an item is removed offline its ModifiedAt field is not set, check if it needs to be set or we can use this
                    }

                    if (hasUpdateConflict) {
                        contentTypeSyncData.conflicts.conflictingItems.push({
                            // if the item was modified on the server and deleted locally we have a conflict and set the client item to null
                            // otherwise it is a simple modification conflict
                            clientItem: offlineItem[constants.offlineItemsStateMarker] === offlineItemStates.deleted ? null : offlineItem,
                            serverItem: serverItem,
                            result: {}
                        });
                    } else {
                        if (offlineItem[constants.offlineItemsStateMarker] === offlineItemStates.deleted) {
                            contentTypeSyncData.itemsForSync.deletedItems.push({
                                remoteItem: serverItem,
                                resultingItem: offlineItem
                            });
                        } else {
                            contentTypeSyncData.itemsForSync.modifiedItems.push({
                                remoteItem: serverItem,
                                resultingItem: offlineItem
                            });
                        }
                    }
                } else {
                    // if the item in memory has been modified, but the item on the server has been deleted
                    if (offlineItem[constants.offlineItemsStateMarker] === offlineItemStates.modified) {
                        contentTypeSyncData.conflicts.conflictingItems.push({
                            clientItem: offlineItem,
                            serverItem: null,
                            result: {}
                        });
                    } else {
                        contentTypeSyncData.itemsForSync.createdItems.push({
                            remoteItem: serverItem,
                            resultingItem: offlineItem
                        });
                    }
                }

                delete offlineItem[constants.offlineItemsStateMarker];
            });

            return contentTypeSyncData;
        },

        _setResolutionTypeForItem: function (resolutionType, conflictingItem) {
            conflictingItem.result = {
                resolutionType: resolutionType
            };
        },

        _applyResolutionStrategy: function (conflicts) {
            var self = this;
            var conflictResolutionStrategy = self.setup.conflicts.strategy;
            return new rsvp.Promise(function (resolve, reject) {
                var conflictResolutionPromises = [];

                for (var i = 0; i < conflicts.length; i++) {
                    var conflict = conflicts[i];
                    if (conflict.conflictingItems.length) {
                        switch (conflictResolutionStrategy) {
                            case constants.ConflictResolutionStrategy.ServerWins:
                                _.each(conflict.conflictingItems,
                                    self._setResolutionTypeForItem.bind(self, constants.ConflictResolution.KeepServer));
                                break;
                            case constants.ConflictResolutionStrategy.Custom:
                                var customStrategy = self.setup.conflicts.implementation;
                                if (!customStrategy) {
                                    return reject(new EverliveError('Implementation of the conflict resolution strategy ' +
                                    'must be provided when set to Custom'));
                                }

                                conflictResolutionPromises.push(new rsvp.Promise(function (resolve) {
                                    customStrategy(conflicts, resolve)
                                }));
                                break;
                            default:
                                return reject(new EverliveError('Invalid resolution strategy provided'));
                        }
                    }
                }

                rsvp.all(conflictResolutionPromises)
                    .then(function () {
                        resolve();
                    });
            });
        },

        _getSyncPromiseBatch: function (contentType, batchIds) {
            var self = this;

            return new rsvp.Promise(function (resolve, reject) {
                var dataQuery = new DataQuery({
                    collectionName: contentType,
                    filter: {
                        'Id': {
                            '$in': batchIds
                        }
                    },
                    operation: DataQuery.operations.Read,
                    onSuccess: function (res) {
                        resolve(res.result);
                    },
                    applyOffline: false,
                    onError: reject
                });

                var getRequestOptionsFromQuery = RequestOptionsBuilder[dataQuery.operation];
                var requestOptions = getRequestOptionsFromQuery(dataQuery);
                var request = new Request(self._everlive.setup, requestOptions);
                request.send();
            });
        },

        _getDirtyItems: function (collection) {
            return this._queryProcessor._getDirtyItems(collection);
        },

        _getSyncPromiseForCollection: function (collection, contentType) {
            var self = this;

            var batches = [];
            var batchSize = constants.syncBatchSize;

            var offlineItemsToSync = self._getDirtyItems(collection);

            var allIdsForSync;
            if (this._shouldAutogenerateIdForContentType(contentType)) {
                allIdsForSync = _.pluck(offlineItemsToSync, '_id');
            } else {
                allIdsForSync = _.pluck(_.reject(offlineItemsToSync, function (offlineItem) {
                    return offlineItem[constants.offlineItemsStateMarker] === offlineItemStates.created;
                }), '_id');
            }

            var batchCount = Math.ceil(allIdsForSync.length / batchSize);

            for (var i = 0; i < batchCount; i++) {
                var batchSkipSize = i * batchSize;
                var batchIds = allIdsForSync.slice(batchSkipSize, batchSkipSize + batchSize);
                var syncGetServerItemsPromise = this._getSyncPromiseBatch(contentType, batchIds);
                batches.push(syncGetServerItemsPromise);
            }

            return rsvp.all(batches)
                .then(function (serverItemsSyncResponses) {
                    var result = {
                        serverItems: []
                    };

                    _.each(serverItemsSyncResponses, function (serverItems) {
                        result.serverItems = _.union(result.serverItems, serverItems);
                    });

                    result.offlineItemsToSync = offlineItemsToSync;
                    return result;
                });
        },

        _onItemFailed: function (syncResult, itemId) {
            var self = this;

            var results = syncResult.reason ? syncResult.reason : syncResult;
            var targetType = results.contentType;

            var getFailedItem = function (id) {
                var pickedObject = _.pick(results, 'storage', 'type', 'error');
                return _.extend({
                    itemId: id,
                    contentType: targetType
                }, pickedObject);
            };

            var failedItems = [];
            if (results.type === offlineItemStates.created && results.items) {
                failedItems = _.map(results.items, function (item) {
                    return getFailedItem(item.Id);
                });
            } else {
                failedItems.push(getFailedItem(itemId));
            }

            self._syncResultInfo.failedItems[targetType] = self._syncResultInfo.failedItems[targetType] || [];
            _.each(failedItems, function (failedItem) {
                self._syncResultInfo.failedItems[targetType].push(failedItem);
                self._fireItemProcessed(failedItem);
            });
        },

        _onItemProcessed: function (item, contentType, syncStorage, syncType) {
            var syncInfo = {
                itemId: item.Id,
                type: syncType,
                storage: syncStorage,
                contentType: contentType
            };

            this._syncResultInfo.syncedItems[contentType] = this._syncResultInfo.syncedItems[contentType] || [];
            this._syncResultInfo.syncedItems[contentType].push(syncInfo);

            if (syncInfo.storage == syncLocation.server) {
                this._syncResultInfo.syncedToServer++;
            } else {
                this._syncResultInfo.syncedToClient++;
            }

            this._fireItemProcessed(syncInfo);
        },

        _fireItemProcessed: function (syncInfo) {
            this._everlive._emitter.emit(constants.Events.ItemProcessed, syncInfo);
        },

        _getClientWinsSyncData: function (collections) {
            var self = this;
            var syncData = {};
            _.each(collections, function (collection, typeName) {
                if (!syncData[typeName]) {
                    syncData[typeName] = {
                        createdItems: [],
                        modifiedItems: [],
                        deletedItems: []
                    };
                }

                var dirtyItems = self._getDirtyItems(collection);
                var itemsForSync = offlineTransformations.idTransform(dirtyItems);

                _.each(itemsForSync, function (itemForSync) {
                    switch (itemForSync[constants.offlineItemsStateMarker]) {
                        case offlineItemStates.created:
                            syncData[typeName].createdItems.push({
                                remoteItem: itemForSync,
                                resultingItem: itemForSync
                            });
                            break;
                        case offlineItemStates.modified:
                            syncData[typeName].modifiedItems.push({
                                remoteItem: itemForSync,
                                resultingItem: itemForSync
                            });
                            break;
                        case offlineItemStates.deleted:
                            syncData[typeName].deletedItems.push({
                                remoteItem: itemForSync,
                                resultingItem: itemForSync
                            });
                            break;
                    }

                    delete itemForSync[constants.offlineItemsStateMarker];
                });
            });

            return syncData;
        },

        _getModifiedFilesForSyncClientWins: function (itemId, item, collectionName) {
            var self = this;
            var sdk = self._everlive;

            return new rsvp.Promise(function (resolve, reject) {
                var offlineFiles = self.files;
                offlineFiles.getOfflineLocation(itemId)
                    .then(function (location) {
                        if (location) {
                            return self._transferFile(true, item, location)
                                .then(function (result) {
                                    if (result.Result === false) {
                                        reject({
                                            type: offlineItemStates.modified,
                                            itemId: item.Id,
                                            contentType: collectionName,
                                            error: result,
                                            storage: syncLocation.server
                                        });
                                    } else {
                                        return {
                                            result: result
                                        };
                                    }
                                }, function (err) {
                                    reject({
                                        type: offlineItemStates.modified,
                                        itemId: item.Id,
                                        contentType: collectionName,
                                        error: err,
                                        storage: syncLocation.server
                                    });
                                });
                        } else {
                            return sdk.files
                                .isSync(true)
                                .applyOffline(false)
                                .updateSingle(item)
                                .then(function (response) {
                                    return response;
                                }, function (err) {
                                    reject({
                                        type: offlineItemStates.modified,
                                        itemId: item.Id,
                                        contentType: collectionName,
                                        error: err,
                                        storage: syncLocation.server
                                    });
                                });
                        }
                    })
                    .then(function (onlineResponse) {
                        var onlineResult = onlineResponse.result;
                        item.ModifiedAt = onlineResult.ModifiedAt;
                        self._onItemProcessed(item, collectionName, syncLocation.server, offlineItemStates.modified);
                        return sdk.files
                            .isSync(true)
                            .useOffline(true)
                            .updateSingle(item);
                    })
                    .then(resolve)
                    .catch(function (err) {
                        reject({
                            type: offlineItemStates.modified,
                            itemId: item.Id,
                            contentType: collectionName,
                            error: err,
                            storage: syncLocation.server
                        });
                    });
            });
        },

        _getModifiedItemForSyncClientWins: function (dataCollection, item, collectionName) {
            var self = this;

            return new rsvp.Promise(function (resolve, reject) {
                return dataCollection
                    .isSync(true)
                    .applyOffline(false)
                    .updateSingle(item)
                    .then(function (res) {
                        self._onItemProcessed(item, collectionName, syncLocation.server, offlineItemStates.modified);
                        var updatedItem = _.extend({}, item, {
                            ModifiedAt: res.ModifiedAt
                        });

                        var updateQuery = new DataQuery({
                            operation: DataQuery.operations.Update,
                            data: updatedItem,
                            additionalOptions: {
                                id: item.Id
                            },
                            collectionName: collectionName,
                            isSync: true
                        });

                        return self.processQuery(updateQuery);
                    }, function (res) {
                        reject({
                            storage: syncLocation.server,
                            type: offlineItemStates.modified,
                            itemId: item.Id,
                            contentType: collectionName,
                            error: res
                        });
                    })
                    .then(resolve, function (err) {
                        reject({
                            storage: syncLocation.client,
                            type: offlineItemStates.modified,
                            itemId: item.Id,
                            contentType: collectionName,
                            error: err
                        });
                    });
            });
        },

        _addModifiedItemsForSyncClientWins: function (contentTypeData, syncPromises, dataCollection) {
            var self = this;

            this._addUpdatedItemsForSync(contentTypeData, getSyncFilterNoModifiedAt, syncPromises, dataCollection, function (item) {
                var itemId = item.Id;
                if (!itemId) {
                    throw new EverliveError('When updating an item it must have an Id field.');
                }
                var collectionName = dataCollection.collectionName;

                if (utils.isContentType.files(collectionName)) {
                    syncPromises[itemId] = self._getModifiedFilesForSyncClientWins(itemId, item, collectionName);
                } else {
                    syncPromises[itemId] = self._getModifiedItemForSyncClientWins(dataCollection, item, collectionName);
                }
            });
        },

        _addDeletedItemsForSyncClientWins: function (contentTypeData, syncPromises, dataCollection) {
            var self = this;

            this._addDeletedItemsForSync(contentTypeData, getSyncFilterNoModifiedAt, syncPromises, dataCollection,
                function (item, itemFilter) {
                    var collectionName = dataCollection.collectionName;
                    syncPromises[item.Id] = new rsvp.Promise(function (resolve, reject) {
                        var itemId = item.Id;
                        if (!itemId) {
                            throw new EverliveError('When deleting an item it must have an Id field.');
                        }

                        return dataCollection
                            .isSync(true)
                            .applyOffline(false)
                            .destroySingle(itemFilter)
                            .then(function () {
                                self._onItemProcessed(item, collectionName, syncLocation.server, offlineItemStates.deleted);
                                return self._purgeById(collectionName, item.Id).then(function () {
                                    resolve();
                                }, function (err) {
                                    reject(_.extend({}, {
                                        storage: syncLocation.client,
                                        type: offlineItemStates.deleted,
                                        contentType: collectionName,
                                        itemId: itemId,
                                        error: err
                                    }));
                                });
                            }, function (err) {
                                reject(_.extend({}, {
                                    storage: syncLocation.server,
                                    type: offlineItemStates.deleted,
                                    contentType: collectionName,
                                    error: err,
                                    itemId: itemId
                                }));
                            });
                    });
                });
        },

        _applyClientWins: function (collections) {
            var self = this;
            var syncData = this._getClientWinsSyncData(collections);
            var syncPromises = {};

            _.each(syncData, function (contentTypeData, typeName) {
                var dataCollection = self._everlive.data(typeName);
                if (contentTypeData.createdItems.length) {
                    self._addCreatedItemsForSync(contentTypeData, syncPromises, dataCollection);
                }

                if (contentTypeData.modifiedItems.length) {
                    self._addModifiedItemsForSyncClientWins(contentTypeData, syncPromises, dataCollection);
                }

                if (contentTypeData.deletedItems.length) {
                    self._addDeletedItemsForSyncClientWins(contentTypeData, syncPromises, dataCollection);
                }
            });

            return rsvp.hashSettled(syncPromises);
        },

        _modifyFileStandardSync: function (syncPromises, itemId, item, collectionName, resolutionType) {
            var self = this;

            var filesCollection = self._everlive.files;
            syncPromises[itemId] = new rsvp.Promise(function (resolve, reject) {
                var offlineLocation;
                self.files.getOfflineLocation(itemId)
                    .then(function (locationOnDisk) {
                        offlineLocation = locationOnDisk;
                    })
                    .then(function () {
                        return filesCollection
                            .isSync(true)
                            .applyOffline(false)
                            .getById(itemId);
                    })
                    .then(function (response) {
                        var file = response.result;
                        if (file.ModifiedAt.getTime() !== item.ModifiedAt.getTime()) {
                            reject(_.extend({}, new EverliveError(EverliveErrors.syncConflict), {
                                contentType: collectionName
                            }));
                        } else {
                            if (offlineLocation) {
                                if (resolutionType === constants.ConflictResolution.KeepServer) {
                                    return self.files._saveFile(item.Uri, item.Filename, item.Id)
                                        .then(function () {
                                            return self._offlineFilesProcessor.purge(offlineLocation);
                                        })
                                        .then(function () {
                                            return response;
                                        });
                                } else if (resolutionType === constants.ConflictResolution.KeepClient) {
                                    return self._transferFile(true, item, offlineLocation);
                                }
                            }
                        }
                    })
                    .then(function () {
                        return self._everlive.files
                            .isSync(true)
                            .useOffline(true)
                            .updateSingle(item);
                    })
                    .then(resolve)
                    .catch(reject);
            });
        },

        _modifyContentTypeStandardSync: function (syncPromises, itemId, dataCollection, item, itemFilter, collectionName, isCustom) {
            var self = this;

            syncPromises[itemId] = dataCollection
                .isSync(true)
                .applyOffline(false)
                .update(item, itemFilter)
                .then(function (res) {
                    return self._onSyncResponse(res, item, collectionName, DataQuery.operations.Update, isCustom);
                }, function (err) {
                    return new rsvp.Promise(function (resolve, reject) {
                        reject({
                            type: offlineItemStates.modified,
                            itemId: item.Id,
                            contentType: collectionName,
                            error: err,
                            storage: syncLocation.server
                        });
                    });
                });
        },

        _applyStandardSync: function (collections) {
            var self = this;

            var promises = {};
            _.each(collections, function (collection, contentType) {
                promises[contentType] = self._getSyncPromiseForCollection(collection, contentType);
            });

            return rsvp.hash(promises)
                .then(function (contentTypes) {
                    return self._prepareSyncData(contentTypes);
                })
                .then(function (syncData) {
                    return self._resolveConflicts(syncData);
                })
                .then(function (contentTypeSyncData) {
                    var syncPromises = {};
                    _.each(contentTypeSyncData, function (contentTypeData, collectionName) {
                        var dataCollection = self._everlive.data(collectionName);
                        if (contentTypeData.createdItems.length) {
                            self._addCreatedItemsForSync(contentTypeData, syncPromises, dataCollection);
                        }

                        if (contentTypeData.modifiedItems.length) {
                            self._addUpdatedItemsForSync(contentTypeData, getSyncFilterForItem, syncPromises, dataCollection, function (item, itemFilter, isCustom, resolutionType) {
                                var itemId = item.Id;

                                if (utils.isContentType.files(collectionName)) {
                                    self._modifyFileStandardSync(syncPromises, itemId, item, collectionName, resolutionType, isCustom);
                                } else {
                                    self._modifyContentTypeStandardSync(syncPromises, itemId, dataCollection, item, itemFilter, collectionName, isCustom);
                                }
                            });
                        }

                        if (contentTypeData.deletedItems.length) {
                            self._addDeletedItemsForSync(contentTypeData, getSyncFilterForItem, syncPromises, dataCollection, function (item, itemFilter, isCustom) {
                                syncPromises[item.Id] = dataCollection
                                    .isSync(true)
                                    .applyOffline(false)
                                    .destroy(itemFilter)
                                    .then(function (res) {
                                        return self._onSyncResponse(res, item, collectionName, DataQuery.operations.Delete, isCustom);
                                    }, function (err) {
                                        return new rsvp.Promise(function (resolve, reject) {
                                            reject({
                                                type: offlineItemStates.deleted,
                                                itemId: item.Id,
                                                contentType: collectionName,
                                                error: err,
                                                storage: syncLocation.server
                                            });
                                        });
                                    });
                            });
                        }
                    });

                    return rsvp.hashSettled(syncPromises);
                });
        },

        _applySync: function () {
            var self = this;

            return this._queryProcessor._getAllCollections()
                .then(function (collections) {
                    if (self.setup.conflicts.strategy === constants.ConflictResolutionStrategy.ClientWins) {
                        return self._applyClientWins(collections);
                    } else {
                        return self._applyStandardSync(collections);
                    }
                });
        },

        /**
         * Get all the offline items that have not been synced online.
         * @method getItemsForSync
         * @name getItemsForSync
         * @memberOf OfflineModule.prototype
         * @param {function} [success] A success callback.
         * @param {function} [error] An error callback.
         */
        /**
         * Get all the offline items that have not been synced online.
         * @method getItemsForSync
         * @name getItemsForSync
         * @memberOf OfflineModule.prototype
         * @returns {Promise}
         */
        getItemsForSync: function (success, error) {
            var self = this;
            var dirtyItemsForSync = {};
            return buildPromise(function (successCb, errorCb) {
                self._queryProcessor._getAllCollections()
                    .then(function (collections) {
                        _.each(collections, function (collection, collectionName) {
                            var dirtyItems = self._getDirtyItems(collection);
                            dirtyItemsForSync[collectionName] = _.map(dirtyItems, function (item) {
                                var itemForSync = {
                                    item: _.extend({}, item),
                                    action: item[constants.offlineItemsStateMarker]
                                };

                                delete itemForSync.item[constants.offlineItemsStateMarker];
                                return itemForSync;
                            });
                        });

                        successCb(dirtyItemsForSync);
                    }).catch(errorCb);
            }, success, error);
        }
    };

    return OfflineModule;
})();

},{"../EverliveError":47,"../Request":52,"../common":58,"../constants":59,"../query/DataQuery":85,"../query/RequestOptionsBuilder":89,"../utils":100,"./OfflineFilesModule":72,"./OfflineFilesProcessor":73,"./OfflineQueryProcessor":74,"./offlineTransformations":78,"path":3}],76:[function(require,module,exports){
var constants = require('../constants');
var persisters = require('./offlinePersisters');
var LocalStoragePersister = persisters.LocalStoragePersister;
var FileSystemPersister = persisters.FileSystemPersister;
var OfflineStorageModule = require('./OfflineStorageModule');
var EverliveError = require('../EverliveError').EverliveError;
var isNativeScript = require('../everlive.platform').isNativeScript;
var common = require('../common');
var _ = common._;
var rsvp = common.rsvp;
var CryptographicProvider = require('../encryption/CryptographicProvider');

var defaultOfflineStorageOptions = {
    autoSync: true,
    enabled: true,
    conflicts: {
        strategy: constants.ConflictResolutionStrategy.ClientWins,
        implementation: null
    },
    offline: false,
    storage: {
        name: '',
        provider: isNativeScript ? constants.StorageProvider.FileSystem : constants.StorageProvider.LocalStorage,
        implementation: null,
        storagePath: constants.DefaultStoragePath
    },
    typeSettings: {},
    encryption: {
        provider: constants.EncryptionProvider.Default,
        implementation: null,
        key: ''
    },
    files: {
        storagePath: constants.DefaultFilesStoragePath,
        metaPath: constants.DefaultFilesMetadataPath,
        maxConcurrentDownloads: constants.MaxConcurrentDownloadTasks
    }
};

module.exports = (function () {

    var conflictResolutionStrategies = {};

    conflictResolutionStrategies[constants.ConflictResolutionStrategy.ClientWins] = function (collection, local, server) {
        return new rsvp.Promise(function (resolve) {
            resolve(local);
        });
    };

    conflictResolutionStrategies[constants.ConflictResolutionStrategy.ServerWins] = function (collection, local, server) {
        return new rsvp.Promise(function (resolve) {
            resolve(server);
        });
    };

    var initStoragePersister = function initStoragePersister(options) {
        var storageKey = options.storage.name || 'everliveOfflineStorage_' + this.setup.appId;
        var persister = persisters.getPersister(storageKey, options);
        options.storage.implementation = persister;
        return persister;
    };

    var initEncryptionProvider = function initEncryptionProvider(options) {
        var encryptor;
        var encryptionProvider = options.encryption.provider;
        var encryptionImplementation = options.encryption.implementation;
        if (_.isObject(encryptionImplementation) && encryptionProvider === constants.EncryptionProvider.Custom) {
            encryptor = encryptionImplementation;
        } else {
            switch (encryptionProvider) {
                case constants.EncryptionProvider.Default:
                    encryptor = new CryptographicProvider(options);
                    break;
                case constants.EncryptionProvider.Custom:
                    throw new EverliveError('Custom encryption provider requires an implementation object');
                default:
                    throw new EverliveError('Unsupported encryption provider ' + encryptionProvider);
            }
        }

        options.encryption.implementation = encryptor;
        return encryptor;
    };

    function buildOfflineStorageOptions(sdkOptions) {
        var storageOptions = sdkOptions.offline || sdkOptions.offlineStorage;
        var options;
        if (storageOptions === true) { // explicit check for shorthand initialization
            options = _.defaults({}, defaultOfflineStorageOptions);
        } else if (_.isObject(storageOptions)) {
            options = _.defaults(storageOptions, defaultOfflineStorageOptions);
            options.storage = _.defaults(storageOptions.storage, defaultOfflineStorageOptions.storage);
            options.encryption = _.defaults(storageOptions.encryption, defaultOfflineStorageOptions.encryption);
            options.conflicts = _.defaults(storageOptions.conflicts, defaultOfflineStorageOptions.conflicts);
            options.files = _.defaults(storageOptions.files, defaultOfflineStorageOptions.files);
        } else {
            options = _.defaults({}, defaultOfflineStorageOptions);
            options.enabled = false;
            if (!storageOptions) {
                sdkOptions.offlineStorage = options;
            }
        }

        options.cacheEnabled = sdkOptions.caching && sdkOptions.caching.enabled;
        return options;
    }

    var buildOfflineStorageModule = function buildOfflineStorageModule(sdkOptions) {
        var options = buildOfflineStorageOptions(sdkOptions);
        var persister = initStoragePersister.call(this, options);
        var encryptionProvider = initEncryptionProvider.call(this, options);

        return new OfflineStorageModule(this, options, persister, encryptionProvider);
    };

    var initOfflineStorage = function (options) {
        this.offlineStorage = buildOfflineStorageModule.call(this, options);
    };

    return {
        initOfflineStorage: initOfflineStorage,
        buildOfflineStorageOptions: buildOfflineStorageOptions
    }
}());
},{"../EverliveError":47,"../common":58,"../constants":59,"../encryption/CryptographicProvider":60,"../everlive.platform":61,"./OfflineStorageModule":75,"./offlinePersisters":77}],77:[function(require,module,exports){
var BasePersister = require('./persisters/BasePersister');
var LocalStoragePersister = require('./persisters/LocalStoragePersister');
var FileSystemPersister = require('./persisters/FileSystemPersister');
var constants = require('../constants');
var EverliveError = require('../EverliveError').EverliveError;
var _ = require('../common')._;

module.exports = {
    BasePersister: BasePersister,
    LocalStoragePersister: LocalStoragePersister,
    FileSystemPersister: FileSystemPersister,
    getPersister: function (storageKey, options) {
        var persister;

        var storageProvider = options.storage.provider;
        var storageProviderImplementation = options.storage.implementation;
        if (_.isObject(storageProviderImplementation) && storageProvider === constants.StorageProvider.Custom) {
            persister = storageProviderImplementation;
        } else {
            switch (storageProvider) {
                case constants.StorageProvider.LocalStorage:
                    persister = new LocalStoragePersister(storageKey, options);
                    break;
                case constants.StorageProvider.FileSystem:
                    persister = new FileSystemPersister(storageKey, options);
                    break;
                case constants.StorageProvider.Custom:
                    throw new EverliveError('Custom storage provider requires an implementation object');
                default:
                    throw new EverliveError('Unsupported storage type ' + storageProvider);
            }
        }

        return persister;
    }
};
},{"../EverliveError":47,"../common":58,"../constants":59,"./persisters/BasePersister":79,"./persisters/FileSystemPersister":80,"./persisters/LocalStoragePersister":81}],78:[function(require,module,exports){
'use strict';

var constants = require('../constants');
var _ = require('../common')._;
var offlineItemStateMarker = constants.offlineItemsStateMarker;

var traverseAndApply = function (value, operation, additionalOptions) {
    if (_.isArray(value)) {
        return _.map(value, function (item) {
            return operation(item, additionalOptions);
        });
    } else {
        return operation(value, additionalOptions);
    }
};

var idTransformation = function (value) {
    if (typeof value === 'object' && value._id && !value.Id) {
        value.Id = value._id;
        delete value._id;
    }

    return value;
};

var removeIdTransform = function (value, opts) {
    var verifyStateCreated = opts.verifyStateCreated;
    var shouldModifyObject = verifyStateCreated ? value[constants.offlineItemsStateMarker] === constants.offlineItemStates.created : true;
    if (typeof value === 'object' && (value._id || value.Id) && shouldModifyObject) {
        delete value._id;
        delete value.Id;
    }

    return value;
};

var removeMarkerTransform = function (value) {
    delete value[offlineItemStateMarker];
    return value;
};

var offlineTransformations = {
    removeIdTransform: function (value, verifyStateCreated) {
        return traverseAndApply(value, removeIdTransform, {verifyStateCreated: verifyStateCreated});
    },
    idTransform: function (value) {
        return traverseAndApply(value, idTransformation);
    },
    singleFieldTransform: function (singleFieldExpression, value) {
        if (typeof value === 'undefined' || value === null) {
            return null;
        } else {
            return value[singleFieldExpression];
        }
    },
    traverseAndTransformFilterId: function (filterObj) {
        if (filterObj && filterObj.Id) {
            filterObj._id = filterObj.Id;
            delete filterObj.Id;
        }

        for (var prop in filterObj) {
            if (filterObj.hasOwnProperty(prop)) {
                var objectMember = filterObj[prop];
                if (typeof objectMember === 'object') {
                    offlineTransformations.traverseAndTransformFilterId(objectMember);
                }
            }
        }
    },
    removeMarkersTransform: function (value) {
        return traverseAndApply(value, removeMarkerTransform);
    },
    removeFieldsTransform: function (value, fields) {
        _.each(fields, function (field) {
            delete value[field];
        });

        return value;
    }
};

module.exports = offlineTransformations;
},{"../common":58,"../constants":59}],79:[function(require,module,exports){
'use strict';

var EverliveError = require('../../EverliveError').EverliveError;
var utils = require('../../utils');
var common = require('../../common');
var _ = common._;
var rsvp = common.rsvp;

var BasePersister = (function () {

    /**
     * @class BasePersister
     * @classdesc An abstraction layer for all persisters. Every persister can write/read
     * data to/from a specific place. The data is saved as key-value pairs where the keys are
     * content types.
     */
    function BasePersister(key, options) {
        this.key = key;
        this.options = options;
        this.contentTypesStoreKey = this.key + '@ContentTypes';
    }

    BasePersister.prototype = {
        /**
         * Gets all the saved data.
         * @method getAllData
         * @memberof BasePersister
         * @param {Function} success A success callback.
         * @param {Function} error An error callback.
         * @returns {Object} The keys are the content types and the values are the corresponding data items.
         */
        getAllData: function (success, error) {
            var self = this;
            var promises = {};
            this._getContentTypes(function (contentTypes) {
                _.each(contentTypes, function (contentType) {
                    promises[contentType] = new rsvp.Promise(function (resolve, reject) {
                        self.getData(contentType, resolve, reject);
                    });
                });

                rsvp.hash(promises)
                    .then(success)
                    .catch(error);
            }, error);
        },

        /**
         * Returns the saved data for a specific content type.
         * @method getData
         * @param {string} contentType The content type for which to retrieve the data.
         * @param {Function} success A success callback.
         * @param {Function} error An error callback.
         * @memberof BasePersister
         * @returns {string} The retrieved data.
         */
        getData: function (contentType, success, error) {
            throw new EverliveError('The method getData is not implemented');
        },

        /**
         * Saves data for a specific content type.
         * @method saveData
         * @param {string} contentType The content for which to save the data.
         * @param {string} data The data corresponding to the specified content type.
         * @param {Function} success A success callback.
         * @param {Function} error An error callback.
         * @memberof BasePersister
         */
        saveData: function (contentType, data, success, error) {
            throw new EverliveError('The method saveData is not implemented');
        },

        /**
         * Clears the persisted data for a specific content type.
         * @method purge
         * @param {string} contentType The content type for which to clear the data.
         * @param {Function} success A success callback.
         * @param {Function} error An error callback.
         * @memberof BasePersister
         */
        purge: function (contentType, success, error) {
            throw new EverliveError('The method clear is not implemented');
        },

        /**
         * Clears all persisted data in the offline store.
         * @method purgeAll
         * @memberof BasePersister
         * @param {Function} success A success callback.
         * @param {Function} error An error callback.
         */
        purgeAll: function (success, error) {
            throw new EverliveError('The method clearAll is not implemented');
        },

        _getKey: function (contentType) {
            return this.key + '_' + contentType;
        },

        _getContentTypes: function (success, error) {
            throw new EverliveError('The method _getContentTypes is not implemented');
        }
    };

    return BasePersister;
}());

module.exports = BasePersister;
},{"../../EverliveError":47,"../../common":58,"../../utils":100}],80:[function(require,module,exports){
'use strict';

var FileStore = require('../../storages/FileStore');
var BasePersister = require('./BasePersister');
var EverliveError = require('../../EverliveError').EverliveError;
var common = require('../../common');
var _ = common._;
var platform = require('../../everlive.platform');
var rsvp = common.rsvp;
var util = require('util');
var path = require('path');
var utils = require('../../utils');

var FileSystemPersister = (function () {
    /**
     * @class FileSystemPersister
     * @protected
     * @extends BasePersister
     */
    function FileSystemPersister(key, options) {
        BasePersister.apply(this, arguments);
        this.fileStore = new FileStore(options.storage.storagePath, options);
    }

    util.inherits(FileSystemPersister, BasePersister);

    FileSystemPersister.prototype.getAllData = function (success, error) {
        var errorHandler = this._fileSystemErrorHandler(error);
        FileSystemPersister.super_.prototype.getAllData.call(this, success, errorHandler);
    };

    FileSystemPersister.prototype.getData = function (contentType, success, error) {
        var self = this;
        var errorHandler = this._fileSystemErrorHandler(error);
        this.getFileHandle(contentType, function (fileEntry) {
            self._readFileContent(fileEntry, success, errorHandler);
        }, error);
    };

    FileSystemPersister.prototype.saveData = function (contentType, data, success, error) {
        var self = this;
        var errorHandler = this._fileSystemErrorHandler(error);
        this.getFileHandle(contentType, function (fileEntry) {
            self._writeFileContent(fileEntry, data, function () {
                self._saveContentTypes(contentType, success, errorHandler);
            }, errorHandler);
        }, errorHandler);
    };

    FileSystemPersister.prototype.purge = function (contentType, success, error) {
        var self = this;
        var errorHandler = this._fileSystemErrorHandler(error);
        this.getFileHandle(contentType, function (fileEntry) {
            self.fileStore.removeFile(fileEntry).then(function () {
                success();
            }).catch(error);
        }, errorHandler);
    };

    FileSystemPersister.prototype.purgeAll = function (success, error) {
        var errorHandler = this._fileSystemErrorHandler(error);
        this.fileStore.removeFilesDirectory()
            .then(function () {
                success();
            })
            .catch(errorHandler);
    };

    FileSystemPersister.prototype._getContentTypes = function (success, error) {
        this.getData(this.contentTypesStoreKey, function (savedContentTypesRaw) {
            var savedContentTypes = JSON.parse(savedContentTypesRaw || '[]');
            success(savedContentTypes);
        }, error);
    };

    FileSystemPersister.prototype._saveContentTypes = function (contentType, success, error) {
        var self = this;
        this._getContentTypes(function (savedContentTypes) {
            if (!_.contains(savedContentTypes, contentType)) {
                savedContentTypes.push(contentType);
            }

            self.getFileHandle(self.contentTypesStoreKey, function (contentTypesFile) {
                self._writeFileContent(contentTypesFile, JSON.stringify(savedContentTypes), success, error);
            }, error);
        });
    };

    FileSystemPersister.prototype.getFileHandle = function (contentType, success, error) {
        var self = this;
        var path = self._getFilePath(contentType);
        this.fileStore.getFilesDirectory()
            .then(function () {
                return self.fileStore.getFile(path);
            })
            .then(function (fileHandle) {
                success(fileHandle);
            })
            .catch(error);
    };

    FileSystemPersister.prototype._readFileContent = function (fileEntry, success, error) {
        this.fileStore.readFileAsText(fileEntry).then(function (content) {
            success(content);
        }).catch(error);
    };

    FileSystemPersister.prototype._writeFileContent = function (fileEntry, content, success, error) {
        this.fileStore.writeTextToFile(fileEntry, content)
            .then(success)
            .catch(error);
    };

    FileSystemPersister.prototype._getFilePath = function (contentType) {
        return this._getKey(contentType);
        //return utils.joinPath(this.fileStore.filesDirectoryPath, this._getKey(contentType));
    };

    FileSystemPersister.prototype._fileSystemErrorHandler = function (callback) {
        return this.fileStore.getErrorHandler(callback);
    };

    return FileSystemPersister;
}());

module.exports = FileSystemPersister;
},{"../../EverliveError":47,"../../common":58,"../../everlive.platform":61,"../../storages/FileStore":93,"../../utils":100,"./BasePersister":79,"path":3,"util":6}],81:[function(require,module,exports){
'use strict';

var common = require('../../common');
var _ = common._;
var rsvp = common.rsvp;
var util = require('util');
var LocalStore = require('../../storages/LocalStore');
var BasePersister = require('./BasePersister');

var LocalStoragePersister = (function () {

    /**
     * @class LocalStoragePersister
     * @extends BasePersister
     */
    function LocalStoragePersister(key, options) {
        BasePersister.apply(this, arguments);
        this._localStore = new LocalStore(options);
    }

    util.inherits(LocalStoragePersister, BasePersister);

    LocalStoragePersister.prototype.getData = function (contentType, success, error) {
        try {
            var key = this._getKey(contentType);
            var storedItem = this._getItem(key);
            success(storedItem);
        } catch (e) {
            error(e);
        }
    };

    LocalStoragePersister.prototype.saveData = function (contentType, data, success, error) {
        try {
            var contentTypeKey = this._getKey(contentType);
            this._setItem(contentTypeKey, data);
            success();
        } catch (e) {
            error(e);
        }
    };

    LocalStoragePersister.prototype.purge = function (contentType, success, error) {
        var self = this;

        try {
            var key = this._getKey(contentType);
            this._removeItem(key);
            this._getContentTypes(function (contentTypes) {
                contentTypes = _.without(contentTypes, contentType);
                self._setContentTypesCollection(contentTypes);
                success();
            }, error);
        } catch (e) {
            error(e);
        }
    };

    LocalStoragePersister.prototype.purgeAll = function (success, error) {
        try {
            var self = this;

            this._getContentTypes(function (contentTypes) {
                _.each(contentTypes, function (contentType) {
                    var contentTypeKey = self._getKey(contentType);
                    self._removeItem(contentTypeKey);
                });

                self._removeItem(self.contentTypesStoreKey);
                success();
            }, error);
        } catch (e) {
            error(e);
        }
    };

    LocalStoragePersister.prototype._getItem = function (key) {
        return this._localStore.getItem(key);
    };

    LocalStoragePersister.prototype._setItem = function (key, value) {
        return this._localStore.setItem(key, value);
    };

    LocalStoragePersister.prototype._removeItem = function (key) {
        return this._localStore.removeItem(key);
    };

    LocalStoragePersister.prototype._getKey = function (contentType) {
        this._addTypeToCollectionsCache(contentType);
        return LocalStoragePersister.super_.prototype._getKey.apply(this, arguments);
    };

    LocalStoragePersister.prototype._getContentTypes = function (success, error) {
        try {
            var localStorageString = this._getItem(this.contentTypesStoreKey);

            var data = [];
            if (localStorageString) {
                data = JSON.parse(localStorageString);
            }

            success(data);
        } catch (e) {
            error(e);
        }
    };

    LocalStoragePersister.prototype._setContentTypesCollection = function (collection) {
        this._setItem(this.contentTypesStoreKey, JSON.stringify(collection));
    };

    LocalStoragePersister.prototype._addTypeToCollectionsCache = function (typeName) {
        var self = this;
        this._getContentTypes(function (contentTypes) {
            if (!_.contains(contentTypes, typeName)) {
                contentTypes.push(typeName);
                self._setContentTypesCollection(contentTypes);
            }
        });
    };

    return LocalStoragePersister;
}());

module.exports = LocalStoragePersister;
},{"../../common":58,"../../storages/LocalStore":94,"./BasePersister":79,"util":6}],82:[function(require,module,exports){
var buildPromise = require('../utils').buildPromise;
var EverliveError = require('../EverliveError').EverliveError;
var Platform = require('../constants').Platform;
var common = require('../common');
var jstz = common.jstz;
var _ = common._;
var utils = require('../utils');

module.exports = (function () {
    /**
     * @class CurrentDevice
     * @deprecated
     * @protected
     * @param pushHandler
     * @constructor
     */
    var CurrentDevice = function (pushHandler) {

        if (!window.cordova) {
                throw new EverliveError('Error: currentDevice() can only be called from within a hybrid mobile app, after \'deviceready\' event has been fired.');
        }

        this._pushHandler = pushHandler;
        this._initSuccessCallback = null;
        this._initErrorCallback = null;

        //Suffix for the global callback functions
        this._globalFunctionSuffix = null;

        this.pushSettings = null;
        this.pushToken = null;
        this.isInitialized = false;
        this.isInitializing = false;

        this.emulatorMode = false;
    };

    CurrentDevice.ensurePushIsAvailable = function() {
        var isPushNotificationPluginAvailable = (typeof window !== 'undefined' && window.plugins && window.plugins.pushNotification);

        if (!isPushNotificationPluginAvailable && !utils._inAppBuilderSimulator()) {
            throw new EverliveError('The push notification plugin is not available. Ensure that the pushNotification plugin is included ' +
            'and use after `deviceready` event has been fired.');
        }
    };

    CurrentDevice.prototype = {

        /**
         * Initializes the current device for push notifications. This method requests a push token from the device vendor and enables the push notification functionality on the device. Once this is done, you can register the device in {{site.TelerikBackendServices}} using the register() method.
         * @method enableNotifications
         * @name enableNotifications
         * @memberOf CurrentDevice.prototype
         * @param {PushSettings} pushSettings An object specifying various settings for the initialization.
         * @returns {Object} The promise for the request.
         */
        /**
         * Initializes the current device for push notifications. This method requests a push token from the device vendor and enables the push notification functionality on the device. Once this is done, you can register the device in Everlive using the register() method.
         * @method enableNotifications
         * @name enableNotifications
         * @memberOf CurrentDevice.prototype
         * @param {PushSettings} pushSettings An object specifying various settings for the initialization.
         * @param {Function} [success] Callback to invoke on success.
         * @param {Function} [error] Callback to invoke on error.
         */
        enableNotifications: function (pushSettings, success, error) {
            this.pushSettings = this._cleanPlatformsPushSettings(pushSettings);

            return buildPromise(_.bind(this._initialize, this), success, error);
        },

        /**
         * Disables push notifications for the current device. This method invalidates any push tokens that were obtained for the device from the current application.
         * @method disableNotifications
         * @name disableNotifications
         * @memberOf CurrentDevice.prototype
         * @returns {Object} The promise for the request.
         */
        /**
         * Disables push notifications for the current device. This method invalidates any push tokens that were obtained for the device from the current application.
         * @method disableNotifications
         * @name disableNotifications
         * @memberOf CurrentDevice.prototype
         * @param {Function} [success] Callback to invoke on success.
         * @param {Function} [error] Callback to invoke on error.
         */
        disableNotifications: function (success, error) {
            var self = this;

            return this.unregister().then(
                function () {
                    return buildPromise(
                        function (success, error) {
                            if (self.emulatorMode) {
                                success();
                            } else {
                                var pushNotification = window.plugins.pushNotification;
                                var unregisterOptions;
                                var platformType = self._getPlatformType();
                                if (platformType === Platform.WindowsPhone) {
                                    unregisterOptions = {'channelName': self.pushSettings.wp8.channelName};
                                }
                                pushNotification.unregister(
                                    function () {
                                        self.isInitialized = false;
                                        success();
                                    },
                                    error,
                                    unregisterOptions
                                );
                            }
                        },
                        success,
                        error
                    );
                },
                error
            );
        },

        /**
         * Returns the push registration for the current device.
         * @memberOf CurrentDevice.prototype
         * @method getRegistration
         * @name getRegistration
         * @returns {Object} The promise for the request.
         */
        /**
         * Returns the push registration for the current device.
         * @memberOf CurrentDevice.prototype
         * @method getRegistration
         * @name getRegistration
         * @param {Function} success Callback to invoke on success.
         * @param {Function} error Callback to invoke on error.
         */
        getRegistration: function (success, error) {
            var deviceId = encodeURIComponent(this._getDeviceId());
            return this._pushHandler.devices.getById('HardwareId/' + deviceId, success, error);
        },

        /**
         * Registers the current device for push notifications in {{site.TelerikBackendServices}}. This method can be called only after [enableNotifications()]{@link currentDevice.enableNotifications} has completed successfully.
         * @memberOf CurrentDevice.prototype
         * @method register
         * @name register
         * @param {Object} customParameters Custom parameters for the registration.
         * @returns {Object} The promise for the request.
         */
        /**
         * Registers the current device for push notifications in {{site.TelerikBackendServices}}. This method can be called only after [enableNotifications()]{@link currentDevice.enableNotifications} has completed successfully.
         * @memberOf CurrentDevice.prototype
         * @method register
         * @name register
         * @param {Object} customParameters Custom parameters for the registration.
         * @param {Function} [success] Callback to invoke on success.
         * @param {Function} [error] Callback to invoke on error.
         */
        register: function (customParameters, success, error) {
            var self = this;

            var deviceRegistration = {};
            if (customParameters !== undefined) {
                deviceRegistration.Parameters = customParameters;
            }

            return this._populateRegistrationObject(deviceRegistration).then(
                function () {
                    return self._pushHandler.devices.create(deviceRegistration, success, error);
                },
                error
            );
        },

        /**
         * Unregisters the current device from push notifications in {{site.TelerikBackendServices}}. After this call completes successfully, {{site.bs}} will no longer send notifications to this device. Note that this does not prevent the device from receiving notifications and does not invalidate push tokens.
         * @memberOf CurrentDevice.prototype
         * @method unregister
         * @name unregister
         * @returns {Object} The promise for the request.
         */
        /**
         * Unregisters the current device from push notifications in {{site.TelerikBackendServices}}. After this call completes successfully, {{site.bs}} will no longer send notifications to this device. Note that this does not prevent the device from receiving notifications and does not invalidate push tokens.
         * @memberOf CurrentDevice.prototype
         * @method unregister
         * @name unregister
         * @param {Function} [success] Callback to invoke on success.
         * @param {Function} [error] Callback to invoke on error.
         */
        unregister: function (success, error) {
            var deviceId = encodeURIComponent(device.uuid);
            return this._pushHandler.devices.destroySingle({Id: 'HardwareId/' + deviceId}, success, error);
        },

        /**
         * Updates the registration of the current device.
         * @memberOf CurrentDevice.prototype
         * @method updateRegistration
         * @name updateRegistration
         * @param {Object} customParameters Custom parameters for the registration. If undefined, customParameters are not updated.
         * @returns {Object} The promise for the request.
         */
        /**
         * Updates the registration for the current device.
         * @memberOf CurrentDevice.prototype
         * @method updateRegistration
         * @name updateRegistration
         * @param {Object} customParameters Custom parameters for the registration. If undefined, customParameters are not updated.
         * @param {Function} [success] Callback to invoke on success.
         * @param {Function} [error] Callback to invoke on error.
         */
        updateRegistration: function (customParameters, success, error) {
            var self = this;

            var deviceRegistration = {};
            if (customParameters !== undefined) {
                deviceRegistration.Parameters = customParameters;
            }

            return this._populateRegistrationObject(deviceRegistration).then(
                function () {
                    deviceRegistration.Id = 'HardwareId/' + encodeURIComponent(deviceRegistration.HardwareId);
                    return self._pushHandler.devices.updateSingle(deviceRegistration, success, error);
                },
                error
            );
        },

        /**
         * This method provides a different operation on each supported platform:
         *
         * - On iOS: Checks if Notifications is enabled for this application in the device's Notification Center.
         * - On Windows Phone: Checks if the application has an active open channel for communication with the Microsoft Push Notification Service. The outcome does not depend on the device's notification settings.
         * - On Android: Checks if the application has established a connection with Google Cloud Messaging. The outcome does not depend on the device's notification settings.
         * @method areNotificationsEnabled
         * @name areNotificationsEnabled
         * @memberOf Push.prototype
         * @param {Object} options An object passed to the Push Notification plugin's areNotificationsEnabled method
         * @returns {Promise} The promise for the request.
         */
        /**
         * iOS: Checks if the Notifications are enabled for this Application in the Device's Notification Center.
         * Windows Phone: Checks if the Application has an active opened Channel for communication with the Notification Service. Not relying on the device notification settings.
         * Android: Checks if the Application has established connection with the Notification Service. Not relying on the device notification settings.
         * @method areNotificationsEnabled
         * @name areNotificationsEnabled
         * @memberOf Push.prototype
         * @param {Object} options an object passed to the Push Notification plugin's areNotificationsEnabled method.
         * @param {Function} [onSuccess] Callback to invoke on successful check. Passes a single boolean value: true or false.
         * @param {Function} [onError] Callback to invoke when an error in the push plugin has occurred.
         */
        areNotificationsEnabled: function (options, onSuccess, onError) {
            options = options || {};
            var pushNotification = window.plugins.pushNotification;

            return buildPromise(function (successCb, errorCb) {
                pushNotification.areNotificationsEnabled(successCb, errorCb, options);
            }, onSuccess, onError);
        },

        _initializeInteractivePush: function (iOSSettings, success, error) {
            var pushPlugin = window.plugins.pushNotification;

            var interactiveSettings = iOSSettings.interactiveSettings;
            var notificationTypes = [];
            if (iOSSettings.alert) {
                notificationTypes.push(pushPlugin.UserNotificationTypes.Alert);
            }
            if (iOSSettings.badge) {
                notificationTypes.push(pushPlugin.UserNotificationTypes.Badge);
            }
            if (iOSSettings.sound) {
                notificationTypes.push(pushPlugin.UserNotificationTypes.Sound);
            }

            var getAction = function (actionIdentifier) {
                var action = _.find(interactiveSettings.actions, function (action) {
                    return action.identifier === actionIdentifier;
                });

                return action;
            };
            var categories = _.map(interactiveSettings.categories, function (category) {
                return {
                    identifier: category.identifier,
                    actionsForDefaultContext: _.map(category.actionsForDefaultContext, getAction),
                    actionsForMinimalContext: _.map(category.actionsForMinimalContext, getAction)
                }
            });

            pushPlugin.registerUserNotificationSettings(
                // the success callback which will immediately return (APNs is not contacted for this)
                success,
                // called in case the configuration is incorrect
                error, {
                    // asking permission for these features
                    types: notificationTypes,
                    // register these categories
                    categories: categories
                }
            );
        },

        //Initializes the push functionality on the device.
        _initialize: function (success, error) {
            var self = this;

            if (this.isInitializing) {
                error(new EverliveError('Push notifications are currently initializing.'));
                return;
            }

            if (!this.emulatorMode && (!window.navigator || !window.navigator.globalization)) {
                error(new EverliveError('The globalization plugin is not initialized.'));
                return;
            }

            if (!this.emulatorMode && (!window.plugins || !window.plugins.pushNotification)) {
                error(new EverliveError('The push notifications plugin is not initialized.'));
                return;
            }

            this._initSuccessCallback = success;
            this._initErrorCallback = error;

            if (this.isInitialized) {
                this._deviceRegistrationSuccess(this.pushToken);
                return;
            }

            if (this.emulatorMode) {
                setTimeout(
                    function () {
                        self._deviceRegistrationSuccess('fake_push_token');
                    },
                    1000
                );
                return;
            }

            this.isInitializing = true;

            var suffix = this._globalFunctionSuffix;
            if (!suffix) {
                suffix = Date.now().toString();
                this._globalFunctionSuffix = suffix;
            }

            var pushNotification = window.plugins.pushNotification;

            var platformType = this._getPlatformType();
            if (platformType === Platform.iOS) {
                //Initialize global APN callback
                var apnCallbackName = 'apnCallback_' + suffix;
                Everlive.PushCallbacks[apnCallbackName] = _.bind(this._onNotificationAPN, this);

                //Construct registration options object and validate iOS settings
                var apnRegistrationOptions = this.pushSettings.iOS;
                apnRegistrationOptions.ecb = 'Everlive.PushCallbacks.' + apnCallbackName;

                //Register for APN
                pushNotification.register(
                    _.bind(this._successfulRegistrationAPN, this),
                    _.bind(this._failedRegistrationAPN, this),
                    apnRegistrationOptions
                );
            } else if (platformType === Platform.Android) {
                //Initialize global GCM callback
                var gcmCallbackName = 'gcmCallback_' + suffix;
                Everlive.PushCallbacks[gcmCallbackName] = _.bind(this._onNotificationGCM, this);

                //Construct registration options object and validate the Android settings
                var gcmRegistrationOptions = this.pushSettings.android;
                this._validateAndroidSettings(gcmRegistrationOptions);
                gcmRegistrationOptions.ecb = 'Everlive.PushCallbacks.' + gcmCallbackName;

                //Register for GCM
                pushNotification.register(
                    _.bind(this._successSentRegistrationGCM, this),
                    _.bind(this._errorSentRegistrationGCM, this),
                    gcmRegistrationOptions
                );
            } else if (platformType === Platform.WindowsPhone) {
                //Initialize global WP8 callbacks.
                var wp8CallbackName = 'wp8Callback_' + suffix;
                var wp8RegistrationSuccessCallbackName = 'wp8RegistrationSuccessCallback_' + suffix;
                var wp8RegistrationErrorCallbackName = 'wp8RegistrationErrorCallback_' + suffix;

                Everlive.PushCallbacks[wp8CallbackName] = _.bind(this._onNotificationWP8, this);
                Everlive.PushCallbacks[wp8RegistrationSuccessCallbackName] = _.bind(this._deviceRegistrationSuccessWP, this);
                Everlive.PushCallbacks[wp8RegistrationErrorCallbackName] = _.bind(this._deviceRegistrationFailed, this);

                //Construct registration options object and validate the WP8  settings
                var wp8RegistrationOptions = this.pushSettings.wp8;
                this._validateWP8Settings(wp8RegistrationOptions);
                wp8RegistrationOptions.ecb = 'Everlive.PushCallbacks.' + wp8CallbackName;
                wp8RegistrationOptions.uccb = 'Everlive.PushCallbacks.' + wp8RegistrationSuccessCallbackName;
                wp8RegistrationOptions.errcb = 'Everlive.PushCallbacks.' + wp8RegistrationErrorCallbackName;


                pushNotification.register(
                    _.bind(this._successSentRegistrationWP8, this),
                    _.bind(this._errorSentRegistrationWP8, this),
                    wp8RegistrationOptions
                );

            } else {
                throw new EverliveError('The current platform is not supported: ' + device.platform);
            }
        },

        _deviceRegistrationSuccessWP: function (result) {
            this._deviceRegistrationSuccess(result.uri);
        },

        _validateAndroidSettings: function (androidSettings) {
            if (!androidSettings.senderID) {
                throw new EverliveError('Sender ID (project number) is not set in the android settings.');
            }
        },

        _validateWP8Settings: function (settings) {
            if (!settings.channelName) {
                throw new EverliveError('channelName is not set in the WP8 settings.');
            }
        },

        _cleanPlatformsPushSettings: function (pushSettings) {
            var cleanSettings = {};
            pushSettings = pushSettings || {};

            var addSettingsForPlatform = function addSettingsForPlatform(newSettingsObject, platform, allowedFields) {
                if (!pushSettings[platform]) {
                    return;
                }

                newSettingsObject[platform] = newSettingsObject[platform] || {};
                var newPlatformSettings = pushSettings[platform];
                var settings = newSettingsObject[platform];
                _.each(allowedFields, function (allowedField) {
                    if (newPlatformSettings.hasOwnProperty(allowedField)) {
                        settings[allowedField] = newPlatformSettings[allowedField];
                    }
                });
            };

            addSettingsForPlatform(cleanSettings, 'iOS', ['badge', 'sound', 'alert', 'interactiveSettings']);
            addSettingsForPlatform(cleanSettings, 'android', ['senderID', 'projectNumber']);
            addSettingsForPlatform(cleanSettings, 'wp8', ['channelName']);

            var callbackFields = ['notificationCallbackAndroid', 'notificationCallbackIOS', 'notificationCallbackWP8'];
            _.each(callbackFields, function (callbackField) {
                var callback = pushSettings[callbackField];
                if (callback) {
                    if (typeof callback !== 'function') {
                        throw new EverliveError('The "' + callbackField + '" of the push settings should be a function');
                    }

                    cleanSettings[callbackField] = pushSettings[callbackField];
                }
            });

            if (pushSettings.customParameters) {
                cleanSettings.customParameters = pushSettings.customParameters;
            }

            return cleanSettings;
        },

        _populateRegistrationObject: function (deviceRegistration, success, error) {
            var self = this;

            return buildPromise(
                function (success, error) {
                    if (!self.pushToken) {
                        throw new EverliveError('Push token is not available.');
                    }

                    self._getLocaleName(
                        function (locale) {
                            var deviceId = self._getDeviceId();
                            var hardwareModel = device.model;
                            var platformType = self._getPlatformType();
                            var timeZone = jstz.determine().name();
                            var pushToken = self.pushToken;
                            var language = locale.value;
                            var platformVersion = device.version;

                            deviceRegistration.HardwareId = deviceId;
                            deviceRegistration.HardwareModel = hardwareModel;
                            deviceRegistration.PlatformType = platformType;
                            deviceRegistration.PlatformVersion = platformVersion;
                            deviceRegistration.TimeZone = timeZone;
                            deviceRegistration.PushToken = pushToken;
                            deviceRegistration.Locale = language;

                            success();
                        },
                        error
                    );
                },
                success,
                error
            );
        },

        _getLocaleName: function (success, error) {
            if (this.emulatorMode) {
                success({value: 'en_US'});
            } else {
                navigator.globalization.getLocaleName(
                    function (locale) {
                        success(locale);
                    },
                    error
                );
                navigator.globalization.getLocaleName(
                    function (locale) {
                    },
                    error
                );
            }
        },

        _getDeviceId: function () {
            return device.uuid;
        },

        //Returns the Everlive device platform constant given a value aquired from cordova's device.platform.
        _getPlatformType: function () {
            var psLower = device.platform.toLowerCase();
            switch (psLower) {
                case 'ios':
                case 'iphone':
                case 'ipad':
                    return Platform.iOS;
                case 'android':
                    return Platform.Android;
                case 'wince':
                    return Platform.WindowsPhone;
                case 'win32nt': // real wp8 devices return this string as platform identifier.
                    return Platform.WindowsPhone;
                default:
                    return Platform.Unknown;
            }
        },

        _deviceRegistrationFailed: function (error) {
            this.pushToken = null;
            this.isInitializing = false;
            this.isInitialized = false;

            if (this._initErrorCallback) {
                this._initErrorCallback({error: error});
            }
        },

        _deviceRegistrationSuccess: function (token) {
            this.pushToken = token;
            this.isInitializing = false;
            this.isInitialized = true;

            if (this._initSuccessCallback) {
                this._initSuccessCallback({token: token});
            }
        },

        //Occurs when the device registration in APN succeeds
        _successfulRegistrationAPN: function (token) {
            var self = this;
            if (this.pushSettings.iOS && this.pushSettings.iOS.interactiveSettings) {
                this._initializeInteractivePush(
                    this.pushSettings.iOS,
                    function () {
                        self._deviceRegistrationSuccess(token);
                    },
                    function (err) {
                        throw new EverliveError('The interactive push configuration is incorrect: ' + err);
                    }
                );
            } else {
                this._deviceRegistrationSuccess(token);
            }
        },

        //Occurs if the device registration in APN fails
        _failedRegistrationAPN: function (error) {
            this._deviceRegistrationFailed(error);
        },

        //Occurs when device registration has been successfully sent to GCM
        _successSentRegistrationGCM: function (id) {
            //console.log("Successfully sent request for registering with GCM.");
        },
        //Occurs when device registration has been successfully sent for WP8
        _successSentRegistrationWP8: function (id) {
            //console.log("Successfully sent request for registering WP8 .");
        },
        //Occurs when an error occured when sending registration request for WP8
        _errorSentRegistrationWP8: function (error) {
            this._deviceRegistrationFailed(error);
        },

        //Occurs when an error occured when sending registration request to GCM
        _errorSentRegistrationGCM: function (error) {
            this._deviceRegistrationFailed(error);
        },

        //This function receives all notification events from APN
        _onNotificationAPN: function (e) {
            this._raiseNotificationEventIOS(e);
        },
        //This function receives all notification events for WP8
        _onNotificationWP8: function (e) {
            this._raiseNotificationEventWP8(e);
        },

        //This function receives all notification events from GCM
        _onNotificationGCM: function onNotificationGCM(e) {
            switch (e.event) {
                case 'registered':
                    if (e.regid.length > 0) {
                        this._deviceRegistrationSuccess(e.regid);
                    }
                    break;
                case 'message':
                    this._raiseNotificationEventAndroid(e);
                    break;
                case 'error':
                    if (!this.pushToken) {
                        this._deviceRegistrationFailed(e);
                    } else {
                        this._raiseNotificationEventAndroid(e);
                    }
                    break;
                default:
                    this._raiseNotificationEventAndroid(e);
                    break;
            }
        },

        _raiseNotificationEventAndroid: function (e) {
            if (this.pushSettings.notificationCallbackAndroid) {
                this.pushSettings.notificationCallbackAndroid(e);
            }
        },
        _raiseNotificationEventIOS: function (e) {
            if (this.pushSettings.notificationCallbackIOS) {
                this.pushSettings.notificationCallbackIOS(e);
            }
        },
        _raiseNotificationEventWP8: function (e) {
            if (this.pushSettings.notificationCallbackWP8) {
                this.pushSettings.notificationCallbackWP8(e);
            }
        }
    };

    return CurrentDevice;
}());

},{"../EverliveError":47,"../common":58,"../constants":59,"../utils":100}],83:[function(require,module,exports){
var platform = require('../everlive.platform');
var _ = require('../common')._;

'use strict';

if (platform.isNativeScript) {
	var NativeScriptCurrentDevice = require('./NativeScriptCurrentDevice');
    module.exports = NativeScriptCurrentDevice;
} else if (platform.isCordova || platform.isDesktop) {
	var CordovaCurrentDevice = require('./CordovaCurrentDevice');
    module.exports = CordovaCurrentDevice;
} else {
    module.exports = _.noop;
}
},{"../common":58,"../everlive.platform":61,"./CordovaCurrentDevice":82,"./NativeScriptCurrentDevice":84}],84:[function(require,module,exports){
var buildPromise = require('../utils').buildPromise;
var EverliveError = require('../EverliveError').EverliveError;
var Platform = require('../constants').Platform;
var common = require('../common');
var utils = require('../utils');
var jstz = common.jstz;
var _ = common._;
var tnsPushPluginLazy = utils.lazyRequire('nativescript-push-notifications', 'tnsPushPlugin');
var tnsPlatform = require('platform');

module.exports = (function () {
    /**
     * @class CurrentDevice
     * @deprecated
     * @protected
     * @param pushHandler
     * @constructor
     */
    var CurrentDevice = function (pushHandler) {
        this._pushHandler = pushHandler;
        this._initSuccessCallback = null;
        this._initErrorCallback = null;

        //Suffix for the global callback functions
        this._globalFunctionSuffix = null;

        this.pushSettings = null;
        this.pushToken = null;
        this.isInitialized = false;
        this.isInitializing = false;

        this.emulatorMode = false;
    };

    CurrentDevice.ensurePushIsAvailable = function() {
        // NativeScript will throw an error when the TNS Push Plugin cannot be required. So this is actually unreachable.
    };

    CurrentDevice.prototype = {

        /**
         * Initializes the current device for push notifications. This method requests a push token from the device vendor and enables the push notification functionality on the device. Once this is done, you can register the device in {{site.TelerikBackendServices}} using the register() method.
         * @method enableNotifications
         * @name enableNotifications
         * @memberOf CurrentDevice.prototype
         * @param {PushSettings} pushSettings An object specifying various settings for the initialization.
         * @returns {Object} The promise for the request.
         */
        /**
         * Initializes the current device for push notifications. This method requests a push token from the device vendor and enables the push notification functionality on the device. Once this is done, you can register the device in Everlive using the register() method.
         * @method enableNotifications
         * @name enableNotifications
         * @memberOf CurrentDevice.prototype
         * @param {PushSettings} pushSettings An object specifying various settings for the initialization.
         * @param {Function} [success] Callback to invoke on success.
         * @param {Function} [error] Callback to invoke on error.
         */
        enableNotifications: function (pushSettings, success, error) {
            this.pushSettings = this._cleanPlatformsPushSettings(pushSettings);

            return buildPromise(_.bind(this._initialize, this), success, error);
        },

        /**
         * Disables push notifications for the current device. This method invalidates any push tokens that were obtained for the device from the current application.
         * @method disableNotifications
         * @name disableNotifications
         * @memberOf CurrentDevice.prototype
         * @returns {Object} The promise for the request.
         */
        /**
         * Disables push notifications for the current device. This method invalidates any push tokens that were obtained for the device from the current application.
         * @method disableNotifications
         * @name disableNotifications
         * @memberOf CurrentDevice.prototype
         * @param {Function} [success] Callback to invoke on success.
         * @param {Function} [error] Callback to invoke on error.
         */
        disableNotifications: function (successCb, errorCb) {
            var self = this;

            return this.unregister().then(
                function () {
                    return buildPromise(
                        function (success, error) {
                            var successCallback = function successCallback() {
                                    self.isInitialized = false;
                                    success();
                                };


                            var platformType = self._getPlatformType();
                            if(platformType === Platform.Android) {
                                return tnsPushPluginLazy.tnsPushPlugin.unregister(successCallback, error, self.pushSettings.android);
                            }

                            tnsPushPluginLazy.tnsPushPlugin.unregister(successCallback, error);
                        },
                        successCb,
                        errorCb
                    );
                },
                errorCb
            );
        },

        /**
         * Returns the push registration for the current device.
         * @memberOf CurrentDevice.prototype
         * @method getRegistration
         * @name getRegistration
         * @returns {Object} The promise for the request.
         */
        /**
         * Returns the push registration for the current device.
         * @memberOf CurrentDevice.prototype
         * @method getRegistration
         * @name getRegistration
         * @param {Function} success Callback to invoke on success.
         * @param {Function} error Callback to invoke on error.
         */
        getRegistration: function (success, error) {
            var deviceId = encodeURIComponent(this._getDeviceId());
            return this._pushHandler.devices.getById('HardwareId/' + deviceId, success, error);
        },

        /**
         * Registers the current device for push notifications in {{site.TelerikBackendServices}}. This method can be called only after [enableNotifications()]{@link currentDevice.enableNotifications} has completed successfully.
         * @memberOf CurrentDevice.prototype
         * @method register
         * @name register
         * @param {Object} customParameters Custom parameters for the registration.
         * @returns {Object} The promise for the request.
         */
        /**
         * Registers the current device for push notifications in {{site.TelerikBackendServices}}. This method can be called only after [enableNotifications()]{@link currentDevice.enableNotifications} has completed successfully.
         * @memberOf CurrentDevice.prototype
         * @method register
         * @name register
         * @param {Object} customParameters Custom parameters for the registration.
         * @param {Function} [success] Callback to invoke on success.
         * @param {Function} [error] Callback to invoke on error.
         */
        register: function (customParameters, success, error) {
            var self = this;

            var deviceRegistration = {};
            if (customParameters !== undefined) {
                deviceRegistration.Parameters = customParameters;
            }

            return this._populateRegistrationObject(deviceRegistration).then(
                function () {
                    return self._pushHandler.devices.create(deviceRegistration, success, error);
                },
                error
            );
        },

        /**
         * Unregisters the current device from push notifications in {{site.TelerikBackendServices}}. After this call completes successfully, {{site.bs}} will no longer send notifications to this device. Note that this does not prevent the device from receiving notifications and does not invalidate push tokens.
         * @memberOf CurrentDevice.prototype
         * @method unregister
         * @name unregister
         * @returns {Object} The promise for the request.
         */
        /**
         * Unregisters the current device from push notifications in {{site.TelerikBackendServices}}. After this call completes successfully, {{site.bs}} will no longer send notifications to this device. Note that this does not prevent the device from receiving notifications and does not invalidate push tokens.
         * @memberOf CurrentDevice.prototype
         * @method unregister
         * @name unregister
         * @param {Function} [success] Callback to invoke on success.
         * @param {Function} [error] Callback to invoke on error.
         */
        unregister: function (success, error) {
            var deviceId = encodeURIComponent(this._getDeviceId());
            return this._pushHandler.devices.destroySingle({Id: 'HardwareId/' + deviceId}, success, error);
        },

        /**
         * Updates the registration of the current device.
         * @memberOf CurrentDevice.prototype
         * @method updateRegistration
         * @name updateRegistration
         * @param {Object} customParameters Custom parameters for the registration. If undefined, customParameters are not updated.
         * @returns {Object} The promise for the request.
         */
        /**
         * Updates the registration for the current device.
         * @memberOf CurrentDevice.prototype
         * @method updateRegistration
         * @name updateRegistration
         * @param {Object} customParameters Custom parameters for the registration. If undefined, customParameters are not updated.
         * @param {Function} [success] Callback to invoke on success.
         * @param {Function} [error] Callback to invoke on error.
         */
        updateRegistration: function (customParameters, success, error) {
            var self = this;

            var deviceRegistration = {};
            if (customParameters !== undefined) {
                deviceRegistration.Parameters = customParameters;
            }

            return this._populateRegistrationObject(deviceRegistration).then(
                function () {
                    deviceRegistration.Id = 'HardwareId/' + encodeURIComponent(deviceRegistration.HardwareId);
                    return self._pushHandler.devices.updateSingle(deviceRegistration, success, error);
                },
                error
            );
        },

        /**
         * This method provides a different operation on each supported platform:
         *
         * - On iOS: Checks if Notifications is enabled for this application in the device's Notification Center.
         * - On Windows Phone: Checks if the application has an active open channel for communication with the Microsoft Push Notification Service. The outcome does not depend on the device's notification settings.
         * - On Android: Checks if the application has established a connection with Google Cloud Messaging. The outcome does not depend on the device's notification settings.
         * @method areNotificationsEnabled
         * @name areNotificationsEnabled
         * @memberOf Push.prototype
         * @param {Object} options An object passed to the Push Notification plugin's areNotificationsEnabled method
         * @returns {Promise} The promise for the request.
         */
        /**
         * iOS: Checks if the Notifications are enabled for this Application in the Device's Notification Center.
         * Windows Phone: Checks if the Application has an active opened Channel for communication with the Notification Service. Not relying on the device notification settings.
         * Android: Checks if the Application has established connection with the Notification Service. Not relying on the device notification settings.
         * @method areNotificationsEnabled
         * @name areNotificationsEnabled
         * @memberOf Push.prototype
         * @param {Object} options an object passed to the Push Notification plugin's areNotificationsEnabled method.
         * @param {Function} [onSuccess] Callback to invoke on successful check. Passes a single boolean value: true or false.
         * @param {Function} [onError] Callback to invoke when an error in the push plugin has occurred.
         */
        areNotificationsEnabled: function (options, onSuccess, onError) {
            options = options || {};
            
            return buildPromise(function (successCb, errorCb) {
                tnsPushPluginLazy.tnsPushPlugin.areNotificationsEnabled(successCb, errorCb, options);
            }, onSuccess, onError);
        },

        _initializeInteractivePush: function (iOSSettings, success, error) {
            tnsPushPluginLazy.tnsPushPlugin.registerUserNotificationSettings(
                // the success callback which will immediately return (APNs is not contacted for this)
                success,
                // called in case the configuration is incorrect
                error
            );
        },

        //Initializes the push functionality on the device.
        _initialize: function (success, error) {
            if (this.isInitializing) {
                error(new EverliveError('Push notifications are currently initializing.'));
                return;
            }

            this._initSuccessCallback = success;
            this._initErrorCallback = error;

            if (this.isInitialized) {
                this._deviceRegistrationSuccess(this.pushToken);
                return;
            }

            this.isInitializing = true;

            var suffix = this._globalFunctionSuffix;
            if (!suffix) {
                suffix = Date.now().toString();
                this._globalFunctionSuffix = suffix;
            }

            var platformType = this._getPlatformType();
            if (platformType === Platform.iOS) {
                //Construct registration options object and validate iOS settings
                var apnRegistrationOptions = this.pushSettings.iOS;

                apnRegistrationOptions.notificationCallbackIOS = this.pushSettings.notificationCallbackIOS;
                //Register for APN
                tnsPushPluginLazy.tnsPushPlugin.register(
                    apnRegistrationOptions,
                    _.bind(this._successfulRegistrationAPN, this),
                    _.bind(this._failedRegistrationAPN, this)                    
                );
            } else if (platformType === Platform.Android) {
                // Ensure the required fields are present in the Android Settings
                var gcmRegistrationOptions = this.pushSettings.android;
                this._validateAndroidSettings(gcmRegistrationOptions);

                gcmRegistrationOptions.notificationCallbackAndroid = this.pushSettings.notificationCallbackAndroid;

                //Register for GCM
                tnsPushPluginLazy.tnsPushPlugin.register(
                    gcmRegistrationOptions,
                    _.bind(this._successSentRegistrationGCM, this),
                    _.bind(this._errorSentRegistrationGCM, this)
                );
            } else {
                throw new EverliveError('The current platform is not supported: ' + tnsPlatform.device.os);
            }
        },

        _validateAndroidSettings: function (androidSettings) {
            if (!androidSettings.senderID) {
                throw new EverliveError('Sender ID (project number) is not set in the android settings.');
            }
        },
        _cleanPlatformsPushSettings: function (pushSettings) {
            var cleanSettings = {};
            pushSettings = pushSettings || {};

            var addSettingsForPlatform = function addSettingsForPlatform(newSettingsObject, platform, allowedFields) {
                if (!pushSettings[platform]) {
                    return;
                }

                newSettingsObject[platform] = newSettingsObject[platform] || {};
                var newPlatformSettings = pushSettings[platform];
                var settings = newSettingsObject[platform];
                _.each(allowedFields, function (allowedField) {
                    if (newPlatformSettings.hasOwnProperty(allowedField)) {
                        settings[allowedField] = newPlatformSettings[allowedField];
                    }
                });
            };

            addSettingsForPlatform(cleanSettings, 'iOS', ['badge', 'sound', 'alert', 'interactiveSettings']);
            addSettingsForPlatform(cleanSettings, 'android', ['senderID', 'projectNumber']);

            var callbackFields = ['notificationCallbackAndroid', 'notificationCallbackIOS'];
            _.each(callbackFields, function (callbackField) {
                var callback = pushSettings[callbackField];
                if (callback) {
                    if (typeof callback !== 'function') {
                        throw new EverliveError('The "' + callbackField + '" of the push settings should be a function');
                    }

                    cleanSettings[callbackField] = pushSettings[callbackField];
                }
            });

            if (pushSettings.customParameters) {
                cleanSettings.customParameters = pushSettings.customParameters;
            }

            return cleanSettings;
        },

        _populateRegistrationObject: function (deviceRegistration, success, error) {
            var self = this;

            return buildPromise(
                function (success, error) {
                    if (!self.pushToken) {
                        throw new EverliveError('Push token is not available.');
                    }

                    self._getLocaleName(
                        function (locale) {
                            var deviceId = self._getDeviceId();
                            var hardwareModel = tnsPlatform.device.model;
                            var platformType = self._getPlatformType();
                            var timeZone = jstz.determine().name();
                            var pushToken = self.pushToken;
                            var language = 'en_US'; //TODO
                            var platformVersion = tnsPlatform.device.osVersion;

                            deviceRegistration.HardwareId = deviceId;
                            deviceRegistration.HardwareModel = hardwareModel;
                            deviceRegistration.PlatformType = platformType;
                            deviceRegistration.PlatformVersion = platformVersion;
                            deviceRegistration.TimeZone = timeZone;
                            deviceRegistration.PushToken = pushToken;
                            deviceRegistration.Locale = language;

                            success();
                        },
                        error
                    );
                },
                success,
                error
            );
        },

        _getLocaleName: function (success, error) {
            return success(); // TODO            
            /* TODO: Must translate somehow to NativeScript to get the current locale
            if (this.emulatorMode) {
                success({value: 'en_US'});
            } else {
                navigator.globalization.getLocaleName(
                    function (locale) {
                        success(locale);
                    },
                    error
                );
                navigator.globalization.getLocaleName(
                    function (locale) {
                    },
                    error
                );
            }*/
        },

        _getDeviceId: function () {
            return tnsPlatform.device.uuid;
        },

        //Returns the Everlive device platform constant given a value aquired from cordova's device.platform.
        _getPlatformType: function () {
            var psLower = tnsPlatform.device.os.toLowerCase();
            switch (psLower) {
                case 'ios':
                case 'iphone':
                case 'ipad':
                    return Platform.iOS;
                case 'android':
                    return Platform.Android;
                default:
                    return Platform.Unknown;
            }
        },

        _deviceRegistrationFailed: function (error) {
            this.pushToken = null;
            this.isInitializing = false;
            this.isInitialized = false;

            if (this._initErrorCallback) {
                this._initErrorCallback({error: error});
            }
        },

        _deviceRegistrationSuccess: function (token) {
            this.pushToken = token;
            this.isInitializing = false;
            this.isInitialized = true;

            if (this._initSuccessCallback) {
                this._initSuccessCallback({token: token});
            }
        },

        //Occurs when the device registration in APN succeeds
        _successfulRegistrationAPN: function (token) {
            var self = this;
            if (this.pushSettings.iOS && this.pushSettings.iOS.interactiveSettings) {
                this._initializeInteractivePush(
                    this.pushSettings.iOS,
                    function () {
                        self._deviceRegistrationSuccess(token);
                    },
                    function (err) {
                        throw new EverliveError('The interactive push configuration is incorrect: ' + err);
                    }
                );
            } else {
                this._deviceRegistrationSuccess(token);
            }
        },

        //Occurs if the device registration in APN fails
        _failedRegistrationAPN: function (error) {
            this._deviceRegistrationFailed(error);
        },

        //Occurs when device registration has been successfully sent to GCM
        _successSentRegistrationGCM: function (token) {
            //console.log("Successfully sent request for registering with GCM.");

            // set on message received.
            tnsPushPluginLazy.tnsPushPlugin.onMessageReceived(this.pushSettings.notificationCallbackAndroid);

            this._deviceRegistrationSuccess(token);
        },

        //Occurs when an error occured when sending registration request to GCM
        _errorSentRegistrationGCM: function (error) {
            this._deviceRegistrationFailed(error);
        },

        //This function receives all notification events from APN
        _onNotificationAPN: function (e) {
            this._raiseNotificationEventIOS(e);
        },

        //This function receives all notification events from GCM
        _onNotificationGCM: function onNotificationGCM(e) {
            switch (e.event) {
                case 'registered':
                    if (e.regid.length > 0) {
                        this._deviceRegistrationSuccess(e.regid);
                    }
                    break;
                case 'message':
                    this._raiseNotificationEventAndroid(e);
                    break;
                case 'error':
                    if (!this.pushToken) {
                        this._deviceRegistrationFailed(e);
                    } else {
                        this._raiseNotificationEventAndroid(e);
                    }
                    break;
                default:
                    this._raiseNotificationEventAndroid(e);
                    break;
            }
        },

        _raiseNotificationEventAndroid: function (e) {
            if (this.pushSettings.notificationCallbackAndroid) {
                this.pushSettings.notificationCallbackAndroid(e);
            }
        },
        _raiseNotificationEventIOS: function (e) {
            if (this.pushSettings.notificationCallbackIOS) {
                this.pushSettings.notificationCallbackIOS(e);
            }
        }
    };

    return CurrentDevice;
}());

},{"../EverliveError":47,"../common":58,"../constants":59,"../utils":100,"platform":"platform"}],85:[function(require,module,exports){
var _ = require('../common')._;
var constants = require('../constants');
var Query = require('../query/Query');
var Headers = constants.Headers;
var utils = require('../utils');

module.exports = (function () {
    // TODO: [offline] Update the structure - filter field can be refactored for example and a skip/limit/sort property can be added
    var DataQuery = function (config) {
        this.collectionName = config.collectionName;
        this.headers = config.headers || {};
        this.filter = config.filter;
        this.onSuccess = config.onSuccess;
        this.onError = config.onError;
        this.operation = config.operation;
        this.parse = config.parse;
        this.additionalOptions = config.additionalOptions;
        this.data = config.data;
        this.useOffline = config.useOffline;
        this.applyOffline = config.applyOffline;
        this.noRetry = config.noRetry; //retry will be done by default, when a request fails because of expired token, once the authentication.completeAuthentication in sdk is called.
        this.skipAuth = config.skipAuth; //if set to true, the sdk will not require authorization if the data query fails because of expired token. Used internally for various login methods.
        this._normalizedHeaders = null;
        this.isSync = config.isSync;
    };

    DataQuery.prototype = {
        _normalizeHeaders: function () {
            this._normalizedHeaders = utils.normalizeKeys(this.headers);
        },

        getHeader: function (header) {
            this._normalizeHeaders();

            var normalizedHeader = header.toLowerCase();
            return this._normalizedHeaders[normalizedHeader];
        },

        getHeaderAsJSON: function (header) {
            this._normalizeHeaders();

            var headerValue;
            if (header) {
                headerValue = this._normalizedHeaders[header.toLowerCase()];
            }

            if (_.isObject(headerValue)) {
                return headerValue;
            }
            if (_.isString(headerValue)) {
                try {
                    return JSON.parse(headerValue);
                } catch (e) {
                    return headerValue;
                }
            } else {
                return headerValue;
            }
        },

        getHeaders: function () {
            this._normalizeHeaders();
            var headers = _.deepExtend(this._normalizedHeaders);
            return headers;
        },

        getQueryParameters: function () {
            var queryParams = {};

            if (this.operation === DataQuery.operations.ReadById) {
                queryParams.filter = this.additionalOptions.id;
                queryParams.expand = this.getHeaderAsJSON(Headers.expand);
            } else {
                var sort = this.getHeaderAsJSON(Headers.sort);
                var limit = this.getHeaderAsJSON(Headers.take);
                var skip = this.getHeaderAsJSON(Headers.skip);
                var select = this.getHeaderAsJSON(Headers.select);
                var filter = this.getHeaderAsJSON(Headers.filter);
                var expand = this.getHeaderAsJSON(Headers.expand);

                if (this.filter instanceof Query) {
                    var filterObj = this.filter.build();
                    queryParams.filter = filterObj.$where || filter || {};
                    queryParams.sort = filterObj.$sort || sort;
                    queryParams.limit = filterObj.$take || limit;
                    queryParams.skip = filterObj.$skip || skip;
                    queryParams.select = filterObj.$select || select;
                    queryParams.expand = filterObj.$expand || expand;
                } else {
                    queryParams.filter = (this.filter || filter) || {};
                    queryParams.sort = sort;
                    queryParams.limit = limit;
                    queryParams.skip = skip;
                    queryParams.select = select;
                    queryParams.expand = expand;
                }
            }

            return queryParams;
        },

        applyEventQuery: function (eventQuery) {
            this._applyCustomHeaders(eventQuery);
            this._applyEventQueryHeaders(eventQuery);
            this._applyEventQueryParams(eventQuery);
            this.additionalOptions = this.additionalOptions || {};
            this.additionalOptions.id = eventQuery.itemId;
            this.data = eventQuery.data;
            this._applyEventQuerySettings(eventQuery);
        },

        _applyCustomHeaders: function (eventQuery) {
            this.headers = eventQuery.headers;
            this._normalizeHeaders();
        },

        _applyEventQueryHeaders: function (eventQuery) {
            this._applyEventHeader(Headers.filter, eventQuery.filter);
            this._applyEventHeader(Headers.select, eventQuery.fields);
            this._applyEventHeader(Headers.sort, eventQuery.sort);
            this._applyEventHeader(Headers.skip, eventQuery.skip);
            this._applyEventHeader(Headers.take, eventQuery.take);
            this._applyEventHeader(Headers.expand, eventQuery.expand);
            this._applyEventHeader(Headers.powerFields, eventQuery.powerfields);
        },

        _applyEventQueryParams: function (eventQuery) {
            this.filter = eventQuery.filter;
            this.fields = eventQuery.select;
            this.sort = eventQuery.sort;
            this.skip = eventQuery.skip;
            this.take = eventQuery.take;
            this.expand = eventQuery.expand;
        },

        _applyEventQuerySettings: function (eventQuery) {
            this.useOffline = eventQuery.settings.useOffline;
            this.forceCache = eventQuery.settings.forceCache;
            this.ignoreCache = eventQuery.settings.ignoreCache;
            this.applyOffline = eventQuery.settings.applyOffline;
        },

        _applyEventHeader: function (header, value) {
            if (value && typeof value !== 'string') {
                var headerToLower = header.toLowerCase();
                this.headers[headerToLower] = JSON.stringify(value);
            }
        }
    };

    DataQuery.operations = constants.DataQueryOperations;

    return DataQuery;
}());
},{"../common":58,"../constants":59,"../query/Query":87,"../utils":100}],86:[function(require,module,exports){
'use strict';

var constants = require('../constants');

var EventQuery = function () {
};

function applyDataQueryParameters(eventQuery, dataQuery) {
    var queryParameters = dataQuery.getQueryParameters();
    eventQuery.filter = queryParameters.filter;
    eventQuery.fields = queryParameters.select;
    eventQuery.sort = queryParameters.sort;
    eventQuery.skip = queryParameters.skip;
    eventQuery.take = queryParameters.limit || queryParameters.take;
    eventQuery.expand = queryParameters.expand;
    return queryParameters;
}

function applyDataQuerySettings(eventQuery, dataQuery) {
    eventQuery.settings = {
        useOffline: dataQuery.useOffline,
        applyOffline: dataQuery.applyOffline,
        ignoreCache: dataQuery.ignoreCache,
        forceCache: dataQuery.forceCache
    };
}

EventQuery.fromDataQuery = function (dataQuery) {
    var eventQuery = new EventQuery();
    eventQuery.contentTypeName = dataQuery.collectionName;
    if (dataQuery.additionalOptions && dataQuery.additionalOptions.id) {
        switch (dataQuery.operation) {
            case constants.DataQueryOperations.Update:
                eventQuery.operation = constants.DataQueryOperations.UpdateById;
                break;
            case constants.DataQueryOperations.Delete:
                eventQuery.operation = constants.DataQueryOperations.DeleteById;
                break;
            default:
                eventQuery.operation = dataQuery.operation;
        }
    } else {
        eventQuery.operation = dataQuery.operation;
    }

    eventQuery.itemId = dataQuery.additionalOptions ? dataQuery.additionalOptions.id : undefined;
    eventQuery.data = dataQuery.data;

    applyDataQuerySettings(eventQuery, dataQuery);
    applyDataQueryParameters(eventQuery, dataQuery);
    eventQuery.headers = dataQuery.getHeaders();
    var powerFieldsHeader = eventQuery.headers[constants.Headers.powerFields];
    if (typeof powerFieldsHeader === 'string') {
        eventQuery.powerfields = JSON.parse(powerFieldsHeader);
    }
    eventQuery.isSync = dataQuery.isSync; // readonly

    return eventQuery;
};

EventQuery.prototype = {
    cancel: function () {
        this._cancelled = true;
    },
    isCancelled: function () {
        return this._cancelled;
    }
};

module.exports = EventQuery;
},{"../constants":59}],87:[function(require,module,exports){
var Expression = require('../Expression');
var OperatorType = require('../constants').OperatorType;
var WhereQuery = require('./WhereQuery');
var QueryBuilder = require('./QueryBuilder');

module.exports = (function () {
    /**
     * @class Query
     * @classdesc A query class used to describe a request that will be made to the {{site.TelerikBackendServices}} JavaScript API.
     * @param {object} [filter] A [filter expression](http://docs.telerik.com/platform/backend-services/rest/queries/queries-filtering) definition.
     * @param {object} [fields] A [fields expression](http://docs.telerik.com/platform/backend-services/rest/queries/queries-subset-fields) definition.
     * @param {object} [sort] A [sort expression](http://docs.telerik.com/platform/backend-services/rest/queries/queries-sorting) definition.
     * @param {number} [skip] Number of items to skip. Used for paging.
     * @param {number} [take] Number of items to take. Used for paging.
     * @param {object} [expand] An [expand expression](http://docs.telerik.com/platform/backend-services/rest/data/relations/relations-defining) definition.
     */
    function Query(filter, fields, sort, skip, take, expand) {
        this.filter = filter;
        this.fields = fields;
        this.sort = sort;
        this.toskip = skip;
        this.totake = take;
        this.expandExpression = expand;
        this.expr = new Expression(OperatorType.query);
    }

    Query.prototype = {
        /** Applies a filter to the current query. This allows you to retrieve only a subset of the items based on various filtering criteria.
         * @memberOf Query.prototype
         * @method where
         * @name where
         * @param {object} filter A [filter expression](http://docs.telerik.com/platform/backend-services/rest/queries/queries-filtering) definition.
         * @returns {Query}
         */
        /** Defines a filter definition for the current query.
         * @memberOf Query.prototype
         * @method where
         * @name where
         * @returns {WhereQuery}
         */
        where: function (filter) {
            if (filter) {
                return this._simple(OperatorType.filter, [filter]);
            }
            else {
                return new WhereQuery(this);
            }
        },
        /** Applies a fields selection to the current query. This allows you to retrieve only a subset of all available item fields.
         * @memberOf Query.prototype
         * @method select
         * @param {object} fieldsExpression A [fields expression](http://docs.telerik.com/platform/backend-services/rest/queries/queries-subset-fields) definition.
         * @returns {Query}
         */
        select: function () {
            return this._simple(OperatorType.select, arguments);
        },
        // TODO
        //exclude: function () {
        //    return this._simple(OperatorType.exclude, arguments);
        //},
        /** Sorts the items in the current query in ascending order by the specified field.
         * @memberOf Query.prototype
         * @method order
         * @param {string} field The field name to order by in ascending order.
         * @returns {Query}
         */
        order: function (field) {
            return this._simple(OperatorType.order, [field]);
        },
        /** Sorts the items in the current query in descending order by the specified field.
         * @memberOf Query.prototype
         * @method orderDesc
         * @param {string} field The field name to order by in descending order.
         * @returns {Query}
         */
        orderDesc: function (field) {
            return this._simple(OperatorType.order_desc, [field]);
        },
        /** Skips a certain number of items from the beginning before returning the rest of the items. Used for paging.
         * @memberOf Query.prototype
         * @method skip
         * @see [query.take]{@link query.take}
         * @param {number} value The number of items to skip.
         * @returns {Query}
         */
        skip: function (value) {
            return this._simple(OperatorType.skip, [value]);
        },
        /** Takes a specified number of items from the query result. Used for paging.
         * @memberOf Query.prototype
         * @method take
         * @see [query.skip]{@link query.skip}
         * @param {number} value The number of items to take.
         * @returns {Query}
         */
        take: function (value) {
            return this._simple(OperatorType.take, [value]);
        },
        /** Sets an expand expression for the current query. This allows you to retrieve complex data sets using a single query based on relations between data types.
         * @memberOf Query.prototype
         * @method expand
         * @param {object} expandExpression An [expand expression](http://docs.telerik.com/platform/backend-services/rest/data/relations/relations-defining) definition.
         * @returns {Query}
         */
        expand: function (expandExpression) {
            return this._simple(OperatorType.expand, [expandExpression]);
        },
        /** Builds an object containing the different expressions that will be sent to {{site.TelerikBackendServices}}. It basically translates any previously specified expressions into standard queries that {{site.bs}} can understand.
         * @memberOf Query.prototype
         * @method build
         * @returns {{$where,$select,$sort,$skip,$take,$expand}}
         */
        build: function () {
            return new QueryBuilder(this).build();
        },
        _simple: function (op, oprs) {
            var args = [].slice.call(oprs);
            this.expr.addOperand(new Expression(op, args));
            return this;
        }
    };

    return Query;
}());
},{"../Expression":49,"../constants":59,"./QueryBuilder":88,"./WhereQuery":90}],88:[function(require,module,exports){
var constants = require('../constants');
var OperatorType = constants.OperatorType;
var _ = require('../common')._;
var GeoPoint = require('../GeoPoint');
var EverliveError = require('../EverliveError').EverliveError;
var Expression = require('../Expression');
var maxDistanceConsts = constants.maxDistanceConsts;
var radiusConsts = constants.radiusConsts;

module.exports = (function () {
    function QueryBuilder(query) {
        this.query = query;
        this.expr = query.expr;
    }

    QueryBuilder.prototype = {
        // TODO merge the two objects before returning them
        build: function () {
            var query = this.query;
            if (query.filter || query.fields || query.sort || query.toskip || query.totake || query.expandExpression) {
                return {
                    $where: query.filter || null,
                    $select: query.fields || null,
                    $sort: query.sort || null,
                    $skip: query.toskip || null,
                    $take: query.totake || null,
                    $expand: query.expandExpression || null
                };
            }
            return {
                $where: this._buildWhere(),
                $select: this._buildSelect(),
                $sort: this._buildSort(),
                $skip: this._getSkip(),
                $take: this._getTake(),
                $expand: this._getExpand()
            };
        },
        _getSkip: function () {
            var skipExpression = _.find(this.expr.operands, function (value, index, list) {
                return value.operator === OperatorType.skip;
            });
            return skipExpression ? skipExpression.operands[0] : null;
        },
        _getTake: function () {
            var takeExpression = _.find(this.expr.operands, function (value, index, list) {
                return value.operator === OperatorType.take;
            });
            return takeExpression ? takeExpression.operands[0] : null;
        },
        _getExpand: function () {
            var expandExpression = _.chain(this.expr.operands)
                .filter(function (value) {
                    return value.operator === OperatorType.expand;
                })
                .reduce(function (result, expression) { //expression contains operands and has operator type expand
                    return _.extend(result, expression.operands[0]);
                }, {})
                .value();
            return _.isEmpty(expandExpression) ? null : expandExpression;
        },
        _buildSelect: function () {
            var selectExpression = _.find(this.expr.operands, function (value, index, list) {
                return value.operator === OperatorType.select;
            });
            var result = {};
            if (selectExpression) {
                _.reduce(selectExpression.operands, function (memo, value) {
                    memo[value] = 1;
                    return memo;
                }, result);
                return result;
            }
            else {
                return null;
            }
        },
        _buildSort: function () {
            var sortExpressions = _.filter(this.expr.operands, function (value, index, list) {
                return value.operator === OperatorType.order || value.operator === OperatorType.order_desc;
            });
            var result = {};
            if (sortExpressions.length > 0) {
                _.reduce(sortExpressions, function (memo, value) {
                    memo[value.operands[0]] = value.operator === OperatorType.order ? 1 : -1;
                    return memo;
                }, result);
                return result;
            }
            else {
                return null;
            }
        },
        _buildWhere: function () {
            var whereExpression = _.find(this.expr.operands, function (value, index, list) {
                return value.operator === OperatorType.where;
            });
            if (whereExpression) {
                return this._build(new Expression(OperatorType.and, whereExpression.operands));
            }
            else {
                var filterExpression = _.find(this.expr.operands, function (value, index, list) {
                    return value.operator === OperatorType.filter;
                });
                if (filterExpression) {
                    return filterExpression.operands[0];
                }
                return null;
            }
        },
        _build: function (expr) {
            if (this._isSimple(expr)) {
                return this._simple(expr);
            }
            else if (this._isRegex(expr)) {
                return this._regex(expr);
            }
            else if (this._isGeo(expr)) {
                return this._geo(expr);
            }
            else if (this._isAnd(expr)) {
                return this._and(expr);
            }
            else if (this._isOr(expr)) {
                return this._or(expr);
            }
            else if (this._isNot(expr)) {
                return this._not(expr);
            }
        },
        _isSimple: function (expr) {
            return expr.operator >= OperatorType.equal && expr.operator <= OperatorType.size;
        },
        _simple: function (expr) {
            var term = {}, fieldTerm = {};
            var operands = expr.operands;
            var operator = this._translateoperator(expr.operator);
            if (operator) {
                term[operator] = operands[1];
            }
            else {
                term = operands[1];
            }
            fieldTerm[operands[0]] = term;
            return fieldTerm;
        },
        _isRegex: function (expr) {
            return expr.operator >= OperatorType.regex && expr.operator <= OperatorType.endsWith;
        },
        _regex: function (expr) {
            var fieldTerm = {};
            var regex = this._getRegex(expr);
            var regexValue = this._getRegexValue(regex);
            var operands = expr.operands;
            fieldTerm[operands[0]] = regexValue;
            return fieldTerm;
        },
        _getRegex: function (expr) {
            var pattern = expr.operands[1];
            var flags = expr.operands[2] ? expr.operands[2] : '';
            switch (expr.operator) {
                case OperatorType.regex:
                    return pattern instanceof RegExp ? pattern : new RegExp(pattern, flags);
                case OperatorType.startsWith:
                    return new RegExp("^" + pattern, flags);
                case OperatorType.endsWith:
                    return new RegExp(pattern + "$", flags);
                default:
                    throw new EverliveError('Unknown operator type.');
            }
        },
        _getRegexValue: function (regex) {
            var options = '';
            if (regex.global) {
                options += 'g';
            }
            if (regex.multiline) {
                options += 'm';
            }
            if (regex.ignoreCase) {
                options += 'i';
            }
            return {$regex: regex.source, $options: options};
        },
        _isGeo: function (expr) {
            return expr.operator >= OperatorType.nearShpere && expr.operator <= OperatorType.withinShpere;
        },
        _geo: function (expr) {
            var fieldTerm = {};
            var operands = expr.operands;
            fieldTerm[operands[0]] = this._getGeoTerm(expr);
            return fieldTerm;
        },
        _getGeoTerm: function (expr) {
            switch (expr.operator) {
                case OperatorType.nearShpere:
                    return this._getNearSphereTerm(expr);
                case OperatorType.withinBox:
                    return this._getWithinBox(expr);
                case OperatorType.withinPolygon:
                    return this._getWithinPolygon(expr);
                case OperatorType.withinShpere:
                    return this._getWithinCenterSphere(expr);
                default:
                    throw new EverliveError('Unknown operator type.');
            }
        },
        _getNearSphereTerm: function (expr) {
            var operands = expr.operands;
            var center = this._getGeoPoint(operands[1]);
            var maxDistance = operands[2];
            var metrics = operands[3];
            var maxDistanceConst;
            var term = {
                '$nearSphere': center
            };
            if (typeof maxDistance !== 'undefined') {
                maxDistanceConst = maxDistanceConsts[metrics] || maxDistanceConsts.radians;
                term[maxDistanceConst] = maxDistance;
            }
            return term;
        },
        _getWithinBox: function (expr) {
            var operands = expr.operands;
            var bottomLeft = this._getGeoPoint(operands[1]);
            var upperRight = this._getGeoPoint(operands[2]);
            return {
                '$within': {
                    '$box': [bottomLeft, upperRight]
                }
            };
        },
        _getWithinPolygon: function (expr) {
            var operands = expr.operands;
            var points = this._getGeoPoints(operands[1]);
            return {
                '$within': {
                    '$polygon': points
                }
            };
        },
        _getWithinCenterSphere: function (expr) {
            var operands = expr.operands;
            var center = this._getGeoPoint(operands[1]);
            var radius = operands[2];
            var metrics = operands[3];
            var radiusConst = radiusConsts[metrics] || radiusConsts.radians;
            var sphereInfo = {
                'center': center
            };
            sphereInfo[radiusConst] = radius;
            return {
                '$within': {
                    '$centerSphere': sphereInfo
                }
            };
        },
        _getGeoPoint: function (point) {
            if (_.isArray(point)) {
                return new GeoPoint(point[0], point[1]);
            }
            return point;
        },
        _getGeoPoints: function (points) {
            var self = this;
            return _.map(points, function (point) {
                return self._getGeoPoint(point);
            });
        },
        _isAnd: function (expr) {
            return expr.operator === OperatorType.and;
        },
        _and: function (expr) {
            var i, l, term, result = {};
            var operands = expr.operands;
            for (i = 0, l = operands.length; i < l; i++) {
                term = this._build(operands[i]);
                result = this._andAppend(result, term);
            }
            return result;
        },
        _andAppend: function (andObj, newObj) {
            var i, l, key, value, newValue;
            var keys = _.keys(newObj);
            for (i = 0, l = keys.length; i < l; i++) {
                key = keys[i];
                value = andObj[key];
                if (typeof value === 'undefined') {
                    andObj[key] = newObj[key];
                }
                else {
                    newValue = newObj[key];
                    if (typeof value === 'object' && typeof newValue === 'object') {
                        value = _.extend(value, newValue);
                    } else {
                        value = newValue;
                    }
                    andObj[key] = value;
                }
            }
            return andObj;
        },
        _isOr: function (expr) {
            return expr.operator === OperatorType.or;
        },
        _or: function (expr) {
            var i, l, term, result = [];
            var operands = expr.operands;
            for (i = 0, l = operands.length; i < l; i++) {
                term = this._build(operands[i]);
                result.push(term);
            }
            return {$or: result};
        },
        _isNot: function (expr) {
            return expr.operator === OperatorType.not;
        },
        _not: function (expr) {
            return {$not: this._build(expr.operands[0])};
        },
        _translateoperator: function (operator) {
            switch (operator) {
                case OperatorType.equal:
                    return null;
                case OperatorType.not_equal:
                    return '$ne';
                case OperatorType.gt:
                    return '$gt';
                case OperatorType.lt:
                    return '$lt';
                case OperatorType.gte:
                    return '$gte';
                case OperatorType.lte:
                    return '$lte';
                case OperatorType.isin:
                    return '$in';
                case OperatorType.notin:
                    return '$nin';
                case OperatorType.all:
                    return '$all';
                case OperatorType.size:
                    return '$size';
            }
            throw new EverliveError('Unknown operator type.');
        }
    };

    return QueryBuilder;
}());
},{"../EverliveError":47,"../Expression":49,"../GeoPoint":50,"../common":58,"../constants":59}],89:[function(require,module,exports){
var DataQuery = require('./DataQuery');
var Request = require('../Request');
var _ = require('../common')._;
var constants = require('../constants');

module.exports = (function () {
    var RequestOptionsBuilder = {};

    RequestOptionsBuilder._buildEndpointUrl = function (dataQuery) {
        var endpoint = dataQuery.collectionName;
        if (dataQuery.additionalOptions && dataQuery.additionalOptions.id) {
            endpoint += '/' + dataQuery.additionalOptions.id;
        }

        return endpoint;
    };

    RequestOptionsBuilder._buildBaseObject = function (dataQuery) {
        var defaultObject = {
            endpoint: RequestOptionsBuilder._buildEndpointUrl(dataQuery),
            filter: dataQuery.filter,
            success: dataQuery.onSuccess,
            error: dataQuery.onError,
            data: dataQuery.data,
            headers: dataQuery.headers
        };

        if (dataQuery.parse) {
            defaultObject.parse = dataQuery.parse;
        }

        return defaultObject;
    };

    RequestOptionsBuilder._build = function (dataQuery, additionalOptions) {
        return _.extend(RequestOptionsBuilder._buildBaseObject(dataQuery), additionalOptions);
    };

    RequestOptionsBuilder[DataQuery.operations.Read] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'GET'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.ReadById] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'GET'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.Count] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'GET',
            endpoint: dataQuery.collectionName + '/_count'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.Create] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'POST'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.RawUpdate] = function (dataQuery) {
        var endpoint = dataQuery.collectionName;
        var filter = dataQuery.filter;
        var ofilter = null; // request options filter

        if (typeof filter === 'string') {
            endpoint += '/' + filter; // send the filter through query string
        } else if (typeof filter === 'object') {
            ofilter = filter; // send the filter as filter headers
        }

        return RequestOptionsBuilder._build(dataQuery, {
            method: 'PUT',
            endpoint: endpoint,
            filter: ofilter
        });
    };

    RequestOptionsBuilder[DataQuery.operations.Update] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'PUT'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.Delete] = function (dataQuery) {
        return _.extend(RequestOptionsBuilder._buildBaseObject(dataQuery), {
            method: 'DELETE'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.DeleteById] = RequestOptionsBuilder[DataQuery.operations.Delete];

    RequestOptionsBuilder[DataQuery.operations.SetAcl] = function (dataQuery) {
        var endpoint = dataQuery.collectionName;
        var filter = dataQuery.filter;

        if (typeof filter === 'string') { // if filter is string than will update a single item using the filter as an identifier
            endpoint += '/' + filter;
        } else if (typeof filter === 'object') { // else if it is an object than we will use it's id property
            endpoint += '/' + filter[constants.idField];
        }
        endpoint += '/_acl';
        var method, data;
        if (dataQuery.additionalOptions.acl === null) {
            method = 'DELETE';
        } else {
            method = 'PUT';
            data = dataQuery.additionalOptions.acl;
        }

        return RequestOptionsBuilder._build(dataQuery, {
            method: method,
            endpoint: endpoint,
            data: data
        });
    };

    RequestOptionsBuilder[DataQuery.operations.SetOwner] = function (dataQuery) {
        var endpoint = dataQuery.collectionName;
        var filter = dataQuery.filter;
        if (typeof filter === 'string') { // if filter is string than will update a single item using the filter as an identifier
            endpoint += '/' + filter;
        } else if (typeof filter === 'object') { // else if it is an object than we will use it's id property
            endpoint += '/' + filter[constants.idField];
        }
        endpoint += '/_owner';

        return RequestOptionsBuilder._build(dataQuery, {
            method: 'PUT',
            endpoint: endpoint
        });
    };

    RequestOptionsBuilder[DataQuery.operations.UserLogin] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'POST',
            endpoint: 'oauth/token',
            authHeaders: false,
            parse: Request.parsers.single
        });
    };

    RequestOptionsBuilder[DataQuery.operations.UserLogout] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'GET',
            endpoint: 'oauth/logout'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.UserChangePassword] = function (dataQuery) {
        var keepTokens = dataQuery.additionalOptions.keepTokens;
        var endpoint = 'Users/changepassword';
        if (keepTokens) {
            endpoint += '?keepTokens=true';
        }

        return RequestOptionsBuilder._build(dataQuery, {
            method: 'POST',
            endpoint: endpoint,
            authHeaders: false,
            parse: Request.parsers.single
        });
    };

    RequestOptionsBuilder[DataQuery.operations.UserLoginWithProvider] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'POST',
            authHeaders: false
        });
    };

    RequestOptionsBuilder[DataQuery.operations.UserLinkWithProvider] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'POST',
            endpoint: RequestOptionsBuilder._buildEndpointUrl(dataQuery) + '/link'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.UserUnlinkFromProvider] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'POST',
            endpoint: RequestOptionsBuilder._buildEndpointUrl(dataQuery) + '/unlink'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.UserResetPassword] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'POST',
            endpoint: RequestOptionsBuilder._buildEndpointUrl(dataQuery) + '/resetpassword'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.UserSetPassword] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'POST',
            endpoint: RequestOptionsBuilder._buildEndpointUrl(dataQuery) + '/setpassword'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.FilesUpdateContent] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'PUT',
            endpoint: RequestOptionsBuilder._buildEndpointUrl(dataQuery) + '/Content'
        });
    };

    RequestOptionsBuilder[DataQuery.operations.FilesGetDownloadUrlById] = function (dataQuery) {
        return RequestOptionsBuilder._build(dataQuery, {
            method: 'GET'
        });
    };

    return RequestOptionsBuilder;
}());
},{"../Request":52,"../common":58,"../constants":59,"./DataQuery":85}],90:[function(require,module,exports){
var Expression = require('../Expression');
var OperatorType = require('../constants').OperatorType;

module.exports = (function () {
    /**
     * @classdesc A fluent API operation for creating a filter for a query by chaining different rules.
     * @class WhereQuery
     * @protected
     * @borrows WhereQuery#eq as WhereQuery#equal
     * @borrows WhereQuery#ne as WhereQuery#notEqual
     * @borrows WhereQuery#gt as WhereQuery#greaterThan
     * @borrows WhereQuery#gte as WhereQuery#greaterThanEqual
     * @borrows WhereQuery#lt as WhereQuery#lessThan
     * @borrows WhereQuery#lte as WhereQuery#lessThanEqual
     */
    function WhereQuery(parentQuery, exprOp, singleOperand) {
        this.parent = parentQuery;
        this.single = singleOperand;
        this.expr = new Expression(exprOp || OperatorType.where);
        this.parent.expr.addOperand(this.expr);
    }

    WhereQuery.prototype = {
        /**
         * Adds an `and` clause to the current condition and returns it for further chaining.
         * @method and
         * @memberOf WhereQuery.prototype
         * @returns {WhereQuery}
         */
        and: function () {
            return new WhereQuery(this, OperatorType.and);
        },
        /**
         * Adds an `or` clause to the current condition and returns it for further chaining.
         * @method or
         * @memberOf WhereQuery.prototype
         * @returns {WhereQuery}
         */
        or: function () {
            return new WhereQuery(this, OperatorType.or);
        },
        /**
         * Adds a `not` clause to the current condition and returns it for further chaining.
         * @method not
         * @memberOf WhereQuery.prototype
         * @returns {WhereQuery}
         */
        not: function () {
            return new WhereQuery(this, OperatorType.not, true);
        },
        _simple: function (operator) {
            var args = [].slice.call(arguments, 1);
            this.expr.addOperand(new Expression(operator, args));
            return this._done();
        },
        /**
         * Adds a condition that a field must be equal to a specific value.
         * @method eq
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name.
         * @param {*} value Comparison value (to which the fields must be equal).
         * @returns {WhereQuery}
         */
        eq: function (field, value) {
            return this._simple(OperatorType.equal, field, value);
        },
        /**
         * Adds a condition that a field must *not* be equal to a specific value.
         * @method ne
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name.
         * @param {*} value Comparison value (to which the field must not be equal).
         * @returns {WhereQuery}
         */
        ne: function (field, value) {
            return this._simple(OperatorType.not_equal, field, value);
        },
        /**
         * Adds a condition that a field must be `greater than` a certain value. Applicable to Number, String, and Date fields.
         * @method gt
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name.
         * @param {*} value Comparison value (that the field should be greater than).
         * @returns {WhereQuery}
         */
        gt: function (field, value) {
            return this._simple(OperatorType.gt, field, value);
        },
        /**
         * Adds a condition that a field must be `greater than or equal` to a certain value. Applicable to Number, String, and Date fields.
         * @method gte
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name.
         * @param {*} value Comparison value (that the field should be greater than or equal to).
         * @returns {WhereQuery}
         */
        gte: function (field, value) {
            return this._simple(OperatorType.gte, field, value);
        },
        /**
         * Adds a condition that a field must be `less than` a certain value. Applicable to Number, String, and Date fields.
         * @method lt
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name.
         * @param {*} value Comparison value (that the field should be less than).
         * @returns {WhereQuery}
         */
        lt: function (field, value) {
            return this._simple(OperatorType.lt, field, value);
        },
        /**
         * Adds a condition that a field must be `less than or equal` to a certain value. Applicable to Number, String, and Date fields.
         * @method lte
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name.
         * @param {*} value Comparison value (that the field should be less than or equal to).
         * @returns {WhereQuery}
         */
        lte: function (field, value) {
            return this._simple(OperatorType.lte, field, value);
        },
        /**
         * Adds a condition that a field must be in a set of values.
         * @method isin
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name.
         * @param {Array} value An array of the values that the field should be in.
         * @returns {WhereQuery}
         */
        isin: function (field, value) {
            return this._simple(OperatorType.isin, field, value);
        },
        /**
         * Adds a condition that a field must *not* be in a set of values.
         * @method notin
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name.
         * @param {Array} value An array of values that the field should not be in.
         * @returns {WhereQuery}
         */
        notin: function (field, value) {
            return this._simple(OperatorType.notin, field, value);
        },
        /**
         * Adds a condition that a field must include *all* of the specified values. Applicable to Array fields.
         * @method all
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name.
         * @param {Array} value An array of values that the field must include.
         * @returns {WhereQuery}
         */
        all: function (field, value) {
            return this._simple(OperatorType.all, field, value);
        },
        /**
         * Adds a condition that a field must contain an array whose length is larger than a specified value. Applicable to Array fields.
         * @method size
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name.
         * @param {number} value The size that the array must be bigger than.
         * @returns {WhereQuery}
         */
        size: function (field, value) {
            return this._simple(OperatorType.size, field, value);
        },
        /**
         * Adds a condition that a field must satisfy a specified regex.
         * @method regex
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name.
         * @param {string} regularExpression Regular expression in PCRE format.
         * @param {string} [options] A string of regex options to use. See [specs](http://docs.mongodb.org/manual/reference/operator/query/regex/#op._S_options) for a description of available options.
         * @returns {WhereQuery}
         */
        regex: function (field, value, flags) {
            return this._simple(OperatorType.regex, field, value, flags);
        },
        /**
         * Adds a condition that a field value must *start* with a specified string.
         * @method startsWith
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name.
         * @param {string} value The string that the field should start with.
         * @param {string} [options] A string of regex options to use. See [specs](http://docs.mongodb.org/manual/reference/operator/query/regex/#op._S_options) for a description of available options.
         * @returns {WhereQuery}
         */
        startsWith: function (field, value, flags) {
            return this._simple(OperatorType.startsWith, field, value, flags);
        },
        /**
         * Adds a condition that a field value must *end* with a specified string.
         * @method endsWith
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name.
         * @param {string} value The string that the field should end with.
         * @param {string} [options] A string of  regex options to use. See [specs](http://docs.mongodb.org/manual/reference/operator/query/regex/#op._S_options) for a description of available options.
         * @returns {WhereQuery}
         */
        endsWith: function (field, value, flags) {
            return this._simple(OperatorType.endsWith, field, value, flags);
        },
        /**
         * Adds a Geospatial condition that a specified geopoint must be within a certain distance from another geopoint. Applicable to GeoPoint fields only.
         * @method nearSphere
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name containing a {GeoPoint} in the following format: `(decimal_degrees_latitude,decimal_degrees_longitude)`, where *decimal_degrees_latitude* ranges from -90 to 90 and *decimal_degrees_longitude* ranges from -180 to 180. Example: `(42.6954322,123.3239467)`
         * @param {Everlive.GeoPoint} point Comparison geopoint value.
         * @param {number} distance Distance value.
         * @param {string} [metrics=radians] A string representing what unit of measurement is used for distance. Possible values: radians, km, miles.
         * @returns {WhereQuery}
         */
        nearSphere: function (field, point, distance, metrics) {
            return this._simple(OperatorType.nearShpere, field, point, distance, metrics);
        },
        /**
         * Adds a Geospatial condition that a specified geopoint must be within a specified coordinate rectangle. Applicable to GeoPoint fields only.
         * @method withinBox
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name containing a {GeoPoint} in the following format: `(decimal_degrees_latitude,decimal_degrees_longitude)`, where *decimal_degrees_latitude* ranges from -90 to 90 and *decimal_degrees_longitude* ranges from -180 to 180. Example: `(42.6954322,123.3239467)`
         * @param {Everlive.GeoPoint} pointBottomLeft Value representing the bottom left corner of the box.
         * @param {Everlive.GeoPoint} pointUpperRight Value representing the upper right corner of the box.
         * @example ```js
         var query = new Everlive.Query();
         query.where().withinBox('Location',
         new Everlive.GeoPoint(23.317871, 42.687709),
         new Everlive.GeoPoint(23.331346, 42.707075));
         ```
         * @returns {WhereQuery}
         */
        withinBox: function (field, pointBottomLeft, pointUpperRight) {
            return this._simple(OperatorType.withinBox, field, pointBottomLeft, pointUpperRight);
        },
        /**
         * Adds a Geospatial condition that a specified geopoint must be within a specified coordinate polygon. The polygon is specified as an array of geopoints. The last point in the array is implicitly connected to the first point thus closing the shape. Applicable to GeoPoint fields only.
         * @method withinPolygon
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name containing a {GeoPoint} in the following format: `(decimal_degrees_latitude,decimal_degrees_longitude)`, where *decimal_degrees_latitude* ranges from -90 to 90 and *decimal_degrees_longitude* ranges from -180 to 180. Example: `(42.6954322,123.3239467)`
         * @param {Everlive.GeoPoint[]} points Comparison value in the form of an array of geopoints defining the polygon.
         * @example ```js
         var point1 = new Everlive.GeoPoint(23.317871, 42.687709);
         var point2 = new Everlive.GeoPoint(42.698749, 42.698749);
         var point3 = new Everlive.GeoPoint(23.331346, 42.702282);

         var query = new Everlive.Query();
         query.where().withinPolygon("location", [point1, point2, point3]);
         * ```
         * @returns {WhereQuery}
         */
        withinPolygon: function (field, points) {
            return this._simple(OperatorType.withinPolygon, field, points);
        },
        /**
         * Adds a Geospatial condition that a specified geopoint must be within a coordinate circle. Applicable to GeoPoint fields only.
         * @method withinCenterSphere
         * @memberOf WhereQuery.prototype
         * @param {string} field Field name containing a {GeoPoint} in the following format: `(decimal_degrees_latitude,decimal_degrees_longitude)`, where *decimal_degrees_latitude* ranges from -90 to 90 and *decimal_degrees_longitude* ranges from -180 to 180. Example: `(42.6954322,123.3239467)`
         * @param {Everlive.GeoPoint} center Comparison value specifying the center of the coordinate circle.
         * @param {number} radius Value specifying the radius length.
         * @param {string} [metrics=radians] A string representing what unit of measurement is used for radius length. Possible values: radians, km, miles.
         * @returns {WhereQuery}
         */
        withinCenterSphere: function (field, center, radius, metrics) {
            return this._simple(OperatorType.withinShpere, field, center, radius, metrics);
        },
        /**
         * Ends the definition of the current WhereQuery. You need to call this method in order to continue with the definition of the parent `Query`. All other `WhereQuery` methods return the current instance of `WhereQuery` to allow chaining.
         * @method done
         * @memberOf WhereQuery.prototype
         * @returns {Query}
         */
        done: function () {
            if (this.parent instanceof WhereQuery) {
                return this.parent._done();
            } else {
                return this.parent;
            }
        },
        _done: function () {
            if (this.single) {
                return this.parent;
            } else {
                return this;
            }
        }
    };

    WhereQuery.prototype.equal = WhereQuery.prototype.eq;
    WhereQuery.prototype.notEqual = WhereQuery.prototype.ne;
    WhereQuery.prototype.greaterThan = WhereQuery.prototype.gt;
    WhereQuery.prototype.greaterThanEqual = WhereQuery.prototype.gte;
    WhereQuery.prototype.lessThan = WhereQuery.prototype.lt;
    WhereQuery.prototype.lessThanEqual = WhereQuery.prototype.lte;

    return WhereQuery;
}());
},{"../Expression":49,"../constants":59}],91:[function(require,module,exports){
var http = require('http');
module.exports = (function () {
    'use strict';

    function reqwest(options) {
        var httpRequestOptions = {
            url: options.url,
            method: options.method,
            headers: options.headers || {}
        };

        if (options.data) {
            httpRequestOptions.content = options.data; // NOTE: If we pass null/undefined, it will raise an exception in the http module.
        }

        httpRequestOptions.headers['Accept'] = 'application/json';
        httpRequestOptions.headers['Content-Type'] = 'application/json';

        var noop = function () {
        };
        var success = options.success || noop;
        var error = options.error || noop;

        var requestSuccessCallback = function (response) {
            var contentString = response.content.toString();
            if (response.statusCode < 400) {
                // Success callback calls a custom parse function
                success(contentString);
            } else {
                // Error callback relies on a JSON Object with ResponseText inside
                error({
                    responseText: contentString
                });
            }
        };

        var requestErrorCallback = function (err) {
            // error: function(jqXHR, textStatus, errorThrown)
            // when timeouting for example (i.e. no internet connectivity), we get an err with content { message: "timeout...", stack: null }
            error({
                responseText: err
            });
        };

        http.request(httpRequestOptions).then(requestSuccessCallback, requestErrorCallback);
    }

    return reqwest;
}());
},{"http":"http"}],92:[function(require,module,exports){
(function (Buffer){
var url = require('url');
var http = require('http');
var https = require('https');
var rsvp = require('rsvp');
var zlib = require('zlib');
var _ = require('underscore');

module.exports = (function () {
    'use strict';

    function reqwest(options) {
        var urlParts = url.parse(options.url);
        var request;
        if (urlParts.protocol === 'https:') {
            request = https.request;
        }
        else {
            request = http.request;
        }
        var headers = options.headers || {};
        options.success = options.success || _.noop;
        options.error = options.error || _.noop;

        headers['Content-Type'] = options.contentType;
        var req = request({
            method: options.method,
            hostname: urlParts.hostname,
            port: urlParts.port,
            path: urlParts.path,
            headers: headers
        }, function (res) {
            var json = '';
            var contentEncoding = res.headers['content-encoding'];
            var responseProxy;
            switch (contentEncoding){
                case 'gzip':
                    responseProxy = zlib.createGunzip();
                    res.pipe(responseProxy);
                    break;
                default:
                    responseProxy = res;
                    responseProxy.setEncoding('utf8');
                    break;
            }

            responseProxy.on('data', function (data) {
                json += data.toString();
            });

            responseProxy.on('end', function () {
                // 1xx Informational, 2xx Success, 3xx Redirection, 4xx Client Error, 5xx Server Error
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    options.success(json, res);
                } else {
                    if (json) {
                        options.error({ responseText: json });
                    }
                    else { // empty response
                        var error = new Error('Response error.');
                        error.statusCode = res.statusCode;
                        options.error({ responseText: error });
                    }
                }
            });
        });

        req.on('error', function (e) {
            options.error({ responseText: e }); // TODO
        });

        if (options.data) {
            var contentEncoding = headers['content-encoding'];
            switch (contentEncoding){
                case 'gzip':
                    var buf = new Buffer(options.data, 'utf-8');
                    zlib.gzip(buf, function (err, result) {
                        req.end(result);
                    });
                    break;
                default:
                    req.end(options.data);
                    break;
            }
        }
        else {
            req.end();
        }
    }

    return reqwest;
}());
}).call(this,require("buffer").Buffer)

},{"buffer":"buffer","http":"http","https":"https","rsvp":34,"underscore":35,"url":"url","zlib":"zlib"}],93:[function(require,module,exports){
var platform = require('../everlive.platform');
var WebFileStore = require('./WebFileStore');
var NativeScriptFileStore = require('./NativeScriptFileStore');
var _ = require('../common')._;

'use strict';

if (platform.isNativeScript) {
    module.exports = NativeScriptFileStore;
} else if (platform.isCordova || platform.isDesktop) {
    module.exports = WebFileStore;
} else {
    module.exports = _.noop;
}
},{"../common":58,"../everlive.platform":61,"./NativeScriptFileStore":95,"./WebFileStore":96}],94:[function(require,module,exports){
var platform = require('./../everlive.platform.js');
var isNativeScript = platform.isNativeScript;
var isNodejs = platform.isNodejs;
var constants = require('./../constants');

module.exports = (function () {
    'use strict';

    function initLocalStorage(options) {
        if (isNativeScript) {
            var localSettings;

            //workound for older nativescript versions
            try {
                localSettings = require('application-settings');
            } catch (e) {
                localSettings = require('local-settings');
            }

            return {
                getItem: function (key) {
                    return localSettings.getString(key);
                },

                removeItem: function (key) {
                    return localSettings.remove(key);
                },

                setItem: function (key, value) {
                    return localSettings.setString(key, value);
                }
            };
        } else {
            var localStorage;
            if (isNodejs) {
                var LocalStorage = require('node-localstorage').LocalStorage;
                localStorage = new LocalStorage(options.storage.storagePath);
            } else {
                localStorage = window.localStorage;
            }

            return {
                getItem: function (key) {
                    return localStorage.getItem(key);
                },

                removeItem: function (key) {
                    return localStorage.removeItem(key);
                },

                setItem: function (key, value) {
                    return localStorage.setItem(key, value);
                }
            };
        }
    }

    function LocalStore(options) {
        this.options = options;
        this._localStorage = initLocalStorage(this.options);
    }

    LocalStore.prototype = {
        getItem: function (key) {
            return this._localStorage.getItem(key);
        },

        removeItem: function (key) {
            return this._localStorage.removeItem(key);
        },

        setItem: function (key, value) {
            return this._localStorage.setItem(key, value);
        }
    };

    return LocalStore;
}());
},{"./../constants":59,"./../everlive.platform.js":61,"application-settings":"application-settings","local-settings":"local-settings","node-localstorage":"node-localstorage"}],95:[function(require,module,exports){
'use strict';

var common = require('../common');
var rsvp = common.rsvp;
var utils = require('../utils');

function NativeScriptFileStore(storagePath, options) {
    this.options = options;
    this.fs = require('file-system');
    this.dataDirectoryPath = this.fs.knownFolders.documents().path;
    this.filesDirectoryPath = this.fs.path.join(this.dataDirectoryPath, storagePath);
}

NativeScriptFileStore.prototype = {
    getErrorHandler: function (callback) {
        return function (e) {
            callback && callback(e);
        }
    },

    removeFilesDirectory: function () {
        var self = this;

        return self.getFilesDirectory()
            .then(function (filesDirectory) {
                return filesDirectory.remove();
            });
    },

    removeFile: function (fileEntry) {
        return fileEntry.remove();
    },

    readFileAsText: function (fileEntry) {
        return fileEntry.readText();
    },

    writeTextToFile: function (fileEntry, content) {
        return fileEntry.writeText(content);
    },

    getFile: function (path) {
        var self = this;
        return new rsvp.Promise(function (resolve, reject) {
            self.resolveDataDirectory()
                .then(function (directoryEntry) {
                    var fullFilePath = self.fs.path.join(directoryEntry.path, path);
                    var file = self.fs.File.fromPath(fullFilePath);
                    resolve(file);
                })
                .catch(reject);
        });
    },

    getFilesDirectory: function () {
        var self = this;

        return new rsvp.Promise(function (resolve) {
            var filesDirectory = self.fs.Folder.fromPath(self.filesDirectoryPath);
            resolve(filesDirectory);
        });
    },

    resolveDataDirectory: function () {
        var self = this;

        return new rsvp.Promise(function (resolve) {
            var dataDirectory = self.fs.Folder.fromPath(self.dataDirectoryPath);
            resolve(dataDirectory);
        });
    },

    ensureFilesDirectory: function () {
        var self = this;

        return new rsvp.Promise(function (resolve, reject) {
            self.resolveDataDirectory()
                .then(function (directoryEntry) {
                    var fileDirectoryPath = self.fs.path.join(directoryEntry.path, self.filesDirectoryPath);
                    self.fs.Folder.fromPath(fileDirectoryPath);
                    resolve();
                })
                .catch(reject);
        });
    },

    getFilesDirectoryPath: function () {
        return this.filesDirectoryPath;
    },

    // TODO: [offline] Implement
    writeText: function (fileName, text) {
        throw new Error('Not implemented');
    },

    // TODO: [offline] Implement
    createDirectory: function () {
        throw new Error('Not implemented');
    },

    // TODO: [offline] Implement
    getFileSize: function (file, getFileSize) {
        throw new Error('Not implemented');
    },

    // TODO: [offline] Implement
    getFileByAbsolutePath: function (path) {
        throw new Error('Not implemented');
    },

    readFileAsBase64: function (file) {
        throw new Error('Not implemented');
    },

    renameFile: function () {
        throw new Error('Not implemented');
    },
};

module.exports = NativeScriptFileStore;
},{"../common":58,"../utils":100,"file-system":"file-system"}],96:[function(require,module,exports){
'use strict';

var EverliveError = require('../EverliveError').EverliveError;
var common = require('../common');
var rsvp = common.rsvp;
var _ = common._;
var utils = require('../utils');
var platform = require('../everlive.platform');
var path = require('path');

var deviceReadyPromise = function () {
    return new rsvp.Promise(function (resolve) {
        document.addEventListener('deviceready', resolve);
    });
};

function WebFileStore(storagePath, options) {
    this.options = options;

    var filesDirectoryPath;

    if (platform.isWindowsPhone) {
        //windows phone does not handle leading or trailing slashes very well :(
        filesDirectoryPath = storagePath.replace(new RegExp('/', 'g'), '');
    } else {
        if (storagePath.lastIndexOf('/') === -1) {
            filesDirectoryPath = storagePath + '/';
        }
    }

    filesDirectoryPath = filesDirectoryPath || storagePath;

    var self = this;

    deviceReadyPromise()
        .then(function () {
            self.filesDirectoryPath = filesDirectoryPath;
            self._requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
            self._resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;
            self._PERSISTENT_FILE_SYSTEM = window.LocalFileSystem ? window.LocalFileSystem.PERSISTENT : window.PERSISTENT;
        });
}

WebFileStore.prototype = {
    getErrorHandler: function getErrorHandler(callback) {
        var errorsMap = {
            '1000': 'NOT_FOUND'
        };

        _.each(Object.keys(FileError), function (error) {
            errorsMap[FileError[error]] = error;
        });

        return function (e) {
            if (!e.message) {
                e.message = errorsMap[e.code];
            }

            callback && callback(e);
        }
    },

    getDataDirectory: (function () {
        var fileSystemRoot;

        return function getDataDirectory() {
            var self = this;

            return deviceReadyPromise()
                .then(function () {
                    var requestFileSystem = function (bytes, success, error) {
                        self._requestFileSystem.call(window, self._PERSISTENT_FILE_SYSTEM, bytes, function (fileSystem) {
                            fileSystemRoot = fileSystem.root;
                            fileSystemRoot.nativeURL = fileSystemRoot.nativeURL || fileSystemRoot.toURL();
                            success(fileSystemRoot);
                        }, error);
                    };

                    return new rsvp.Promise(function (resolve, reject) {
                        if (fileSystemRoot) {
                            return resolve(fileSystemRoot);
                        }

                        if (platform.isDesktop) {
                            if (navigator && !navigator.webkitPersistentStorage) {
                                return reject(new EverliveError('FileSystemStorage can be used only with browsers supporting it. Consider using localStorage.'))
                            }

                            navigator.webkitPersistentStorage.requestQuota(self.options.storage.requestedQuota, function (grantedBytes) {
                                requestFileSystem(grantedBytes, resolve, reject);
                            }, reject);
                        } else {
                            requestFileSystem(0, resolve, reject);
                        }
                    });
                });
        };
    }()),

    getFilesDirectory: function getFilesDirectory() {
        var self = this;
        return new rsvp.Promise(function (resolve, reject) {
            self.getDataDirectory()
                .then(function (dataDirectory) {
                    dataDirectory.getDirectory(self.filesDirectoryPath, {
                        create: true,
                        exclusive: false
                    }, resolve, reject);
                })
                .catch(reject);
        });
    },

    removeFilesDirectory: function () {
        var self = this;

        return this.getFilesDirectory()
            .then(function (filesDirectory) {
                return self._removeFolderWrap(filesDirectory);
            });
    },

    removeFile: function (fileEntry) {
        return new rsvp.Promise(function (resolve, reject) {
            fileEntry.remove(function () {
                resolve();
            }, reject);
        });
    },

    readFileAsText: function (fileEntry) {
        var self = this;

        return new rsvp.Promise(function (resolve, reject) {
            self.getFilesDirectory().then(function () {
                fileEntry.file(function (file) {
                    var reader = new FileReader();
                    reader.onloadend = function () {
                        var result = this.result;

                        //windows phone returns an object....
                        if (typeof this.result === 'object') {
                            result = JSON.stringify(this.result);
                        }

                        resolve(result);
                    };
                    reader.onerror = reject;
                    reader.readAsText(file);
                }, reject);
            }).catch(reject);
        });
    },

    writeTextToFile: function (fileEntry, content) {
        var self = this;

        return self.getFilesDirectory()
            .then(function () {
                return self._getWriterWrap(fileEntry, content);
            });
    },

    getFileSize: function (filename, folder) {
        var self = this;

        return new rsvp.Promise(function (resolve, reject) {
            var fileLocation = utils.joinPath(folder, filename);

            return self.getFile(fileLocation)
                .then(function (fileEntry) {
                    fileEntry.file(function (file) {
                        resolve(file.size);
                    }, reject);
                })
        });
    },

    getFile: function (fileName, dirEntry) {
        return this.getFilesDirectory()
            .then(function (directoryEntry) {
                var fileDirectory;
                if (dirEntry) {
                    fileDirectory = dirEntry;
                } else {
                    fileDirectory = directoryEntry;
                }

                return new rsvp.Promise(function (resolve, reject) {
                    fileDirectory.getFile(fileName, {
                        create: true,
                        exclusive: false
                    }, resolve, reject);
                });
            });
    },

    getFileByAbsolutePath: function (path) {
        var self = this;
        path = utils.transformPlatformPath(path);

        return new rsvp.Promise(function (resolve, reject) {
            self._resolveLocalFileSystemURL.call(window, path, resolve, function (err) {
                if (err && err.code === FileError.NOT_FOUND_ERR) {
                    return resolve();
                }

                return reject(err);
            });
        });
    },

    createDirectory: function (directory) {
        var self = this;

        return this.getFilesDirectory()
            .then(function (directoryEntry) {
                return self._getDirectoryWrap(directory, directoryEntry, {
                    create: true,
                    exclusive: false
                });
            });
    },

    renameFile: function (directoryEntry, fileEntry, filename) {
        return new rsvp.Promise(function (resolve, reject) {
            fileEntry.moveTo(directoryEntry, filename, resolve, reject);
        });
    },

    _getDirectoryWrap: function (directory, directoryEntry, options) {
        return new rsvp.Promise(function (resolve, reject) {
            directoryEntry.getDirectory(directory, options, resolve, reject);
        });
    },

    _removeFolderWrap: function (filesDirEntry) {
        return new rsvp.Promise(function (resolve, reject) {
            filesDirEntry.removeRecursively(function () {
                resolve();
            }, reject);
        });
    },

    _getWriterWrap: function (fileEntry, content) {
        return new rsvp.Promise(function (resolve, reject) {
            fileEntry.createWriter(function (fileWriter) {
                fileWriter.onwriteend = function () {
                    resolve();
                };

                fileWriter.onerror = reject;

                var bb = new Blob([content]);
                fileWriter.write(bb);
            }, reject);
        });
    },

    writeText: function (fileName, text, path) {
        var self = this;
        var fileHandle;

        return this.getFilesDirectory()
            .then(function (directoryEntry) {
                if (path) {
                    return self.createDirectory(path);
                } else {
                    return directoryEntry;
                }
            })
            .then(function (directoryEntry) {
                return self.getFile(fileName, directoryEntry);
            })
            .then(function (fileEntry) {
                fileHandle = fileEntry;
                return self.writeTextToFile(fileEntry, text);
            })
            .then(function () {
                // there  is a difference between the cordova implementation and the standard FileTransfer fileEntry
                return fileHandle.nativeURL || fileHandle.toURL();
            });
    },

    // http://stackoverflow.com/questions/9583363/get-base64-from-imageuri-with-phonegap
    readFileAsBase64: function (fileEntry) {
        return new rsvp.Promise(function (resolve, reject) {
            fileEntry.file(function (file) {
                var reader = new FileReader();
                reader.onloadend = function (evt) {
                    resolve(utils.arrayBufferToBase64(evt.target.result));
                };

                reader.readAsArrayBuffer(file);
            }, reject);
        });
    }
};

module.exports = WebFileStore;
},{"../EverliveError":47,"../common":58,"../everlive.platform":61,"../utils":100,"path":3}],97:[function(require,module,exports){
var buildPromise = require('../utils').buildPromise;
var constants = require('../constants');
var idField = constants.idField;
var DataQuery = require('../query/DataQuery');
var RequestOptionsBuilder = require('../query/RequestOptionsBuilder');
var rsvp = require('../common').rsvp;
var Request = require('../Request');
var Everlive = require('../Everlive');
var EverliveError = require('../EverliveError').EverliveError;
var EverliveErrors = require('../EverliveError').EverliveErrors;
var EventQuery = require('../query/EventQuery');
var everlivePlatform = require('../everlive.platform').platform;
var _ = require('../common')._;
var utils = require('../utils');

var beforeExecuteAllowedOperations = [
    constants.DataQueryOperations.Count,
    constants.DataQueryOperations.Read,
    constants.DataQueryOperations.Create,
    constants.DataQueryOperations.Update,
    constants.DataQueryOperations.UpdateById,
    constants.DataQueryOperations.Delete,
    constants.DataQueryOperations.DeleteById,
    constants.DataQueryOperations.ReadById,
    constants.DataQueryOperations.RawUpdate
];

module.exports = (function () {
    function mergeResultData(data, success) {
        return function (res, response) {
            var attrs = res.result;
            // support for kendo observable array
            if (_.isArray(data) || typeof data.length === 'number') {
                _.each(data, function (item, index) {
                    _.extend(item, attrs[index]);
                });
            } else {
                _.extend(data, attrs);
            }

            success(res, response);
        };
    }

    function mergeUpdateResultData(data, success) {
        return function (res) {
            var modifiedAt = res.ModifiedAt;
            data.ModifiedAt = modifiedAt;
            success(res);
        };
    }

    /**
     * @class Data
     * @classdesc A class that provides methods for all CRUD operations to a given {{site.bs}} data type. Covers advanced scenarios with custom headers and special server-side functionality.
     * @param {object} setup
     * @param {string} collectionName
     * @protected
     */
    function Data(setup, collectionName, offlineStorage, everlive) {
        this.setup = setup;
        this.collectionName = collectionName;
        this.options = null;
        this.offlineStorage = offlineStorage;
        this.everlive = everlive;
    }

    Data.prototype = {
        _isOnline: function () {
            return this.offlineStorage ? this.offlineStorage.isOnline() : true;
        },

        _getOfflineCreateData: function (query, requestResponse) {
            var createData;
            if (_.isArray(query.data)) {
                createData = [];
                for (var i = 0; i < query.data.length; i++) {
                    var objectToCreate = _.extend(query.data[i], requestResponse.result[i]);
                    createData.push(objectToCreate)
                }
            } else {
                createData = _.extend(query.data, requestResponse.result);
            }

            return createData;
        },
        _applyOffline: function (query, requestResponse) {
            var autoSyncEnabled = this.offlineStorage && this.offlineStorage.setup.autoSync;
            if (autoSyncEnabled) {
                switch (query.operation) {
                    case DataQuery.operations.Read:
                    case DataQuery.operations.ReadById:
                        var syncReadQuery = new DataQuery(_.defaults({
                            data: requestResponse.result,
                            isSync: true,
                            operation: DataQuery.operations.Create
                        }, query));
                        return this.offlineStorage.processQuery(syncReadQuery);
                    case DataQuery.operations.Create:
                        var createData = this._getOfflineCreateData(query, requestResponse);
                        var createQuery = new DataQuery(_.defaults({
                            data: createData,
                            isSync: true
                        }, query));
                        return this.offlineStorage.processQuery(createQuery);
                    case DataQuery.operations.Update:
                    case DataQuery.operations.RawUpdate:
                        query.isSync = true;
                        query.ModifiedAt = requestResponse.ModifiedAt;
                        return this.offlineStorage.processQuery(query);
                    default:
                        query.isSync = true;
                        return this.offlineStorage.processQuery(query);
                }
            }

            return new rsvp.Promise(function (resolve) {
                resolve();
            });
        },

        _setOption: function (key, value) {
            this.options = this.options || {};
            if (_.isObject(value)) {
                this.options[key] = _.extend({}, this.options[key], value);
            } else {
                this.options[key] = value;
            }
            return this;
        },

        /**
         * Modifies whether the query should be invoked on the offline storage.
         * @memberOf Data.prototype
         * @method useOffline
         * @name useOffline
         * @param {boolean} [useOffline]
         * @returns {Data} Returns the same instance of the Data object.
         */
        useOffline: function (useOffline) {
            if (arguments.length !== 1) {
                throw new Error('A single value is expected in useOffline() query modifier');
            }
            return this._setOption('useOffline', useOffline);
        },

        /**
         * Does not use the cache when retrieving the data.
         * Only valid when caching is enabled.
         * @memberOf Data.prototype
         * @method ignoreCache
         * @name ignoreCache
         * @returns {Data}
         * */
        ignoreCache: function () {
            return this._setOption('ignoreCache', true);
        },

        /**
         * Forces the request to get the data from the cache even if the data is already expired.
         * Only valid when caching is enabled.
         * @memberOf Data.prototype
         * @method forceCache
         * @name forceCache
         * @returns {Data}
         * */
        forceCache: function () {
            return this._setOption('forceCache', true);
        },

        /**
         * Sets cache expiration specifically for the current query.
         * Only valid when caching is enabled.
         * @memberOf Data.prototype
         * @method maxAge
         * @name maxAge
         * @param maxAgeInMinutes
         * @returns {Data}
         * */
        maxAge: function (maxAgeInMinutes) {
            var maxAge = maxAgeInMinutes * 1000 * 60;
            return this._setOption('maxAge', maxAge);
        },

        isSync: function (isSync) {
            if (arguments.length !== 1) {
                throw new Error('A single value is expected in isSync() query modifier');
            }
            return this._setOption('isSync', isSync);
        },

        /**
         * Modifies whether the query should try to authenticate if the security token has expired.
         * Default is false.
         * Only valid when the authentication module has an onAuthenticationRequired function.
         * @memberOf Data.prototype
         * @method skipAuth
         * @param skipAuth
         * @returns {Data}
         * */
        skipAuth: function (skipAuth) {
            if (arguments.length !== 1) {
                throw new Error('A single value is expected in skipAuth() query modifier');
            }
            return this._setOption('skipAuth', skipAuth);
        },

        /**
         * Modifies whether the query should be applied offline, if the sdk is currenty working online.
         * Default is true.
         * Only valid when offlineStorage is enabled.
         * @memberOf Data.prototype
         * @method applyOffline
         * @param applyOffline
         * @returns {Data}
         * */
        applyOffline: function (applyOffline) {
            if (arguments.length !== 1) {
                throw new Error('A single value is expected in applyOffline() query modifier');
            }
            return this._setOption('applyOffline', applyOffline);
        },

        /**
         * Sets additional non-standard HTTP headers in the current data request. See [List of Request Parameters](http://docs.telerik.com/platform/backend-services/rest/apireference/RESTfulAPI/custom_headers) for more information.
         * @memberOf Data.prototype
         * @method withHeaders
         * @param {object} headers Additional headers to be sent with the data request.
         * @returns {Data}
         */
        withHeaders: function (headers) {
            return this._setOption('headers', headers);
        },
        /**
         * Sets an expand expression to be used in the data request. This allows you to retrieve complex data sets using a single query based on relations between data types.
         * @memberOf Data.prototype
         * @method expand
         * @param {object} expandExpression An [expand expression](http://docs.telerik.com/platform/backend-services/rest/data/relations/relations-defining) definition.
         * @returns {Data}
         */
        expand: function (expandExpression) {
            var expandHeader = {
                'X-Everlive-Expand': JSON.stringify(expandExpression)
            };
            return this.withHeaders(expandHeader);
        },

        _applyQueryOffline: function (query) {
            var self = this;

            if (!query.applyOffline) {
                query.onError.call(this, new EverliveError('The applyOffline must be false when working offline.'));
            } else {
                self.offlineStorage.processQuery(query)
                    .then(function () {
                        query.onSuccess.apply(this, arguments);
                    }, function (err) {
                        if (!err.code) {
                            err = new EverliveError(err.message, EverliveErrors.generalDatabaseError.code);
                        }
                        query.onError.call(this, err);
                    });
            }
        },

        _sendRequest: function (query, online) {
            var self = this;

            var originalSuccess = query.onSuccess;
            query.onSuccess = function () {
                var args = arguments;
                var data = args[0];

                if (query.applyOffline) {
                    return self._applyOffline(query, data)
                        .then(function () {
                            originalSuccess.apply(this, args);
                        }, function (err) {
                            if (online && err.code === EverliveErrors.operationNotSupportedOffline.code) {
                                originalSuccess.apply(this, args);
                            } else {
                                query.onError.apply(this, arguments);
                            }
                        });
                } else {
                    return originalSuccess.apply(this, args);
                }
            };

            var getRequestOptionsFromQuery = RequestOptionsBuilder[query.operation];
            var requestOptions = getRequestOptionsFromQuery(query);
            this._setAdditionalHeaders(query, requestOptions);
            var request = new Request(this.setup, requestOptions);
            request.send();
        },

        _applyQueryOnline: function (query) {
            if (query.useCache) {
                this.everlive.cache._cacheDataQuery(query);
            } else {
                this._sendRequest(query, true);
            }
        },

        _setAdditionalHeaders: function (query, requestOptions) {
            if (query.isSync) {
                requestOptions.headers[constants.Headers.sync] = true;
            }

            var sdkHeaderValue = {
                sdk: 'js',
                platform: everlivePlatform
            };

            requestOptions.headers[constants.Headers.sdk] = JSON.stringify(sdkHeaderValue);
        },

        processDataQuery: function (query) {
            var self = this;

            var offlineStorageEnabled = this.everlive._isOfflineStorageEnabled();
            query.useOffline = offlineStorageEnabled ? !this.everlive.isOnline() : false;

            if (this.options) {
                query = _.defaults(this.options, query);
            }
            var isCachingEnabled = (this.everlive.setup.caching === true || (this.everlive.setup.caching && this.everlive.setup.caching.enabled));
            var isSupportedInOffline = utils.isQuerySupportedOffline(query);

            query.useCache = isCachingEnabled && !query.isSync && isSupportedInOffline;
            query.applyOffline = query.applyOffline !== undefined ? query.applyOffline : offlineStorageEnabled || query.useCache;

            if (!query.useCache && query.forceCache) {
                return query.onError.call(this, new EverliveError(EverliveErrors.cannotForceCacheWhenDisabled));
            }

            this.options = null;
            if (!query.skipAuth && this.everlive.authentication && this.everlive.authentication.isAuthenticationInProgress()) {
                query.onError = _.wrap(query.onError, function (errorFunc, err) {
                    if (err.code === EverliveErrors.invalidToken.code || err.code === EverliveErrors.expiredToken.code) {
                        var whenAuthenticatedPromise = self.everlive.authentication._ensureAuthentication();
                        if (!query.noRetry) {
                            whenAuthenticatedPromise.then(function () {
                                if (query.headers && query.headers.authorization) {
                                    //at this stage if a token is used for authentication it is already invalidated
                                    //we need to set the new one to the query
                                    var authHeader = utils.buildAuthHeader(self.everlive.setup);
                                    _.extend(query.headers, authHeader);
                                }

                                return self.processDataQuery(query);
                            });
                        }
                    } else {
                        errorFunc.call(self, err);
                    }
                });

                //if we are currently authenticating, queue the data query after we have logged in
                if (self.everlive.authentication.isAuthenticating()) {
                    var whenAuthenticatedPromise = self.everlive.authentication._ensureAuthentication();
                    if (!query.noRetry) {
                        whenAuthenticatedPromise.then(function () {
                            return self.processDataQuery(query);
                        });
                    }

                    return whenAuthenticatedPromise;
                }
            }


            if (_.contains(beforeExecuteAllowedOperations, query.operation)) {
                var eventQuery = EventQuery.fromDataQuery(query);
                this.everlive._emitter.emit(constants.Events.BeforeExecute, eventQuery);
                if (eventQuery.isCancelled()) {
                    return;
                }

                query.applyEventQuery(eventQuery);
            }

            if ((!query.isSync && this.offlineStorage && this.offlineStorage.isSynchronizing())) {
                query.onError.call(this, new EverliveError(EverliveErrors.syncInProgress));
            } else if (query.useOffline) {
                this._applyQueryOffline(query);
            } else {
                this._applyQueryOnline(query);
            }
        },
        // TODO implement options: { requestSettings: { executeServerCode: false } }. power fields queries could be added to that options argument
        /**
         * Gets all data items that match the filter. This allows you to retrieve a subset of the items based on various filtering criteria.
         * @memberOf Data.prototype
         * @method get
         * @name get
         * @param {object|null} filter A [filter expression](http://docs.telerik.com/platform/backend-services/rest/queries/queries-filtering) definition.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Gets all data items that match the filter. This allows you to retrieve a subset of the items based on various filtering criteria.
         * @memberOf Data.prototype
         * @method get
         * @name get
         * @param {object|null} filter A [filter expression](http://docs.telerik.com/platform/backend-services/rest/queries/queries-filtering) definition.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        get: function (filter, success, error) {
            var self = this;

            return buildPromise(function (successCb, errorCb) {
                var dataQuery = new DataQuery({
                    operation: DataQuery.operations.Read,
                    collectionName: self.collectionName,
                    filter: filter,
                    onSuccess: successCb,
                    onError: errorCb
                });

                return self.processDataQuery(dataQuery);
            }, success, error);
        },
        // TODO handle options
        // TODO think to pass the id as a filter

        /**
         * Gets a data item by ID.
         * @memberOf Data.prototype
         * @method getById
         * @name getById
         * @param {string} id ID of the item.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Gets an item by ID.
         * @memberOf Data.prototype
         * @method getById
         * @name getById
         * @param {string} id ID of the item.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         * */
        getById: function (id, success, error) {
            var self = this;

            return buildPromise(function (successCb, errorCb) {
                var dataQuery = new DataQuery({
                    operation: DataQuery.operations.ReadById,
                    collectionName: self.collectionName,
                    parse: Request.parsers.single,
                    additionalOptions: {
                        id: id
                    },
                    onSuccess: successCb,
                    onError: errorCb
                });


                return self.processDataQuery(dataQuery);
            }, success, error);
        },

        /**
         * Gets the count of the data items that match the filter.
         * @memberOf Data.prototype
         * @method count
         * @name count
         * @param {object|null} filter A [filter expression](http://docs.telerik.com/platform/backend-services/rest/queries/queries-filtering) definition.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Gets the count of the items that match the filter.
         * @memberOf Data.prototype
         * @method count
         * @name count
         * @param {object|null} filter A [filter expression](http://docs.telerik.com/platform/backend-services/rest/queries/queries-filtering) definition.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        count: function (filter, success, error) {
            var self = this;

            return buildPromise(function (sucessCb, errorCb) {
                var dataQuery = new DataQuery({
                    operation: DataQuery.operations.Count,
                    collectionName: self.collectionName,
                    filter: filter,
                    parse: Request.parsers.single,
                    onSuccess: sucessCb,
                    onError: errorCb
                });
                return self.processDataQuery(dataQuery);
            }, success, error);
        },

        /**
         * Creates a data item.
         * @memberOf Data.prototype
         * @method create
         * @name create
         * @param {object|object[]} data Item or items that will be created.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Creates an item.
         * @memberOf Data.prototype
         * @method create
         * @name create
         * @param {object|object[]} data The item or items that will be created.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        create: function (data, success, error) {
            var self = this;

            return buildPromise(function (success, error) {
                var dataQuery = new DataQuery({
                    operation: DataQuery.operations.Create,
                    collectionName: self.collectionName,
                    data: data,
                    parse: Request.parsers.single,
                    onSuccess: mergeResultData(data, success),
                    onError: error
                });


                return self.processDataQuery(dataQuery);
            }, success, error);
        },
        /**
         * Updates all objects that match a filter with the specified update expression.
         * @memberOf Data.prototype
         * @method rawUpdate
         * @name rawUpdate
         * @param {object} updateObject Update object that contains the new values.
         * @param {object|null} filter A [filter expression](http://docs.telerik.com/platform/backend-services/rest/queries/queries-filtering) definition.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Updates all objects that match a filter with the specified update expression.
         * @memberOf Data.prototype
         * @method rawUpdate
         * @name rawUpdate
         * @param {object} updateObject Update object that contains the new values.
         * @param {object|null} filter A [filter expression](http://docs.telerik.com/platform/backend-services/rest/queries/queries-filtering) definition.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        /**
         * Updates an object by ID with the specified update expression.
         * @memberOf Data.prototype
         * @method rawUpdate
         * @name rawUpdate
         * @param {object} updatedObject Updated object that contains the new values.
         * @param {string} id The ID of the item.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Updates an object by ID with the specified update expression.
         * @memberOf Data.prototype
         * @method rawUpdate
         * @name rawUpdate
         * @param {object} updateObject Updated object that contains the new values.
         * @param {string} id The ID of the item.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        rawUpdate: function (attrs, filter, success, error) {
            var self = this;

            return buildPromise(function (success, error) {
                var dataQuery = new DataQuery({
                    operation: DataQuery.operations.RawUpdate,
                    collectionName: self.collectionName,
                    filter: filter,
                    data: attrs,
                    onSuccess: success,
                    onError: error
                });
                return self.processDataQuery(dataQuery);
            }, success, error);
        },
        // TODO: Check if there is a case in which replace = true is passed to this function
        _update: function (attrs, filter, single, replace, success, error) {
            var self = this;

            return buildPromise(function (success, error) {
                var data = {};
                data[replace ? '$replace' : '$set'] = attrs;

                // if the update is for a single item - merge the update result and add the ModifiedAt field to the result
                var onSuccess = single ? mergeUpdateResultData(attrs, success) : success;

                var dataQuery = new DataQuery({
                    operation: DataQuery.operations.Update,
                    collectionName: self.collectionName,
                    parse: Request.parsers.update,
                    filter: filter,
                    data: data,
                    additionalOptions: {
                        id: single ? attrs[idField] : undefined
                    },
                    onSuccess: onSuccess,
                    onError: error
                });
                return self.processDataQuery(dataQuery);
            }, success, error);
        },

        /**
         * Updates a single data item. This operation takes an object that specifies both the data item to be updated and the updated values.
         * @memberOf Data.prototype
         * @method updateSingle
         * @name updateSingle
         * @param {object} item The item that will be updated. Note: the ID property of the item will be used to determine which item will be updated.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Updates the provided item.
         * @memberOf Data.prototype
         * @method updateSingle
         * @name updateSingle
         * @param {object} model The item that will be updated. Note: the ID property of the item will be used to determine which item will be updated.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        updateSingle: function (model, success, error) {
            var err = this._validateIdForModel(model);
            if (err) {
                return buildPromise(function (success, error) {
                    return error(err);
                }, success, error);
            }
            return this._update(model, null, true, false, success, error);
        },

        _validateIdForModel: function (model, isDestroy) {
            // validation for destroySingle('id-as-string') scenario
            if ((typeof model === 'string' || typeof model === 'number') && isDestroy) {
                return;
            }

            if (!model || model.Id === undefined || model.Id === null) {
                return new EverliveError(EverliveErrors.invalidId)
            }
        },

        /**
         * Updates all items that match a filter with the specified update object.
         * @memberOf Data.prototype
         * @method update
         * @name update
         * @param {object} updateObject The update object.
         * @param {object|null} filter A [filter expression](http://docs.telerik.com/platform/backend-services/rest/queries/queries-filtering) definition.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Updates all items that match the filter with the specified update object.
         * @memberOf Data.prototype
         * @method update
         * @name update
         * @param {object} model The update object.
         * @param {object|null} filter A [filter expression](http://docs.telerik.com/platform/backend-services/rest/queries/queries-filtering) definition.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        update: function (model, filter, success, error) {
            return this._update(model, filter, false, false, success, error);
        },
        _destroy: function (attrs, filter, single, success, error) {
            var self = this;

            return buildPromise(function (success, error) {
                // for support of destroySingle using string id
                var idField = (attrs && typeof attrs === 'object') ? attrs[constants.idField] : attrs;

                var dataQuery = new DataQuery({
                    operation: single ? DataQuery.operations.DeleteById : DataQuery.operations.Delete,
                    collectionName: self.collectionName,
                    filter: filter,
                    onSuccess: success,
                    onError: error,
                    additionalOptions: {
                        id: single ? idField : undefined
                    }
                });
                return self.processDataQuery(dataQuery);
            }, success, error);
        },

        /**
         * Deletes a single data item by ID.
         * @memberOf Data.prototype
         * @method destroySingle
         * @name destroySingle
         * @param {object} item Object containing the item ID to be deleted.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Deletes a single data item by ID.
         * @memberOf Data.prototype
         * @method destroySingle
         * @name destroySingle
         * @param {object} model Object containing the item ID to be deleted.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        destroySingle: function (model, success, error) {
            var err = this._validateIdForModel(model, true);
            if (err) {
                return buildPromise(function (success, error) {
                    return error(err);
                }, success, error);
            }

            return this._destroy(model, null, true, success, error);
        },

        /**
         * Deletes all data items that match a filter.
         * @memberOf Data.prototype
         * @method destroy
         * @name destroy
         * @param {object|null} filter A [filter expression](http://docs.telerik.com/platform/backend-services/rest/queries/queries-filtering) definition.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Deletes all items that match the filter.
         * @memberOf Data.prototype
         * @method destroy
         * @name destroy
         * @param {object|null} filter A [filter expression](http://docs.telerik.com/platform/backend-services/rest/queries/queries-filtering) definition.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        destroy: function (filter, success, error) {
            return this._destroy(null, filter, false, success, error);
        },

        /**
         * Sets the Access Control List (ACL) of a specified data item.
         * @memberOf Data.prototype
         * @method setAcl
         * @name setAcl
         * @param {object} acl The acl object.
         * @param {object} item The item whose ACL will be updated. Note: the ID property of the item will be used to determine which item will be updated.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Sets the Access Control List (ACL) of a specified data item.
         * @memberOf Data.prototype
         * @method setAcl
         * @name setAcl
         * @param {object} acl The acl object.
         * @param {object} item The item whose ACL will be updated. Note: the ID property of the item will be used to determine which item will be updated.
         * @param {object} operationParameters An object that accepts operation parameters.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        /**
         * Sets the Access Control List (ACL) of a specified data item.
         * @memberOf Data.prototype
         * @method setAcl
         * @name setAcl
         * @param {object} acl The acl object.
         * @param {string} id The ID of the item.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Sets the Access Control List (ACL) of an item with a specified ID.
         * @memberOf Data.prototype
         * @method setAcl
         * @name setAcl
         * @param {object} acl The acl object.
         * @param {string} id The ID of the item.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        setAcl: function (acl, filter, success, error) {
            var self = this;

            return buildPromise(function (success, error) {
                var dataQuery = new DataQuery({
                    operation: DataQuery.operations.SetAcl,
                    collectionName: self.collectionName,
                    parse: Request.parsers.single,
                    filter: filter,
                    additionalOptions: {
                        acl: acl
                    },
                    onSuccess: success,
                    onError: error
                });

                return self.processDataQuery(dataQuery);
            }, success, error);
        },

        /**
         * Sets the owner of the specified data item.
         * @memberOf Data.prototype
         * @method setOwner
         * @name setOwner
         * @param {string} acl The new owner ID.
         * @param {object} item The item whose owner will be updated. Note: the ID property of the item will be used to determine which item will be updated.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Sets the owner of the specified data item.
         * @memberOf Data.prototype
         * @method setOwner
         * @name setOwner
         * @param {string} acl The new owner ID.
         * @param {object} item The item whose owner will be updated. Note: the ID property of the item will be used to determine which item will be updated.
         * @param {object} operationParameters An object that accepts operation parameters.
         * @param {Function} [operationParameters.success] A success callback.
         * @param {Function} [operationParameters.error] An error callback.
         * @param {Boolean} [operationParameters.useOffline] Whether to invoke the operation on the offline storage. Default is based on the current mode of the Everlive instance.
         * @param {Boolean} [operationParameters.applyOffline=true] If working online, whether to also apply the operation on the local storage.
         */
        /**
         * Sets the owner of the specified data item.
         * @memberOf Data.prototype
         * @method setOwner
         * @name setOwner
         * @param {string} ownerId The new owner ID.
         * @param {string} id The ID of the item.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Sets the owner of the specified data item.
         * @memberOf Data.prototype
         * @method setOwner
         * @name setOwner
         * @param {string} ownerId The new owner ID.
         * @param {string} id The ID of the item.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        setOwner: function (ownerId, filter, success, error) {
            var self = this;

            return buildPromise(function (success, error) {
                var dataQuery = new DataQuery({
                    operation: DataQuery.operations.SetOwner,
                    collectionName: self.collectionName,
                    filter: filter,
                    data: {
                        Owner: ownerId
                    },
                    onSuccess: success,
                    onError: error
                });
                return self.processDataQuery(dataQuery);
            }, success, error);
        },
        /**
         * Saves the provided data item. This operation will create or update the item depending on whether it is new or existing.
         * @memberOf Data.prototype
         * @method save
         * @name save
         * @param {object} item An object containing the item that is being saved.
         * @returns {Promise} The promise for the request.
         */
        /**
         * Saves the provided data item. This operation will create or update the item depending on whether it is new or existing.
         * @memberOf Data.prototype
         * @method save
         * @name save
         * @param {object} model An object containing the item that is being saved.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        save: function (model, success, error) {
            var self = this;
            var isNew = this.isNew(model);

            return buildPromise(function (success, error) {
                function saveSuccess(res) {
                    res.type = isNew ? 'create' : 'update';
                    success(res);
                }

                function saveError(err) {
                    err.type = isNew ? 'create' : 'update';
                    error(err);
                }

                if (isNew) {
                    return self.create(model, saveSuccess, saveError);
                } else {
                    return self.updateSingle(model, saveSuccess, saveError);
                }
            }, success, error);
        },
        /**
         * Checks if the specified data item is new or not.
         * @memberOf Data.prototype
         * @method isNew
         * @param model Item to check.
         * @returns {boolean}
         */
        isNew: function (model) {
            return typeof model[idField] === 'undefined';
        }
    };

    return Data;
}());

},{"../Everlive":46,"../EverliveError":47,"../Request":52,"../common":58,"../constants":59,"../everlive.platform":61,"../query/DataQuery":85,"../query/EventQuery":86,"../query/RequestOptionsBuilder":89,"../utils":100}],98:[function(require,module,exports){
/**
 * @class Files
 * @protected
 * @extends Data
 */

var buildPromise = require('../utils').buildPromise;
var DataQuery = require('../query/DataQuery');
var Request = require('../Request');
var utils = require('../utils');

module.exports.addFilesFunctions = function addFilesFunctions(ns) {
    /**
     * Get a URL that can be used as an endpoint for uploading a file. It is specific to each {{site.TelerikBackendServices}} app.
     * @memberof Files.prototype
     * @method getUploadUrl
     * @returns {string}
     */
    ns.getUploadUrl = function () {
        return utils.buildUrl(this.setup) + this.collectionName;
    };

    /**
     * Get the download URL for a file.
     * @memberof Files.prototype
     * @method getDownloadUrl
     * @deprecated
     * @see {@link Files.getDownloadUrlById}
     * @param {string} fileId The ID of the file.
     * @returns {string} url The download URL.
     */
    ns.getDownloadUrl = function (fileId) {
        return utils.buildUrl(this.setup) + this.collectionName + '/' + fileId + '/Download';
    };

    ns._getUpdateUrl = function (fileId) {
        return this.collectionName + '/' + fileId + '/Content';
    };

    /**
     * Get a URL that can be used as an endpoint for updating a file. It is specific to each {{site.TelerikBackendServices}} app.
     * @memberof Files.prototype
     * @method getUpdateUrl
     * @param {string} fileId The ID of the file.
     * @returns {string} url The update URL.
     */
    ns.getUpdateUrl = function (fileId) {
        return utils.buildUrl(this.setup) + this._getUpdateUrl(fileId);
    };

    /**
     * Updates a file's content
     * @memberof Files.prototype
     * @method updateContent
     * @param {string} fileId File ID.
     * @param {Object} file The file metadata and the base64 encoded file content.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     * @returns {Promise} The promise for the request
     */
    ns.updateContent = function (fileId, file, success, error) {
        var self = this;

        return buildPromise(function (success, error) {
            var dataQuery = new DataQuery({
                operation: DataQuery.operations.FilesUpdateContent,
                // the passed file content is base64 encoded
                data: file,
                collectionName: self.collectionName,
                additionalOptions: {
                    id: fileId
                },
                onSuccess: success,
                onError: error
            });


            return self.processDataQuery(dataQuery);
        }, success, error);
    };

    /**
     * Gets the download URL for a file by ID.
     * @memberof Files.prototype
     * @method getDownloadUrlById
     * @param {string} fileId File ID.
     * @returns {Promise} The promise for the request
     */
    /**
     * Gets the download URL for a file by ID.
     * @memberof Files.prototype
     * @method getDownloadUrlById
     * @param {string} fileId File ID.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.getDownloadUrlById = function (fileId, success, error) {
        var self = this;

        return buildPromise(function (success, error) {
            var dataQuery = new DataQuery({
                operation: DataQuery.operations.FilesGetDownloadUrlById,
                collectionName: self.collectionName,
                additionalOptions: {
                    id: fileId
                },
                parse: Request.parsers.single,
                onSuccess: function (data) {
                    success(data.result.Uri);
                },
                onError: error
            });


            return self.processDataQuery(dataQuery);
        }, success, error);
    };

    /**
     * Downloads a file to the device's file system. Wraps the Apache Cordova "download()" [FileTransfer](http://cordova.apache.org/docs/en/2.7.0/cordova_file_file.md.html#FileTransfer) method. Note that the signatures of these methods differ.
     * @memberof Files.prototype
     * @method download
     * @param {string} fileToDownload A Backend Services File ID.
     * @param {string} pathOnDevice An Apache Cordova FileSystem URL representing the local path on the device where the downloaded file will be saved. Maps to the "target" FileTransfer plugin parameter.
     * @param {object} [options] Additional request options. Maps to the "options" FileTransfer plugin parameter.
     * @param {object} [options.headers] A JSON object containing headers to send along with the request.
     * @param {boolean} [trustAllHosts=false] Whether to accept all security certificates including self-signed certificates. Maps to the "trustAllHosts" FileTransfer plugin parameter.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Downloads a file to the device's file system. Wraps the Apache Cordova "download()" [FileTransfer](http://cordova.apache.org/docs/en/2.7.0/cordova_file_file.md.html#FileTransfer) method. Note that the signatures of these methods differ.
     * @memberof Files.prototype
     * @method download
     * @param {string} fileToDownload A Backend Services File ID.
     * @param {string} pathOnDevice An Apache Cordova FileSystem URL representing the local path on the device where the downloaded file will be saved. Maps to the "target" FileTransfer plugin parameter.
     * @param {object} [options] Additional request options. Maps to the "options" FileTransfer plugin parameter.
     * @param {object} [options.headers] A JSON object containing headers to send along with the request.
     * @param {boolean} [trustAllHosts=false] Whether to accept all security certificates including self-signed certificates. Maps to the "trustAllHosts" FileTransfer plugin parameter.
     * @param {Function} [success] A success callback that is passed an Apache Cordova [FileEntry](https://cordova.apache.org/docs/en/3.3.0/cordova_file_file.md.html#FileEntry) object. Maps to the "successCallback" FileTransfer plugin parameter.
     * @param {Function} [error] An error callback that is passed an Apache Cordova [FileTransferError](https://github.com/apache/cordova-plugin-file-transfer#filetransfererror) object. Maps to the "errorCallback" FileTransfer plugin parameter.
     */
    ns.download = function (url, localPath, options, trustAllHosts, success, error) {
        var self = this;

        return buildPromise(function (success, error) {
            if (!trustAllHosts) {
                trustAllHosts = false;
            }

            var headers = options && options.headers ? options.headers : {};

            var fileTransfer = new FileTransfer();
            self.withHeaders(headers)
                .getById(url)
                .then(function (res) {
                    var file = res.result;
                    url = file.Uri;
                    fileTransfer.download(url, localPath, success, error, trustAllHosts, options);
                }, error);
        }, success, error);
    };

    /**
     * Uploads a file from the device's file system to Backend Services. Wraps the Apache Cordova "upload()" [FileTransfer](http://cordova.apache.org/docs/en/2.7.0/cordova_file_file.md.html#FileTransfer) method. Note that the signatures of these methods differ.
     * @memberof Files.prototype
     * @method upload
     * @param {string} fileToUpload An Apache Cordova FileSystem URL representing the full path to the file on the device.
     * @param {object} [options] Additional request options. Maps to the "options" FileTransfer plugin parameter.
     * @param {string} [options.fileKey] The name of the form element. Defaults to 'file' in the FileTransfer plugin parameter.
     * @param {string} [options.fileName] The file name to use when uploading the file. Defaults to 'image.jpg' in the FileTransfer plugin.
     * @param {string} [options.httpMethod] The HTTP method to use, either POST or PUT. Defaults to 'POST' in the FileTransfer plugin parameter.
     * @param {string} [options.mimeType] The mime type of the uploaded data. Defaults to 'image/jpeg' in the FileTransfer plugin parameter.
     * @param {object} [options.params] A set of optional key/value pairs to pass in the HTTP request.
     * @param {boolean} [options.chunkedMode] Whether to upload the data in chunked streaming mode. Defaults to 'true' in the FileTransfer plugin parameter.
     * @param {object} [options.headers] A JSON object for the headers to send along with the request.
     * @param {boolean} [trustAllHosts=false] Whether to accept all security certificates including self-signed certificates. Maps to the "trustAllHosts" FileTransfer plugin parameter.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Uploads a file from the device's file system to Backend Services. Wraps the Apache Cordova "upload()" [FileTransfer](http://cordova.apache.org/docs/en/2.7.0/cordova_file_file.md.html#FileTransfer) method. Note that the signatures of these methods differ.
     * @memberof Files.prototype
     * @method upload
     * @param {string} fileToUpload An Apache Cordova FileSystem URL representing the full path to the file on the device.
     * @param {object} [options] Additional request options. Maps to the "options" FileTransfer plugin parameter.
     * @param {string} [options.fileKey] The name of the form element. Defaults to 'file' in the FileTransfer plugin parameter.
     * @param {string} [options.fileName] The file name to use when uploading the file. Defaults to 'image.jpg' in the FileTransfer plugin parameter.
     * @param {string} [options.httpMethod] The HTTP method to use, either POST or PUT. Defaults to 'POST' in the FileTransfer plugin parameter.
     * @param {string} [options.mimeType] The mime type of the uploaded data. Defaults to 'image/jpeg' in the FileTransfer plugin parameter.
     * @param {object} [options.params] A set of optional key/value pairs to pass in the HTTP request.
     * @param {boolean} [options.chunkedMode] Whether to upload the data in chunked streaming mode. Defaults to 'true' in the FileTransfer plugin parameter.
     * @param {object} [options.headers] A JSON object for the headers to send along with the request.
     * @param {boolean} [trustAllHosts=false] Whether to accept all security certificates including self-signed certificates. Maps to the "trustAllHosts" FileTransfer plugin parameter.
     * @param {Function} [success] A success callback that is passed an Apache Cordova [FileUploadResult](https://github.com/apache/cordova-plugin-file-transfer#fileuploadresult) object. Maps to the "successCallback" FileTransfer plugin parameter.
     * @param {Function} [error] An error callback that is passed an Apache Cordova [FileTransferError](https://github.com/apache/cordova-plugin-file-transfer#filetransfererror) object. Maps to the "errorCallback" FileTransfer plugin parameter.
     */
    ns.upload = function (localPath, options, trustAllHosts, success, error) {
        var url = this.getUploadUrl();
        return buildPromise(function (success, error) {
            if (!trustAllHosts) {
                trustAllHosts = false;
            }
            var fileTransfer = new FileTransfer();
            var uri = encodeURI(url);
            fileTransfer.upload(localPath, uri, success, error, options, trustAllHosts);
        }, success, error);
    }
};
},{"../Request":52,"../query/DataQuery":85,"../utils":100}],99:[function(require,module,exports){
/**
 * @class Users
 * @extends Data
 * @protected
 */

var utils = require('../utils');
var buildPromise = utils.buildPromise;
var guardUnset = utils.guardUnset;
var DataQuery = require('../query/DataQuery');
var Request = require('../Request');
var _ = require('../common')._;
var EverliveError = require('../EverliveError').EverliveError;
var EverliveErrors = require('../EverliveError').EverliveErrors;

module.exports.addUsersFunctions = function addUsersFunctions(ns, everlive) {

    /**
     * Registers a new user with username and password.
     * @memberOf Users.prototype
     * @method register
     * @name register
     * @param {string} username The new user's username.
     * @param {string} password The new user's password.
     * @param {object} userInfo Additional information for the user (ex. DisplayName, Email, etc.)
     * @returns {Promise} The promise for the request.
     */
    /**
     * Registers a new user using a username and a password.
     * @memberOf Users.prototype
     * @method register
     * @name register
     * @param {string} username The new user's username.
     * @param {string} password The new user's password.
     * @param attrs
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.register = function (username, password, attrs, success, error) {
        guardUnset(username, 'username');
        guardUnset(password, 'password');
        var user = {
            Username: username,
            Password: password
        };
        _.extend(user, attrs);
        return this.create(user, success, error);
    };

    /**
     * Gets information about the user that is currently authenticated to the {{site.bs}} JavaScript SDK. The success function is called with {@link Users.ResultTypes.currentUserResult}.
     * @memberOf Users.prototype
     * @method currentUser
     * @name currentUser
     * @returns {Promise} The promise for the request.
     */
    /**
     * Gets information about the user that is currently authenticated to the {{site.bs}} JavaScript SDK. The success function is called with {@link Users.ResultTypes.currentUserResult}.
     * @memberOf Users.prototype
     * @method currentUser
     * @name currentUser
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.currentUser = function (success, error) {
        var self = this;
        var id = self.everlive._isOfflineStorageEnabled() && self.everlive.isOffline() ? self.everlive.setup.principalId : 'me';
        return buildPromise(function (success, error) {
            if (id === 'me' && !self.everlive.setup.token && !self.everlive.setup.masterKey || !id) {
                return success({result: null});
            }

            self.getById(id).then(function (res) {
                    if (typeof res.result !== 'undefined') {
                        success({result: res.result});
                    } else {
                        success({result: null});
                    }
                },
                function (err) {
                    if (self.everlive.authentication && self.everlive.authentication.isAuthenticationInProgress()) {
                        success({result: null});
                    } else if (err.code === 601) { // invalid request, i.e. the access token is missing
                        success({result: null});
                    } else if (err.code === 801) {
                        error(new EverliveError(EverliveErrors.invalidToken));
                    } else {
                        error(err);
                    }
                }
            );
        }, success, error);
    };

    /**
     * Changes the password of a user.
     * @memberOf Users.prototype
     * @method changePassword
     * @name changePassword
     * @param {string} username The user's username.
     * @param {string} password The user's password.
     * @param {string} newPassword The user's new password.
     * @param {boolean} keepTokens If set to true, the user tokens will be preserved even after the password change.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Changes the password of a user.
     * @memberOf Users.prototype
     * @method changePassword
     * @name changePassword
     * @param {string} username The user's username.
     * @param {string} password The user's password.
     * @param {string} newPassword The user's new password.
     * @param {boolean} keepTokens If set to true, the user tokens will be preserved even after the password change.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.changePassword = function (username, password, newPassword, keepTokens, success, error) {
        var self = this;
        return buildPromise(function (success, error) {
            success = _.wrap(success, function (success, data) {
                if (data && data.result) {
                    if (!keepTokens) {
                        ns.clearAuthorization();
                    }
                }
                return success(data);
            });

            var dataQuery = new DataQuery({
                operation: DataQuery.operations.UserChangePassword,
                collectionName: self.collectionName,
                data: {
                    Username: username,
                    Password: password,
                    NewPassword: newPassword
                },
                additionalOptions: {
                    keepTokens: keepTokens
                },
                skipAuth: true,
                onSuccess: success,
                onError: error
            });

            return self.processDataQuery(dataQuery)
        }, success, error)
    };

    /**
     *
     * Logs in a user using a username and a password to the current {{site.bs}} JavaScript SDK instance. All requests initiated by the current {{site.bs}} JavaScript SDK instance will be authenticated with that user's credentials.
     * @memberOf Users.prototype
     * @method login
     * @name login
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.login}
     * @param {string} username The user's username.
     * @param {string} password The user's password.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Logs in a user using a username and a password to the current {{site.bs}} JavaScript SDK instance. All requests initiated by the current {{site.bs}} JavaScript SDK instance will be authenticated with that user's credentials.
     * @memberOf Users.prototype
     * @method login
     * @name login
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.login}
     * @param {string} username The user's username.
     * @param {string} password The user's password.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.login = function (username, password, success, error) {
        return everlive.authentication.login(username, password, success, error);

    };

    /**
     * Log out the user who is currently logged in.
     * @memberOf Users.prototype
     * @method logout
     * @name logout
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.logout}
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log out the user who is currently logged in.
     * @memberOf Users.prototype
     * @method logout
     * @name logout
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.logout}
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.logout = function (success, error) {
        return everlive.authentication.logout(success, error);

    };

    /**
     * Log in a user using an Facebook access token.
     * @memberOf Users.prototype
     * @method loginWithFacebook
     * @name loginWithFacebook
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.loginWithFacebook}
     * @param {string} accessToken Facebook access token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user using an Facebook access token.
     * @memberOf Users.prototype
     * @method loginWithFacebook
     * @name loginWithFacebook
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.loginWithFacebook}
     * @param {string} accessToken Facebook access token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.loginWithFacebook = function (accessToken, success, error) {
        return everlive.authentication.loginWithFacebook(accessToken, success, error);
    };

    /**
     * Links a {{site.TelerikBackendServices}} user account to a Facebook access token.
     * @memberOf Users.prototype
     * @method linkWithFacebook
     * @name linkWithFacebook
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} accessToken The Facebook access token that will be linked to the {{site.bs}} user account.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Links a Backend Services user with a Facebook access token.
     * @memberOf Users.prototype
     * @method linkWithFacebook
     * @name linkWithFacebook
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} accessToken The Facebook access token that will be linked to the {{site.bs}} user account.         * @param {Function} [success] a success callback.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.linkWithFacebook = function (userId, accessToken, success, error) {
        var identity = {
            Provider: 'Facebook',
            Token: accessToken
        };
        return ns._linkWithProvider(identity, userId, success, error);
    };

    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the Facebook token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromFacebook
     * @name unlinkFromFacebook
     * @param {string} userId The user's ID in {{site.bs}}.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the Facebook token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromFacebook
     * @name unlinkFromFacebook
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.unlinkFromFacebook = function (userId, success, error) {
        return ns._unlinkFromProvider('Facebook', userId, success, error);
    };

    /**
     * Log in a user using an ADFS access token.
     * @memberOf Users.prototype
     * @method loginWithADFS
     * @name loginWithADFS
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.loginWithADFS}
     * @param {string} accessToken ADFS access token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user using an ADFS access token.
     * @memberOf Users.prototype
     * @method loginWithADFS
     * @name loginWithADFS
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.loginWithADFS}
     * @param {string} accessToken ADFS access token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.loginWithADFS = function (accessToken, success, error) {
        return everlive.authentication.loginWithADFS(accessToken, success, error);
    };

    /**
     * Links a {{site.TelerikBackendServices}} user account to an ADFS access token.
     * @memberOf Users.prototype
     * @method linkWithADFS
     * @name linkWithADFS
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} accessToken The ADFS access token that will be linked to the {{site.bs}} user account.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Links a {{site.TelerikBackendServices}} user account to an ADFS access token.
     * @memberOf Users.prototype
     * @method linkWithADFS
     * @name linkWithADFS
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} accessToken The ADFS access token that will be linked to the {{site.bs}} user account.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.linkWithADFS = function (userId, accessToken, success, error) {
        var identity = {
            Provider: 'ADFS',
            Token: accessToken
        };
        return ns._linkWithProvider(identity, userId, success, error);
    };

    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the ADFS token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromADFS
     * @name unlinkFromADFS
     * @param {string} userId The user's ID in {{site.bs}}.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the ADFS token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromADFS
     * @name unlinkFromADFS
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.unlinkFromADFS = function (userId, success, error) {
        return ns._unlinkFromProvider('ADFS', userId, success, error);
    };

    /**
     * Log in a user using a Microsoft Account access token.
     * @memberOf Users.prototype
     * @method loginWithLiveID
     * @name loginWithLiveID
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.loginWithLiveID}
     * @param {string} accessToken Microsoft Account access token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user using a Microsoft Account access token.
     * @memberOf Users.prototype
     * @method loginWithLiveID
     * @name loginWithLiveID
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.loginWithLiveID}
     * @param {string} accessToken Microsoft Account access token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.loginWithLiveID = function (accessToken, success, error) {
        return everlive.authentication.loginWithLiveID(accessToken, success, error);
    };

    /**
     * Links a {{site.TelerikBackendServices}} user account to a Microsoft Account access token.
     * @memberOf Users.prototype
     * @method linkWithLiveID
     * @name linkWithLiveID
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} accessToken The Microsoft Account access token that will be linked to the {{site.bs}} user account.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Links a {{site.TelerikBackendServices}} user account to a Microsoft Account access token.
     * @memberOf Users.prototype
     * @method linkWithLiveID
     * @name linkWithLiveID
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} accessToken The Microsoft Account access token that will be linked to the {{site.bs}} user account.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.linkWithLiveID = function (userId, accessToken, success, error) {
        var identity = {
            Provider: 'LiveID',
            Token: accessToken
        };
        return ns._linkWithProvider(identity, userId, success, error);
    };

    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the Microsoft Account access token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromLiveID
     * @name unlinkFromLiveID
     * @param {string} userId The user's ID in {{site.bs}}.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the Microsoft Account access token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromLiveID
     * @name unlinkFromLiveID
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.unlinkFromLiveID = function (userId, success, error) {
        return ns._unlinkFromProvider('LiveID', userId, success, error);
    };

    /**
     * Log in a user using a Google access token.
     * @memberOf Users.prototype
     * @method loginWithGoogle
     * @name loginWithGoogle
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.loginWithGoogle}
     * @param {string} accessToken Google access token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user using a Google access token.
     * @memberOf Users.prototype
     * @method loginWithGoogle
     * @name loginWithGoogle
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.loginWithGoogle}
     * @param {string} accessToken Google access token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.loginWithGoogle = function (accessToken, success, error) {
        return everlive.authentication.loginWithGoogle(accessToken, success, error);
    };

    /**
     * Links a {{site.TelerikBackendServices}} user account to a Google access token.
     * @memberOf Users.prototype
     * @method linkWithGoogle
     * @name linkWithGoogle
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} accessToken The Google access token that will be linked to the {{site.bs}} user account.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Links a {{site.TelerikBackendServices}} user account to a Google access token.
     * @memberOf Users.prototype
     * @method linkWithGoogle
     * @name linkWithGoogle
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} accessToken The Google access token that will be linked to the {{site.bs}} user account.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.linkWithGoogle = function (userId, accessToken, success, error) {
        var identity = {
            Provider: 'Google',
            Token: accessToken
        };

        return ns._linkWithProvider(identity, userId, success, error);
    };

    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the Google access token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromGoogle
     * @name unlinkFromGoogle
     * @param {string} userId The user's ID in {{site.bs}}.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the Google access token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromGoogle
     * @name unlinkFromGoogle
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.unlinkFromGoogle = function (userId, success, error) {
        return ns._unlinkFromProvider('Google', userId, success, error);
    };

    /**
     * Log in a user with a Twitter token. A secret token needs to be provided.
     * @memberOf Users.prototype
     * @method loginWithTwitter
     * @name loginWithTwitter
     * @param {string} token Twitter token.
     * @param {string} tokenSecret Twitter secret token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Log in a user with a Twitter token. A secret token needs to be provided.
     * @memberOf Users.prototype
     * @method loginWithTwitter
     * @name loginWithTwitter
     * @param {string} token Twitter token.
     * @param {string} tokenSecret Twitter secret token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.loginWithTwitter = function (token, tokenSecret, success, error) {
        return everlive.authentication.loginWithTwitter(token, tokenSecret, success, error);
    };

    /**
     * Links a {{site.TelerikBackendServices}} user to a Twitter token. A secret token needs to be provided.
     * @memberOf Users.prototype
     * @method linkWithTwitter
     * @name linkWithTwitter
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} token The Twitter access token that will be linked to the {{site.bs}} user account.
     * @param {string} tokenSecret The Twitter secret token.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Links a {{site.TelerikBackendServices}} user to a Twitter token. A secret token needs to be provided.         * Links a Backend Services user with a Twitter token. A secret token needs to be provided.
     * @memberOf Users.prototype
     * @method linkWithTwitter
     * @name linkWithTwitter
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {string} token The Twitter access token that will be linked to the {{site.bs}} user account.
     * @param {string} tokenSecret The Twitter secret token.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.linkWithTwitter = function (userId, token, tokenSecret, success, error) {
        var identity = {
            Provider: 'Twitter',
            Token: token,
            TokenSecret: tokenSecret
        };

        return ns._linkWithProvider(identity, userId, success, error);
    };

    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the Twitter access token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromTwitter
     * @name unlinkFromTwitter
     * @param {string} userId The user's ID in {{site.bs}}.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Unlinks a {{site.TelerikBackendServices}} user account from the Twitter access token that it is linked to.
     * @memberOf Users.prototype
     * @method unlinkFromTwitter
     * @name unlinkFromTwitter
     * @param {string} userId The user's ID in {{site.bs}}.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.unlinkFromTwitter = function (userId, success, error) {
        return ns._unlinkFromProvider('Twitter', userId, success, error);
    };

    /**
     * Sets the token and token type that the {{site.TelerikBackendServices}} JavaScript SDK will use for authorization.
     * @memberOf Users.prototype
     * @method setAuthorization
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.setAuthorization}
     * @param {string} token Token that will be used for authorization.
     * @param {Everlive.TokenType} tokenType Token type. Currently only 'bearer' token is supported.
     * @param {string} principalId The id of the user that is logged in.
     */
    ns.setAuthorization = function setAuthorization(token, tokenType, principalId) {
        everlive.authentication.setAuthorization(token, tokenType, principalId)
    };

    /**
     * Clears the authentication token that the {{site.bs}} JavaScript SDK currently uses. Note that this is different than logging out, because the current authorization token is not invalidated.
     * @method clearAuthorization
     * @deprecated
     * @see [authentication.login]{@link ../Authentication/authentication.clearAuthorization}
     * @memberOf Users.prototype
     */
    ns.clearAuthorization = function clearAuthorization() {
        everlive.authentication.setAuthorization(null, null, null);
    };

    /**
     * Sends a password reset email to a specified user.
     * @memberOf Users.prototype
     * @method resetPassword
     * @name resetPassword
     * @param {Object} user The user object, which must container either username or email address.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Sends a password reset email to a specified user.
     * @memberOf Users.prototype
     * @method resetPassword
     * @name resetPassword
     * @param {Object} user The user object, which must container either username or email address.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.resetPassword = function (user, success, error) {
        var self = this;

        return buildPromise(function (successCb, errorCb) {
            var dataQuery = new DataQuery({
                operation: DataQuery.operations.UserResetPassword,
                collectionName: self.collectionName,
                data: user,
                onSuccess: successCb,
                onError: errorCb
            });

            return self.processDataQuery(dataQuery);
        }, success, error);
    };

    /**
     * Set a new password for a user using a password reset code.
     * @memberOf Users.prototype
     * @method setPassword
     * @name setPassword
     * @param {object} setPasswordObject The object, which contains information necessary for changing the user password.
     * @param {string} setPasswordObject.ResetCode The reset code obtained using a password reset email.
     * @param {string} setPasswordObject.NewPassword The new password for the user.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Set a new password for a user using a password reset code.
     * @memberOf Users.prototype
     * @method setPassword
     * @name setPassword
     * @param {object} setPasswordObject The object, which contains information necessary for changing the user password.
     * @param {string} setPasswordObject.ResetCode The reset code obtained using a password reset email.
     * @param {string} setPasswordObject.NewPassword The new password for the user.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    /**
     * Set a new password for a user using a password reset code.
     * @memberOf Users.prototype
     * @method setPassword
     * @name setPassword
     * @param {object} setPasswordObject The object, which contains information necessary for changing the user password.
     * @param {number} setPasswordObject.Username The username that the password will be changed.
     * @param {number} setPasswordObject.SecretQuestionId The id of the secret question.
     * @param {string} setPasswordObject.SecretAnswer The answer to the secret question.
     * @param {string} setPasswordObject.NewPassword The new password for the user.
     * @returns {Promise} The promise for the request.
     */
    /**
     * Set a new password for a user using a password reset code.
     * @memberOf Users.prototype
     * @method setPassword
     * @name setPassword
     * @param {object} setPasswordObject The object, which contains information necessary for changing the user password.
     * @param {number} setPasswordObject.Username The username that the password will be changed.
     * @param {number} setPasswordObject.SecretQuestionId The id of the secret question.
     * @param {string} setPasswordObject.SecretAnswer The answer to the secret question.
     * @param {string} setPasswordObject.NewPassword The new password for the user.
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    ns.setPassword = function (setPasswordObject, success, error) {
        var self = this;

        return buildPromise(function (successCb, errorCb) {
            var dataQuery = new DataQuery({
                operation: DataQuery.operations.UserSetPassword,
                collectionName: self.collectionName,
                data: setPasswordObject,
                onSuccess: successCb,
                onError: errorCb
            });

            return self.processDataQuery(dataQuery);
        }, success, error);
    };

    ns._linkWithProvider = function (identity, userId, success, error) {
        var self = this;
        return buildPromise(function (success, error) {
            var query = new DataQuery({
                additionalOptions: {
                    id: userId
                },
                operation: DataQuery.operations.UserLinkWithProvider,
                collectionName: self.collectionName,
                data: identity,
                parse: Request.parsers.single,
                skipAuth: true,
                onSuccess: success,
                onError: error
            });

            return self.processDataQuery(query);
        }, success, error);
    };

    ns._unlinkFromProvider = function (providerName, userId, success, error) {
        var identity = {
            Provider: providerName
        };
        var self = this;
        return buildPromise(function (success, error) {
            var query = new DataQuery({
                additionalOptions: {
                    userId: userId
                },
                operation: DataQuery.operations.UserUnlinkFromProvider,
                collectionName: self.collectionName,
                data: identity,
                parse: Request.parsers.single,
                skipAuth: true,
                onSuccess: success,
                onError: error
            });

            return self.processDataQuery(query);
        }, success, error);
    };
};
},{"../EverliveError":47,"../Request":52,"../common":58,"../query/DataQuery":85,"../utils":100}],100:[function(require,module,exports){
var EverliveError = require('./EverliveError').EverliveError;
var common = require('./common');
var _ = common._;
var rsvp = common.rsvp;
var Everlive = require('./Everlive');
var platform = require('./everlive.platform');
var path = require('path');

var utils = {};

utils.guardUnset = function guardUnset(value, name, message) {
    if (!message) {
        message = 'The ' + name + ' is required';
    }
    if (typeof value === 'undefined' || value === null) {
        throw new EverliveError(message);
    }
};

//brings down all keys to the same level (lowerCase)
utils.normalizeKeys = function normalizeKeys(obj) {
    var normalizedKeys = {};

    _.each(obj, function (val, key) {
        var lowerKey = key.toLowerCase();

        if (!normalizedKeys.hasOwnProperty(lowerKey)) {
            normalizedKeys[lowerKey] = val;
        }
    });

    return normalizedKeys;
};

utils.parseUtilities = {
    getReviver: function (parseOnlyCompleteDateTimeString) {
        var dateParser;
        if (parseOnlyCompleteDateTimeString) {
            dateParser = utils.parseUtilities.parseIsoDateString;
        } else {
            dateParser = utils.parseUtilities.parseOnlyCompleteDateTimeString;
        }

        return function (key, value) {
            if (typeof value === 'string') {
                var date = dateParser(value);
                if (date) {
                    value = date;
                }
            }

            return value;
        };
    },

    parseIsoDateString: function (string) {
        var match;
        if (match = string.match(/^(\d{4})(-(\d{2})(-(\d{2})(T(\d{2}):(\d{2})(:(\d{2})(\.(\d+))?)?(Z|((\+|-)(\d{2}):(\d{2}))))?))$/)) {
            // DateTime
            var secondParts = match[12];
            if (secondParts) {
                if (secondParts.length > 3) {
                    secondParts = Math.round(Number(secondParts.substr(0, 3) + '.' + secondParts.substr(3)));
                }
                else if (secondParts.length < 3) {
                    // if the secondParts are one or two characters then two or one zeros should be appended
                    // in order to have the correct number for milliseconds ('.67' means 670ms not 67ms)
                    secondParts += secondParts.length === 2 ? '0' : '00';
                }
            }
            var date = new Date(
                Date.UTC(
                    Number(match[1]), // year
                    (Number(match[3]) - 1) || 0, // month
                    Number(match[5]) || 0, // day
                    Number(match[7]) || 0, // hour
                    Number(match[8]) || 0, // minute
                    Number(match[10]) || 0, // second
                    Number(secondParts) || 0
                )
            );

            if (match[13] && match[13] !== "Z") {
                var h = Number(match[16]) || 0,
                    m = Number(match[17]) || 0;

                h *= 3600000;
                m *= 60000;

                var offset = h + m;
                if (match[15] === "+")
                    offset = -offset;

                date = new Date(date.valueOf() + offset);
            }

            return date;
        } else {
            return null;
        }
    },

    parseOnlyCompleteDateTimeString: function (string) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(string)) {
            // Date
            return null;
        }

        if (/^(\d{2}):(\d{2})(:(\d{2})(\.(\d+))?)?(Z|((\+|-)(\d{2}):(\d{2})))?$/.test(string)) {
            // Time
            return null;
        }

        return utils.parseUtilities.parseIsoDateString(string);
    },

    traverse: function (obj, func) {
        var key, value, newValue;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                value = obj[key];
                newValue = func(key, value);
                obj[key] = newValue;
                if (value === newValue && typeof value === 'object') {
                    utils.parseUtilities.traverse(value, func);
                }
            }
        }
        return obj;
    },

    traverseAndRevive: function (data, reviver) {
        if (!reviver) {
            reviver = utils.parseUtilities.getReviver();
        }

        return utils.parseUtilities.traverse(data, reviver);
    },

    parseError: function (reviver, error) {
        if (typeof error === 'string' && error.length > 0) {
            try {
                error = JSON.parse(error);
                return {message: error.message, code: error.errorCode};
            } catch (e) {
                return error;
            }
        } else {
            return error;
        }
    },

    _parseInternal: function (reviver, data) {
        if (typeof data === 'string' && data.length > 0) {
            data = JSON.parse(data, reviver);
        } else if (typeof data === 'object') {
            utils.parseUtilities.traverseAndRevive(data, reviver);
        }

        return data;
    },

    _transformResult: function (data, additionalProperties) {
        if (data) {
            var result = {result: data.Result};
            _.extend(result, additionalProperties);
            return result;
        } else {
            return data;
        }
    },

    parseResult: function (reviver, data) {
        data = utils.parseUtilities._parseInternal.apply(null, arguments);
        return utils.parseUtilities._transformResult(data, {count: data.Count});
    },

    parseSingleResult: function (reviver, data) {
        data = utils.parseUtilities._parseInternal.apply(null, arguments);
        return utils.parseUtilities._transformResult(data);
    },

    parseUpdateResult: function (reviver, data) {
        data = utils.parseUtilities._parseInternal.apply(null, arguments);
        return utils.parseUtilities._transformResult(data, {ModifiedAt: data.ModifiedAt});
    },

    parseJSON: function (json) {
        return JSON.parse(json, utils.parseUtilities.getReviver());
    }
};

utils.buildPromise = function buildPromise(operation, success, error) {
    var callbacks = utils.getCallbacks(success, error);
    operation(callbacks.success, callbacks.error);
    return callbacks.promise;
};

utils.getCallbacks = function (success, error) {
    var promise;
    var createPromise = function () {
        return new rsvp.Promise(function (resolve, reject) {
            success = function (data) {
                resolve(data);
            };
            error = function (error) {
                reject(error);
            };
        });
    };

    if (platform.isNodejs) {
        // node js style continuation
        if (typeof success === 'function' && typeof error !== 'function') {
            var callback = success;
            success = function (data, response) {
                callback(null, data, response);
            };
            error = function (error) {
                callback(error);
            };
        } else if (typeof success !== 'function' && typeof error !== 'function') {
            promise = createPromise();
        }
    } else {
        if (typeof success !== 'function' && typeof error !== 'function') {
            promise = createPromise();
        }
    }

    return {promise: promise, success: success, error: error};
};

utils.buildAuthHeader = function buildAuthHeader(setup, options) {
    var authHeaderValue = null;
    if (options && options.authHeaders === false) {
        return authHeaderValue;
    }
    if (setup.token) {
        authHeaderValue = (setup.tokenType || 'bearer') + ' ' + setup.token;
    }
    else if (setup.masterKey) {
        authHeaderValue = 'masterkey ' + setup.masterKey;
    }
    if (authHeaderValue) {
        return {authorization: authHeaderValue};
    } else {
        return null;
    }
};

utils.DeviceRegistrationResult = function DeviceRegistrationResult(token) {
    this.token = token;
};

utils.cloneDate = function (date) {
    return new Date(date);
};

utils.buildUrl = function (setup) {
    var url = '';
    if (typeof setup.scheme === 'string') {
        url += setup.scheme + ':';
    }
    url += setup.url;
    if (setup.appId) {
        url += setup.appId + '/';
    }
    return url;
};

utils.getDbOperators = function (expression, shallow) {
    var dbOperators = [];

    if (typeof expression === 'string' || typeof expression === 'number') {
        return dbOperators;
    }

    var modifierKeys = Object.keys(expression || {});
    _.each(modifierKeys, function (key) {
        if (key.indexOf('$') === 0) {
            dbOperators.push(key);
        } else if (typeof expression[key] === 'object' && !shallow) {
            dbOperators = dbOperators.concat(utils.getDbOperators(expression[key]));
        }
    });

    return dbOperators;
};

utils.disableRequestCache = function (url, method) {
    if (method === 'GET') {
        var timestamp = (new Date()).getTime();
        var separator = url.indexOf('?') > -1 ? '&' : '?';
        url += separator + '_el=' + timestamp;
    }

    return url;
};

var unsupportedDbOperators = [
    '$geoWithin',
    '$geoIntersects',
    '$near',
    '$within',
    '$nearSphere'
];

utils.getUnsupportedOperators = function (filter) {
    var dbOperators = utils.getDbOperators(filter);
    return _.intersection(dbOperators, unsupportedDbOperators);
};

// http://stackoverflow.com/questions/7905929/how-to-test-valid-uuid-guid
utils.isGuid = function (str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

utils.isQuerySupportedOffline = function (query) {
    var queryParams = query.getQueryParameters();
    var hasExpandExpression = !_.isEmptyObject(queryParams.expand);
    var unsupportedOperators = utils.getUnsupportedOperators(queryParams.filter);
    var hasUnsupportedOperators = unsupportedOperators.length !== 0;
    var isUnsupportedInOffline = hasExpandExpression || hasUnsupportedOperators;
    return !isUnsupportedInOffline;
};

// http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript/16245768#16245768
utils.b64toBlob = function (b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {type: contentType});
    return blob;
};

// http://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
utils.arrayBufferToBase64 = function (buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
};

utils.successfulPromise = function (data) {
    return new rsvp.Promise(function (resolve) {
        resolve(data);
    });
};

utils.rejectedPromise = function (err) {
    return new rsvp.Promise(function (resolve, reject) {
        reject(err);
    });
};

utils.transformPlatformPath = function transformPlatformPath(platformPath) {
    if (!platformPath) {
        return '';
    }

    if (platform.isWindowsPhone) {
        if (platformPath.charAt(0) === '/' && platformPath.charAt(1) !== '/') {
            platformPath = '/' + platformPath;
        }
    } else { //TODO: probably desktop too
        if (platformPath.indexOf('file:/') !== -1 && platformPath.indexOf('file:///') === -1) {
            platformPath = platformPath.replace('file:/', 'file:///');
        }
    }

    return platformPath;
};

utils._stringCompare = function (string, check) {
    return string.toLowerCase() === check;
};

utils.isContentType = {
    files: function (collectionName) {
        return utils._stringCompare(collectionName, 'files');
    },
    users: function (collectionName) {
        return utils._stringCompare(collectionName, 'users');
    }
};

utils.isElement = {
    _isElement: function (el, check) {
        var tag = el;

        if (typeof tag !== 'string') {
            if (el instanceof HTMLElement) {
                tag = el.tagName;
            }
        }

        return utils._stringCompare(tag, check);
    },
    image: function (el) {
        return utils.isElement._isElement(el, 'img');
    },
    anchor: function (el) {
        return utils.isElement._isElement(el, 'a');
    }
};

utils.joinPath = function joinPath() {
    var args = [].slice.apply(arguments).map(function (arg) {
        return arg || '';
    });

    var joinedPath = path.join.apply(path, args);
    return utils.transformPlatformPath(joinedPath);
};

utils.uuid = function () {
    //http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });

    return uuid;
};

utils.getId = function (obj) {
    return obj.Id || obj._id || obj.id;
};

utils.lazyRequire = function (moduleName, exportName) {
    exportName = exportName || moduleName;
    var obj = {};

    Object.defineProperty(obj, exportName, {
        get: function () {
            return require(moduleName);
        }
    });

    return obj;
};

utils._inAppBuilderSimulator = function () {
    return typeof window !== undefined && window.navigator && window.navigator.simulator;
};

module.exports = utils;

},{"./Everlive":46,"./EverliveError":47,"./common":58,"./everlive.platform":61,"path":3}]},{},[66])(66)
});
//# sourceMappingURL=everlive.map

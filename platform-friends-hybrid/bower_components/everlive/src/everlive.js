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
 Version 1.2.14
 */
/*global device, define, window, navigator*/
(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // with require.js
        define(['underscore', 'rsvp', 'reqwest', 'jstz'], function (_, rsvp, reqwest, jstz) {
            return (root.Everlive = factory(_, rsvp, reqwest, jstz));
        });
    } else if (typeof(isNativeScriptApplication) !== 'undefined' && isNativeScriptApplication) {
        // native script

        // wrap the native script Promise in a RSVP object
        var rsvp = {
            Promise: Promise
        };
        root.RSVP = rsvp;

        var http = require('http');
        var reqwest = function (options) {
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
            http.request(httpRequestOptions).then(
                function (response) {
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
                },
                function (err) {
                    // error: function(jqXHR, textStatus, errorThrown)
                    // when timeouting for example (i.e. no internet connectivity), we get an err with content { message: "timeout...", stack: null }
                    error({
                        responseText: err
                    });
                });
        };
        root.reqwest = reqwest;

        module.exports = factory(exports._, root.RSVP, root.reqwest, exports.jstz);
    } else if (typeof exports === 'object') {
        // node js
        module.exports = factory(require('underscore'), require('rsvp'));
    } else {
        // web browser
        root.Everlive = factory(root._, root.RSVP, root.reqwest, root.jstz);
    }
}(this, function (_, rsvp, reqwest, jstz) {
    'use strict';
    var slice = Array.prototype.slice;
    var everliveUrl = '//api.everlive.com/v1/';
    var idField = 'Id';

    function guardUnset(value, name, message) {
        if (!message) {
            message = 'The ' + name + ' is required';
        }
        if (typeof value === 'undefined' || value === null) {
            throw new EverliveError(message);
        }
    }

    // An object that keeps information about an Everlive connection
    function Setup(options) {
        this.url = everliveUrl;
        this.apiKey = null;
        this.masterKey = null;
        this.token = null;
        this.tokenType = null;
        this.scheme = 'http'; // http or https
        this.parseOnlyCompleteDateTimeObjects = false;
        if (typeof options === 'string') {
            this.apiKey = options;
        } else {
            this._emulatorMode = options.emulatorMode;
            _.extend(this, options);
        }
    }


    // The constructor of Everlive instances.
    // The entry point for the SDK.

    /**
     * @class Everlive
     * @classdesc The constructor of the {{site.bs}} (Everlive) JavaScript SDK. This is the entry point for the SDK.
     * @param {object|string} options - An object containing configuration options for the Setup object. Alternatively, you can pass a string representing your API key.
     * @param {string} options.apiKey - Your API key.
     * @param {string} [options.url=//api.everlive.com/v1/] - The {{site.TelerikBackendServices}} URL.
     * @param {string} [options.token] - An authentication token. The instance will be associated with the provided previously obtained token.
     * @param {string} [options.tokenType=bearer] - The type of the token that is used for authentication.
     * @param {string} [options.scheme=http] - The URI scheme used to make requests. Supported values: http, https
     * @param {boolean} [options.parseOnlyCompleteDateTimeObjects=false] - If set to true, the SDK will parse only complete date strings (according to the ISO 8601 standard).
     * @param {boolean} [options.emulatorMode=false] - Set this option to true to set the SDK in emulator mode.
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
    }

    /** Reference to the current {{site.TelerikBackendServices}} (Everlive) JavaScript SDK
     * @memberOf Everlive
     * @type {Everlive}
     * @static
     */
    Everlive.$ = null;
    Everlive.idField = idField;


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

    /** Creates a new {{site.TelerikBackendServices}} (Everlive) Java Script SDK instance.
     * @memberOf Everlive
     * @param {object} options - An object containing options used to initialize the {{site.bs}} JavaScript SDK instance.
     * @returns {Everlive} The instance of the {{site.bs}} (Everlive) JavaScript SDK that was created using the provided options.
     * @static
     * @method
     */
    Everlive.init = function (options) {
        Everlive.$ = null;
        return new Everlive(options);
    };

    Everlive.buildUrl = function (setup) {
        var url = '';
        if (typeof setup.scheme === 'string') {
            url += setup.scheme + ':';
        }
        url += setup.url;
        if (setup.apiKey) {
            url += setup.apiKey + '/';
        }
        return url;
    };

    Everlive.prototype.data = function (collectionName) {
        return new Data(this.setup, collectionName);
    };

    /**
     * Returns the URL to the {{site.bs}} application endpoint that the SDK uses.
     * @memberOf Everlive.prototype
     * @method buildUrl
     * @returns {string} The generated URL.
     */
    Everlive.prototype.buildUrl = function () {
        return Everlive.buildUrl(this.setup);
    };

    var buildAuthHeader = function (setup, options) {
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
            return {Authorization: authHeaderValue};
        } else {
            return null;
        }
    };

    /**
     * Generates the Authorization headers that are used by the {{site.TelerikBackendServices}} (Everlive) JavaScript SDK to make requests to the {{site.bs}} servers.
     * @memberOf Everlive
     * @returns {Object} AuthorizationHeaders The generated Authorization headers object.
     */
    Everlive.prototype.buildAuthHeader = function () {
        return buildAuthHeader(this.setup);
    };

    // Everlive queries
    (function () {
        var OperatorType = {
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
        };

        function Expression(operator, operands) {
            this.operator = operator;
            this.operands = operands || [];
        }

        Expression.prototype = {
            addOperand: function (operand) {
                this.operands.push(operand);
            }
        };

        /**
         * @class Query
         * @classdesc A query class used to describe a request that will be made to the {{site.TelerikBackendServices}} JavaScript API.
         * @param {object} filter A [filter expression]({% slug rest-api-querying-filtering %}) definition.
         * @param {object} fields A [fields expression]({% slug rest-api-querying-Subset-of-fields %}) definition.
         * @param {object} sort A [sort expression]({% slug rest-api-querying-sorting %}) definition.
         * @param {number} skip Number of items to skip. Used for paging.
         * @param {number} take Number of items to take. Used for paging.
         * @param {object} expand An [expand expression]({% slug features-data-relations-defining-expand %}) definition.
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
             * @param {object} filter A [filter expression]({% slug rest-api-querying-filtering %}) definition.
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
             * @param {object} fieldsExpression A [fields expression]({% slug rest-api-querying-Subset-of-fields %}) definition.
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
             * @param {object} expandExpression An [expand expression]({% slug features-data-relations-defining-expand %}) definition.
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
                var args = slice.call(oprs);
                this.expr.addOperand(new Expression(op, args));
                return this;
            }
        };

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
                var args = slice.call(arguments, 1);
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
             * @param {string} [options] A string of regex options to use. See [specs]({http://docs.mongodb.org/manual/reference/operator/query/regex/#op._S_options}) for a description of available options.
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
             * @param {string} [options] A string of regex options to use. See [specs]({http://docs.mongodb.org/manual/reference/operator/query/regex/#op._S_options}) for a description of available options.
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
             * @param {string} [options] A string of  regex options to use. See [specs]({http://docs.mongodb.org/manual/reference/operator/query/regex/#op._S_options}) for a description of available options.
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
             * @param {radians|km|miles} [metrics=radians] A string representing what unit of measurement is used for distance.
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
             * @param {radians|km|miles} [metrics=radians] A string representing what unit of measurement is used for radius length.
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

        function QueryBuilder(query) {
            this.query = query;
            this.expr = query.expr;
        }

        var maxDistanceConsts = {
            'radians': '$maxDistance',
            'km': '$maxDistanceInKilometers',
            'miles': '$maxDistanceInMiles'
        };
        var radiusConsts = {
            'radians': 'radius',
            'km': 'radiusInKilometers',
            'miles': 'radiusInMiles'
        };

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
                var expandExpression = _.find(this.expr.operands, function (value, index, list) {
                    return value.operator === OperatorType.expand;
                });
                return expandExpression ? expandExpression.operands[0] : null;
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

        Everlive.Query = Query;
        Everlive.QueryBuilder = QueryBuilder;
    }());

    // Everlive requests
    var Request = (function () {
        // The headers used by the Everlive services
        var Headers = {
            filter: 'X-Everlive-Filter',
            select: 'X-Everlive-Fields',
            sort: 'X-Everlive-Sort',
            skip: 'X-Everlive-Skip',
            take: 'X-Everlive-Take',
            expand: 'X-Everlive-Expand'
        };

        var _self = null;
        // The Request type is an abstraction over Ajax libraries
        // A Request object needs information about the Everlive connection and initialization options

        function Request(setup, options) {
            guardUnset(setup, 'setup');
            guardUnset(options, 'options');
            this.setup = setup;
            this.method = null;
            this.endpoint = null;
            this.data = null;
            this.headers = {};
            // TODO success and error callbacks should be uniformed for all ajax libs
            this.success = null;
            this.error = null;
            this.parse = Request.parsers.simple;
            _.extend(this, options);
            this._init(options);
            _self = this;
        }

        Request.prototype = {
            // Calls the underlying Ajax library
            send: function () {
                Everlive.sendRequest(this);
            },
            // Returns an authorization header used by the request.
            // If there is a logged in user for the Everlive instance then her/his authentication will be used.
            buildAuthHeader: buildAuthHeader,
            // Builds the URL of the target Everlive service
            buildUrl: function buildUrl(setup) {
                return Everlive.buildUrl(setup);
            },
            // Processes the given query to return appropriate headers to be used by the request
            buildQueryHeaders: function buildQueryHeaders(query) {
                if (query) {
                    if (query instanceof Everlive.Query) {
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
        // Exposes the Request constructor
        Everlive.Request = Request;
        // A utility method for creating requests for the current Everlive instance

        /**
         * HTTP Methods
         * @enum {string}
         */
        var HttpMethod = {
            GET: 'GET',
            POST: 'POST',
            PUT: 'PUT',
            DELETE: 'DELETE'
        };

        /**
         * Make a request to the current {{site.bs}} JavaScript SDK instance.
         * @method request
         * @memberOf Everlive.prototype
         * @param {object} options Object used to configure the request.
         * @param {object} [options.endpoint] The endpoint of the {{site.bs}} JavaScript API relative to the API key section. (For example, options.endpoint = MyType will make a request to the MyType type.)
         * @param {HttpMethod} [options.method] HTTP request method.
         * @param {object} [options.data] Data to be sent with the request.
         * @param {Function} [options.success] Success callback that will be called when the request finishes successfully.
         * @param {Function} [options.error] Error callback to be called in case of an error.
         * @param {object} [options.headers] Additional headers to be included in the request.
         * @param {Query|object} [options.filter] This is either a {@link Query} or a [filter]({% slug rest-api-querying-filtering %}) expression.
         * @param {boolean} [options.authHeaders=true] When set to false, no Authorization headers will be sent with the request.
         * @returns {function} The request configuration object containing the `send` function that sends the request.
         */
        Everlive.prototype.request = function (options) {
            return new Request(this.setup, options);
        };
        function parseIsoDateString(string) {
            if (_self && _self.setup && _self.setup.parseOnlyCompleteDateTimeObjects) {
                if (/^\d{4}-\d{2}-\d{2}$/.test(string)) {
                    // Date
                    return null;
                }

                if (/^(\d{2}):(\d{2})(:(\d{2})(\.(\d+))?)?(Z|((\+|-)(\d{2}):(\d{2})))?$/.test(string)) {
                    // Time
                    return null;
                }
            }

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
        }

        function jsonDateReviver(key, value) {
            if (typeof value === 'string') {
                var date = parseIsoDateString(value);
                if (date) {
                    value = date;
                }
            }
            return value;
        }

        function traverse(obj, func) {
            var key, value, newValue;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    value = obj[key];
                    newValue = func(key, value);
                    obj[key] = newValue;
                    if (value === newValue && typeof value === 'object') {
                        traverse(value, func);
                    }
                }
            }
        }

        function traverseAndRevive(data) {
            traverse(data, jsonDateReviver);
        }

        Everlive._traverseAndRevive = traverseAndRevive;
        function parseResult(data) {
            if (typeof data === 'string' && data.length > 0) {
                data = JSON.parse(data, jsonDateReviver);
            }
            else if (typeof data === 'object') {
                traverseAndRevive(data);
            }
            if (data) {
                return {result: data.Result, count: data.Count};
            }
            else {
                return data;
            }
        }

        function parseError(error) {
            if (typeof error === 'string' && error.length > 0) {
                try {
                    error = JSON.parse(error);
                    return {message: error.message, code: error.errorCode};
                }
                catch (e) {
                    return error;
                }
            }
            else {
                return error;
            }
        }

        function parseSingleResult(data) {
            if (typeof data === 'string' && data.length > 0) {
                data = JSON.parse(data, jsonDateReviver);
            }
            else if (typeof data === 'object') {
                traverseAndRevive(data);
            }
            if (data) {
                return {result: data.Result};
            }
            else {
                return data;
            }
        }

        function parseUpdateResult(data) {
            if (typeof data === 'string' && data.length > 0) {
                data = JSON.parse(data, jsonDateReviver);
            }
            else if (typeof data === 'object') {
                traverseAndRevive(data);
            }
            if (data) {
                return {result: data.Result, ModifiedAt: data.ModifiedAt};
            }
            else {
                return data;
            }
        }

        Request.parsers = {
            simple: {
                result: parseResult,
                error: parseError
            },
            single: {
                result: parseSingleResult,
                error: parseError
            },
            update: {
                result: parseUpdateResult,
                error: parseError
            }
        };

        Everlive.disableRequestCache = function (url, method) {
            if (method === 'GET') {
                var timestamp = (new Date()).getTime();
                var separator = url.indexOf('?') > -1 ? '&' : '?';
                url += separator + '_el=' + timestamp;
            }
            return url;
        };

        // TODO built for reqwest
        if (typeof Everlive.sendRequest === 'undefined') {
            Everlive.sendRequest = function (request) {
                var url = request.buildUrl(request.setup) + request.endpoint;
                url = Everlive.disableRequestCache(url, request.method);
                var data = request.method === 'GET' ? request.data : JSON.stringify(request.data);

                //$.ajax(url, {
                reqwest({
                    url: url,
                    method: request.method,
                    data: data,
                    headers: request.headers,
                    type: 'json',
                    contentType: 'application/json',
                    crossOrigin: true,
                    //processData: request.method === "GET",
                    success: function (data, textStatus, jqXHR) {
                        request.success.call(request, request.parse.result(data));
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        request.error.call(request, request.parse.error(jqXHR.responseText));
                    }
                });
            };
        }

        return Request;
    }());

    // rsvp promises
    Everlive.getCallbacks = function (success, error) {
        var promise;
        if (typeof success !== 'function' && typeof error !== 'function') {
            promise = new rsvp.Promise(function (resolve, reject) {
                success = function (data) {
                    resolve(data);
                };
                error = function (error) {
                    reject(error);
                };
            });
        }
        return {promise: promise, success: success, error: error};
    };
    // whenjs promises
    //Everlive.getCallbacks = function (success, error) {
    //    var promise;
    //    if (typeof success !== "function" && typeof error !== "function") {
    //        promise = when.defer();
    //        success = function (data) {
    //            promise.resolve(data);
    //        };
    //        error = function (error) {
    //            promise.reject(error);
    //        };
    //    }
    //    return { promise: promise.promise, success: success, error: error };
    //};
    function buildPromise(operation, success, error) {
        var callbacks = Everlive.getCallbacks(success, error);
        operation(callbacks.success, callbacks.error);
        return callbacks.promise;
    }

    function mergeResultData(data, success) {
        return function (res, response) {
            var attrs = res.result;
            // support for kendo observable array
            if (_.isArray(data) || typeof data.length === 'number') {
                _.each(data, function (item, index) {
                    _.extend(item, attrs[index]);
                });
            }
            else {
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


    // Everlive base CRUD functions
    /**
     * @class Data
     * @classdesc A class that provides methods for all CRUD operations to a given {{site.bs}} data type. Covers advanced scenarios with custom headers and special server-side functionality.
     * @param {object} setup
     * @param {string} collectionName
     * @protected
     */
    function Data(setup, collectionName) {
        this.setup = setup;
        this.collectionName = collectionName;
        this.options = null;
    }

    Data.prototype = {
        /**
         * Sets additional non-standard HTTP headers in the current data request. See [List of Non-Standard HTTP Headers]{{% slug rest-api-headers}} for more information.
         * @memberOf Data.prototype
         * @method
         * @param {object} headers Additional headers to be sent with the data request.
         * @returns {Data}
         */
        withHeaders: function (headers) {
            var options = this.options || {};
            options.headers = _.extend(options.headers || {}, headers);
            this.options = options;
            return this;
        },
        /**
         * Sets an expand expression to be used in the data request. This allows you to retrieve complex data sets using a single query based on relations between data types.
         * @memberOf Data.prototype
         * @method
         * @param {object} expandExpression An [expand expression]({% slug features-data-relations-defining-expand %}) definition.
         * @returns {Data}
         */
        expand: function (expandExpression) {
            var expandHeader = {
                'X-Everlive-Expand': JSON.stringify(expandExpression)
            };
            return this.withHeaders(expandHeader);
        },
        _createRequest: function (options) {
            _.extend(options, this.options);
            this.options = null;
            return new Request(this.setup, options);
        },
        // TODO implement options: { requestSettings: { executeServerCode: false } }. power fields queries could be added to that options argument
        /**
         * Gets all data items that match the filter. This allows you to retrieve a subset of the items based on various filtering criteria.
         * @memberOf Data.prototype
         * @method get
         * @name get
         * @param {object|null} filter A [filter expression]({% slug rest-api-querying-filtering %}) definition.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        /**
         * Gets all data items that match the filter. This allows you to retrieve a subset of the items based on various filtering criteria.
         * @memberOf Data.prototype
         * @method get
         * @name get
         * @param {object|null} filter A [filter expression]({% slug rest-api-querying-filtering %}) definition.
         * @returns {Promise} the promise for the request
         */
        get: function (filter, success, error) {
            var self = this;
            return buildPromise(function (success, error) {
                var request = self._createRequest({
                    method: 'GET',
                    endpoint: self.collectionName,
                    filter: filter,
                    success: success,
                    error: error
                });
                request.send();
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
         * @returns {Promise} the promise for the request
         */
        /**
         * Gets an item by Id.
         * @memberOf Data.prototype
         * @method getById
         * @name getById
         * @param {string} id ID of the item.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        getById: function (id, success, error) {
            var self = this;
            return buildPromise(function (success, error) {
                var request = self._createRequest({
                    method: 'GET',
                    endpoint: self.collectionName + '/' + id,
                    parse: Request.parsers.single,
                    success: success,
                    error: error
                });
                request.send();
            }, success, error);
        },

        /**
         * Gets the count of the data items that match the filter.
         * @memberOf Data.prototype
         * @method count
         * @name count
         * @param {object|null} filter A [filter expression]({% slug rest-api-querying-filtering %}) definition.
         * @returns {Promise} The promise for the request
         */
        /**
         * Gets the count of the items that match the filter.
         * @memberOf Data.prototype
         * @method count
         * @name count
         * @param {object|null} filter A [filter expression]({% slug rest-api-querying-filtering %}) definition.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        count: function (filter, success, error) {
            var self = this;
            return buildPromise(function (success, error) {
                var request = self._createRequest({
                    method: 'GET',
                    endpoint: self.collectionName + '/_count',
                    filter: filter,
                    parse: Request.parsers.single,
                    success: success,
                    error: error
                });
                request.send();
            }, success, error);
        },

        /**
         * Creates a data item.
         * @memberOf Data.prototype
         * @method create
         * @name create
         * @param {object|object[]} data the item or items that will be created.
         * @returns {Promise} The promise for the request
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
                var request = self._createRequest({
                    method: 'POST',
                    endpoint: self.collectionName,
                    data: data,
                    parse: Request.parsers.single,
                    success: mergeResultData(data, success),
                    error: error
                });
                request.send();
            }, success, error);
        },
        /**
         * Updates all data items that match a filter with the specified update object.
         * @memberOf Data.prototype
         * @method rawUpdate
         * @name rawUpdate
         * @param updateObject Update object that contains the new values.
         * @param {object|null} filter A [filter expression]({% slug rest-api-querying-filtering %}) definition.
         * @returns {Promise} The promise for the request
         */
        /**
         * Updates all items that match the filter with the specified update object.
         * @memberOf Data.prototype
         * @method rawUpdate
         * @name rawUpdate
         * @param updateObject Update object that contains the new values.
         * @param {object|null} filter A [filter expression]({% slug rest-api-querying-filtering %}) definition.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        /**
         * Updates the item with the specified Id with the specified update object.
         * @memberOf Data.prototype
         * @method rawUpdate
         * @name rawUpdate
         * @param {object} Update object that contains the new values.
         * @param {string} id The ID of the item.
         * @returns {Promise} The promise for the request
         */
        /**
         * Updates a data item by ID with the specified update object.
         * @memberOf Data.prototype
         * @method rawUpdate
         * @name rawUpdate
         * @param {object} Update object that contains the new values.
         * @param {string} id the ID of the item.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        rawUpdate: function (attrs, filter, success, error) {
            var self = this;
            return buildPromise(function (success, error) {
                var endpoint = self.collectionName;
                var ofilter = null; // request options filter
                // if filter is string than will update a single item using the filter as an identifier
                if (typeof filter === 'string') {
                    endpoint += '/' + filter;
                }
                // else if it is an object than we will use it as a query filter
                else if (typeof filter === 'object') {
                    ofilter = filter;
                }
                var request = self._createRequest({
                    method: 'PUT',
                    endpoint: endpoint,
                    data: attrs,
                    filter: ofilter,
                    success: success,
                    error: error
                });
                request.send();
            }, success, error);
        },
        _update: function (attrs, filter, single, replace, success, error) {
            var self = this;
            return buildPromise(function (success, error) {
                var endpoint = self.collectionName;
                var requestSuccess = success;
                if (single) {
                    endpoint += '/' + attrs[idField];
                    requestSuccess = mergeUpdateResultData(attrs, success);
                }
                var data = {};
                data[replace ? '$replace' : '$set'] = attrs;
                var request = self._createRequest({
                    method: 'PUT',
                    endpoint: endpoint,
                    parse: Request.parsers.update,
                    data: data,
                    filter: filter,
                    success: requestSuccess,
                    error: error
                });
                request.send();
            }, success, error);
        },

        /**
         * Updates a single data item. This operation takes an object that specifies both the data item to be updated and the updated values.
         * @memberOf Data.prototype
         * @method updateSingle
         * @name updateSingle
         * @param {object} item the item that will be updated. Note: the Id property of the item will be used to determine which item will be updated
         * @returns {Promise} the promise for the request
         */
        /**
         * Updates the provided item.
         * @memberOf Data.prototype
         * @method updateSingle
         * @name updateSingle
         * @param {object} item the item that will be updated. Note: the Id property of the item will be used to determine which item will be updated
         * @param {Function} [success] a success callback.
         * @param {Function} [error] an error callback.
         */
        updateSingle: function (model, success, error) {
            return this._update(model, null, true, false, success, error);
        },

        /**
         * Updates all items that match a filter with the specified update object.
         * @memberOf Data.prototype
         * @method update
         * @name update
         * @param updateObject the update object.
         * @param {object|null} filter a [filter expression]({% slug rest-api-querying-filtering %}) definition.
         * @returns {Promise} the promise for the request
         */
        /**
         * Updates all items that match the filter with the specified update object.
         * @memberOf Data.prototype
         * @method update
         * @name update
         * @param updateObject the update object.
         * @param {object|null} filter a [filter expression]({% slug rest-api-querying-filtering %}) definition.
         * @param {Function} [success] a success callback.
         * @param {Function} [error] an error callback.
         */
        update: function (model, filter, success, error) {
            return this._update(model, filter, false, false, success, error);
        },
        //replaceSingle: function (model, success, error) {
        //    return this._update(model, null, true, true, success, error);
        //},
        _destroy: function (attrs, filter, single, success, error) {
            var self = this;
            return buildPromise(function (success, error) {
                var endpoint = self.collectionName;
                if (single) {
                    endpoint += '/' + attrs[idField];
                }
                var request = self._createRequest({
                    method: 'DELETE',
                    endpoint: endpoint,
                    filter: filter,
                    success: success,
                    error: error
                });
                request.send();
            }, success, error);
        },

        /**
         * Deletes a single data item by ID.
         * @memberOf Data.prototype
         * @method destroySingle
         * @name destroySingle
         * @param {object} item Object containing the item Id to be deleted.
         * @returns {Promise} The promise for the request
         */
        /**
         * Deletes a single data item by ID.
         * @memberOf Data.prototype
         * @method destroySingle
         * @name destroySingle
         * @param {object} Object containing the item Id to be deleted.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        destroySingle: function (model, success, error) {
            return this._destroy(model, null, true, success, error);
        },

        /**
         * Deletes all data items that match a filter.
         * @memberOf Data.prototype
         * @method destroy
         * @name destroy
         * @param {object|null} filter A [filter expression]({% slug rest-api-querying-filtering %}) definition.
         * @returns {Promise} the promise for the request
         */
        /**
         * Deletes all items that match the filter.
         * @memberOf Data.prototype
         * @method destroy
         * @name destroy
         * @param {object|null} filter A [filter expression]({% slug rest-api-querying-filtering %}) definition.
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
         * @param {object} item The item whose ACL will be updated. Note: the Id property of the item will be used to determine which item will be deleted.
         * @returns {Promise} The promise for the request
         */
        /**
         * Sets the Access Control List (ACL) of a specified data item.
         * @memberOf Data.prototype
         * @method setAcl
         * @name setAcl
         * @param {object} acl The acl object.
         * @param {object} item The item whose ACL will be updated. Note: the Id property of the item will be used to determine which item will be deleted.
         * @param {Function} success A success callback.
         * @param {Function} error An error callback.
         */
        /**
         * Sets the Access Control List (ACL) of a specified data item.
         * @memberOf Data.prototype
         * @method setAcl
         * @name setAcl
         * @param {object} acl The acl object.
         * @param {string} id The Id of the item.
         * @returns {Promise} The promise for the request
         */
        /**
         * Sets the Access Control List (ACL) of an item with a specified ID.
         * @memberOf Data.prototype
         * @method setAcl
         * @name setAcl
         * @param {object} acl The acl object.
         * @param {string} id The Id of the item.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        setAcl: function (acl, filter, success, error) {
            var self = this;
            return buildPromise(function (success, error) {
                var endpoint = self.collectionName;

                if (typeof filter === 'string') { // if filter is string than will update a single item using the filter as an identifier
                    endpoint += '/' + filter;
                }
                else if (typeof filter === 'object') { // else if it is an object than we will use it's id property
                    endpoint += '/' + filter[idField];
                }
                endpoint += '/_acl';
                var method, data;
                if (acl === null) {
                    method = 'DELETE';
                } else {
                    method = 'PUT';
                    data = acl;
                }

                var request = self._createRequest({
                    method: method,
                    endpoint: endpoint,
                    data: data,
                    success: success,
                    error: error
                });
                request.send();
            }, success, error);
        },
        /**
         * Sets the owner of the specified data item.
         * @memberOf Data.prototype
         * @method setOwner
         * @name setOwner
         * @param {string} acl The new owner Id.
         * @param {object} item The item whose owner will be updated. Note: the Id property of the item will be used to determine which item will be deleted.
         * @returns {Promise} the promise for the request
         */
        /**
         * Sets the owner of the specified data item.
         * @memberOf Data.prototype
         * @method setOwner
         * @name setOwner
         * @param {string} acl The new owner Id.
         * @param {object} item the item whose owner will be updated. Note: the Id property of the item will be used to determine which item will be deleted.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        /**
         * Sets the owner of the specified data item.
         * @memberOf Data.prototype
         * @method setOwner
         * @name setOwner
         * @param {string} ownerId The new owner Id.
         * @param {string} id The Id of the item.
         * @returns {Promise} The promise for the request
         */
        /**
         * Sets the owner of the specified data item.
         * @memberOf Data.prototype
         * @method setOwner
         * @name setOwner
         * @param {string} ownerId The new owner Id.
         * @param {string} id The Id of the item.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        setOwner: function (ownerId, filter, success, error) {
            var self = this;
            return buildPromise(function (success, error) {
                var endpoint = self.collectionName;

                if (typeof filter === 'string') { // if filter is string than will update a single item using the filter as an identifier
                    endpoint += '/' + filter;
                }
                else if (typeof filter === 'object') { // else if it is an object than we will use it's id property
                    endpoint += '/' + filter[idField];
                }
                endpoint += '/_owner';

                var request = self._createRequest({
                    method: 'PUT',
                    endpoint: endpoint,
                    data: {
                        Owner: ownerId
                    },
                    success: success,
                    error: error
                });
                request.send();
            }, success, error);
        },
        /**
         * Saves the provided data item. This operation will create or update the item depending on whether it is new or existing.
         * @memberOf Data.prototype
         * @method save
         * @name save
         * @param {object} item An object containing the item that is being saved.
         * @returns {Promise} The promise for the request
         */
        /**
         * Saves the provided data item. This operation will create or update the item depending on whether it is new or existing.
         * @memberOf Data.prototype
         * @method save
         * @name save
         * @param {object} item An object containing the item that is being saved.
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
                }
                else {
                    return self.updateSingle(model, saveSuccess, saveError);
                }
            }, success, error);
        },
        /**
         * Checks if the specified data item is new or not.
         * @memberOf Data.prototype
         * @method
         * @param item Item to check.
         * @returns {boolean}
         */
        isNew: function (model) {
            return typeof model[idField] === 'undefined';
        }
    };
    Everlive.Data = Data;

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

    Everlive.GeoPoint = GeoPoint;

    /**
     * A class used to represent the current authentication status of the {{site.TelerikBackendServices}} JavaScript SDK instance.
     * @property {string} unauthenticated Indicates that no user is authenticated.
     * @property {string} masterKey Indicates that a master key authentication is used.
     * @property {string} invalidAuthentication Indicates an authentication has been attempted, but it was invalid.
     * @property {string} authenticated Indicates that a user is authenticated.
     * @typedef {string} Everlive.AuthStatus
     */
    var AuthStatus = {
        unauthenticated: 'unauthenticated',
        masterKey: 'masterKey',
        invalidAuthentication: 'invalidAuthentication',
        authenticated: 'authenticated'
    };
    Everlive.AuthStatus = AuthStatus;
    function getAuthInfo(setup, getUser, success, error) {
        if (setup.masterKey) {
            return buildPromise(function (success, error) {
                success({status: AuthStatus.masterKey});
            }, success, error);
        }
        if (!setup.token) {
            return buildPromise(function (success, error) {
                success({status: AuthStatus.unauthenticated});
            }, success, error);
        }

        var errorcb;
        if (success) {
            errorcb = function (err) {
                if (err && err.code === 601) { // invalid request, i.e. the access token is invalid or missing
                    success({status: AuthStatus.invalidAuthentication});
                }
                else {
                    error(err);
                }
            };
        }
        var promise = getUser(success, errorcb);
        if (promise) {
            promise = promise.then(function (res) {
                return {status: AuthStatus.authenticated, user: res.result};
            }, function (err) {
                if (err && err.code === 601) { // invalid request, i.e. the access token is invalid or missing
                    return {status: AuthStatus.invalidAuthentication};
                }
                else {
                    throw err;
                }
            });
        }
        return promise;
    }

    /**
     * Gets the current authentication status of the {{site.TelerikBackendServices}} JavaScript SDK instance.
     * @memberOf Everlive.prototype
     * @method authInfo
     * @name authInfo
     * @returns {Promise} A promise to the authentication status.
     */
    /**
     * Gets the current authentication status of the {{site.TelerikBackendServices}} JavaScript SDK instance.
     * @memberOf Everlive.prototype
     * @method authInfo
     * @name authInfo
     * @param {Function} [success] A success callback.
     * @param {Function} [error] An error callback.
     */
    Everlive.prototype.authInfo = function (success, error) {
        return getAuthInfo(this.setup, _.bind(this.Users.getById, this.Users, 'me'), success, error);
    };

    /**
     * @class Users
     * @extends Data
     * @protected
     */

    var addUsersFunctions = function (ns) {
        ns._loginSuccess = function (data) {
            var result = data.result;
            this.setAuthorization(result.access_token, result.token_type);
        };
        ns._logoutSuccess = function () {
            this.clearAuthorization();
        };

        /**
         * Registers a new user with username and password.
         * @memberOf Users.prototype
         * @method register
         * @name register
         * @param {string} username the new user's username.
         * @param {string} password the new user's password.
         * @param {object} userInfo additional information for the user (ex. DisplayName, Email, etc.)
         * @returns {Promise} the promise for the request
         */
        /**
         * Registers a new user using a username and a password.
         * @memberOf Users.prototype
         * @method register
         * @name register
         * @param {string} username The new user's username.
         * @param {string} password The new user's password.
         * @param {object} userInfo Additional information for the user (ex. DisplayName, Email, etc.)
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
         *
         * Logs in a user using a username and a password to the current {{site.bs}} JavaScript SDK instance. All requests initiated by the current {{site.bs}} JavaScript SDK instance will be authenticated with that user's credentials.
         * @memberOf Users.prototype
         * @method login
         * @name login
         * @param {string} username The user's username.
         * @param {string} password The user's password.
         * @returns {Promise} The promise for the request
         */
        /**
         * Logs in a user using a username and a password to the current {{site.bs}} JavaScript SDK instance. All requests initiated by the current {{site.bs}} JavaScript SDK instance will be authenticated with that user's credentials.
         * @memberOf Users.prototype
         * @method login
         * @name login
         * @param {string} username The user's username.
         * @param {string} password The user's password.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        ns.login = function (username, password, success, error) {
            var self = this;
            return buildPromise(function (success, error) {
                var request = new Request(self.setup, {
                    method: 'POST',
                    endpoint: 'oauth/token',
                    data: {
                        username: username,
                        password: password,
                        grant_type: 'password'
                    },
                    authHeaders: false,
                    parse: Request.parsers.single,
                    success: function () {
                        self._loginSuccess.apply(self, arguments);
                        success.apply(null, arguments);
                    },
                    error: error
                });
                request.send();
            }, success, error);
        };

        /**
         * Gets information about the user that is currently authenticated to the {{site.bs}} JavaScript SDK.
         * @memberOf Users.prototype
         * @method currentUser
         * @name currentUser
         * @returns {Promise} the promise for the request
         */
        /**
         * Gets information about the user that is currently authenticated to the {{site.bs}} JavaScript SDK.
         * @memberOf Users.prototype
         * @method currentUser
         * @name currentUser
         * @param {Function} [success] a success callback.
         * @param {Function} [error] an error callback.
         */
        ns.currentUser = function (success, error) {
            var self = this;
            return buildPromise(function (success, error) {
                getAuthInfo(self.setup, _.bind(self.getById, self, 'me'))
                    .then(function (res) {
                        if (typeof res.user !== 'undefined') {
                            success({result: res.user});
                        }
                        else {
                            success({result: null});
                        }
                    }, function (err) {
                        error(err);
                    });
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
         * @returns {Promise} The promise for the request
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
                var endpoint = 'Users/changepassword';
                if (keepTokens) {
                    endpoint += '?keepTokens=true';
                }
                var request = new Request(self.setup, {
                    method: 'POST',
                    endpoint: endpoint,
                    data: {
                        Username: username,
                        Password: password,
                        NewPassword: newPassword
                    },
                    authHeaders: false,
                    parse: Request.parsers.single,
                    success: success,
                    error: error
                });
                request.send();
            }, success, error);
        };

        /**
         * Log out the user who is currently logged in.
         * @memberOf Users.prototype
         * @method logout
         * @name logout
         * @returns {Promise} The promise for the request
         */
        /**
         * Log out the user who is currently logged in.
         * @memberOf Users.prototype
         * @method logout
         * @name logout
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        ns.logout = function (success, error) {
            var self = this;
            return buildPromise(function (success, error) {
                var request = new Request(self.setup, {
                    method: 'GET',
                    endpoint: 'oauth/logout',
                    success: function () {
                        self._logoutSuccess.apply(self, arguments);
                        success.apply(null, arguments);
                    },
                    error: function (err) {
                        if (err.code === 301) { //invalid token
                            self.clearAuthorization();
                        }

                        error.apply(null, arguments);
                    }
                });

                request.send();
            }, success, error);
        };

        ns._loginWithProvider = function (identity, success, error) {
            var user = {
                Identity: identity
            };
            var self = this;
            return buildPromise(function (success, error) {
                var request = new Request(self.setup, {
                    method: 'POST',
                    endpoint: 'Users',
                    data: user,
                    authHeaders: false,
                    parse: Request.parsers.single,
                    success: function () {
                        self._loginSuccess.apply(self, arguments);
                        success.apply(null, arguments);
                    },
                    error: error
                });
                request.send();
            }, success, error);
        };
        ns._linkWithProvider = function (identity, userId, success, error) {
            var self = this;
            return buildPromise(function (success, error) {
                var request = new Request(self.setup, {
                    method: 'POST',
                    endpoint: 'Users/' + userId + '/link',
                    data: identity,
                    parse: Request.parsers.single,
                    success: success,
                    error: error
                });
                request.send();
            }, success, error);
        };
        ns._unlinkFromProvider = function (providerName, userId, success, error) {
            var identity = {
                Provider: providerName
            };
            var self = this;
            return buildPromise(function (success, error) {
                var request = new Request(self.setup, {
                    method: 'POST',
                    endpoint: 'Users/' + userId + '/unlink',
                    data: identity,
                    parse: Request.parsers.single,
                    success: success,
                    error: error
                });
                request.send();
            }, success, error);
        };

        /**
         * Log in a user using an Facebook access token.
         * @memberOf Users.prototype
         * @method loginWithFacebook
         * @name loginWithFacebook
         * @param {string} accessToken Facebook access token.
         * @returns {Promise} The promise for the request
         */
        /**
         * Log in a user using an Facebook access token.
         * @memberOf Users.prototype
         * @method loginWithFacebook
         * @name loginWithFacebook
         * @param {string} accessToken Facebook access token.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        ns.loginWithFacebook = function (accessToken, success, error) {
            var identity = {
                Provider: 'Facebook',
                Token: accessToken
            };
            return ns._loginWithProvider(identity, success, error);
        };

        /**
         * Links a {{site.TelerikBackendServices}} user account to a Facebook access token.
         * @memberOf Users.prototype
         * @method linkWithFacebook
         * @name linkWithFacebook
         * @param {string} userId The user's Id in {{site.bs}}.
         * @param {string} accessToken The Facebook access token that will be linked to the {{site.bs}} user account.
         * @returns {Promise} The promise for the request
         */
        /**
         * Links a Backend Services user with a Facebook access token.
         * @memberOf Users.prototype
         * @method linkWithFacebook
         * @name linkWithFacebook
         * @param {string} userId The user's Id in {{site.bs}}.
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
         * @param {string} userId The user's Id in {{site.bs}}.
         * @returns {Promise} The promise for the request
         */
        /**
         * Unlinks a {{site.TelerikBackendServices}} user account from the Facebook token that it is linked to.
         * @memberOf Users.prototype
         * @method unlinkFromFacebook
         * @name unlinkFromFacebook
         * @param {string} userId The user's Id in {{site.bs}}.
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
         * @param {string} accessToken ADFS access token.
         * @returns {Promise} The promise for the request
         */
        /**
         * Log in a user using an ADFS access token.
         * @memberOf Users.prototype
         * @method loginWithADFS
         * @name loginWithADFS
         * @param {string} accessToken ADFS access token.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        ns.loginWithADFS = function (accessToken, success, error) {
            var identity = {
                Provider: 'ADFS',
                Token: accessToken
            };
            return ns._loginWithProvider(identity, success, error);
        };

        /**
         * Links a {{site.TelerikBackendServices}} user account to an ADFS access token.
         * @memberOf Users.prototype
         * @method linkWithADFS
         * @name linkWithADFS
         * @param {string} userId The user's Id in {{site.bs}}.
         * @param {string} accessToken The ADFS access token that will be linked to the {{site.bs}} user account.
         * @returns {Promise} The promise for the request
         */
        /**
         * Links a {{site.TelerikBackendServices}} user account to an ADFS access token.
         * @memberOf Users.prototype
         * @method linkWithADFS
         * @name linkWithADFS
         * @param {string} userId The user's Id in {{site.bs}}.
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
         * @param {string} userId The user's Id in {{site.bs}}.
         * @returns {Promise} The promise for the request
         */
        /**
         * Unlinks a {{site.TelerikBackendServices}} user account from the ADFS token that it is linked to.
         * @memberOf Users.prototype
         * @method unlinkFromADFS
         * @name unlinkFromADFS
         * @param {string} userId The user's Id in {{site.bs}}.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        ns.unlinkFromADFS = function (userId, success, error) {
            return ns._unlinkFromProvider('ADFS', userId, success, error);
        };

        /**
         * Log in a user using a LiveID access token.
         * @memberOf Users.prototype
         * @method loginWithLiveID
         * @name loginWithLiveID
         * @param {string} accessToken LiveID access token.
         * @returns {Promise} The promise for the request
         */
        /**
         * Log in a user using a LiveID access token.
         * @memberOf Users.prototype
         * @method loginWithLiveID
         * @name loginWithLiveID
         * @param {string} accessToken LiveID access token.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        ns.loginWithLiveID = function (accessToken, success, error) {
            var identity = {
                Provider: 'LiveID',
                Token: accessToken
            };
            return ns._loginWithProvider(identity, success, error);
        };

        /**
         * Links a {{site.TelerikBackendServices}} user account to a LiveId access token.
         * @memberOf Users.prototype
         * @method linkWithLiveID
         * @name linkWithLiveID
         * @param {string} userId The user's Id in {{site.bs}}.
         * @param {string} accessToken The LiveID access token that will be linked to the {{site.bs}} user account.
         * @returns {Promise} The promise for the request
         */
        /**
         * Links a {{site.TelerikBackendServices}} user account to a LiveId access token.
         * @memberOf Users.prototype
         * @method linkWithLiveID
         * @name linkWithLiveID
         * @param {string} userId The user's Id in {{site.bs}}.
         * @param {string} accessToken The LiveID access token that will be linked to the {{site.bs}} user account.
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
         * Unlinks a {{site.TelerikBackendServices}} user account from the LiveID access token that it is linked to.
         * @memberOf Users.prototype
         * @method unlinkFromLiveID
         * @name unlinkFromLiveID
         * @param {string} userId The user's Id in {{site.bs}}.
         * @returns {Promise} The promise for the request
         */
        /**
         * Unlinks a {{site.TelerikBackendServices}} user account from the LiveID access token that it is linked to.
         * @memberOf Users.prototype
         * @method unlinkFromLiveID
         * @name unlinkFromLiveID
         * @param {string} userId The user's Id in {{site.bs}}.
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
         * @param {string} accessToken Google access token.
         * @returns {Promise} The promise for the request
         */
        /**
         * Log in a user using a Google access token.
         * @memberOf Users.prototype
         * @method loginWithGoogle
         * @name loginWithGoogle
         * @param {string} accessToken Google access token.
         * @param {Function} [success] A success callback.
         * @param {Function} [error] An error callback.
         */
        ns.loginWithGoogle = function (accessToken, success, error) {
            var identity = {
                Provider: 'Google',
                Token: accessToken
            };

            return ns._loginWithProvider(identity, success, error);
        };

        /**
         * Links a {{site.TelerikBackendServices}} user account to a Google access token.
         * @memberOf Users.prototype
         * @method linkWithGoogle
         * @name linkWithGoogle
         * @param {string} userId The user's Id in {{site.bs}}.
         * @param {string} accessToken The Google access token that will be linked to the {{site.bs}} user account.
         * @returns {Promise} the promise for the request
         */
        /**
         * Links a {{site.TelerikBackendServices}} user account to a Google access token.
         * @memberOf Users.prototype
         * @method linkWithGoogle
         * @name linkWithGoogle
         * @param {string} userId The user's Id in {{site.bs}}.
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
         * @param {string} userId The user's Id in {{site.bs}}.
         * @returns {Promise} The promise for the request
         */
        /**
         * Unlinks a {{site.TelerikBackendServices}} user account from the Google access token that it is linked to.
         * @memberOf Users.prototype
         * @method unlinkFromGoogle
         * @name unlinkFromGoogle
         * @param {string} userId The user's Id in {{site.bs}}.
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
         * @returns {Promise} The promise for the request
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
            var identity = {
                Provider: 'Twitter',
                Token: token,
                TokenSecret: tokenSecret
            };

            return ns._loginWithProvider(identity, success, error);
        };

        /**
         * Links a {{site.TelerikBackendServices}} user to a Twitter token. A secret token needs to be provided.
         * @memberOf Users.prototype
         * @method linkWithTwitter
         * @name linkWithTwitter
         * @param {string} userId The user's Id in {{site.bs}}.
         * @param {string} token The Twitter access token that will be linked to the {{site.bs}} user account.
         * @param {string} tokenSecret The Twitter secret token.
         * @returns {Promise} The promise for the request
         */
        /**
         * Links a {{site.TelerikBackendServices}} user to a Twitter token. A secret token needs to be provided.         * Links a Backend Services user with a Twitter token. A secret token needs to be provided.
         * @memberOf Users.prototype
         * @method linkWithTwitter
         * @name linkWithTwitter
         * @param {string} userId The user's Id in {{site.bs}}.
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
         * @param {string} userId The user's Id in {{site.bs}}.
         * @returns {Promise} The promise for the request
         */
        /**
         * Unlinks a {{site.TelerikBackendServices}} user account from the Twitter access token that it is linked to.
         * @memberOf Users.prototype
         * @method unlinkFromTwitter
         * @name unlinkFromTwitter
         * @param {string} userId The user's Id in {{site.bs}}.
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
         * @param {string} token Token that will be used for authorization.
         * @param {Everlive.TokenType} tokenType Token type. Currently only 'bearer' token is supported.
         */
        ns.setAuthorization = function setAuthorization(token, tokenType) {
            this.setup.token = token;
            this.setup.tokenType = tokenType;
        };

        /**
         * Clears the authentication token that the {{site.bs}} JavaScript SDK currently uses. Note that this is different than logging out, because the current authorization token is not invalidated.
         * @method clearAuthorization
         * @memberOf Users.prototype
         */
        ns.clearAuthorization = function clearAuthorization() {
            this.setAuthorization(null, null);
        };
    };

    /**
     * @class Files
     * @protected
     * @extends Data
     */

    var addFilesFunctions = function (ns) {
        /**
         * Get a URL that can be used as an endpoint for uploading a file. It is specific to each {{site.TelerikBackendServices}} app.
         * @memberof Files.prototype
         * @method getUploadUrl
         * @returns {string}
         */
        ns.getUploadUrl = function () {
            return Everlive.buildUrl(this.setup) + this.collectionName;
        };

        /**
         * Get the download URL for a file.
         * @memberof Files.prototype
         * @method getDownloadUrl
         * @deprecated
         * @param {string} fileId The ID of the file.
         * @returns {string} url The download URL.
         */
        ns.getDownloadUrl = function (fileId) {
            return Everlive.buildUrl(this.setup) + this.collectionName + '/' + fileId + '/Download';
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
            return Everlive.buildUrl(this.setup) + this._getUpdateUrl(fileId);
        };

        /**
         * Updates a file's content
         * @memberof Files.prototype
         * @method updateContent
         * @param {string} fileId File ID.
         * @param {string} file File contents in base64 encoding.
         * @param {function} [success] Success callback.
         * @param {function} [error] Error callback.
         * @returns {Promise}
         */
        ns.updateContent = function (fileId, file, success, error) {
            var self = this;
            return buildPromise(function (success, error) {
                var endpoint = self._getUpdateUrl(fileId);
                // the passed file content is base64 encoded
                var request = self._createRequest({
                    method: 'PUT',
                    endpoint: endpoint,
                    data: file,
                    success: success,
                    error: error
                });
                request.send();
            }, success, error);
        };

        /**
         * Gets the download URL for a file by ID.
         * @memberof Files.prototype
         * @method getDownloadUrlById
         * @param {string} fileId File ID.
         * @param {function} [success] Success callback.
         * @param {function} [error] Error callback.
         * @returns {Promise}
         */
        ns.getDownloadUrlById = function (fileId, success, error) {
            var self = this;
            return buildPromise(function (success, error) {
                var request = self._createRequest({
                    method: 'GET',
                    endpoint: self.collectionName + '/' + fileId,
                    parse: Request.parsers.single,
                    success: function (data) {
                        success(data.result.Uri);
                    },
                    error: error
                });
                request.send();
            }, success, error);
        };
    };

    //#region Push

    //Constants for different platforms in Everlive
    var Platform = {
        WindowsPhone: 1,
        Windows: 2,
        Android: 3,
        iOS: 4,
        OSX: 5,
        Blackberry: 6,
        Nokia: 7,
        Unknown: 100
    };

    //Global event handlers for push notification events. Required by the cordova PushNotifications plugin that we use.
    Everlive.PushCallbacks = {};

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
            var isPushNotificationPluginAvailable = (typeof window !== 'undefined' && window.plugins && window.plugins.pushNotification);

            if (!isPushNotificationPluginAvailable) {
                throw new EverliveError("The push notification plugin is not available. Ensure that the pushNotification plugin is included " +
                "and use after `deviceready` event has been fired.");
            }
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

            if (!window.cordova) {
                throw new EverliveError('Error: currentDevice() can only be called from within a hybrid mobile app, after \'deviceready\' event has been fired.');
            }

            if (!this._currentDevice) {
                this._currentDevice = new CurrentDevice(this);
            }

            this._currentDevice.emulatorMode = emulatorMode;

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
         * @param {Boolean} settings.iOS.sound=true If set to true, the device will play a notification sound.
         * @param {Object} settings.android=null Android-specific settings.
         * @param {String} settings.android.senderID=null Your Google API project number. It is required when obtaining a push token for an Android device.
         * @param {String} settings.android.projectNumber=null Synonym for android.senderID. Available in JavaScript SDK versions 1.2.7 and later.
         * @param {Object} settings.wp8=null Windows Phone specific settings
         * @returns {Promise} A promise for the operation
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
         * @param {Boolean} settings.iOS.sound=true Specifies whether the device will play a sound.
         * @param {Object} settings.android=null Android specific settings
         * @param {String} settings.android.senderID=null This is your Google API project number. It is required when obtaining a push token for an Android device.
         * @param {String} settings.android.projectNumber=null Synonym for android.senderID. Available in JavaScript SDK versions 1.2.7 and later.
         * @param {Object} settings.wp8=null Windows Phone specific settings
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
                var platformType = currentDevice._getPlatformType(device.platform);
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
         * @returns {Promise} A promise for the operation
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
         * @returns {Promise} A promise for the operation
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
         * @returns {Promise} A promise for the operation
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
                        if (window.plugins && window.plugins.pushNotification) {
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
         * @returns {Promise} A promise for the operation
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
         * @returns {Promise} A promise for the operation
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
         * @returns {Promise} A promise to the request
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
            this.ensurePushIsAvailable();

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
         * @param {Object} options an object passed to the Push Notification plugin's areNotificationsEnabled method
         * @returns {Promise} A promise for the operation
         */
        /**
         * iOS: Checks if the Notifications are enabled for this Application in the Device's Notification Center.
         * Windows Phone: Checks if the Application has an active opened Channel for communication with the Notification Service. Not relying on the device notification settings.
         * Android: Checks if the Application has established connection with the Notification Service. Not relying on the device notification settings.
         * @method areNotificationsEnabled
         * @name areNotificationsEnabled
         * @memberOf Push.prototype
         * @param {Object} options an object passed to the Push Notification plugin's areNotificationsEnabled method
         * @param {Function} [onSuccess] Callback to invoke on successful check - passes one boolean value - true or false
         * @param {Function} [onError] Callback to invoke when an error in the push plugin has occurred.
         */
        areNotificationsEnabled: function (options, onSuccess, onError) {
            this.ensurePushIsAvailable();

            options = options || {};
            var pushNotification = window.plugins.pushNotification;

            return buildPromise(function (successCb, errorCb) {
                pushNotification.areNotificationsEnabled(successCb, errorCb, options);
            }, onSuccess, onError);
        }
    };

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

    CurrentDevice.prototype = {

        /**
         * Initializes the current device for push notifications. This method requests a push token from the device vendor and enables the push notification functionality on the device. Once this is done, you can register the device in {{site.TelerikBackendServices}} using the register() method.
         * @method enableNotifications
         * @name enableNotifications
         * @memberOf CurrentDevice.prototype
         * @param {PushSettings} pushSettings An object specifying various settings for the initialization.
         * @returns {Object} A promise for the operation
         */
        /**
         * Initializes the current device for push notifications. This method requests a push token
         * from the device vendor and enables the push notification functionality on the device.
         * Once this is done, you can register the device in Everlive using the register() method.
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
         * @returns {Object} A promise for the operation
         */
        /**
         * Disables push notifications for the current device. This method invalidates any push tokens
         * that were obtained for the device from the current application.
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
                                var platformType = self._getPlatformType(device.platform);
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
         * @returns {Object} A promise for the operation
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
         * Registers the current device for push notifications in {{site.TelerikBackendServices}}. This method can be called only after [enableNotifications()]({% slug apireference-js-sdk-currentdevice.enablenotifications %}) has completed successfully.
         * @memberOf CurrentDevice.prototype
         * @method register
         * @name register
         * @param {Object} customParameters Custom parameters for the registration.
         * @returns {Object} A promise for the operation
         */
        /**
         * Registers the current device for push notifications in Everlive. This method can be called
         * only after enableNotifications() has completed successfully.
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
         * @returns {Object} A promise for the operation
         */
        /**
         * Unregisters the current device from push notifications in Everlive. After this call completes
         * successfully, Everlive will no longer send notifications to this device. Note that this does
         * not prevent the device from receiving notifications and does not invalidate push tokens.
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
         * @returns {Object} A promise for the operation
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

            var platformType = this._getPlatformType(device.platform);
            if (platformType === Platform.iOS) {
                //Initialize global APN callback
                var apnCallbackName = 'apnCallback_' + suffix;
                Everlive.PushCallbacks[apnCallbackName] = _.bind(this._onNotificationAPN, this);

                //Construct registration options object and validate iOS settings
                var apnRegistrationOptions = this.pushSettings.iOS;
                this._validateIOSSettings(apnRegistrationOptions);
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

        _validateIOSSettings: function (iOSSettings) {

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
                            var platformType = self._getPlatformType(device.platform);
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
        _getPlatformType: function (platformString) {
            var psLower = platformString.toLowerCase();
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

    function EverliveError() {
        var tmp = Error.apply(this, arguments);

        tmp.name = this.name = 'EverliveError';

        this.message = tmp.message;

        Object.defineProperty(this, 'stack', {
            get: function () {
                return tmp.stack
            }
        });

        return this;
    }

    EverliveError.prototype = Object.create(Error.prototype);
    EverliveError.prototype.toJSON = function () {
        return {
            name: this.name,
            message: this.message,
            stack: this.stack
        };
    };

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

    var DeviceRegistrationResult = function (token) {
        this.token = token;
    };

    //#endregion

    var initDefault = function () {
        /**
         * @memberOf Everlive
         * @instance
         * @extends Data
         * @member {Data} Users
         */
        this.Users = this.data('Users');
        addUsersFunctions(this.Users);

        /**
         * @memberOf Everlive
         * @instance
         * @extends Files
         * @member {Files} Files
         */
        this.Files = this.data('Files');
        addFilesFunctions(this.Files);

        this.push = new Push(this);
    };

    initializations.push({name: 'default', func: initDefault});

    return Everlive;
}));

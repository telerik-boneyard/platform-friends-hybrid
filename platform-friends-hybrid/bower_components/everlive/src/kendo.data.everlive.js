(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['Everlive'], function (Everlive) {
            factory(Everlive);
        });
    }
    else {
        factory(root.Everlive);
    }
}(this, function (Everlive) {
    var $ = window.jQuery,
        kendo = window.kendo;
    if ($ === undefined || kendo === undefined)
        return;
    var extend = $.extend;

    extend(true, kendo.data, {
        schemas: {
            everlive: {
                type: "json",
                data: function (data) {
                    // update
                    if (typeof data.ModifiedAt !== 'undefined') {
                        return { ModifiedAt: data.ModifiedAt };
                    }
                    else {
                        return data.Result || data;
                    }
                },
                total: "Count",
                model: {
                    id: "Id"
                }
            }
        },
        transports: {
            everlive: {
                read: {
                    dataType: "json",
                    type: "GET",
                    cache: false
                },
                update: {
                    dataType: "json",
                    contentType: "application/json",
                    type: "PUT",
                    cache: false
                },
                create: {
                    dataType: "json",
                    contentType: "application/json",
                    type: "POST",
                    cache: false
                },
                destroy: {
                    dataType: "json",
                    type: "DELETE",
                    cache: false
                },
                parameterMap: function (data, operation) {
                    if (operation === "destroy") {
                        return {};
                    }

                    if (operation === "create" || operation === "update") {
                        return JSON.stringify(data);
                    }

                    if (operation === "read") {
                        return null;
                    }
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
                var sort = {}
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
                var filter = new FilterBuilder().build(data.filter);
                result.$where = filter;
                delete data.filter;
            }
        }
        return result;
    }

    var regexOperations = ['startswith', 'startsWith', 'endswith', 'endsWith', 'contains'];
    function FilterBuilder() {
    }
    FilterBuilder.prototype = {
        build: function (filter) {
            return this._build(filter);
        },
        _build: function (filter) {
            if (this._isRaw(filter)) {
                return this._raw(filter);
            }
            else if (this._isSimple(filter)) {
                return this._simple(filter);
            }
            else if (this._isRegex(filter)) {
                return this._regex(filter);
            }
            else if (this._isAnd(filter)) {
                return this._and(filter);
            }
            else if (this._isOr(filter)) {
                return this._or(filter);
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
            return typeof filter.logic === 'undefined' && !this._isRegex(filter);
        },
        _simple: function (filter) {
            var term = {}, fieldTerm = {};
            var operator = this._translateoperator(filter.operator);
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
            var regex = this._getRegex(filter);
            var regexValue = this._getRegexValue(regex);
            fieldTerm[filter.field] = regexValue;
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
            return Everlive.QueryBuilder.prototype._getRegexValue.call(this, regex);
        },
        _isAnd: function (filter) {
            return filter.logic === 'and';
        },
        _and: function (filter) {
            var i, l, term, result = {};
            var operands = filter.filters;
            for (i = 0, l = operands.length; i < l; i++) {
                term = this._build(operands[i]);
                result = this._andAppend(result, term);
            }
            return result;
        },
        _andAppend: function (andObj, newObj) {
            return Everlive.QueryBuilder.prototype._andAppend.call(this, andObj, newObj);
        },
        _isOr: function (filter) {
            return filter.logic === 'or';
        },
        _or: function (filter) {
            var i, l, term, result = [];
            var operands = filter.filters;
            for (i = 0, l = operands.length; i < l; i++) {
                term = this._build(operands[i]);
                result.push(term);
            }
            return { $or: result };
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

    function createEverliveQuery(query) {
        return new Everlive.Query(query.$where, null, query.$sort, query.$skip, query.$take);
    }

    // replace the setup method of RemoteTransport in order to inject options
    // the setup method is called on all crud operations
    var RemoteTransport_setup = kendo.data.RemoteTransport.prototype.setup;
    kendo.data.RemoteTransport.prototype.setup = function (options, type) {
        if (!options.url && !this.options[type].url && this.options.typeName) {
            var everlive$ = this.options.dataProvider || Everlive.$;
            if (!everlive$) {
                throw new Error("You should either specify a url for this transport method, or instantiate an Everlive instance.");
            }

            options.url = Everlive.Request.prototype.buildUrl(everlive$.setup) + this.options.typeName;
            if (type === 'update' || type === 'destroy') {
                options.url += '/' + options.data[Everlive.idField];
        }

            options.headers = Everlive.Request.prototype.buildAuthHeader(everlive$.setup);

        if (type === 'read' && options.data) {
            var query = translateKendoQuery(options.data);
            var everliveQuery = createEverliveQuery(query);
            options.headers = $.extend(options.headers, Everlive.Request.prototype.buildQueryHeaders(everliveQuery));
        }

        if (type === 'create' || type === 'read' || type === 'update') {
            var success = options.success;
            options.success = function (result) {
                // convert date strings into dates
                Everlive._traverseAndRevive(result);
                if (success)
                    success(result);
            };
        }
        }

        return RemoteTransport_setup.call(this, options, type);
    };

    // kendo merges the rest service result with the original data
    // but Everlive does not return the whole objects on update and create
    // so replace the accept method of Model in order to merge the response
    // from the request for creating a new item to the client model item
    var createRequestFields = [Everlive.idField, 'CreatedAt'];
    var Model_accept = kendo.data.Model.prototype.accept;
    kendo.data.Model.prototype.accept = function (data) {
        var that = this, field, value;
        Everlive._traverseAndRevive(data);
        // create
        if (data && that.isNew() && data[Everlive.idField]) {
            for (field in that.fields) {
                if ($.inArray(field, createRequestFields) === -1) {
                    value = that.get(field);
                    data[field] = value;
                }
            }
        }
            // update
        else if (data && typeof data.ModifiedAt !== 'undefined') {
            for (field in that.fields) {
                if (field !== 'ModifiedAt') {
                    value = that.get(field);
                    data[field] = value;
                }
            }
        }
        Model_accept.call(this, data);
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
    }

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
                'X-Everlive-Fields': JSON.stringify(expandNode.fields),
            }
        }
    }

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
     * Creates a new [HierarchicalDataSource](http://docs.telerik.com/kendo-ui/api/javascript/data/hierarchicaldatasource) that manages a certain Backend Services content type and can expand a chain of relations.
     * Kendo UI [HierarchicalDataSource](http://docs.telerik.com/kendo-ui/api/javascript/data/hierarchicaldatasource) is used in conjunction with other Kendo widgets (such as [TreeView](http://docs.telerik.com/kendo-ui/web/treeview/overview)) to render data from Backend Services in a structured way.
     * The chain of relations is defined by specifying the field names that contain the relation on each level. For example a generic hierarchy chain is a content type 'Continents' with relation to 'Countries', which in turn contains a relation to 'Towns'.
     * *including Kendo scripts is required*.
     * @param options data source options for [HierarchicalDataSource](http://docs.telerik.com/kendo-ui/api/javascript/data/hierarchicaldatasource).
     * @param options.typeName name of the main content type for the data source.
     * @param {ExpandDefinition[]} options.expand an array of expand definitions. It defines the levels of hierarchy by specifying the relation fields. An expand definition can either be the field name as a **string**, or an **object** that allows additional options.
     * @param {string} ExpandDefinition - The field name of the relation that will be expanded.
     * @param {string} ExpandDefinition.relation - *Required*. The field name of the relation that will be expanded.
     * @param {object} ExpandDefinition.filter - an object specifying the filter expression.
     * @param {object} ExpandDefinition.sort - an object specifying the sort expression.
     * @param {object} ExpandDefinition.skip - a number specifying the skip value.
     * @param {object} ExpandDefinition.take - a number specifying the take value.
     * @param {object} ExpandDefinition.fields - an object specifying the fields expression.
     * @returns {HierarchicalDataSource} A new instance of Kendo UI HierarchicalDataSource. See Kendo UI documentation for [HierarchicalDataSource](http://docs.telerik.com/kendo-ui/api/javascript/data/hierarchicaldatasource)
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
    Everlive.createHierarchicalDataSource = function (options) {
        options = options || {};
        var expand = options.expand;
        var typeName = options.typeName;
        var everlive$ = options.dataProvider || Everlive.$;
        delete options.expand;
        delete options.typeName;
        delete options.dataProvider;
        var baseUrl;

        if (options.url) {
            baseUrl = options.url;
        } else if (everlive$ && typeName) {
            baseUrl = Everlive.Request.prototype.buildUrl(everlive$.setup) + typeName;
        } else {
            if (!everlive$) {
                throw new Error("You need to instantiate an Everlive instance in order to create a kendo HierarchicalDataSource.");
            }
            if (!typeName) {
                throw new Error("You need to specify a 'typeName' in order to create a kendo HierarchicalDataSource.");
            }
        }

        var expandSchema;
        if (expand) {
            for (var i = expand.length - 1; i >= 0; i--) {
                var expandSchema = {
                    model: {
                        hasChildren: getRelationFieldForExpandNode(expand[i]),
                        children: {
                            type: "everlive",
                            transport: {
                                read: {
                                    url: getUrlGeneratorForNode(baseUrl, expand.slice(0, i + 1)),
                                    headers: getHeadersForExpandNode(expand[i])
                                }
                            },
                            schema: expandSchema
                        }
                    }
                }
            }
        }
        var dataSourceOptions = {};
        dataSourceOptions.type = 'everlive';
        dataSourceOptions.transport = {
            typeName: typeName,
            dataProvider: everlive$
        };
        dataSourceOptions.schema = expandSchema;
        extend(true, dataSourceOptions, options);
        return new kendo.data.HierarchicalDataSource(dataSourceOptions);
    };

    /**
     * Creates a new Kendo UI [DataSource](http://docs.telerik.com/kendo-ui/api/javascript/data/datasource) that manages a certain Backend Services content type.
     * Kendo UI [DataSource](http://docs.telerik.com/kendo-ui/api/javascript/data/datasource) is used in conjunction with other Kendo UI widgets (such as [ListView](http://docs.telerik.com/kendo-ui/web/listview/overview) and [Grid](http://docs.telerik.com/kendo-ui/web/grid/overview)) to provide an easy way to render data from Backend Services.
     * *including Kendo scripts is required*.
     * @param options data source options. See Kendo UI documentation of [DataSource](http://docs.telerik.com/kendo-ui/api/javascript/data/datasource) for more info.
     * @param options.transport.typeName the content type name in Backend Services that will be managed.
     * @returns {DataSource} A new instance of Kendo UI DataSource. See Kendo UI documentation of [DataSource](http://docs.telerik.com/kendo-ui/api/javascript/data/datasource) for more info.
     * @example ```js
     * var booksDataSource = Everlive.createDataSource({
     *   transport: {
     *     typeName: 'Books'
     *   }
     * });
     * ```
     */
    Everlive.createDataSource = function (options) {
        options = options || {};
        var typeName = options.typeName;
        var everlive$ = options.dataProvider || Everlive.$;
        if (!everlive$) {
            throw new Error("You need to instantiate an Everlive instance in order to create a kendo DataSource.");
        }
        if (!typeName) {
            throw new Error("You need to specify a 'typeName' in order to create a kendo DataSource.");
        }
        delete options.typeName;
        delete options.dataProvider;

        var dataSourceOptions = {};
        dataSourceOptions.type = 'everlive';
        dataSourceOptions.transport = {
            typeName: typeName,
            dataProvider: everlive$
        };
        extend(true, dataSourceOptions, options);
        return new kendo.data.DataSource(dataSourceOptions);
    }
}));
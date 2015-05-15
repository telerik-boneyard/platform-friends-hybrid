(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Processor = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
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

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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

},{"./Constants":2}],4:[function(require,module,exports){
'use strict';
function ExpandError(message) {
    this.name = 'ExpandError';
    this.message = message;
    this.stack = (new Error()).stack;
}
ExpandError.prototype = new Error;
module.exports = ExpandError;
},{}],5:[function(require,module,exports){
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

},{"./Constants":2,"./ExecutionTree":3,"./ExpandError":4,"./RelationTreeBuilder":7,"async":8}],6:[function(require,module,exports){
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

},{"./Constants":2,"./ExpandError":4,"underscore":9}],7:[function(require,module,exports){
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

},{"./Constants":2,"./ExpandError":4,"./RelationNode":6,"async":8,"underscore":9}],8:[function(require,module,exports){
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
},{"_process":1}],9:[function(require,module,exports){
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

},{}]},{},[5])(5)
});
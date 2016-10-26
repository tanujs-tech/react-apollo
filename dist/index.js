(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var react_1 = require('react');
var invariant = require('invariant');
var ApolloProvider = (function (_super) {
    __extends(ApolloProvider, _super);
    function ApolloProvider(props, context) {
        _super.call(this, props, context);
        invariant(props.client, 'ApolloClient was not passed a client instance. Make ' +
            'sure you pass in your client via the "client" prop.');
        this.client = props.client;
        if (props.store) {
            this.store = props.store;
            if (props.immutable)
                props.client.initStore();
            return;
        }
        props.client.initStore();
        this.store = props.client.store;
    }
    ApolloProvider.prototype.getChildContext = function () {
        return {
            store: this.store,
            client: this.client,
        };
    };
    ApolloProvider.prototype.render = function () {
        return React.Children.only(this.props.children);
    };
    ApolloProvider.propTypes = {
        store: react_1.PropTypes.shape({
            subscribe: react_1.PropTypes.func.isRequired,
            dispatch: react_1.PropTypes.func.isRequired,
            getState: react_1.PropTypes.func.isRequired,
        }),
        client: react_1.PropTypes.object.isRequired,
        immutable: react_1.PropTypes.bool,
        children: react_1.PropTypes.element.isRequired,
    };
    ApolloProvider.childContextTypes = {
        store: react_1.PropTypes.object.isRequired,
        client: react_1.PropTypes.object.isRequired,
    };
    return ApolloProvider;
}(react_1.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ApolloProvider;
;

},{"invariant":10,"react":6}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var react_1 = require('react');
var pick = require('lodash.pick');
var flatten = require('lodash.flatten');
var shallowEqual_1 = require('./shallowEqual');
var invariant = require('invariant');
var assign = require('object-assign');
var hoistNonReactStatics = require('hoist-non-react-statics');
var apollo_client_1 = require('apollo-client');
var parser_1 = require('./parser');
var defaultQueryData = {
    loading: true,
    error: null,
};
var skippedQueryData = {
    loading: false,
    error: null,
};
var defaultMapPropsToOptions = function (props) { return ({}); };
var defaultMapResultToProps = function (props) { return props; };
var defaultMapPropsToSkip = function (props) { return false; };
function observableQueryFields(observable) {
    var fields = pick(observable, 'variables', 'refetch', 'fetchMore', 'updateQuery', 'startPolling', 'stopPolling', 'subscribeToMore');
    Object.keys(fields).forEach(function (key) {
        if (typeof fields[key] === 'function') {
            fields[key] = fields[key].bind(observable);
        }
    });
    return fields;
}
function getDisplayName(WrappedComponent) {
    return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
var nextVersion = 0;
function withApollo(WrappedComponent) {
    var withDisplayName = "withApollo(" + getDisplayName(WrappedComponent) + ")";
    var WithApollo = (function (_super) {
        __extends(WithApollo, _super);
        function WithApollo(props, context) {
            _super.call(this, props, context);
            this.client = context.client;
            invariant(!!this.client, "Could not find \"client\" in the context of " +
                ("\"" + withDisplayName + "\". ") +
                "Wrap the root component in an <ApolloProvider>");
        }
        WithApollo.prototype.render = function () {
            var props = assign({}, this.props);
            props.client = this.client;
            return react_1.createElement(WrappedComponent, props);
        };
        WithApollo.displayName = withDisplayName;
        WithApollo.WrappedComponent = WrappedComponent;
        WithApollo.contextTypes = { client: react_1.PropTypes.object.isRequired };
        return WithApollo;
    }(react_1.Component));
    return hoistNonReactStatics(WithApollo, WrappedComponent, { fetchData: true });
}
exports.withApollo = withApollo;
;
function graphql(document, operationOptions) {
    if (operationOptions === void 0) { operationOptions = {}; }
    var _a = operationOptions.options, options = _a === void 0 ? defaultMapPropsToOptions : _a, _b = operationOptions.skip, skip = _b === void 0 ? defaultMapPropsToSkip : _b;
    var mapPropsToOptions = options;
    if (typeof mapPropsToOptions !== 'function')
        mapPropsToOptions = function () { return options; };
    var mapPropsToSkip = skip;
    if (typeof mapPropsToSkip !== 'function')
        mapPropsToSkip = (function () { return skip; });
    var mapResultToProps = operationOptions.props;
    var operation = parser_1.parser(document);
    var version = nextVersion++;
    return function wrapWithApolloComponent(WrappedComponent) {
        var graphQLDisplayName = "Apollo(" + getDisplayName(WrappedComponent) + ")";
        function calculateOptions(props, newOpts) {
            var opts = mapPropsToOptions(props);
            if (newOpts && newOpts.variables) {
                newOpts.variables = assign({}, opts.variables, newOpts.variables);
            }
            if (newOpts)
                opts = assign({}, opts, newOpts);
            if (opts.fragments) {
                opts.fragments = flatten(opts.fragments);
            }
            if (opts.variables || !operation.variables.length)
                return opts;
            var variables = {};
            for (var _i = 0, _a = operation.variables; _i < _a.length; _i++) {
                var _b = _a[_i], variable = _b.variable, type = _b.type;
                if (!variable.name || !variable.name.value)
                    continue;
                if (typeof props[variable.name.value] !== 'undefined') {
                    variables[variable.name.value] = props[variable.name.value];
                    continue;
                }
                if (type.kind !== 'NonNullType') {
                    variables[variable.name.value] = null;
                    continue;
                }
                invariant(typeof props[variable.name.value] !== 'undefined', ("The operation '" + operation.name + "' wrapping '" + getDisplayName(WrappedComponent) + "' ") +
                    ("is expecting a variable: '" + variable.name.value + "' but it was not found in the props ") +
                    ("passed to '" + graphQLDisplayName + "'"));
            }
            opts.variables = variables;
            return opts;
        }
        function fetchData(props, _a) {
            var client = _a.client;
            if (mapPropsToSkip(props))
                return false;
            if (operation.type === parser_1.DocumentType.Mutation || operation.type === parser_1.DocumentType.Subscription)
                return false;
            var opts = calculateOptions(props);
            if (opts.ssr === false || opts.skip)
                return false;
            var observable = client.watchQuery(assign({ query: document }, opts));
            var result = observable.currentResult();
            if (result.loading) {
                return observable.result();
            }
            else {
                return false;
            }
        }
        var GraphQL = (function (_super) {
            __extends(GraphQL, _super);
            function GraphQL(props, context) {
                _super.call(this, props, context);
                this.data = {};
                this.version = version;
                this.client = context.client;
                invariant(!!this.client, "Could not find \"client\" in the context of " +
                    ("\"" + graphQLDisplayName + "\". ") +
                    "Wrap the root component in an <ApolloProvider>");
                this.store = this.client.store;
                this.type = operation.type;
                if (mapPropsToSkip(props))
                    return;
                this.setInitialProps();
            }
            GraphQL.prototype.componentDidMount = function () {
                this.hasMounted = true;
                if (this.type === parser_1.DocumentType.Mutation)
                    return;
                if (mapPropsToSkip(this.props))
                    return;
                this.subscribeToQuery(this.props);
            };
            GraphQL.prototype.componentWillReceiveProps = function (nextProps) {
                if (mapPropsToSkip(nextProps)) {
                    if (!mapPropsToSkip(this.props)) {
                        this.data = assign({}, skippedQueryData);
                        this.unsubscribeFromQuery();
                    }
                    return;
                }
                if (shallowEqual_1.default(this.props, nextProps))
                    return;
                if (this.type === parser_1.DocumentType.Mutation) {
                    this.createWrappedMutation(nextProps, true);
                    return;
                }
                ;
                this.haveOwnPropsChanged = true;
                this.subscribeToQuery(nextProps);
            };
            GraphQL.prototype.shouldComponentUpdate = function (nextProps, nextState, nextContext) {
                return !!nextContext || this.haveOwnPropsChanged || this.hasOperationDataChanged;
            };
            GraphQL.prototype.componentWillUnmount = function () {
                if (this.type === parser_1.DocumentType.Query)
                    this.unsubscribeFromQuery();
                if (this.type === parser_1.DocumentType.Subscription)
                    this.unsubscribeFromQuery();
                this.hasMounted = false;
            };
            GraphQL.prototype.calculateOptions = function (props, newProps) { return calculateOptions(props, newProps); };
            ;
            GraphQL.prototype.calculateResultProps = function (result) {
                var name = this.type === parser_1.DocumentType.Mutation ? 'mutate' : 'data';
                if (operationOptions.name)
                    name = operationOptions.name;
                var newResult = (_a = {}, _a[name] = result, _a.ownProps = this.props, _a);
                if (mapResultToProps)
                    return mapResultToProps(newResult);
                return (_b = {}, _b[name] = defaultMapResultToProps(result), _b);
                var _a, _b;
            };
            GraphQL.prototype.setInitialProps = function () {
                if (this.type === parser_1.DocumentType.Mutation)
                    return this.createWrappedMutation(this.props);
                var opts = this.calculateOptions(this.props);
                if (opts.skip) {
                    this.data = assign({}, skippedQueryData);
                }
                else {
                    this.data = assign({}, defaultQueryData);
                    this.createQuery(opts);
                }
            };
            GraphQL.prototype.createQuery = function (opts) {
                if (this.type === parser_1.DocumentType.Subscription) {
                    this.queryObservable = this.client.subscribe(assign({
                        query: document,
                    }, opts));
                }
                else {
                    this.queryObservable = this.client.watchQuery(assign({
                        query: document,
                    }, opts));
                }
                this.initializeData(opts);
            };
            GraphQL.prototype.initializeData = function (opts) {
                assign(this.data, observableQueryFields(this.queryObservable));
                if (this.type === parser_1.DocumentType.Subscription) {
                    opts = this.calculateOptions(this.props, opts);
                    assign(this.data, { loading: true }, { variables: opts.variables });
                }
                else if (!opts.forceFetch) {
                    var currentResult = this.queryObservable.currentResult();
                    assign(this.data, currentResult.data, { loading: currentResult.loading });
                }
                else {
                    assign(this.data, { loading: true });
                }
            };
            GraphQL.prototype.subscribeToQuery = function (props) {
                var _this = this;
                var opts = calculateOptions(props);
                if (opts.skip) {
                    if (this.querySubscription) {
                        this.hasOperationDataChanged = true;
                        this.data = assign({}, skippedQueryData);
                        this.unsubscribeFromQuery();
                        this.forceRenderChildren();
                    }
                    return;
                }
                if (this.querySubscription) {
                    if (this.queryObservable._setOptionsNoResult) {
                        this.queryObservable._setOptionsNoResult(opts);
                    }
                    else {
                        this.queryObservable.setOptions(opts);
                    }
                    assign(this.data, { loading: this.queryObservable.currentResult().loading }, observableQueryFields(this.queryObservable));
                    return;
                }
                if (!this.queryObservable) {
                    this.createQuery(opts);
                }
                else if (!this.data.refetch) {
                    this.initializeData(opts);
                }
                var next = function (results) {
                    if (_this.type === parser_1.DocumentType.Subscription) {
                        results = { data: results, loading: false, error: null };
                    }
                    var data = results.data, loading = results.loading, _a = results.error, error = _a === void 0 ? null : _a;
                    var clashingKeys = Object.keys(observableQueryFields(data));
                    invariant(clashingKeys.length === 0, ("the result of the '" + graphQLDisplayName + "' operation contains keys that ") +
                        "conflict with the return object." +
                        clashingKeys.map(function (k) { return ("'" + k + "'"); }).join(', ') + " not allowed.");
                    _this.hasOperationDataChanged = true;
                    _this.data = assign({
                        loading: loading,
                        error: error,
                    }, data, observableQueryFields(_this.queryObservable));
                    _this.forceRenderChildren();
                };
                var handleError = function (error) {
                    if (error instanceof apollo_client_1.ApolloError)
                        return next({ error: error });
                    throw error;
                };
                this.querySubscription = this.queryObservable.subscribe({ next: next, error: handleError });
            };
            GraphQL.prototype.unsubscribeFromQuery = function () {
                if (this.querySubscription) {
                    this.querySubscription.unsubscribe();
                    delete this.querySubscription;
                }
            };
            GraphQL.prototype.forceRenderChildren = function () {
                if (this.hasMounted)
                    this.setState({});
            };
            GraphQL.prototype.getWrappedInstance = function () {
                invariant(operationOptions.withRef, "To access the wrapped instance, you need to specify " +
                    "{ withRef: true } in the options");
                return this.refs.wrappedInstance;
            };
            GraphQL.prototype.createWrappedMutation = function (props, reRender) {
                var _this = this;
                if (reRender === void 0) { reRender = false; }
                if (this.type !== parser_1.DocumentType.Mutation)
                    return;
                this.data = function (opts) {
                    opts = _this.calculateOptions(props, opts);
                    if (typeof opts.variables === 'undefined')
                        delete opts.variables;
                    opts.mutation = document;
                    return _this.client.mutate(opts);
                };
                if (!reRender)
                    return;
                this.hasOperationDataChanged = true;
                this.forceRenderChildren();
            };
            GraphQL.prototype.render = function () {
                if (mapPropsToSkip(this.props))
                    return react_1.createElement(WrappedComponent, this.props);
                var _a = this, haveOwnPropsChanged = _a.haveOwnPropsChanged, hasOperationDataChanged = _a.hasOperationDataChanged, renderedElement = _a.renderedElement, props = _a.props, data = _a.data;
                this.haveOwnPropsChanged = false;
                this.hasOperationDataChanged = false;
                var clientProps = this.calculateResultProps(data);
                var mergedPropsAndData = assign({}, props, clientProps);
                if (!haveOwnPropsChanged && !hasOperationDataChanged && renderedElement) {
                    return renderedElement;
                }
                if (operationOptions.withRef)
                    mergedPropsAndData.ref = 'wrappedInstance';
                this.renderedElement = react_1.createElement(WrappedComponent, mergedPropsAndData);
                return this.renderedElement;
            };
            GraphQL.displayName = graphQLDisplayName;
            GraphQL.WrappedComponent = WrappedComponent;
            GraphQL.contextTypes = {
                store: react_1.PropTypes.object.isRequired,
                client: react_1.PropTypes.object.isRequired,
            };
            GraphQL.fragments = operation.fragments;
            return GraphQL;
        }(react_1.Component));
        if (operation.type === parser_1.DocumentType.Query)
            GraphQL.fetchData = fetchData;
        return hoistNonReactStatics(GraphQL, WrappedComponent, { fetchData: true });
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = graphql;
;

},{"./parser":4,"./shallowEqual":5,"apollo-client":6,"hoist-non-react-statics":9,"invariant":10,"lodash.flatten":11,"lodash.pick":12,"object-assign":13,"react":6}],3:[function(require,module,exports){
"use strict";
var ApolloProvider_1 = require('./ApolloProvider');
exports.ApolloProvider = ApolloProvider_1.default;
var graphql_1 = require('./graphql');
exports.graphql = graphql_1.default;
exports.withApollo = graphql_1.withApollo;
var compose = require('recompose').compose;
exports.compose = compose;

},{"./ApolloProvider":1,"./graphql":2,"recompose":29}],4:[function(require,module,exports){
"use strict";
var apollo_client_1 = require('apollo-client');
var invariant = require('invariant');
(function (DocumentType) {
    DocumentType[DocumentType["Query"] = 0] = "Query";
    DocumentType[DocumentType["Mutation"] = 1] = "Mutation";
    DocumentType[DocumentType["Subscription"] = 2] = "Subscription";
})(exports.DocumentType || (exports.DocumentType = {}));
var DocumentType = exports.DocumentType;
function parser(document) {
    var fragments, queries, mutations, subscriptions, variables, definitions, type, name;
    invariant((!!document || !!document.kind), "Argument of " + document + " passed to parser was not a valid GraphQL Document. You may need to use 'graphql-tag' or another method to convert your operation into a document");
    fragments = document.definitions.filter(function (x) { return x.kind === 'FragmentDefinition'; });
    fragments = apollo_client_1.createFragment({
        kind: 'Document',
        definitions: fragments.slice(),
    });
    queries = document.definitions.filter(function (x) { return x.kind === 'OperationDefinition' && x.operation === 'query'; });
    mutations = document.definitions.filter(function (x) { return x.kind === 'OperationDefinition' && x.operation === 'mutation'; });
    subscriptions = document.definitions.filter(function (x) { return x.kind === 'OperationDefinition' && x.operation === 'subscription'; });
    if (fragments.length && (!queries.length || !mutations.length || !subscriptions.length)) {
        invariant(true, "Passing only a fragment to 'graphql' is not yet supported. You must include a query, subscription or mutation as well");
    }
    if (queries.length && mutations.length && mutations.length) {
        invariant(((queries.length + mutations.length + mutations.length) > 1), "react-apollo only supports a query, subscription, or a mutation per HOC. " + document + " had " + queries.length + " queries, " + subscriptions.length + " subscriptions and " + mutations.length + " muations. You can use 'compose' to join multiple operation types to a component");
    }
    type = queries.length ? DocumentType.Query : DocumentType.Mutation;
    if (!queries.length && !mutations.length)
        type = DocumentType.Subscription;
    definitions = queries.length ? queries : mutations;
    if (!queries.length && !mutations.length)
        definitions = subscriptions;
    if (definitions.length !== 1) {
        invariant((definitions.length !== 1), "react-apollo only supports one defintion per HOC. " + document + " had " + definitions.length + " definitions. You can use 'compose' to join multiple operation types to a component");
    }
    variables = definitions[0].variableDefinitions || [];
    var hasName = definitions[0].name && definitions[0].name.kind === 'Name';
    name = hasName ? definitions[0].name.value : 'data';
    fragments = fragments.length ? fragments : [];
    return { name: name, type: type, variables: variables, fragments: fragments };
}
exports.parser = parser;

},{"apollo-client":6,"invariant":10}],5:[function(require,module,exports){
"use strict";
function shallowEqual(objA, objB) {
    if (!objA || !objB)
        return true;
    if (objA === objB)
        return true;
    var keysA = Object.keys(objA);
    var keysB = Object.keys(objB);
    if (keysA.length !== keysB.length)
        return false;
    var hasOwn = Object.prototype.hasOwnProperty;
    for (var i = 0; i < keysA.length; i++) {
        if (!hasOwn.call(objB, keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
            return false;
        }
    }
    return true;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = shallowEqual;

},{}],6:[function(require,module,exports){

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var createChangeEmitter = exports.createChangeEmitter = function createChangeEmitter() {
  var currentListeners = [];
  var nextListeners = currentListeners;

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  function listen(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.');
    }

    var isSubscribed = true;

    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return function () {
      if (!isSubscribed) {
        return;
      }

      isSubscribed = false;

      ensureCanMutateNextListeners();
      var index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
    };
  }

  function emit() {
    currentListeners = nextListeners;
    var listeners = currentListeners;
    for (var i = 0; i < listeners.length; i++) {
      listeners[i].apply(listeners, arguments);
    }
  }

  return {
    listen: listen,
    emit: emit
  };
};
},{}],8:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks
 * 
 */

/*eslint-disable no-self-compare */

'use strict';

var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * inlined Object.is polyfill to avoid requiring consumers ship their own
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
function is(x, y) {
  // SameValue algorithm
  if (x === y) {
    // Steps 1-5, 7-10
    // Steps 6.b-6.e: +0 != -0
    // Added the nonzero y check to make Flow happy, but it is redundant
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  } else {
    // Step 6.a: NaN == NaN
    return x !== x && y !== y;
  }
}

/**
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not strictly equal between the arguments.
 * Returns true when the values of all keys are strictly equal.
 */
function shallowEqual(objA, objB) {
  if (is(objA, objB)) {
    return true;
  }

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  for (var i = 0; i < keysA.length; i++) {
    if (!hasOwnProperty.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }

  return true;
}

module.exports = shallowEqual;
},{}],9:[function(require,module,exports){
/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

var REACT_STATICS = {
    childContextTypes: true,
    contextTypes: true,
    defaultProps: true,
    displayName: true,
    getDefaultProps: true,
    mixins: true,
    propTypes: true,
    type: true
};

var KNOWN_STATICS = {
    name: true,
    length: true,
    prototype: true,
    caller: true,
    arguments: true,
    arity: true
};

var isGetOwnPropertySymbolsAvailable = typeof Object.getOwnPropertySymbols === 'function';

module.exports = function hoistNonReactStatics(targetComponent, sourceComponent, customStatics) {
    if (typeof sourceComponent !== 'string') { // don't hoist over string (html) components
        var keys = Object.getOwnPropertyNames(sourceComponent);

        /* istanbul ignore else */
        if (isGetOwnPropertySymbolsAvailable) {
            keys = keys.concat(Object.getOwnPropertySymbols(sourceComponent));
        }

        for (var i = 0; i < keys.length; ++i) {
            if (!REACT_STATICS[keys[i]] && !KNOWN_STATICS[keys[i]] && (!customStatics || !customStatics[keys[i]])) {
                try {
                    targetComponent[keys[i]] = sourceComponent[keys[i]];
                } catch (error) {

                }
            }
        }
    }

    return targetComponent;
};

},{}],10:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (process.env.NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

}).call(this,require('_process'))
},{"_process":14}],11:[function(require,module,exports){
(function (global){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]';

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Built-in value references. */
var Symbol = root.Symbol,
    propertyIsEnumerable = objectProto.propertyIsEnumerable,
    spreadableSymbol = Symbol ? Symbol.isConcatSpreadable : undefined;

/**
 * The base implementation of `_.flatten` with support for restricting flattening.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {number} depth The maximum recursion depth.
 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, depth, predicate, isStrict, result) {
  var index = -1,
      length = array.length;

  predicate || (predicate = isFlattenable);
  result || (result = []);

  while (++index < length) {
    var value = array[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

/**
 * Checks if `value` is a flattenable `arguments` object or array.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
 */
function isFlattenable(value) {
  return isArray(value) || isArguments(value) ||
    !!(spreadableSymbol && value && value[spreadableSymbol]);
}

/**
 * Flattens `array` a single level deep.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to flatten.
 * @returns {Array} Returns the new flattened array.
 * @example
 *
 * _.flatten([1, [2, [3, [4]], 5]]);
 * // => [1, 2, [3, [4]], 5]
 */
function flatten(array) {
  var length = array ? array.length : 0;
  return length ? baseFlatten(array, 1) : [];
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

module.exports = flatten;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],12:[function(require,module,exports){
(function (global){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0,
    MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    symbolTag = '[object Symbol]';

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array ? array.length : 0,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Built-in value references. */
var Symbol = root.Symbol,
    propertyIsEnumerable = objectProto.propertyIsEnumerable,
    spreadableSymbol = Symbol ? Symbol.isConcatSpreadable : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * The base implementation of `_.flatten` with support for restricting flattening.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {number} depth The maximum recursion depth.
 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, depth, predicate, isStrict, result) {
  var index = -1,
      length = array.length;

  predicate || (predicate = isFlattenable);
  result || (result = []);

  while (++index < length) {
    var value = array[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

/**
 * The base implementation of `_.pick` without support for individual
 * property identifiers.
 *
 * @private
 * @param {Object} object The source object.
 * @param {string[]} props The property identifiers to pick.
 * @returns {Object} Returns the new object.
 */
function basePick(object, props) {
  object = Object(object);
  return basePickBy(object, props, function(value, key) {
    return key in object;
  });
}

/**
 * The base implementation of  `_.pickBy` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The source object.
 * @param {string[]} props The property identifiers to pick from.
 * @param {Function} predicate The function invoked per property.
 * @returns {Object} Returns the new object.
 */
function basePickBy(object, props, predicate) {
  var index = -1,
      length = props.length,
      result = {};

  while (++index < length) {
    var key = props[index],
        value = object[key];

    if (predicate(value, key)) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = array;
    return apply(func, this, otherArgs);
  };
}

/**
 * Checks if `value` is a flattenable `arguments` object or array.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
 */
function isFlattenable(value) {
  return isArray(value) || isArguments(value) ||
    !!(spreadableSymbol && value && value[spreadableSymbol]);
}

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Creates an object composed of the picked `object` properties.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {...(string|string[])} [props] The property identifiers to pick.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.pick(object, ['a', 'c']);
 * // => { 'a': 1, 'c': 3 }
 */
var pick = baseRest(function(object, props) {
  return object == null ? {} : basePick(object, arrayMap(baseFlatten(props, 1), toKey));
});

module.exports = pick;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],13:[function(require,module,exports){
'use strict';
/* eslint-disable no-unused-vars */
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (e) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],14:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
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
    var timeout = runTimeout(cleanUpNextTick);
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
    runClearTimeout(timeout);
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
        runTimeout(drainQueue);
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

},{}],15:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

var _createEagerFactory = require('./createEagerFactory');

var _createEagerFactory2 = _interopRequireDefault(_createEagerFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var branch = function branch(test, left, right) {
  return function (BaseComponent) {
    return function (_React$Component) {
      _inherits(_class2, _React$Component);

      function _class2(props, context) {
        _classCallCheck(this, _class2);

        var _this = _possibleConstructorReturn(this, _React$Component.call(this, props, context));

        _this.LeftComponent = null;
        _this.RightComponent = null;

        _this.computeChildComponent(_this.props);
        return _this;
      }

      _class2.prototype.computeChildComponent = function computeChildComponent(props) {
        if (test(props)) {
          this.leftFactory = this.leftFactory || (0, _createEagerFactory2.default)(left(BaseComponent));
          this.factory = this.leftFactory;
        } else {
          this.rightFactory = this.rightFactory || (0, _createEagerFactory2.default)(right(BaseComponent));
          this.factory = this.rightFactory;
        }
      };

      _class2.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
        this.computeChildComponent(nextProps);
      };

      _class2.prototype.render = function render() {
        return this.factory(this.props);
      };

      return _class2;
    }(_react2.default.Component);
  };
};

exports.default = (0, _createHelper2.default)(branch, 'branch');
},{"./createEagerFactory":20,"./createHelper":22,"react":6}],16:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _omit = require('./utils/omit');

var _omit2 = _interopRequireDefault(_omit);

var _createEagerElement = require('./createEagerElement');

var _createEagerElement2 = _interopRequireDefault(_createEagerElement);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var componentFromProp = function componentFromProp(propName) {
  var Component = function Component(props) {
    return (0, _createEagerElement2.default)(props[propName], (0, _omit2.default)(props, [propName]));
  };
  Component.displayName = 'componentFromProp(' + propName + ')';
  return Component;
};

exports.default = componentFromProp;
},{"./createEagerElement":19,"./utils/omit":51}],17:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.componentFromStreamWithConfig = undefined;

var _react = require('react');

var _changeEmitter = require('change-emitter');

var _symbolObservable = require('symbol-observable');

var _symbolObservable2 = _interopRequireDefault(_symbolObservable);

var _setObservableConfig = require('./setObservableConfig');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var componentFromStreamWithConfig = exports.componentFromStreamWithConfig = function componentFromStreamWithConfig(config) {
  return function (propsToVdom) {
    return function (_Component) {
      _inherits(ComponentFromStream, _Component);

      function ComponentFromStream() {
        var _config$fromESObserva;

        var _temp, _this, _ret;

        _classCallCheck(this, ComponentFromStream);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, _Component.call.apply(_Component, [this].concat(args))), _this), _this.state = { vdom: null }, _this.propsEmitter = (0, _changeEmitter.createChangeEmitter)(), _this.props$ = config.fromESObservable((_config$fromESObserva = {
          subscribe: function subscribe(observer) {
            var unsubscribe = _this.propsEmitter.listen(function (props) {
              return observer.next(props);
            });
            return { unsubscribe: unsubscribe };
          }
        }, _config$fromESObserva[_symbolObservable2.default] = function () {
          return this;
        }, _config$fromESObserva)), _this.vdom$ = config.toESObservable(propsToVdom(_this.props$)), _temp), _possibleConstructorReturn(_this, _ret);
      }

      // Stream of props


      // Stream of vdom


      ComponentFromStream.prototype.componentWillMount = function componentWillMount() {
        var _this2 = this;

        // Subscribe to child prop changes so we know when to re-render
        this.subscription = this.vdom$.subscribe({
          next: function next(vdom) {
            _this2.setState({ vdom: vdom });
          }
        });
        this.propsEmitter.emit(this.props);
      };

      ComponentFromStream.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
        // Receive new props from the owner
        this.propsEmitter.emit(nextProps);
      };

      ComponentFromStream.prototype.shouldComponentUpdate = function shouldComponentUpdate(nextProps, nextState) {
        return nextState.vdom !== this.state.vdom;
      };

      ComponentFromStream.prototype.componentWillUnmount = function componentWillUnmount() {
        // Clean-up subscription before un-mounting
        this.subscription.unsubscribe();
      };

      ComponentFromStream.prototype.render = function render() {
        return this.state.vdom;
      };

      return ComponentFromStream;
    }(_react.Component);
  };
};

var componentFromStream = componentFromStreamWithConfig(_setObservableConfig.config);

exports.default = componentFromStream;
},{"./setObservableConfig":44,"change-emitter":7,"react":6,"symbol-observable":60}],18:[function(require,module,exports){
"use strict";

exports.__esModule = true;
exports.default = compose;
function compose() {
  for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  if (funcs.length === 0) {
    return function (arg) {
      return arg;
    };
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  var last = funcs[funcs.length - 1];
  return function () {
    var result = last.apply(undefined, arguments);
    for (var i = funcs.length - 2; i >= 0; i--) {
      var f = funcs[i];
      result = f(result);
    }
    return result;
  };
}
},{}],19:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createEagerElementUtil = require('./utils/createEagerElementUtil');

var _createEagerElementUtil2 = _interopRequireDefault(_createEagerElementUtil);

var _isReferentiallyTransparentFunctionComponent = require('./isReferentiallyTransparentFunctionComponent');

var _isReferentiallyTransparentFunctionComponent2 = _interopRequireDefault(_isReferentiallyTransparentFunctionComponent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createEagerElement = function createEagerElement(type, props, children) {
  var isReferentiallyTransparent = (0, _isReferentiallyTransparentFunctionComponent2.default)(type);
  /* eslint-disable */
  var hasKey = props && props.hasOwnProperty('key');
  /* eslint-enable */
  return (0, _createEagerElementUtil2.default)(hasKey, isReferentiallyTransparent, type, props, children);
};

exports.default = createEagerElement;
},{"./isReferentiallyTransparentFunctionComponent":31,"./utils/createEagerElementUtil":50}],20:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createEagerElementUtil = require('./utils/createEagerElementUtil');

var _createEagerElementUtil2 = _interopRequireDefault(_createEagerElementUtil);

var _isReferentiallyTransparentFunctionComponent = require('./isReferentiallyTransparentFunctionComponent');

var _isReferentiallyTransparentFunctionComponent2 = _interopRequireDefault(_isReferentiallyTransparentFunctionComponent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createFactory = function createFactory(type) {
  var isReferentiallyTransparent = (0, _isReferentiallyTransparentFunctionComponent2.default)(type);
  return function (p, c) {
    return (0, _createEagerElementUtil2.default)(false, isReferentiallyTransparent, type, p, c);
  };
};

exports.default = createFactory;
},{"./isReferentiallyTransparentFunctionComponent":31,"./utils/createEagerElementUtil":50}],21:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.createEventHandlerWithConfig = undefined;

var _symbolObservable = require('symbol-observable');

var _symbolObservable2 = _interopRequireDefault(_symbolObservable);

var _changeEmitter = require('change-emitter');

var _setObservableConfig = require('./setObservableConfig');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createEventHandlerWithConfig = exports.createEventHandlerWithConfig = function createEventHandlerWithConfig(config) {
  return function () {
    var _config$fromESObserva;

    var emitter = (0, _changeEmitter.createChangeEmitter)();
    var stream = config.fromESObservable((_config$fromESObserva = {
      subscribe: function subscribe(observer) {
        var unsubscribe = emitter.listen(function (value) {
          return observer.next(value);
        });
        return { unsubscribe: unsubscribe };
      }
    }, _config$fromESObserva[_symbolObservable2.default] = function () {
      return this;
    }, _config$fromESObserva));
    return {
      handler: emitter.emit,
      stream: stream
    };
  };
};

var createEventHandler = createEventHandlerWithConfig(_setObservableConfig.config);

exports.default = createEventHandler;
},{"./setObservableConfig":44,"change-emitter":7,"symbol-observable":60}],22:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;
var createHelper = function createHelper(func, helperName) {
  var setDisplayName = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];
  var noArgs = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

  if (process.env.NODE_ENV !== 'production' && setDisplayName) {
    var _ret = function () {
      /* eslint-disable global-require */
      var wrapDisplayName = require('./wrapDisplayName').default;
      /* eslint-enable global-require */

      if (noArgs) {
        return {
          v: function v(BaseComponent) {
            var Component = func(BaseComponent);
            Component.displayName = wrapDisplayName(BaseComponent, helperName);
            return Component;
          }
        };
      }

      return {
        v: function v() {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          if (args.length > func.length) {
            /* eslint-disable */
            console.error(
            /* eslint-enable */
            'Too many arguments passed to ' + helperName + '(). It should called ' + ('like so: ' + helperName + '(...args)(BaseComponent).'));
          }

          return function (BaseComponent) {
            var Component = func.apply(undefined, args)(BaseComponent);
            Component.displayName = wrapDisplayName(BaseComponent, helperName);
            return Component;
          };
        }
      };
    }();

    if (typeof _ret === "object") return _ret.v;
  }

  return func;
};

exports.default = createHelper;
}).call(this,require('_process'))
},{"./wrapDisplayName":59,"_process":14}],23:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _react = require('react');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var createSink = function createSink(callback) {
  return function (_Component) {
    _inherits(Sink, _Component);

    function Sink() {
      _classCallCheck(this, Sink);

      return _possibleConstructorReturn(this, _Component.apply(this, arguments));
    }

    Sink.prototype.componentWillMount = function componentWillMount() {
      callback(this.props);
    };

    Sink.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
      callback(nextProps);
    };

    Sink.prototype.render = function render() {
      return null;
    };

    return Sink;
  }(_react.Component);
};

exports.default = createSink;
},{"react":6}],24:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

var _createEagerFactory = require('./createEagerFactory');

var _createEagerFactory2 = _interopRequireDefault(_createEagerFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultProps = function defaultProps(props) {
  return function (BaseComponent) {
    var factory = (0, _createEagerFactory2.default)(BaseComponent);
    var DefaultProps = function DefaultProps(ownerProps) {
      return factory(ownerProps);
    };
    DefaultProps.defaultProps = props;
    return DefaultProps;
  };
};

exports.default = (0, _createHelper2.default)(defaultProps, 'defaultProps');
},{"./createEagerFactory":20,"./createHelper":22}],25:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

var _createEagerFactory = require('./createEagerFactory');

var _createEagerFactory2 = _interopRequireDefault(_createEagerFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var flattenProp = function flattenProp(propName) {
  return function (BaseComponent) {
    var factory = (0, _createEagerFactory2.default)(BaseComponent);
    return function (props) {
      return factory(_extends({}, props, props[propName]));
    };
  };
};

exports.default = (0, _createHelper2.default)(flattenProp, 'flattenProp');
},{"./createEagerFactory":20,"./createHelper":22}],26:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

var _createEagerFactory = require('./createEagerFactory');

var _createEagerFactory2 = _interopRequireDefault(_createEagerFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getContext = function getContext(contextTypes) {
  return function (BaseComponent) {
    var factory = (0, _createEagerFactory2.default)(BaseComponent);
    var GetContext = function GetContext(ownerProps, context) {
      return factory(_extends({}, ownerProps, context));
    };

    GetContext.contextTypes = contextTypes;

    return GetContext;
  };
};

exports.default = (0, _createHelper2.default)(getContext, 'getContext');
},{"./createEagerFactory":20,"./createHelper":22}],27:[function(require,module,exports){
'use strict';

exports.__esModule = true;
var getDisplayName = function getDisplayName(Component) {
  if (typeof Component === 'string') {
    return Component;
  }

  if (!Component) {
    return undefined;
  }

  return Component.displayName || Component.name || 'Component';
};

exports.default = getDisplayName;
},{}],28:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _hoistNonReactStatics = require('hoist-non-react-statics');

var _hoistNonReactStatics2 = _interopRequireDefault(_hoistNonReactStatics);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var hoistStatics = function hoistStatics(higherOrderComponent) {
  return function (BaseComponent) {
    var NewComponent = higherOrderComponent(BaseComponent);
    (0, _hoistNonReactStatics2.default)(NewComponent, BaseComponent);
    return NewComponent;
  };
};

exports.default = hoistStatics;
},{"hoist-non-react-statics":9}],29:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.setObservableConfig = exports.createEventHandler = exports.mapPropsStream = exports.componentFromStream = exports.hoistStatics = exports.nest = exports.componentFromProp = exports.createSink = exports.createEagerFactory = exports.createEagerElement = exports.isClassComponent = exports.shallowEqual = exports.wrapDisplayName = exports.getDisplayName = exports.compose = exports.setDisplayName = exports.setPropTypes = exports.setStatic = exports.toClass = exports.lifecycle = exports.getContext = exports.withContext = exports.onlyUpdateForPropTypes = exports.onlyUpdateForKeys = exports.pure = exports.shouldUpdate = exports.renderNothing = exports.renderComponent = exports.branch = exports.withReducer = exports.withState = exports.flattenProp = exports.renameProps = exports.renameProp = exports.defaultProps = exports.withHandlers = exports.withPropsOnChange = exports.withProps = exports.mapProps = undefined;

var _mapProps2 = require('./mapProps');

var _mapProps3 = _interopRequireDefault(_mapProps2);

var _withProps2 = require('./withProps');

var _withProps3 = _interopRequireDefault(_withProps2);

var _withPropsOnChange2 = require('./withPropsOnChange');

var _withPropsOnChange3 = _interopRequireDefault(_withPropsOnChange2);

var _withHandlers2 = require('./withHandlers');

var _withHandlers3 = _interopRequireDefault(_withHandlers2);

var _defaultProps2 = require('./defaultProps');

var _defaultProps3 = _interopRequireDefault(_defaultProps2);

var _renameProp2 = require('./renameProp');

var _renameProp3 = _interopRequireDefault(_renameProp2);

var _renameProps2 = require('./renameProps');

var _renameProps3 = _interopRequireDefault(_renameProps2);

var _flattenProp2 = require('./flattenProp');

var _flattenProp3 = _interopRequireDefault(_flattenProp2);

var _withState2 = require('./withState');

var _withState3 = _interopRequireDefault(_withState2);

var _withReducer2 = require('./withReducer');

var _withReducer3 = _interopRequireDefault(_withReducer2);

var _branch2 = require('./branch');

var _branch3 = _interopRequireDefault(_branch2);

var _renderComponent2 = require('./renderComponent');

var _renderComponent3 = _interopRequireDefault(_renderComponent2);

var _renderNothing2 = require('./renderNothing');

var _renderNothing3 = _interopRequireDefault(_renderNothing2);

var _shouldUpdate2 = require('./shouldUpdate');

var _shouldUpdate3 = _interopRequireDefault(_shouldUpdate2);

var _pure2 = require('./pure');

var _pure3 = _interopRequireDefault(_pure2);

var _onlyUpdateForKeys2 = require('./onlyUpdateForKeys');

var _onlyUpdateForKeys3 = _interopRequireDefault(_onlyUpdateForKeys2);

var _onlyUpdateForPropTypes2 = require('./onlyUpdateForPropTypes');

var _onlyUpdateForPropTypes3 = _interopRequireDefault(_onlyUpdateForPropTypes2);

var _withContext2 = require('./withContext');

var _withContext3 = _interopRequireDefault(_withContext2);

var _getContext2 = require('./getContext');

var _getContext3 = _interopRequireDefault(_getContext2);

var _lifecycle2 = require('./lifecycle');

var _lifecycle3 = _interopRequireDefault(_lifecycle2);

var _toClass2 = require('./toClass');

var _toClass3 = _interopRequireDefault(_toClass2);

var _setStatic2 = require('./setStatic');

var _setStatic3 = _interopRequireDefault(_setStatic2);

var _setPropTypes2 = require('./setPropTypes');

var _setPropTypes3 = _interopRequireDefault(_setPropTypes2);

var _setDisplayName2 = require('./setDisplayName');

var _setDisplayName3 = _interopRequireDefault(_setDisplayName2);

var _compose2 = require('./compose');

var _compose3 = _interopRequireDefault(_compose2);

var _getDisplayName2 = require('./getDisplayName');

var _getDisplayName3 = _interopRequireDefault(_getDisplayName2);

var _wrapDisplayName2 = require('./wrapDisplayName');

var _wrapDisplayName3 = _interopRequireDefault(_wrapDisplayName2);

var _shallowEqual2 = require('./shallowEqual');

var _shallowEqual3 = _interopRequireDefault(_shallowEqual2);

var _isClassComponent2 = require('./isClassComponent');

var _isClassComponent3 = _interopRequireDefault(_isClassComponent2);

var _createEagerElement2 = require('./createEagerElement');

var _createEagerElement3 = _interopRequireDefault(_createEagerElement2);

var _createEagerFactory2 = require('./createEagerFactory');

var _createEagerFactory3 = _interopRequireDefault(_createEagerFactory2);

var _createSink2 = require('./createSink');

var _createSink3 = _interopRequireDefault(_createSink2);

var _componentFromProp2 = require('./componentFromProp');

var _componentFromProp3 = _interopRequireDefault(_componentFromProp2);

var _nest2 = require('./nest');

var _nest3 = _interopRequireDefault(_nest2);

var _hoistStatics2 = require('./hoistStatics');

var _hoistStatics3 = _interopRequireDefault(_hoistStatics2);

var _componentFromStream2 = require('./componentFromStream');

var _componentFromStream3 = _interopRequireDefault(_componentFromStream2);

var _mapPropsStream2 = require('./mapPropsStream');

var _mapPropsStream3 = _interopRequireDefault(_mapPropsStream2);

var _createEventHandler2 = require('./createEventHandler');

var _createEventHandler3 = _interopRequireDefault(_createEventHandler2);

var _setObservableConfig2 = require('./setObservableConfig');

var _setObservableConfig3 = _interopRequireDefault(_setObservableConfig2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.mapProps = _mapProps3.default; // Higher-order component helpers

exports.withProps = _withProps3.default;
exports.withPropsOnChange = _withPropsOnChange3.default;
exports.withHandlers = _withHandlers3.default;
exports.defaultProps = _defaultProps3.default;
exports.renameProp = _renameProp3.default;
exports.renameProps = _renameProps3.default;
exports.flattenProp = _flattenProp3.default;
exports.withState = _withState3.default;
exports.withReducer = _withReducer3.default;
exports.branch = _branch3.default;
exports.renderComponent = _renderComponent3.default;
exports.renderNothing = _renderNothing3.default;
exports.shouldUpdate = _shouldUpdate3.default;
exports.pure = _pure3.default;
exports.onlyUpdateForKeys = _onlyUpdateForKeys3.default;
exports.onlyUpdateForPropTypes = _onlyUpdateForPropTypes3.default;
exports.withContext = _withContext3.default;
exports.getContext = _getContext3.default;
exports.lifecycle = _lifecycle3.default;
exports.toClass = _toClass3.default;

// Static property helpers

exports.setStatic = _setStatic3.default;
exports.setPropTypes = _setPropTypes3.default;
exports.setDisplayName = _setDisplayName3.default;

// Composition function

exports.compose = _compose3.default;

// Other utils

exports.getDisplayName = _getDisplayName3.default;
exports.wrapDisplayName = _wrapDisplayName3.default;
exports.shallowEqual = _shallowEqual3.default;
exports.isClassComponent = _isClassComponent3.default;
exports.createEagerElement = _createEagerElement3.default;
exports.createEagerFactory = _createEagerFactory3.default;
exports.createSink = _createSink3.default;
exports.componentFromProp = _componentFromProp3.default;
exports.nest = _nest3.default;
exports.hoistStatics = _hoistStatics3.default;

// Observable helpers

exports.componentFromStream = _componentFromStream3.default;
exports.mapPropsStream = _mapPropsStream3.default;
exports.createEventHandler = _createEventHandler3.default;
exports.setObservableConfig = _setObservableConfig3.default;
},{"./branch":15,"./componentFromProp":16,"./componentFromStream":17,"./compose":18,"./createEagerElement":19,"./createEagerFactory":20,"./createEventHandler":21,"./createSink":23,"./defaultProps":24,"./flattenProp":25,"./getContext":26,"./getDisplayName":27,"./hoistStatics":28,"./isClassComponent":30,"./lifecycle":32,"./mapProps":33,"./mapPropsStream":34,"./nest":35,"./onlyUpdateForKeys":36,"./onlyUpdateForPropTypes":37,"./pure":38,"./renameProp":39,"./renameProps":40,"./renderComponent":41,"./renderNothing":42,"./setDisplayName":43,"./setObservableConfig":44,"./setPropTypes":45,"./setStatic":46,"./shallowEqual":47,"./shouldUpdate":48,"./toClass":49,"./withContext":53,"./withHandlers":54,"./withProps":55,"./withPropsOnChange":56,"./withReducer":57,"./withState":58,"./wrapDisplayName":59}],30:[function(require,module,exports){
'use strict';

exports.__esModule = true;
var isClassComponent = function isClassComponent(Component) {
  return Boolean(Component && Component.prototype && typeof Component.prototype.isReactComponent === 'object');
};

exports.default = isClassComponent;
},{}],31:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _isClassComponent = require('./isClassComponent.js');

var _isClassComponent2 = _interopRequireDefault(_isClassComponent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isReferentiallyTransparentFunctionComponent = function isReferentiallyTransparentFunctionComponent(Component) {
  return Boolean(typeof Component === 'function' && !(0, _isClassComponent2.default)(Component) && !Component.defaultProps && !Component.contextTypes && !Component.propTypes);
};

exports.default = isReferentiallyTransparentFunctionComponent;
},{"./isClassComponent.js":30}],32:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

var _createEagerFactory = require('./createEagerFactory');

var _createEagerFactory2 = _interopRequireDefault(_createEagerFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var lifecycle = function lifecycle(spec) {
  return function (BaseComponent) {
    var factory = (0, _createEagerFactory2.default)(BaseComponent);

    if (process.env.NODE_ENV !== 'production' && spec.hasOwnProperty('render')) {
      console.error('lifecycle() does not support the render method; its behavior is to ' + 'pass all props and state to the base component.');
    }

    /* eslint-disable react/prefer-es6-class */
    return (0, _react.createClass)(_extends({}, spec, {
      render: function render() {
        return factory(_extends({}, this.props, this.state));
      }
    }));
    /* eslint-enable react/prefer-es6-class */
  };
};

exports.default = (0, _createHelper2.default)(lifecycle, 'lifecycle');
}).call(this,require('_process'))
},{"./createEagerFactory":20,"./createHelper":22,"_process":14,"react":6}],33:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

var _createEagerFactory = require('./createEagerFactory');

var _createEagerFactory2 = _interopRequireDefault(_createEagerFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mapProps = function mapProps(propsMapper) {
  return function (BaseComponent) {
    var factory = (0, _createEagerFactory2.default)(BaseComponent);
    return function (props) {
      return factory(propsMapper(props));
    };
  };
};

exports.default = (0, _createHelper2.default)(mapProps, 'mapProps');
},{"./createEagerFactory":20,"./createHelper":22}],34:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.mapPropsStreamWithConfig = undefined;

var _symbolObservable = require('symbol-observable');

var _symbolObservable2 = _interopRequireDefault(_symbolObservable);

var _createEagerFactory = require('./createEagerFactory');

var _createEagerFactory2 = _interopRequireDefault(_createEagerFactory);

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

var _componentFromStream = require('./componentFromStream');

var _setObservableConfig = require('./setObservableConfig');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var identity = function identity(t) {
  return t;
};
var componentFromStream = (0, _componentFromStream.componentFromStreamWithConfig)({
  fromESObservable: identity,
  toESObservable: identity
});

var mapPropsStreamWithConfig = exports.mapPropsStreamWithConfig = function mapPropsStreamWithConfig(config) {
  return function (transform) {
    return function (BaseComponent) {
      var factory = (0, _createEagerFactory2.default)(BaseComponent);
      var fromESObservable = config.fromESObservable;
      var toESObservable = config.toESObservable;

      return componentFromStream(function (props$) {
        var _ref;

        return _ref = {
          subscribe: function subscribe(observer) {
            var subscription = toESObservable(transform(fromESObservable(props$))).subscribe({
              next: function next(childProps) {
                return observer.next(factory(childProps));
              }
            });
            return {
              unsubscribe: function unsubscribe() {
                return subscription.unsubscribe();
              }
            };
          }
        }, _ref[_symbolObservable2.default] = function () {
          return this;
        }, _ref;
      });
    };
  };
};

var mapPropsStream = mapPropsStreamWithConfig(_setObservableConfig.config);

exports.default = (0, _createHelper2.default)(mapPropsStream, 'mapPropsStream');
},{"./componentFromStream":17,"./createEagerFactory":20,"./createHelper":22,"./setObservableConfig":44,"symbol-observable":60}],35:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _createEagerFactory = require('./createEagerFactory');

var _createEagerFactory2 = _interopRequireDefault(_createEagerFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var nest = function nest() {
  for (var _len = arguments.length, Components = Array(_len), _key = 0; _key < _len; _key++) {
    Components[_key] = arguments[_key];
  }

  var factories = Components.map(_createEagerFactory2.default);
  var Nest = function Nest(_ref) {
    var props = _objectWithoutProperties(_ref, []);

    var children = _ref.children;
    return factories.reduceRight(function (child, factory) {
      return factory(props, child);
    }, children);
  };

  if (process.env.NODE_ENV !== 'production') {
    /* eslint-disable global-require */
    var getDisplayName = require('./getDisplayName').default;
    /* eslint-enable global-require */
    var displayNames = Components.map(getDisplayName);
    Nest.displayName = 'nest(' + displayNames.join(', ') + ')';
  }

  return Nest;
};

exports.default = nest;
}).call(this,require('_process'))
},{"./createEagerFactory":20,"./getDisplayName":27,"_process":14}],36:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _shouldUpdate = require('./shouldUpdate');

var _shouldUpdate2 = _interopRequireDefault(_shouldUpdate);

var _shallowEqual = require('./shallowEqual');

var _shallowEqual2 = _interopRequireDefault(_shallowEqual);

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

var _pick = require('./utils/pick');

var _pick2 = _interopRequireDefault(_pick);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var onlyUpdateForKeys = function onlyUpdateForKeys(propKeys) {
  return (0, _shouldUpdate2.default)(function (props, nextProps) {
    return !(0, _shallowEqual2.default)((0, _pick2.default)(nextProps, propKeys), (0, _pick2.default)(props, propKeys));
  });
};

exports.default = (0, _createHelper2.default)(onlyUpdateForKeys, 'onlyUpdateForKeys');
},{"./createHelper":22,"./shallowEqual":47,"./shouldUpdate":48,"./utils/pick":52}],37:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _onlyUpdateForKeys = require('./onlyUpdateForKeys');

var _onlyUpdateForKeys2 = _interopRequireDefault(_onlyUpdateForKeys);

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var onlyUpdateForPropTypes = function onlyUpdateForPropTypes(BaseComponent) {
  var propTypes = BaseComponent.propTypes;

  if (process.env.NODE_ENV !== 'production') {
    /* eslint-disable global-require */
    var getDisplayName = require('./getDisplayName').default;
    /* eslint-enable global-require */
    if (!propTypes) {
      /* eslint-disable */
      console.error('A component without any `propTypes` was passed to ' + '`onlyUpdateForPropTypes()`. Check the implementation of the ' + ('component with display name "' + getDisplayName(BaseComponent) + '".'));
      /* eslint-enable */
    }
  }

  var propKeys = Object.keys(propTypes || {});
  var OnlyUpdateForPropTypes = (0, _onlyUpdateForKeys2.default)(propKeys)(BaseComponent);

  return OnlyUpdateForPropTypes;
};

exports.default = (0, _createHelper2.default)(onlyUpdateForPropTypes, 'onlyUpdateForPropTypes', true, true);
}).call(this,require('_process'))
},{"./createHelper":22,"./getDisplayName":27,"./onlyUpdateForKeys":36,"_process":14}],38:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _shouldUpdate = require('./shouldUpdate');

var _shouldUpdate2 = _interopRequireDefault(_shouldUpdate);

var _shallowEqual = require('./shallowEqual');

var _shallowEqual2 = _interopRequireDefault(_shallowEqual);

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pure = (0, _shouldUpdate2.default)(function (props, nextProps) {
  return !(0, _shallowEqual2.default)(props, nextProps);
});

exports.default = (0, _createHelper2.default)(pure, 'pure', true, true);
},{"./createHelper":22,"./shallowEqual":47,"./shouldUpdate":48}],39:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _omit = require('./utils/omit');

var _omit2 = _interopRequireDefault(_omit);

var _mapProps = require('./mapProps');

var _mapProps2 = _interopRequireDefault(_mapProps);

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var renameProp = function renameProp(oldName, newName) {
  return (0, _mapProps2.default)(function (props) {
    var _extends2;

    return _extends({}, (0, _omit2.default)(props, [oldName]), (_extends2 = {}, _extends2[newName] = props[oldName], _extends2));
  });
};

exports.default = (0, _createHelper2.default)(renameProp, 'renameProp');
},{"./createHelper":22,"./mapProps":33,"./utils/omit":51}],40:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _omit = require('./utils/omit');

var _omit2 = _interopRequireDefault(_omit);

var _pick = require('./utils/pick');

var _pick2 = _interopRequireDefault(_pick);

var _mapProps = require('./mapProps');

var _mapProps2 = _interopRequireDefault(_mapProps);

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var keys = Object.keys;


var mapKeys = function mapKeys(obj, func) {
  return keys(obj).reduce(function (result, key) {
    var val = obj[key];
    /* eslint-disable no-param-reassign */
    result[func(val, key)] = val;
    /* eslint-enable no-param-reassign */
    return result;
  }, {});
};

var renameProps = function renameProps(nameMap) {
  return (0, _mapProps2.default)(function (props) {
    return _extends({}, (0, _omit2.default)(props, keys(nameMap)), mapKeys((0, _pick2.default)(props, keys(nameMap)), function (_, oldName) {
      return nameMap[oldName];
    }));
  });
};

exports.default = (0, _createHelper2.default)(renameProps, 'renameProps');
},{"./createHelper":22,"./mapProps":33,"./utils/omit":51,"./utils/pick":52}],41:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

var _createEagerFactory = require('./createEagerFactory');

var _createEagerFactory2 = _interopRequireDefault(_createEagerFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import React from 'react'


var renderComponent = function renderComponent(Component) {
  return function (_) {
    var factory = (0, _createEagerFactory2.default)(Component);
    var RenderComponent = function RenderComponent(props) {
      return factory(props);
    };
    // const RenderComponent = props => <Component {...props} />
    if (process.env.NODE_ENV !== 'production') {
      /* eslint-disable global-require */
      var wrapDisplayName = require('./wrapDisplayName').default;
      /* eslint-enable global-require */
      RenderComponent.displayName = wrapDisplayName(Component, 'renderComponent');
    }
    return RenderComponent;
  };
};

exports.default = (0, _createHelper2.default)(renderComponent, 'renderComponent', false);
}).call(this,require('_process'))
},{"./createEagerFactory":20,"./createHelper":22,"./wrapDisplayName":59,"_process":14}],42:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var renderNothing = function renderNothing(_) {
  var Nothing = function Nothing() {
    return null;
  };
  Nothing.displayName = 'Nothing';
  return Nothing;
};

exports.default = (0, _createHelper2.default)(renderNothing, 'renderNothing', false, true);
},{"./createHelper":22}],43:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _setStatic = require('./setStatic');

var _setStatic2 = _interopRequireDefault(_setStatic);

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var setDisplayName = function setDisplayName(displayName) {
  return (0, _setStatic2.default)('displayName', displayName);
};

exports.default = (0, _createHelper2.default)(setDisplayName, 'setDisplayName', false);
},{"./createHelper":22,"./setStatic":46}],44:[function(require,module,exports){
'use strict';

exports.__esModule = true;
var _config = {
  fromESObservable: null,
  toESObservable: null
};

var configureObservable = function configureObservable(c) {
  _config = c;
};

var config = exports.config = {
  fromESObservable: function fromESObservable(observable) {
    return typeof _config.fromESObservable === 'function' ? _config.fromESObservable(observable) : observable;
  },
  toESObservable: function toESObservable(stream) {
    return typeof _config.toESObservable === 'function' ? _config.toESObservable(stream) : stream;
  }
};

exports.default = configureObservable;
},{}],45:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _setStatic = require('./setStatic');

var _setStatic2 = _interopRequireDefault(_setStatic);

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var setPropTypes = function setPropTypes(propTypes) {
  return (0, _setStatic2.default)('propTypes', propTypes);
};

exports.default = (0, _createHelper2.default)(setPropTypes, 'setPropTypes', false);
},{"./createHelper":22,"./setStatic":46}],46:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var setStatic = function setStatic(key, value) {
  return function (BaseComponent) {
    /* eslint-disable no-param-reassign */
    BaseComponent[key] = value;
    /* eslint-enable no-param-reassign */
    return BaseComponent;
  };
};

exports.default = (0, _createHelper2.default)(setStatic, 'setStatic', false);
},{"./createHelper":22}],47:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _shallowEqual = require('fbjs/lib/shallowEqual');

var _shallowEqual2 = _interopRequireDefault(_shallowEqual);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _shallowEqual2.default;
},{"fbjs/lib/shallowEqual":8}],48:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _react = require('react');

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

var _createEagerFactory = require('./createEagerFactory');

var _createEagerFactory2 = _interopRequireDefault(_createEagerFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var shouldUpdate = function shouldUpdate(test) {
  return function (BaseComponent) {
    var factory = (0, _createEagerFactory2.default)(BaseComponent);
    return function (_Component) {
      _inherits(_class, _Component);

      function _class() {
        _classCallCheck(this, _class);

        return _possibleConstructorReturn(this, _Component.apply(this, arguments));
      }

      _class.prototype.shouldComponentUpdate = function shouldComponentUpdate(nextProps) {
        return test(this.props, nextProps);
      };

      _class.prototype.render = function render() {
        return factory(this.props);
      };

      return _class;
    }(_react.Component);
  };
};

exports.default = (0, _createHelper2.default)(shouldUpdate, 'shouldUpdate');
},{"./createEagerFactory":20,"./createHelper":22,"react":6}],49:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _getDisplayName = require('./getDisplayName');

var _getDisplayName2 = _interopRequireDefault(_getDisplayName);

var _isClassComponent = require('./isClassComponent');

var _isClassComponent2 = _interopRequireDefault(_isClassComponent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var toClass = function toClass(baseComponent) {
  if ((0, _isClassComponent2.default)(baseComponent)) {
    return baseComponent;
  }

  var ToClass = function (_Component) {
    _inherits(ToClass, _Component);

    function ToClass() {
      _classCallCheck(this, ToClass);

      return _possibleConstructorReturn(this, _Component.apply(this, arguments));
    }

    ToClass.prototype.render = function render() {
      if (typeof baseComponent === 'string') {
        return _react2.default.createElement('baseComponent', this.props);
      }
      return baseComponent(this.props, this.context);
    };

    return ToClass;
  }(_react.Component);

  ToClass.displayName = (0, _getDisplayName2.default)(baseComponent);
  ToClass.propTypes = baseComponent.propTypes;
  ToClass.contextTypes = baseComponent.contextTypes;
  ToClass.defaultProps = baseComponent.defaultProps;

  return ToClass;
};

exports.default = toClass;
},{"./getDisplayName":27,"./isClassComponent":30,"react":6}],50:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createEagerElementUtil = function createEagerElementUtil(hasKey, isReferentiallyTransparent, type, props, children) {
  if (!hasKey && isReferentiallyTransparent) {
    if (children) {
      return type(_extends({}, props, { children: children }));
    }
    return type(props);
  }

  var Component = type;

  if (children) {
    return _react2.default.createElement(
      Component,
      props,
      children
    );
  }

  return _react2.default.createElement(Component, props);
};

exports.default = createEagerElementUtil;
},{"react":6}],51:[function(require,module,exports){
"use strict";

exports.__esModule = true;

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var omit = function omit(obj, keys) {
  var rest = _objectWithoutProperties(obj, []);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (rest.hasOwnProperty(key)) {
      delete rest[key];
    }
  }
  return rest;
};

exports.default = omit;
},{}],52:[function(require,module,exports){
"use strict";

exports.__esModule = true;
var pick = function pick(obj, keys) {
  var result = {};
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
  }
  return result;
};

exports.default = pick;
},{}],53:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _react = require('react');

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

var _createEagerFactory = require('./createEagerFactory');

var _createEagerFactory2 = _interopRequireDefault(_createEagerFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var withContext = function withContext(childContextTypes, getChildContext) {
  return function (BaseComponent) {
    var factory = (0, _createEagerFactory2.default)(BaseComponent);

    var WithContext = function (_Component) {
      _inherits(WithContext, _Component);

      function WithContext() {
        var _temp, _this, _ret;

        _classCallCheck(this, WithContext);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, _Component.call.apply(_Component, [this].concat(args))), _this), _this.getChildContext = function () {
          return getChildContext(_this.props);
        }, _temp), _possibleConstructorReturn(_this, _ret);
      }

      WithContext.prototype.render = function render() {
        return factory(this.props);
      };

      return WithContext;
    }(_react.Component);

    WithContext.childContextTypes = childContextTypes;

    return WithContext;
  };
};

exports.default = (0, _createHelper2.default)(withContext, 'withContext');
},{"./createEagerFactory":20,"./createHelper":22,"react":6}],54:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _createEagerFactory = require('./createEagerFactory');

var _createEagerFactory2 = _interopRequireDefault(_createEagerFactory);

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var mapValues = function mapValues(obj, func) {
  var result = [];
  var i = 0;
  /* eslint-disable no-restricted-syntax */
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      i += 1;
      result[key] = func(obj[key], key, i);
    }
  }
  /* eslint-enable no-restricted-syntax */
  return result;
};

var withHandlers = function withHandlers(handlers) {
  return function (BaseComponent) {
    var _class, _temp2, _initialiseProps;

    var factory = (0, _createEagerFactory2.default)(BaseComponent);
    return _temp2 = _class = function (_Component) {
      _inherits(_class, _Component);

      function _class() {
        var _temp, _this, _ret;

        _classCallCheck(this, _class);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, _Component.call.apply(_Component, [this].concat(args))), _this), _initialiseProps.call(_this), _temp), _possibleConstructorReturn(_this, _ret);
      }

      _class.prototype.componentWillReceiveProps = function componentWillReceiveProps() {
        this.cachedHandlers = {};
      };

      _class.prototype.render = function render() {
        return factory(_extends({}, this.props, this.handlers));
      };

      return _class;
    }(_react.Component), _initialiseProps = function _initialiseProps() {
      var _this2 = this;

      this.cachedHandlers = {};
      this.handlers = mapValues(handlers, function (createHandler, handlerName) {
        return function () {
          var cachedHandler = _this2.cachedHandlers[handlerName];
          if (cachedHandler) {
            return cachedHandler.apply(undefined, arguments);
          }

          var handler = createHandler(_this2.props);
          _this2.cachedHandlers[handlerName] = handler;

          if (process.env.NODE_ENV !== 'production' && typeof handler !== 'function') {
            console.error('withHandlers(): Expected a map of higher-order functions. ' + 'Refer to the docs for more info.');
          }

          return handler.apply(undefined, arguments);
        };
      });
    }, _temp2;
  };
};

exports.default = (0, _createHelper2.default)(withHandlers, 'withHandlers');
}).call(this,require('_process'))
},{"./createEagerFactory":20,"./createHelper":22,"_process":14,"react":6}],55:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

var _mapProps = require('./mapProps');

var _mapProps2 = _interopRequireDefault(_mapProps);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var withProps = function withProps(input) {
  return (0, _mapProps2.default)(function (props) {
    return _extends({}, props, typeof input === 'function' ? input(props) : input);
  });
};

exports.default = (0, _createHelper2.default)(withProps, 'withProps');
},{"./createHelper":22,"./mapProps":33}],56:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _pick = require('./utils/pick');

var _pick2 = _interopRequireDefault(_pick);

var _shallowEqual = require('./shallowEqual');

var _shallowEqual2 = _interopRequireDefault(_shallowEqual);

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

var _createEagerFactory = require('./createEagerFactory');

var _createEagerFactory2 = _interopRequireDefault(_createEagerFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var withPropsOnChange = function withPropsOnChange(shouldMapOrKeys, propsMapper) {
  return function (BaseComponent) {
    var factory = (0, _createEagerFactory2.default)(BaseComponent);
    var shouldMap = typeof shouldMapOrKeys === 'function' ? shouldMapOrKeys : function (props, nextProps) {
      return !(0, _shallowEqual2.default)((0, _pick2.default)(props, shouldMapOrKeys), (0, _pick2.default)(nextProps, shouldMapOrKeys));
    };

    return function (_Component) {
      _inherits(_class2, _Component);

      function _class2() {
        var _temp, _this, _ret;

        _classCallCheck(this, _class2);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, _Component.call.apply(_Component, [this].concat(args))), _this), _this.computedProps = propsMapper(_this.props), _temp), _possibleConstructorReturn(_this, _ret);
      }

      _class2.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
        if (shouldMap(this.props, nextProps)) {
          this.computedProps = propsMapper(nextProps);
        }
      };

      _class2.prototype.render = function render() {
        return factory(_extends({}, this.props, this.computedProps));
      };

      return _class2;
    }(_react.Component);
  };
};

exports.default = (0, _createHelper2.default)(withPropsOnChange, 'withPropsOnChange');
},{"./createEagerFactory":20,"./createHelper":22,"./shallowEqual":47,"./utils/pick":52,"react":6}],57:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

var _createEagerFactory = require('./createEagerFactory');

var _createEagerFactory2 = _interopRequireDefault(_createEagerFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var withReducer = function withReducer(stateName, dispatchName, reducer, initialState) {
  return function (BaseComponent) {
    var factory = (0, _createEagerFactory2.default)(BaseComponent);
    return function (_Component) {
      _inherits(_class2, _Component);

      function _class2() {
        var _temp, _this, _ret;

        _classCallCheck(this, _class2);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, _Component.call.apply(_Component, [this].concat(args))), _this), _this.state = {
          stateValue: typeof initialState === 'function' ? initialState(_this.props) : initialState
        }, _this.dispatch = function (action) {
          return _this.setState(function (_ref) {
            var stateValue = _ref.stateValue;
            return {
              stateValue: reducer(stateValue, action)
            };
          });
        }, _temp), _possibleConstructorReturn(_this, _ret);
      }

      _class2.prototype.render = function render() {
        var _extends2;

        return factory(_extends({}, this.props, (_extends2 = {}, _extends2[stateName] = this.state.stateValue, _extends2[dispatchName] = this.dispatch, _extends2)));
      };

      return _class2;
    }(_react.Component);
  };
};

exports.default = (0, _createHelper2.default)(withReducer, 'withReducer');
},{"./createEagerFactory":20,"./createHelper":22,"react":6}],58:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _createHelper = require('./createHelper');

var _createHelper2 = _interopRequireDefault(_createHelper);

var _createEagerFactory = require('./createEagerFactory');

var _createEagerFactory2 = _interopRequireDefault(_createEagerFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var withState = function withState(stateName, stateUpdaterName, initialState) {
  return function (BaseComponent) {
    var factory = (0, _createEagerFactory2.default)(BaseComponent);
    return function (_Component) {
      _inherits(_class2, _Component);

      function _class2() {
        var _temp, _this, _ret;

        _classCallCheck(this, _class2);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, _Component.call.apply(_Component, [this].concat(args))), _this), _this.state = {
          stateValue: typeof initialState === 'function' ? initialState(_this.props) : initialState
        }, _this.updateStateValue = function (updateFn, callback) {
          return _this.setState(function (_ref) {
            var stateValue = _ref.stateValue;
            return {
              stateValue: typeof updateFn === 'function' ? updateFn(stateValue) : updateFn
            };
          }, callback);
        }, _temp), _possibleConstructorReturn(_this, _ret);
      }

      _class2.prototype.render = function render() {
        var _extends2;

        return factory(_extends({}, this.props, (_extends2 = {}, _extends2[stateName] = this.state.stateValue, _extends2[stateUpdaterName] = this.updateStateValue, _extends2)));
      };

      return _class2;
    }(_react.Component);
  };
};

exports.default = (0, _createHelper2.default)(withState, 'withState');
},{"./createEagerFactory":20,"./createHelper":22,"react":6}],59:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _getDisplayName = require('./getDisplayName');

var _getDisplayName2 = _interopRequireDefault(_getDisplayName);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var wrapDisplayName = function wrapDisplayName(BaseComponent, hocName) {
  return hocName + '(' + (0, _getDisplayName2.default)(BaseComponent) + ')';
};

exports.default = wrapDisplayName;
},{"./getDisplayName":27}],60:[function(require,module,exports){
(function (global){
/* global window */
'use strict';

module.exports = require('./ponyfill')(global || window || this);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./ponyfill":61}],61:[function(require,module,exports){
'use strict';

module.exports = function symbolObservablePonyfill(root) {
	var result;
	var Symbol = root.Symbol;

	if (typeof Symbol === 'function') {
		if (Symbol.observable) {
			result = Symbol.observable;
		} else {
			result = Symbol('observable');
			Symbol.observable = result;
		}
	} else {
		result = '@@observable';
	}

	return result;
};

},{}]},{},[3]);

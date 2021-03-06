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
//# sourceMappingURL=graphql.js.map
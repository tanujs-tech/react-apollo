import ApolloProvider from './ApolloProvider';
import graphql, { withApollo } from './graphql';

// expose easy way to join queries from recompose
const compose = require('recompose').compose;

export { ApolloProvider, graphql, withApollo, compose };

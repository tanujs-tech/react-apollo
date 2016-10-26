import ApolloProvider from './ApolloProvider';
import graphql, { withApollo } from './graphql';

// expose easy way to join queries from recompose
const compose = require('recompose').compose; // tslint:disable-line

export { ApolloProvider, graphql, withApollo, compose };

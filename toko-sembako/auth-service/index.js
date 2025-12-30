const { ApolloServer, gql } = require("apollo-server");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const users = [];

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    _empty: String
  }

  type Mutation {
    register(email: String!, password: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
  }
`;

const resolvers = {
  Mutation: {
    register: async (_, { email, password }) => {
      const hash = await bcrypt.hash(password, 10);
      const user = { id: users.length + 1, email, password: hash };
      users.push(user);
      const token = jwt.sign({ userId: user.id }, "SECRET");
      return { token, user };
    },
    login: async (_, { email, password }) => {
      const user = users.find(u => u.email === email);
      if (!user) throw new Error("User not found");
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error("Wrong password");
      const token = jwt.sign({ userId: user.id }, "SECRET");
      return { token, user };
    }
  }
};

new ApolloServer({ typeDefs, resolvers })
  .listen({ port: 4000 })
  .then(() => console.log("Auth Service running on 4003"));

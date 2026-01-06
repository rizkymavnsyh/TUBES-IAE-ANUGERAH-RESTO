const { ApolloServer, gql } = require("apollo-server");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query, queryInsert } = require("../db/config");

const JWT_SECRET = process.env.JWT_SECRET || "SECRET";

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
    me: User
    _empty: String
  }

  type Mutation {
    register(email: String!, password: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
  }
`;

const resolvers = {
  Query: {
    me: async (_, __, context) => {
      // This would need token from context - simplified for now
      return null;
    },
    _empty: () => null
  },

  Mutation: {
    register: async (_, { email, password }) => {
      // Check if user already exists
      const existing = await query("SELECT id FROM users WHERE email = ?", [email]);
      if (existing.length > 0) {
        throw new Error("Email already registered");
      }

      const hash = await bcrypt.hash(password, 10);
      const result = await queryInsert(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        [email, hash]
      );

      const user = { id: result.insertId, email };
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);

      return { token, user };
    },

    login: async (_, { email, password }) => {
      const rows = await query("SELECT * FROM users WHERE email = ?", [email]);
      const user = rows[0];

      if (!user) throw new Error("User not found");

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error("Wrong password");

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);

      return {
        token,
        user: { id: user.id, email: user.email }
      };
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

module.exports = { typeDefs, resolvers };

if (require.main === module) {
  server.listen({ port: 4003 }).then(() => console.log("🔐 Auth Service running on http://localhost:4003"));
}

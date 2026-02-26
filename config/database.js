const path = require('path');

// When DATABASE_URL is set (e.g. production, Strapi Cloud), use PostgreSQL so CLI commands
// (admin:create-user, etc.) never try to load SQLite/better-sqlite3.
module.exports = ({ env }) => {
  const databaseUrl = env('DATABASE_URL');
  if (databaseUrl) {
    const parse = require('pg-connection-string').parse;
    const config = parse(databaseUrl);
    return {
      connection: {
        client: 'postgres',
        connection: {
          host: config.host,
          port: config.port,
          database: config.database,
          user: config.user,
          password: config.password,
          ssl: { rejectUnauthorized: false },
        },
        debug: false,
      },
    };
  }
  return {
    connection: {
      client: 'sqlite',
      connection: {
        filename: path.join(__dirname, '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },
  };
};

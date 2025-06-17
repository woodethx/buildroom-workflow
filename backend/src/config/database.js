const { Sequelize } = require('sequelize');

// Parse database URL or use individual config
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  return {
    database: process.env.DB_NAME || 'buildroom_db',
    username: process.env.DB_USER || 'buildroom_user',
    password: process.env.DB_PASSWORD || 'changeme',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres'
  };
};

// Initialize Sequelize
const sequelize = new Sequelize(getDatabaseConfig(), {
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = { sequelize };
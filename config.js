module.exports = {
    PORT: process.env.PORT || 5000,
    DB_HOST: process.env.DB_HOST || "localhost",
    DB_USER: process.env.DB_USER ||  "root",
    DB_PASSWORD: process.env.DB_PASSWORD || "SusSand#",
    DB_NAME: process.env.DB_NAME || "negocio",
    DB_PORT : process.env.DB_PORT || 3306,
    ORIGIN: process.env.ORIGIN || "http://localhost:3000"
  };
module.exports = {
    PORT: process.env.PORT || //PORT,
    DB_HOST: process.env.DB_HOST || "localhost",
    DB_USER: process.env.DB_USER ||  "root",
    DB_PASSWORD: process.env.DB_PASSWORD || //PASSWORD,
    DB_NAME: process.env.DB_NAME || "negocio",
    DB_PORT : process.env.DB_PORT || //PORT DB,
    ORIGIN: process.env.ORIGIN || //"http://localhost:3000",
    MYSQL_PRIVATE_URL: process.env.MYSQL_PRIVATE_URL
  };

const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Applizor Softech ERP API',
    description: 'Dynamic End-to-End API Documentation with Integration Details',
  },
  host: 'localhost:5000',
  schemes: ['http', 'https'],
  securityDefinitions: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  }
};

const outputFile = './src/swagger.json';
const routes = ['./src/server.ts'];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen(outputFile, routes, doc).then(() => {
    console.log('Swagger JSON generated at ./src/swagger.json');
});

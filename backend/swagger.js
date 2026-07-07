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

const TIMEOUT_MS = 30000;
const timer = setTimeout(() => {
    console.error('Swagger generation timed out after ' + TIMEOUT_MS + 'ms');
    process.exit(0);
}, TIMEOUT_MS);

swaggerAutogen(outputFile, routes, doc).then(() => {
    clearTimeout(timer);
    console.log('Swagger JSON generated at ./src/swagger.json');
    process.exit(0);
}).catch(err => {
    clearTimeout(timer);
    console.error('Swagger generation failed:', err);
    process.exit(0);
});

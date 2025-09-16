import { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

export function setupSwagger(app: Express): void {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Image Upload API",
        version: "1.0.0",
        description: "API documentation for the image upload service",
      },
    },
    apis: ["./src/routes/*.ts"], 
  };

  const swaggerSpec = swaggerJsdoc(options);

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

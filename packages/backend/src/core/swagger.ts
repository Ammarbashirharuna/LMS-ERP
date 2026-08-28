import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import yaml from "yamljs";
import path from "path";

const spec = yaml.load(path.join(__dirname, "..", "..", "docs", "openapi.yaml"));

export function setupSwagger(app: Express): void {
  // JSON endpoint must be registered before swagger-ui middleware
  app.get("/api/docs/json", (_req, res) => {
    res.json(spec);
  });

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(spec, {
    customCss: ".swagger-ui-wrap { max-width: 1000px; }",
    customSiteTitle: "Montessori ERP API Docs",
  }));
}

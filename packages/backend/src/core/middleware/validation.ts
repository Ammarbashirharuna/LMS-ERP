import { AnyZodObject } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: AnyZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Try wrapped format first (schemas with body/query/params keys)
      const keys = Object.keys(schema.shape || {});
      if (keys.includes("body") || keys.includes("query") || keys.includes("params")) {
        schema.parse({
          body: req.body,
          query: req.query,
          params: req.params,
        });
      } else {
        // Flat format — validate body directly
        schema.parse(req.body);
      }
      next();
    } catch (error: unknown) {
      const zodError = error as { errors?: Array<{ message: string }> };
      const message = zodError.errors?.map((e) => e.message).join(", ") || "Validation failed";
      return req.res?.status(400).json({ error: "Validation failed", details: message });
    }
  };

import { Router, Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { validate } from "../../core/middleware/validation";
import { AuthRequest, authenticate } from "../../core/middleware/auth.middleware";

const router = Router();

const registerSchema = z.object({
  body: z.object({
    schoolName: z.string().min(2, "School name must be at least 2 characters"),
    subdomain: z.string().min(3, "Subdomain must be at least 3 characters").max(30),
    adminEmail: z.string().email("Invalid email address"),
    adminPassword: z.string().min(8, "Password must be at least 8 characters"),
    adminFirstName: z.string().optional(),
    adminLastName: z.string().optional(),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

const isPrismaError = (e: unknown): e is Error & { code: string } =>
  e instanceof Error && "code" in e;

router.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const result = await AuthService.registerTenant(req.body);
    const user = await AuthService.login({ email: req.body.adminEmail, password: req.body.adminPassword });
    res.status(201).json({
      message: "Tenant and admin user created successfully",
      tenant: { id: result.tenant.id, name: result.tenant.name, subdomain: result.tenant.subdomain },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: user.user,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Registration failed";
    if (isPrismaError(error) && error.code === "P2002") {
      return res.status(409).json({ error: "A school with this subdomain or email already exists" });
    }
    res.status(400).json({ error: message });
  }
});

router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const result = await AuthService.login(req.body);
    res.json({
      message: "Login successful",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Login failed";
    res.status(401).json({ error: message });
  }
});

router.post("/refresh", validate(refreshTokenSchema), async (req: Request, res: Response) => {
  try {
    const { accessToken } = await AuthService.refreshToken(req.body.refreshToken);
    res.json({ accessToken });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Token refresh failed";
    res.status(401).json({ error: message });
  }
});

router.post("/logout", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await AuthService.logout(req.user!.id);
    res.json({ message: "Logout successful" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Logout failed";
    res.status(400).json({ error: message });
  }
});

export default router;

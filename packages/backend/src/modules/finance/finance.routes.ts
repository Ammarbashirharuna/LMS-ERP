import { Router, Response } from "express";
import { z } from "zod";
import { FinanceService } from "./finance.service";
import { validate } from "../../core/middleware/validation";
import { authenticate, AuthRequest } from "../../core/middleware/auth.middleware";
import { requirePermission } from "../../core/middleware/rbac.middleware";
import { auditLogMiddleware } from "../../core/middleware/audit.middleware";
import { feeStructureSchema, invoiceSchema, paymentSchema } from "./finance.schema";
import { InvoiceStatus } from "@prisma/client";
import { initializePaystackTransaction, verifyPaystackTransaction, isPaystackConfigured } from "../../services/paystack";

const router = Router();

router.get(
  "/fee-structures",
  authenticate,
  requirePermission("finance", "read"),
  async (_req: AuthRequest, res: Response) => {
    try {
      const structures = await FinanceService.getFeeStructures(_req.user!.tenantId);
      res.json({ data: structures });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch fee structures";
      res.status(500).json({ error: message });
    }
  },
);

router.post(
  "/fee-structures",
  authenticate,
  requirePermission("finance", "write"),
  auditLogMiddleware,
  validate(feeStructureSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const structure = await FinanceService.createFeeStructure(req.user!.tenantId, req.body);
      res.status(201).json(structure);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create fee structure";
      res.status(400).json({ error: message });
    }
  },
);

router.get(
  "/invoices",
  authenticate,
  requirePermission("finance", "read"),
  validate(z.object({
    query: z.object({
      studentId: z.string().min(1).optional(),
      status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  })),
  async (req: AuthRequest, res: Response) => {
    const filter = {
      studentId: req.query.studentId as string | undefined,
      status: req.query.status as InvoiceStatus | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    };
    try {
      const result = await FinanceService.getInvoices(req.user!.tenantId, filter);
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch invoices";
      res.status(500).json({ error: message });
    }
  },
);

router.post(
  "/invoices",
  authenticate,
  requirePermission("finance", "write"),
  auditLogMiddleware,
  validate(invoiceSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const invoice = await FinanceService.createInvoice(req.user!.tenantId, req.body);
      res.status(201).json(invoice);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create invoice";
      res.status(400).json({ error: message });
    }
  },
);

router.get(
  "/invoices/student/:studentId",
  authenticate,
  requirePermission("finance", "read"),
  validate(z.object({ params: z.object({ studentId: z.string().min(1) }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      const invoices = await FinanceService.getStudentInvoices(
        req.user!.tenantId,
        req.params.studentId,
      );
      res.json(invoices);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch student invoices";
      res.status(500).json({ error: message });
    }
  },
);

router.post(
  "/payments",
  authenticate,
  requirePermission("finance", "write"),
  auditLogMiddleware,
  validate(paymentSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await FinanceService.recordPayment(req.user!.tenantId, req.body);
      res.status(201).json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to record payment";
      res.status(400).json({ error: message });
    }
  },
);

/* ================================================================== */
/*  PAYSTACK — Initialize Payment                                      */
/* ================================================================== */

router.post(
  "/payments/initialize",
  authenticate,
  requirePermission("finance", "write"),
  validate(z.object({
    body: z.object({
      invoiceId: z.string().min(1),
    }),
    query: z.object({}).passthrough().optional(),
    params: z.object({}).passthrough().optional(),
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!isPaystackConfigured()) {
        return res.status(400).json({
          error: "Online payments are not configured. Please contact the school administrator.",
        });
      }

      const invoice = await FinanceService.getInvoiceById(
        req.user!.tenantId,
        req.body.invoiceId,
      );

      if (invoice.status !== "PENDING") {
        return res.status(400).json({ error: "This invoice is not pending payment." });
      }

      const reference = `INV-${invoice.id.slice(0, 8)}-${Date.now()}`;
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5177";

      const result = await initializePaystackTransaction({
        email: req.user!.email,
        amount: Math.round(Number(invoice.amount) * 100), // Paystack uses kobo/pesewas
        reference,
        callback_url: `${frontendUrl}/finance?payment=success&reference=${reference}&invoiceId=${invoice.id}`,
        metadata: {
          invoiceId: invoice.id,
          tenantId: req.user!.tenantId,
          studentName: invoice.student
            ? `${invoice.student.firstName} ${invoice.student.lastName}`
            : "Unknown",
          schoolFee: true,
        },
      });

      res.json({
        authorization_url: result.authorization_url,
        reference: result.reference,
        access_code: result.access_code,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to initialize payment";
      res.status(400).json({ error: message });
    }
  },
);

/* ================================================================== */
/*  PAYSTACK — Verify Payment (called after redirect)                  */
/* ================================================================== */

router.get(
  "/payments/verify/:reference",
  authenticate,
  requirePermission("finance", "read"),
  validate(z.object({ params: z.object({ reference: z.string().min(1) }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await verifyPaystackTransaction(req.params.reference);

      if (result.status === "success") {
        // Record the payment
        const invoiceId = (req.query.invoiceId as string) || "";
        if (invoiceId) {
          try {
            await FinanceService.recordPayment(req.user!.tenantId, {
              invoiceId,
              amount: result.amount / 100, // Convert from kobo/pesewas
              method: "CARD",
            });
          } catch {
            // Payment may already be recorded
          }
        }
      }

      res.json({
        status: result.status,
        amount: result.amount / 100,
        reference: result.reference,
        gateway_response: result.gateway_response,
        paid_at: result.paid_at,
        channel: result.channel,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to verify payment";
      res.status(400).json({ error: message });
    }
  },
);

/* ================================================================== */
/*  PAYSTACK — Webhook (called by Paystack server-side)                */
/* ================================================================== */

router.post(
  "/payments/webhook",
  async (req: AuthRequest, res: Response) => {
    try {
      // Paystack sends events as JSON
      const event = req.body;

      if (event.event === "charge.success") {
        const { reference, amount, metadata } = event.data;

        // Verify the transaction
        const verification = await verifyPaystackTransaction(reference);

        if (verification.status === "success" && metadata?.invoiceId && metadata?.tenantId) {
          try {
            await FinanceService.recordPayment(metadata.tenantId, {
              invoiceId: metadata.invoiceId,
              amount: amount / 100,
              method: "CARD",
            });
          } catch {
            // Payment may already be recorded
          }
        }
      }

      // Always return 200 to Paystack
      res.status(200).json({ status: "ok" });
    } catch {
      // Always return 200 to Paystack even on errors
      res.status(200).json({ status: "ok" });
    }
  },
);

export default router;

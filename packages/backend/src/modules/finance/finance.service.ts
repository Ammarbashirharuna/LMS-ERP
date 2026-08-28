import { InvoiceStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";

interface FeeStructureData {
  grade: string;
  term: string;
  amount: number;
}

interface InvoiceData {
  studentId: string;
  feeStructureId?: string;
  dueDate: string;
  amount: number;
}

interface PaymentData {
  invoiceId: string;
  amount: number;
  method: "CASH" | "CARD" | "BANK_TRANSFER" | "OTHER";
}

interface InvoiceFilter {
  studentId?: string;
  status?: InvoiceStatus;
  page?: number;
  limit?: number;
}

export class FinanceService {
  static async getFeeStructures(tenantId: string) {
    return prisma.feeStructure.findMany({
      where: { tenantId },
      orderBy: [{ grade: "asc" }, { term: "asc" }],
    });
  }

  static async createFeeStructure(tenantId: string, data: FeeStructureData) {
    return prisma.feeStructure.create({
      data: {
        tenantId,
        grade: data.grade,
        term: data.term,
        amount: data.amount,
      },
    });
  }

  static async getInvoices(tenantId: string, filter: InvoiceFilter = {}) {
    const { studentId, status, page, limit } = filter;
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const where: { tenantId: string; studentId?: string; status?: InvoiceStatus } = { tenantId };
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
          feeStructure: true,
          payments: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    if (page && limit) {
      return {
        data: invoices,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    }

    return { data: invoices };
  }

  static async createInvoice(tenantId: string, data: InvoiceData) {
    return prisma.invoice.create({
      data: {
        tenantId,
        studentId: data.studentId,
        feeStructureId: data.feeStructureId,
        dueDate: new Date(data.dueDate),
        amount: data.amount,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        feeStructure: true,
      },
    });
  }

  static async getInvoiceById(tenantId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { tenantId, id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        feeStructure: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    return invoice;
  }

  static async recordPayment(tenantId: string, data: PaymentData) {
    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { tenantId, id: data.invoiceId },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const payment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId: data.invoiceId,
          amount: data.amount,
          method: data.method,
        },
      });

      const totalPaid = Number(
        (await tx.payment.aggregate({
          where: { tenantId, invoiceId: data.invoiceId },
          _sum: { amount: true },
        }))._sum.amount ?? 0,
      );

      const invoiceAmount = Number(invoice.amount);
      if (totalPaid >= invoiceAmount) {
        await tx.invoice.update({
          where: { id: data.invoiceId },
          data: { status: "PAID" },
        });
      } else if (totalPaid > 0) {
        await tx.invoice.update({
          where: { id: data.invoiceId },
          data: { status: "PENDING" },
        });
      }

      return { payment, invoiceId: data.invoiceId, totalPaid: Number(totalPaid) };
    });
  }

  static async getStudentInvoices(tenantId: string, studentId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, studentId },
      orderBy: { dueDate: "desc" },
      include: {
        feeStructure: true,
        payments: true,
      },
    });

    return invoices.map((invoice) => {
      const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = Number(invoice.amount) - totalPaid;
      return {
        ...invoice,
        totalPaid,
        remaining,
      };
    });
  }
}

import { prisma } from "../../lib/prisma";

interface MaterialData {
  name: string;
  quantity: number;
  location?: string;
  lowStockThreshold: number;
}

interface MaterialUpdateData {
  name?: string;
  quantity?: number;
  location?: string;
  lowStockThreshold?: number;
}

interface MaterialCheckoutData {
  materialId: string;
  classId?: string;
  staffId?: string;
  quantity: number;
}

export class InventoryService {
  static async getMaterials(tenantId: string, filter?: { lowStock?: boolean }) {
    const where: { tenantId: string; quantity?: { lte: number } } = { tenantId };

    if (filter?.lowStock) {
      where.quantity = { lte: 0 };
    }

    return prisma.material.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  static async getMaterialById(tenantId: string, id: string) {
    const material = await prisma.material.findFirst({
      where: { tenantId, id },
      include: { checkouts: true },
    });

    if (!material) {
      throw new Error("Material not found");
    }

    return material;
  }

  static async createMaterial(tenantId: string, data: MaterialData) {
    return prisma.material.create({
      data: {
        tenantId,
        name: data.name,
        quantity: data.quantity ?? 0,
        location: data.location,
        lowStockThreshold: data.lowStockThreshold ?? 0,
      },
    });
  }

  static async updateMaterial(tenantId: string, id: string, data: MaterialUpdateData) {
    const material = await prisma.material.findFirst({
      where: { tenantId, id },
    });

    if (!material) {
      throw new Error("Material not found");
    }

    return prisma.material.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.lowStockThreshold !== undefined && { lowStockThreshold: data.lowStockThreshold }),
      },
    });
  }

  static async deleteMaterial(tenantId: string, id: string): Promise<void> {
    const material = await prisma.material.findFirst({
      where: { tenantId, id },
    });

    if (!material) {
      throw new Error("Material not found");
    }

    await prisma.material.delete({ where: { id } });
  }

  static async checkoutMaterial(tenantId: string, userId: string, data: MaterialCheckoutData) {
    return await prisma.$transaction(async (tx) => {
      const material = await tx.material.findFirst({
        where: { tenantId, id: data.materialId },
      });

      if (!material) {
        throw new Error("Material not found");
      }

      if (material.quantity < data.quantity) {
        throw new Error(`Insufficient stock: ${material.quantity} available, ${data.quantity} requested`);
      }

      const checkout = await tx.materialCheckout.create({
        data: {
          tenantId,
          materialId: data.materialId,
          classId: data.classId,
          staffId: data.staffId,
          quantity: data.quantity,
        },
      });

      await tx.material.update({
        where: { id: data.materialId },
        data: {
          quantity: {
            decrement: data.quantity,
          },
        },
      });

      return checkout;
    });
  }

  static async returnMaterial(tenantId: string, checkoutId: string) {
    const checkout = await prisma.materialCheckout.findFirst({
      where: { tenantId, id: checkoutId, returnAt: null },
    });

    if (!checkout) {
      throw new Error("Checkout not found or already returned");
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.materialCheckout.update({
        where: { id: checkoutId },
        data: { returnAt: new Date() },
      });

      await tx.material.update({
        where: { id: checkout.materialId },
        data: {
          quantity: {
            increment: checkout.quantity,
          },
        },
      });

      return updated;
    });
  }

  static async updateStock(tenantId: string, id: string, adjustment: number) {
    const material = await prisma.material.findFirst({
      where: { tenantId, id },
    });

    if (!material) {
      throw new Error("Material not found");
    }

    return prisma.material.update({
      where: { id },
      data: {
        quantity: {
          increment: adjustment,
        },
      },
    });
  }
}

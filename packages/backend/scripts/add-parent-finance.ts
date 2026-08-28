import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from the backend directory
config({ path: resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET');
  const prisma = new PrismaClient();
  try {
    const parentRole = await prisma.role.findFirst({ where: { name: 'parent' } });
    if (!parentRole) {
      console.log('No parent role found');
      return;
    }
    console.log('Parent role found:', parentRole.id, parentRole.name);

    const existing = await prisma.permission.findFirst({
      where: { roleId: parentRole.id, resource: 'finance', action: 'write' }
    });
    if (existing) {
      console.log('Parent already has finance:write');
      return;
    }

    await prisma.permission.create({
      data: { roleId: parentRole.id, resource: 'finance', action: 'read' }
    });
    await prisma.permission.create({
      data: { roleId: parentRole.id, resource: 'finance', action: 'write' }
    });
    console.log('Added finance:read + finance:write to parent role');

    // Verify
    const updated = await prisma.role.findFirst({
      where: { id: parentRole.id },
      include: { permissions: true }
    });
    const financePerms = updated?.permissions.filter(p => p.resource === 'finance') || [];
    console.log('Parent finance permissions now:', financePerms.map(p => `${p.resource}:${p.action}`));
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

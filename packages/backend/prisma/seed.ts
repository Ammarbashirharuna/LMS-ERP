import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env"), override: true });

const prisma = new PrismaClient();

async function main() {
  // Seed curriculum areas
  const areas = await Promise.all([
    prisma.curriculumArea.upsert({
      where: { name: "Practical Life" },
      update: {},
      create: { name: "Practical Life", order: 1 },
    }),
    prisma.curriculumArea.upsert({
      where: { name: "Sensorial" },
      update: {},
      create: { name: "Sensorial", order: 2 },
    }),
    prisma.curriculumArea.upsert({
      where: { name: "Language" },
      update: {},
      create: { name: "Language", order: 3 },
    }),
    prisma.curriculumArea.upsert({
      where: { name: "Mathematics" },
      update: {},
      create: { name: "Mathematics", order: 4 },
    }),
    prisma.curriculumArea.upsert({
      where: { name: "Cultural/Science" },
      update: {},
      create: { name: "Cultural/Science", order: 5 },
    }),
  ]);

  // Seed curriculum items
  const curriculumItems = [
    { area: "Practical Life", items: [
      { title: "Dressing: Buttons", ageBand: "3-6", description: "Buttoning and unbuttoning practice" },
      { title: "Pouring Activities", ageBand: "3-6", description: "Precise pouring between containers" },
      { title: "Care of Self", ageBand: "3-6", description: "Self-care routines and independence" },
      { title: "Table Setting", ageBand: "6-9", description: "Proper table setting and etiquette" },
    ]},
    { area: "Sensorial", items: [
      { title: "Pink Tower", ageBand: "3-6", description: "Discrimination of dimension through graded cubes" },
      { title: "Brown Stair", ageBand: "3-6", description: "Gradation of thickness" },
      { title: "Color Tablets", ageBand: "3-6", description: "Color gradation and matching" },
      { title: "Sound Boxes", ageBand: "3-6", description: "Auditory discrimination" },
    ]},
    { area: "Language", items: [
      { title: "Sandpaper Letters", ageBand: "3-6", description: "Tactile letter formation" },
      { title: "Metal Insets", ageBand: "3-6", description: "Handwriting preparation and forms" },
      { title: "Moveable Alphabet", ageBand: "3-6", description: "Phonetic word building" },
    ]},
    { area: "Mathematics", items: [
      { title: "Number Rods", ageBand: "3-6", description: "Concrete number quantities 1-10" },
      { title: "Golden Beads", ageBand: "3-6", description: "Units, tens, hundreds, thousands" },
      { title: "Stamp Game", ageBand: "6-9", description: "Abstract arithmetic operations" },
    ]},
    { area: "Cultural/Science", items: [
      { title: "Continent Puzzle", ageBand: "3-6", description: "World geography and continents" },
      { title: "Parts of Plants", ageBand: "3-6", description: "Botany introduction and classification" },
      { title: "Parts of Animals", ageBand: "3-6", description: "Zoology classification" },
    ]},
  ];

  for (const area of areas) {
    for (const item of curriculumItems.find((a) => a.area === area.name)?.items || []) {
      await prisma.curriculumItem.upsert({
        where: { id: `${area.id}-${item.title}` },
        update: {},
        create: {
          id: `${area.id}-${item.title}`,
          areaId: area.id,
          title: item.title,
          ageBand: item.ageBand,
          description: item.description,
        },
      });
    }
  }

  // Create demo tenant
  const passwordHash = await bcrypt.hash("demopass123", 12);

  const tenant = await prisma.tenant.upsert({
    where: { subdomain: "sunrise-montessori" },
    update: {},
    create: {
      name: "Sunrise Montessori School",
      subdomain: "sunrise-montessori",
      plan: "starter",
    },
  });

  // Create roles with permissions
  const rolePermissions: Record<string, { resource: string; action: string }[]> = {
    admin: [
      { resource: "students", action: "read" }, { resource: "students", action: "write" },
      { resource: "attendance", action: "read" }, { resource: "attendance", action: "write" },
      { resource: "observations", action: "read" }, { resource: "observations", action: "write" },
      { resource: "curriculum", action: "read" }, { resource: "curriculum", action: "write" },
      { resource: "finance", action: "read" }, { resource: "finance", action: "write" },
      { resource: "hr", action: "read" }, { resource: "hr", action: "write" },
      { resource: "inventory", action: "read" }, { resource: "inventory", action: "write" },
      { resource: "messages", action: "read" }, { resource: "messages", action: "write" },
      { resource: "announcements", action: "read" }, { resource: "announcements", action: "write" },
      { resource: "audit", action: "read" }, { resource: "users", action: "read" }, { resource: "users", action: "write" },
      { resource: "settings", action: "read" }, { resource: "settings", action: "write" },
    ],
    teacher: [
      { resource: "students", action: "read" },
      { resource: "attendance", action: "read" }, { resource: "attendance", action: "write" },
      { resource: "observations", action: "read" }, { resource: "observations", action: "write" },
      { resource: "curriculum", action: "read" }, { resource: "curriculum", action: "write" },
      { resource: "messages", action: "read" }, { resource: "messages", action: "write" },
      { resource: "announcements", action: "read" },
    ],    parent: [
      { resource: "students", action: "read" }, { resource: "attendance", action: "read" }, { resource: "observations", action: "read" }, { resource: "messages", action: "read" }, { resource: "messages", action: "write" }, { resource: "announcements", action: "read" }, { resource: "finance", action: "read" }, { resource: "finance", action: "write" },
    ],
    student: [
      { resource: "curriculum", action: "read" },
      { resource: "announcements", action: "read" },
    ],
  };

  for (const [roleName, perms] of Object.entries(rolePermissions)) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: roleName } },
      update: {},
      create: { tenantId: tenant.id, name: roleName, isSystem: true },
    });
    await prisma.permission.createMany({
      data: perms.map((p) => ({ roleId: role.id, resource: p.resource, action: p.action })),
      skipDuplicates: true,
    });
  }

  const adminRole = await prisma.role.findFirst({ where: { tenantId: tenant.id, name: "admin" } });
  const teacherRole = await prisma.role.findFirst({ where: { tenantId: tenant.id, name: "teacher" } });
  const parentRole = await prisma.role.findFirst({ where: { tenantId: tenant.id, name: "parent" } });
  const studentRole = await prisma.role.findFirst({ where: { tenantId: tenant.id, name: "student" } });

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: "admin@sunrisemontessori.edu" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@sunrisemontessori.edu",
      passwordHash,
      firstName: "Sarah",
      lastName: "Admin",
      roleId: adminRole!.id,
      status: "ACTIVE",
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@sunrisemontessori.edu" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "teacher@sunrisemontessori.edu",
      passwordHash,
      firstName: "Maria",
      lastName: "Montessori",
      roleId: teacherRole!.id,
      status: "ACTIVE",
    },
  });

  const parent = await prisma.user.upsert({
    where: { email: "parent@sunrisemontessori.edu" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "parent@sunrisemontessori.edu",
      passwordHash,
      firstName: "John",
      lastName: "Parent",
      roleId: parentRole!.id,
      status: "ACTIVE",
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "student@sunrisemontessori.edu" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "student@sunrisemontessori.edu",
      passwordHash,
      firstName: "Alice",
      lastName: "Student",
      roleId: studentRole!.id,
      status: "ACTIVE",
    },
  });

  // Create class
  const classroom = await prisma.classRoom.upsert({
    where: { id: "demo-class-1" },
    update: {},
    create: {
      id: "demo-class-1",
      tenantId: tenant.id,
      name: "Sunflower Class (3-6)",
      academicYear: "2025-2026",
      teacherIds: [teacher.id],
    },
  });

  // Create students
  const student1 = await prisma.student.upsert({
    where: { id: "demo-student-1" },
    update: {},
    create: {
      id: "demo-student-1",
      tenantId: tenant.id,
      firstName: "Alice",
      lastName: "Wonder",
      dob: new Date("2019-03-15"),
      gender: "FEMALE",
      classId: classroom.id,
      enrollmentDate: new Date("2024-09-01"),
    },
  });

  const student2 = await prisma.student.upsert({
    where: { id: "demo-student-2" },
    update: {},
    create: {
      id: "demo-student-2",
      tenantId: tenant.id,
      firstName: "Bob",
      lastName: "Builder",
      dob: new Date("2020-07-22"),
      gender: "MALE",
      classId: classroom.id,
      enrollmentDate: new Date("2024-09-01"),
    },
  });

  // Create observations
  const practicalLife = await prisma.curriculumArea.findUnique({ where: { name: "Practical Life" } });
  const sensorial = await prisma.curriculumArea.findUnique({ where: { name: "Sensorial" } });

  const obs1 = await prisma.curriculumItem.findFirst({ where: { area: { name: "Practical Life" } } });
  const obs2 = await prisma.curriculumItem.findFirst({ where: { area: { name: "Sensorial" } } });

  await prisma.observation.createMany({
    data: [
      {
        id: "demo-obs-1",
        tenantId: tenant.id,
        studentId: student1.id,
        teacherId: teacher.id,
        curriculumItemId: obs1?.id || "temp",
        note: "Alice showed great concentration during the pouring activity. She was able to pour without spilling after 3 attempts.",
        masteryLevel: "PRACTICING",
        createdAt: new Date("2025-06-15"),
      },
      {
        id: "demo-obs-2",
        tenantId: tenant.id,
        studentId: student1.id,
        teacherId: teacher.id,
        curriculumItemId: obs2?.id || "temp",
        note: "Successfully matched the pink tower cubes from smallest to largest independently.",
        masteryLevel: "MASTERED",
        createdAt: new Date("2025-06-10"),
      },
      {
        id: "demo-obs-3",
        tenantId: tenant.id,
        studentId: student2.id,
        teacherId: teacher.id,
        note: "Bob is still working on buttoning. Needs more practice with small buttons.",
        masteryLevel: "INTRODUCED",
        curriculumItemId: obs1?.id || "temp",
        createdAt: new Date("2025-06-18"),
      },
    ],
    skipDuplicates: true,
  });

  // Create attendance records
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const status = i < 4 ? "PRESENT" : "ABSENT";
    await prisma.attendance.upsert({
      where: { tenantId_studentId_date: {
        tenantId: tenant.id,
        studentId: student1.id,
        date: new Date(date.setHours(0, 0, 0, 0)),
      }},
      update: {},
      create: {
        tenantId: tenant.id,
        studentId: student1.id,
        date: new Date(date.setHours(0, 0, 0, 0)),
        status: status as any,
      },
    });
  }

  console.log("Seed complete:");
  console.log(`  - Tenant: ${tenant.name}`);
  console.log(`  - Users: admin, teacher, parent (password: demopass123)`);
  console.log(`  - Students: Alice, Bob`);
  console.log(`  - Class: ${classroom.name}`);
  console.log(`  - Curriculum areas: ${areas.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

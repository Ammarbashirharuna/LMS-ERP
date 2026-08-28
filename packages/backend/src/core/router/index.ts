import { Router } from "express";
import authRouter from "../../modules/auth/routes";
import rolesRouter from "../../modules/roles/roles.routes";
import auditRouter from "../../modules/audit/audit.routes";
import studentsRouter from "../../modules/students/students.routes";
import attendanceRouter from "../../modules/attendance/attendance.routes";
import classesRouter from "../../modules/classes/classes.routes";
import observationsRouter from "../../modules/observations/observations.routes";
import curriculumRouter from "../../modules/curriculum/curriculum.routes";
import financeRouter from "../../modules/finance/finance.routes";
import hrRouter from "../../modules/hr/hr.routes";
import inventoryRouter from "../../modules/inventory/inventory.routes";
import communicationRouter from "../../modules/communication/communication.routes";
import gamificationRouter from "../../modules/gamification/gamification.routes";
import aiRouter from "../../modules/ai/ai.routes";
import settingsRouter from "../../modules/settings/settings.routes";

const router = Router();

// Mount module routers
router.use("/auth", authRouter);
router.use("/roles", rolesRouter);
router.use("/audit-log", auditRouter);
router.use("/students", studentsRouter);
router.use("/attendance", attendanceRouter);
router.use("/classes", classesRouter);
router.use("/observations", observationsRouter);
router.use("/curriculum", curriculumRouter);
router.use("/finance", financeRouter);
router.use("/hr", hrRouter);
router.use("/inventory", inventoryRouter);
router.use("/communication", communicationRouter);
router.use("/gamification", gamificationRouter);
router.use("/ai", aiRouter);
router.use("/settings", settingsRouter);

export { router };

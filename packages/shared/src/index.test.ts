import { ROLES, PERMISSIONS } from "../src/index";

describe("Shared Types", () => {
  it("should export ROLES", () => {
    expect(ROLES).toBeDefined();
    expect(ROLES.SCHOOL_ADMIN).toBe("admin");
    expect(ROLES.TEACHER).toBe("teacher");
  });

  it("should export PERMISSIONS", () => {
    expect(PERMISSIONS).toBeDefined();
    expect(PERMISSIONS.STUDENTS_READ).toBe("students:read");
    expect(PERMISSIONS.ATTENDANCE_WRITE).toBe("attendance:write");
  });
});

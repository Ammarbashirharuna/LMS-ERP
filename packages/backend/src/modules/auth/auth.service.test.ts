import { AuthService } from "./auth.service";

jest.mock("@prisma/client");

describe("AuthService", () => {
  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const hash = await AuthService.hashPassword("testpassword123");
      expect(hash).toBeDefined();
      expect(hash).not.toEqual("testpassword123");
      expect(hash.length).toBeGreaterThan(20);
    });
  });

  describe("verifyPassword", () => {
    it("should verify a correct password", async () => {
      const hash = await AuthService.hashPassword("correctpassword");
      const valid = await AuthService.verifyPassword("correctpassword", hash);
      expect(valid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const hash = await AuthService.hashPassword("correctpassword");
      const valid = await AuthService.verifyPassword("wrongpassword", hash);
      expect(valid).toBe(false);
    });
  });

  describe("generateTokens", () => {
    it("should generate access and refresh tokens", () => {
      const { accessToken, refreshToken } = AuthService.generateTokens(
        "user-id",
        "tenant-id",
        "test@example.com",
        "role-id"
      );
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(accessToken.split(".")).toHaveLength(3);
      expect(refreshToken.split(".")).toHaveLength(3);
    });
  });
});

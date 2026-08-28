import { prisma } from "../../lib/prisma";

// Optional Gemini integration - only used if GEMINI_API_KEY is set
let genAI: any = null;
let geminiModel: any = null;

async function initGemini() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "" && !genAI) {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      geminiModel = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite" });
    } catch {
      // Gemini not available, using local analysis
    }
  }
}

export class AIService {
  static async getStudentContext(tenantId: string, studentId: string) {
    const student = await prisma.student.findFirst({
      where: { tenantId, id: studentId },
      include: { classRoom: { select: { name: true } } },
    });
    if (!student) throw new Error("Student not found");

    const [attendance, observations] = await Promise.all([
      prisma.attendance.findMany({ where: { tenantId, studentId }, orderBy: { date: "desc" }, take: 30, select: { date: true, status: true } }),
      prisma.observation.findMany({
        where: { tenantId, studentId }, orderBy: { createdAt: "desc" }, take: 20,
        include: { curriculumItem: { include: { area: { select: { name: true } } } } },
      }),
    ]);

    const progressByArea: Record<string, any> = {};
    for (const obs of observations) {
      const areaName = obs.curriculumItem?.area?.name || "Uncategorized";
      const itemTitle = obs.curriculumItem?.title || "Unknown";
      if (!progressByArea[areaName]) progressByArea[areaName] = { area: areaName, items: [] };
      const existing = progressByArea[areaName].items.find((i: any) => i.title === itemTitle);
      if (existing) { existing.observations++; if (obs.createdAt > existing.lastObserved) existing.lastObserved = obs.createdAt; existing.mastery = obs.masteryLevel; }
      else progressByArea[areaName].items.push({ title: itemTitle, mastery: obs.masteryLevel, observations: 1, lastObserved: obs.createdAt });
    }

    return {
      student: { id: student.id, firstName: student.firstName, lastName: student.lastName, dob: student.dob, gender: student.gender },
      classRoom: student.classRoom, attendance,
      observations: observations.map(o => ({ note: o.note, masteryLevel: o.masteryLevel, curriculumItem: o.curriculumItem, createdAt: o.createdAt })),
      progress: Object.values(progressByArea),
    };
  }

  static async generateInsights(tenantId: string, studentId: string): Promise<string> {
    await initGemini();
    const context = await this.getStudentContext(tenantId, studentId);

    const prompt = this.buildInsightsPrompt(context);

    // Try Gemini first, fall back to local analysis
    if (geminiModel) {
      try {
        const result = await geminiModel.generateContent(prompt);
        return result.response.text();
      } catch {
        // Fall through to local analysis
      }
    }

    return this.generateLocalInsights(context);
  }

  static async chat(tenantId: string, role: string, message: string, history: Array<{ role: string; parts: string }> = []): Promise<string> {
    await initGemini();
    const lowerMsg = message.toLowerCase();

    // Pattern-based responses (always available)
    const patternResponse = await this.getPatternResponse(tenantId, lowerMsg);
    if (patternResponse) return patternResponse;

    // Try Gemini for open-ended questions
    if (geminiModel) {
      try {
        const roleContext = this.getRoleContext(role);
        const prompt = `${roleContext.roleDescription} at a Montessori school.\n\nPrevious conversation:\n${history.slice(-10).map(h => `${h.role}: ${h.parts}`).join("\n")}\n\nCurrent question: ${message}\n\nProvide a helpful, concise response.`;
        const result = await geminiModel.generateContent(prompt);
        return result.response.text();
      } catch {
        // Fall through to default
      }
    }

    return this.getDefaultResponse(message);
  }

  private static buildInsightsPrompt(context: any): string {
    const age = Math.floor((Date.now() - new Date(context.student.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return `Analyze this Montessori student's data and provide insights:\n\nStudent: ${context.student.firstName} ${context.student.lastName} (${age} years)\nClass: ${context.classRoom?.name || "Unassigned"}\nAttendance: ${context.attendance.filter((a: any) => a.status === "PRESENT").length}/${context.attendance.length} present\nObservations: ${context.observations.length} total\nProgress: ${context.progress.map((p: any) => `${p.area}: ${p.items.map((i: any) => `${i.title}(${i.mastery})`).join(", ")}`).join("; ")}\n\nProvide: 1) Key strengths 2) Areas needing attention 3) Activity recommendations 4) Engagement patterns. Keep under 300 words.`;
  }

  private static generateLocalInsights(context: any): string {
    const parts: string[] = [];
    const age = Math.floor((Date.now() - new Date(context.student.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    parts.push(`## Student Progress Report: ${context.student.firstName} ${context.student.lastName}`);
    parts.push(`**Age:** ${age} years | **Class:** ${context.classRoom?.name || "Unassigned"}`);
    parts.push("");

    if (context.attendance.length > 0) {
      const present = context.attendance.filter((a: any) => a.status === "PRESENT").length;
      const rate = Math.round((present / context.attendance.length) * 100);
      parts.push("## Attendance");
      parts.push(`- **Rate:** ${rate}% (${present}/${context.attendance.length} days)`);
      if (rate >= 90) parts.push("- ✅ Excellent attendance");
      else if (rate >= 75) parts.push("- ⚠️ Could be improved");
      else parts.push("- 🔴 Low attendance — recommend parent meeting");
      parts.push("");
    }

    if (context.observations.length > 0) {
      const mastered = context.observations.filter((o: any) => o.masteryLevel === "MASTERED").length;
      const practicing = context.observations.filter((o: any) => o.masteryLevel === "PRACTICING").length;
      parts.push("## Observations");
      parts.push(`- **Mastered:** ${mastered} | **Practicing:** ${practicing}`);
      parts.push("");
    }

    if (context.progress.length > 0) {
      parts.push("## Curriculum Progress");
      for (const area of context.progress) {
        const masteredItems = area.items.filter((i: any) => i.mastery === "MASTERED").length;
        parts.push(`### ${area.area} (${Math.round((masteredItems / area.items.length) * 100)}% mastered)`);
        for (const item of area.items) {
          const icon = item.mastery === "MASTERED" ? "✅" : item.mastery === "PRACTICING" ? "🔄" : "🆕";
          parts.push(`- ${icon} ${item.title} — ${item.mastery}`);
        }
        parts.push("");
      }
    }

    parts.push("## Recommendations");
    if (context.progress.length > 0) {
      const strong = context.progress.filter((a: any) => a.items.some((i: any) => i.mastery === "MASTERED")).map((a: any) => a.area);
      const weak = context.progress.filter((a: any) => a.items.every((i: any) => i.mastery !== "MASTERED")).map((a: any) => a.area);
      if (strong.length) parts.push(`- 💪 Strengths: ${strong.join(", ")}`);
      if (weak.length) parts.push(`- 📚 Focus areas: ${weak.join(", ")}`);
    }
    parts.push("\n---\n*Generated from student data analysis.*");
    return parts.join("\n");
  }

  private static async getPatternResponse(tenantId: string, lowerMsg: string): Promise<string | null> {
    if (lowerMsg.includes("student") && (lowerMsg.includes("list") || lowerMsg.includes("how many") || lowerMsg.includes("count"))) {
      const count = await prisma.student.count({ where: { tenantId } });
      return `There are currently **${count} students** enrolled.`;
    }
    // Synchronous pattern responses
    if (lowerMsg.includes("help") || lowerMsg.includes("what can you do")) {
      return `I'm your AI assistant for Montessori ERP. I can help with:\n\n📊 **Students** — counts, lists, details\n📋 **Attendance** — summaries, trends\n📝 **Observations** — recent records\n📚 **Classes** — class information\n💰 **Finance** — invoices, payments\n👥 **Staff** — staff records\n📦 **Inventory** — material stock\n\nAsk me anything about your school data!`;
    }
    return null;
  }

  private static getDefaultResponse(message: string): string {
    return `I understand you're asking: "${message}"\n\nI can help with student data, attendance, observations, classes, finance, staff, and inventory. Try asking something specific like "How many students?" or "Show today's attendance".`;
  }

  private static getRoleContext(role: string) {
    const contexts: Record<string, any> = {
      admin: { roleDescription: "School Administrator", capabilities: ["Managing school settings", "Overseeing staff and enrollment", "Reviewing financial reports"] },
      teacher: { roleDescription: "Montessori Teacher", capabilities: ["Recording observations", "Creating lesson plans", "Tracking student progress"] },
      parent: { roleDescription: "Parent/Guardian", capabilities: ["Viewing child's attendance", "Reviewing observations", "Tracking progress"] },
      student: { roleDescription: "Student", capabilities: ["Viewing curriculum materials", "Tracking achievements"] },
    };
    return contexts[role] || contexts.admin;
  }
}

import Anthropic from "@anthropic-ai/sdk";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { env } from "../env";

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const BodySchema = z.object({
  university: z.string().min(1),
  major: z.string().min(1),
  interests: z.array(z.string()).min(1),
});

const OpportunityItemSchema = z.object({
  name: z.string(),
  action: z.string(),
  note: z.string(),
  priority: z.enum(["High", "Medium", "Low"]),
});

const SemesterSchema = z.object({
  year: z.number(),
  semester: z.enum(["Fall", "Spring"]),
  yearLabel: z.string(),
  focus: z.string(),
  opportunities: z.array(OpportunityItemSchema),
});

const RoadmapSchema = z.object({
  roadmap: z.array(SemesterSchema),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsed = BodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  const { university, major, interests } = parsed.data;

  const prompt = `You are a college advisor creating a personalized 4-year opportunity roadmap.

Student profile:
- University: ${university}
- Major: ${major}
- Interests: ${interests.join(", ")}

Create a realistic semester-by-semester roadmap for all 8 semesters (Freshman Fall through Senior Spring).

For each semester, recommend 2-4 specific opportunities the student should pursue or prepare for. Focus on experiences — research programs, organizations, competitions, internships, fellowships — not courses. Only mention a specific course when it is a required prerequisite for an opportunity.

Time opportunities realistically:
- Freshman year: orientation programs, early research, foundational clubs, getting to know campus
- Sophomore year: deeper involvement, first leadership roles, internship prep, competitive program applications
- Junior year: competitive fellowships, summer internships, undergraduate research, leadership positions
- Senior year: capstone experiences, graduate school prep or full-time recruiting, legacy programs

Respond with ONLY valid JSON. No prose, no markdown fences. Start with { and end with }.

Return this exact structure:
{
  "roadmap": [
    {
      "year": 1,
      "semester": "Fall",
      "yearLabel": "Freshman",
      "focus": "One sentence describing the theme or goal of this semester",
      "opportunities": [
        {
          "name": "Specific real program or opportunity name at ${university}",
          "action": "Apply" or "Join" or "Attend info session" or "Prepare application" or "Research" or "Connect with" or "Complete",
          "note": "One sentence: why this semester specifically, key deadline, or prerequisite to know",
          "priority": "High" or "Medium" or "Low"
        }
      ]
    }
  ]
}

Include all 8 semesters in order: Freshman Fall, Freshman Spring, Sophomore Fall, Sophomore Spring, Junior Fall, Junior Spring, Senior Fall, Senior Spring.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(500).json({ error: "Could not parse roadmap from AI" });
    }

    const raw = JSON.parse(match[0]);
    const { roadmap } = RoadmapSchema.parse(raw);

    return res.status(200).json({ roadmap });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(500).json({ error: "AI returned unexpected data shape" });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}

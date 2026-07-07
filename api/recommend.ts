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

const OpportunitySchema = z.object({
  name: z.string(),
  type: z.string(),
  overview: z.string(),
  deadline: z.string(),
  notes: z.string().optional(),
  difficulty: z.enum([
    "Open Enrollment",
    "Low Competition",
    "Moderate Competition",
    "Competitive",
    "Highly Competitive",
  ]),
  url: z.string(),
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

  const prompt = `You are a college advisor. Generate 5-6 real, specific opportunity recommendations for this student:
- University: ${university}
- Major: ${major}
- Interests: ${interests.join(", ")}

Include well-known AND lesser-known programs. Be specific — use real program names that actually exist at ${university}.

Respond with ONLY a JSON array. No prose, no markdown fences, no explanation. Your entire response must start with [ and end with ].

Each item must have exactly these fields:
{
  "name": "Program name",
  "type": exactly one of: "Research Program" | "Honors Track" | "Fellowship" | "Leadership Program" | "Service Program" | "Entrepreneurship Program" | "Internship Program" | "Study Abroad" | "Competition" | "Living-Learning Community" | "Student Organization",
  "overview": "2-3 sentences: what it is, why it's valuable, what students gain",
  "deadline": "e.g. February 1 or Rolling — apply early fall",
  "notes": "1-2 key notes e.g. Separate application required. Open to freshmen.",
  "difficulty": "Open Enrollment" or "Low Competition" or "Moderate Competition" or "Competitive" or "Highly Competitive",
  "url": "Official program URL"
}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return res.status(500).json({ error: "Could not parse response from AI" });
    }

    const raw = JSON.parse(match[0]);
    const opportunities = z.array(OpportunitySchema).parse(raw);

    return res.status(200).json({ opportunities });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(500).json({ error: "AI returned unexpected data shape" });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}

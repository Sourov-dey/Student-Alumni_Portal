import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const AUTO_APPROVE_THRESHOLD = 75;
const AUTO_REJECT_THRESHOLD = 40;

export async function analyzeIdCard(filePath, mimeType, userInfo = {}) {
    if (!GEMINI_API_KEY) {
        return {
            isValid: false,
            confidence: 0,
            reason: "AI verification unavailable (no API key configured).",
            decision: "pending",
        };
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0,   // VERY IMPORTANT (deterministic output)
            },
        });

        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.join(process.cwd(), filePath);

        const fileBuffer = fs.readFileSync(absolutePath);
        const base64Data = fileBuffer.toString("base64");

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType || "image/jpeg",
            },
        };

        const prompt = `
You are an ID card verification assistant.

STRICTLY return valid JSON only. Do not include markdown, explanations, or extra text.

Check if the uploaded document is a valid university/college ID card.

Criteria:
- Must clearly be an institutional ID card.
- Must show institution name or logo.
- Must show personal details (name/photo/ID number).
- Must be readable and not blurred.

User submitted details:
Name: ${userInfo.name || "Unknown"}
Department: ${userInfo.department || "Unknown"}
Role: ${userInfo.role || "Unknown"}

Respond ONLY in this JSON format:
{
  "isValid": true or false,
  "confidence": number (0-100),
  "reason": "max 2 sentences"
}
`;

        const result = await model.generateContent([prompt, imagePart]);
        let responseText = result.response.text();

        // Extract JSON safely (handles extra text cases)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error("Model did not return valid JSON.");
        }

        const parsed = JSON.parse(jsonMatch[0]);

        const confidence = Math.max(
            0,
            Math.min(100, Number(parsed.confidence) || 0)
        );

        const isValid = Boolean(parsed.isValid);
        const reason = String(parsed.reason || "No reason provided.");

        let decision = "pending";

        if (isValid && confidence >= AUTO_APPROVE_THRESHOLD) {
            decision = "verified";
        }
        else if (!isValid && confidence >= AUTO_REJECT_THRESHOLD) {
            decision = "rejected";
        }

        console.log(
            `AI Verification → valid=${isValid}, confidence=${confidence}%, decision=${decision}`
        );

        return { isValid, confidence, reason, decision };

    } catch (err) {
        console.error("AI verification failed:", err.message);

        return {
            isValid: false,
            confidence: 0,
            reason: `AI analysis failed. Sent for manual review.`,
            decision: "pending",
        };
    }
}

export { AUTO_APPROVE_THRESHOLD, AUTO_REJECT_THRESHOLD };
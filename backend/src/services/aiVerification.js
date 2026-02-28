import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Confidence thresholds
const AUTO_APPROVE_THRESHOLD = 75;
const AUTO_REJECT_THRESHOLD = 40;

/**
 * Analyze an uploaded ID card image using Google Gemini Vision API.
 *
 * @param {string} filePath  – absolute path to the uploaded file
 * @param {string} mimeType  – MIME type of the file (image/jpeg, image/png, application/pdf)
 * @param {object} userInfo  – { name, email, department, role } from the user record
 * @returns {{ isValid: boolean, confidence: number, reason: string, decision: 'verified'|'rejected'|'pending' }}
 */
export async function analyzeIdCard(filePath, mimeType, userInfo = {}) {
    if (!GEMINI_API_KEY) {
        console.warn("⚠️  GEMINI_API_KEY not set — skipping AI verification, leaving as pending.");
        return {
            isValid: false,
            confidence: 0,
            reason: "AI verification unavailable (no API key configured).",
            decision: "pending",
        };
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Read the file and convert to base64
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

        const prompt = `You are an ID card verification assistant for a university student-alumni portal.

Analyze the uploaded document and determine if it is a **valid university or college ID card**.

Check for these criteria:
1. **Document type**: Is this an ID card, student card, or institutional identity document? (Not a random photo, screenshot, or unrelated document)
2. **Institution branding**: Does it contain visible university/college name, logo, or branding? Specifically look for "Assam University" or any recognized educational institution.
3. **Personal details**: Does it show a person's name, photo, student/employee ID number, department, or validity dates?
4. **Document quality**: Is the document clear, readable, and not heavily obscured or tampered with?

${userInfo.name ? `The user who submitted this claims to be: ${userInfo.name}` : ""}
${userInfo.department ? `Department: ${userInfo.department}` : ""}
${userInfo.role ? `Role: ${userInfo.role}` : ""}

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "isValid": true or false,
  "confidence": <number from 0 to 100>,
  "reason": "<brief explanation of your decision, max 2 sentences>"
}`;

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text().trim();

        // Parse the JSON response — handle possible markdown code fences
        let cleanJson = responseText;
        if (cleanJson.startsWith("```")) {
            cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
        }

        const parsed = JSON.parse(cleanJson);

        const confidence = Math.min(100, Math.max(0, Number(parsed.confidence) || 0));
        const isValid = Boolean(parsed.isValid);
        const reason = String(parsed.reason || "No reason provided.");

        // Determine auto-decision based on thresholds
        let decision = "pending"; // default: admin must review
        if (isValid && confidence >= AUTO_APPROVE_THRESHOLD) {
            decision = "verified";
        } else if (!isValid && confidence >= (100 - AUTO_REJECT_THRESHOLD)) {
            // High confidence that it's INVALID → auto-reject
            decision = "rejected";
        }

        console.log(`🤖 AI Verification: valid=${isValid}, confidence=${confidence}%, decision=${decision}`);

        return { isValid, confidence, reason, decision };
    } catch (err) {
        console.error("❌ AI verification failed:", err.message || err);
        // On any error, fall back to pending for admin review
        return {
            isValid: false,
            confidence: 0,
            reason: `AI analysis failed: ${err.message || "Unknown error"}. Forwarded to admin for manual review.`,
            decision: "pending",
        };
    }
}

export { AUTO_APPROVE_THRESHOLD, AUTO_REJECT_THRESHOLD };

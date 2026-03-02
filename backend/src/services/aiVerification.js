import Tesseract from "tesseract.js";
import sharp from "sharp";
import stringSimilarity from "string-similarity";
import fs from "fs";
import path from "path";

const AUTO_APPROVE_THRESHOLD = 75;
const AUTO_REJECT_THRESHOLD = 40;

// ─── Configurable institution keywords ───
const INSTITUTION_KEYWORDS = [
    "assam university",
    "silchar",
    "university",
    "college",
    "institute",
    "institution",
    "national institute",
    "iit",
    "nit",
    "iiit",
];

// ─── Document type keywords ───
const DOC_TYPE_KEYWORDS = [
    "identity card",
    "id card",
    "student",
    "enrollment",
    "roll no",
    "roll number",
    "reg no",
    "registration",
    "admission",
    "enrolment",
    "library card",
    "photo identity",
    "identity",
    "department",
    "faculty",
    "alumnus",
    "alumni",
    "staff",
];

// ─── Personal detail patterns ───
const ID_NUMBER_PATTERN = /\b[A-Z]{0,4}\d{4,12}\b/i;
const DEPT_KEYWORDS = [
    "computer science",
    "physics",
    "chemistry",
    "mathematics",
    "engineering",
    "biology",
    "economics",
    "commerce",
    "arts",
    "science",
    "technology",
    "department",
    "dept",
    "school of",
    "faculty of",
    "life science",
    "biotechnology",
    "english",
    "hindi",
    "bengali",
    "ecology",
    "electronics",
    "mass communication",
    "social work",
    "education",
    "management",
    "business",
    "law",
    "political",
    "history",
    "geography",
    "sociology",
    "philosophy",
    "psychology",
    "statistics",
    "zoology",
    "botany",
    "microbiology",
    "biochemistry",
    "pharmacy",
    "medical",
    "nursing",
    "sanskrit",
    "information technology",
    "it",
    "cse",
    "ece",
    "eee",
    "mech",
    "civil",
    "bca",
    "mca",
    "btech",
    "mtech",
    "bsc",
    "msc",
    "ba",
    "ma",
    "bcom",
    "mcom",
    "phd",
    "diploma",
];

/**
 * Preprocess image for better OCR accuracy using sharp.
 * Returns a buffer of the processed image.
 */
async function preprocessImage(filePath) {
    try {
        const metadata = await sharp(filePath).metadata();
        const targetWidth = Math.min(1400, Math.max(800, metadata.width || 1200));

        const processed = await sharp(filePath)
            .resize({ width: targetWidth, withoutEnlargement: false })
            .grayscale()
            .normalize()        // Auto-contrast
            .sharpen({ sigma: 1.5 })
            .toBuffer();

        return { buffer: processed, metadata };
    } catch (err) {
        console.warn("Image preprocessing failed, using raw file:", err.message);
        return { buffer: fs.readFileSync(filePath), metadata: null };
    }
}

/**
 * Score how likely the document is an ID card (0–100).
 */
function scoreDocumentType(text) {
    const lower = text.toLowerCase();
    let hits = 0;
    for (const kw of DOC_TYPE_KEYWORDS) {
        if (lower.includes(kw)) hits++;
    }

    if (hits === 0) return 10;
    if (hits === 1) return 45;
    if (hits === 2) return 65;
    if (hits === 3) return 80;
    return Math.min(100, 80 + hits * 3);
}

/**
 * Score institution recognition (0–100).
 */
function scoreInstitution(text) {
    const lower = text.toLowerCase();

    // Strong match: "Assam University" specifically
    if (lower.includes("assam university") || lower.includes("assam univ")) {
        return 95;
    }

    let hits = 0;
    for (const kw of INSTITUTION_KEYWORDS) {
        if (lower.includes(kw)) hits++;
    }

    if (hits === 0) return 5;
    if (hits === 1) return 50;
    if (hits >= 2) return 75;
    return 50;
}

/**
 * Score personal details presence (0–100).
 */
function scorePersonalDetails(text, userInfo) {
    let score = 0;

    // Check for any name-like text (2+ words with capital letters)
    const namePattern = /[A-Z][a-z]+\s+[A-Z][a-z]+/;
    if (namePattern.test(text)) score += 35;

    // Check for ID number / roll number
    if (ID_NUMBER_PATTERN.test(text)) score += 30;

    // Check for department keywords
    const lower = text.toLowerCase();
    for (const dept of DEPT_KEYWORDS) {
        if (lower.includes(dept)) {
            score += 25;
            break;
        }
    }

    // Bonus: if submitted department is found in text
    if (userInfo.department) {
        const deptLower = userInfo.department.toLowerCase();
        if (lower.includes(deptLower)) {
            score += 10;
        }
    }

    return Math.min(100, score);
}

/**
 * Score image quality from Tesseract confidence and image metadata (0–100).
 */
function scoreQuality(avgConfidence, metadata) {
    let score = 0;

    // Tesseract per-word average confidence (0–100 scale)
    score += Math.min(50, (avgConfidence / 100) * 50);

    // Resolution bonus
    if (metadata) {
        const pixels = (metadata.width || 0) * (metadata.height || 0);
        if (pixels >= 500000) score += 30;       // >= ~700x700
        else if (pixels >= 200000) score += 20;  // >= ~450x450
        else if (pixels >= 100000) score += 10;
        // else: very small image, no bonus
    } else {
        score += 15; // Unknown, give partial credit
    }

    // Text length bonus (ID cards typically have 20–200 words)
    // This is handled externally, so give 20 base points
    score += 20;

    return Math.min(100, score);
}

/**
 * Fuzzy name matching between submitted name and extracted text.
 */
function checkNameMatch(extractedText, submittedName) {
    if (!submittedName || submittedName.trim().length < 2) return false;

    const submitted = submittedName.trim().toLowerCase();
    const lines = extractedText.split(/\n/);

    // Check each line for similarity to the submitted name
    for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        if (trimmed.length < 2) continue;

        // Exact substring match
        if (trimmed.includes(submitted) || submitted.includes(trimmed)) {
            return true;
        }

        // Check individual words from the line
        const words = trimmed.split(/\s+/);
        const nameWords = submitted.split(/\s+/);

        // If any combination of consecutive words matches well
        for (let i = 0; i <= words.length - nameWords.length; i++) {
            const segment = words.slice(i, i + nameWords.length).join(" ");
            const sim = stringSimilarity.compareTwoStrings(segment, submitted);
            if (sim >= 0.6) return true;
        }

        // Full line similarity
        const fullSim = stringSimilarity.compareTwoStrings(trimmed, submitted);
        if (fullSim >= 0.5) return true;
    }

    return false;
}

/**
 * Main analysis function — drop-in replacement for the Gemini/Anthropic version.
 * Same signature, same return format.
 */
export async function analyzeIdCard(filePath, mimeType, userInfo = {}) {
    try {
        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.join(process.cwd(), filePath);

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`File not found: ${absolutePath}`);
        }

        console.log(`🔍 OCR Verification starting for: ${path.basename(absolutePath)}`);

        // Step 1: Preprocess the image
        const { buffer, metadata } = await preprocessImage(absolutePath);

        // Step 2: Run Tesseract OCR
        const { data } = await Tesseract.recognize(buffer, "eng", {
            logger: (info) => {
                if (info.status === "recognizing text") {
                    process.stdout.write(`\r  OCR progress: ${(info.progress * 100).toFixed(0)}%`);
                }
            },
        });
        console.log(""); // newline after progress

        const extractedText = data.text || "";
        const words = data.words || [];

        // Average Tesseract word confidence
        const avgConfidence = words.length > 0
            ? words.reduce((sum, w) => sum + (w.confidence || 0), 0) / words.length
            : 0;

        console.log(`  📝 Extracted ${words.length} words, avg OCR confidence: ${avgConfidence.toFixed(1)}%`);
        console.log(`  📄 Text preview: "${extractedText.substring(0, 120).replace(/\n/g, " ")}..."`);

        // Step 3: Score each category
        const scores = {
            documentType: scoreDocumentType(extractedText),
            institution: scoreInstitution(extractedText),
            personalDetails: scorePersonalDetails(extractedText, userInfo),
            quality: scoreQuality(avgConfidence, metadata),
        };

        // Step 4: Name matching
        const nameMatch = checkNameMatch(extractedText, userInfo.name);

        // Step 5: Compute weighted confidence
        let confidence = Math.round(
            scores.documentType * 0.30 +
            scores.institution * 0.25 +
            scores.personalDetails * 0.30 +
            scores.quality * 0.15
        );

        // Penalty if name doesn't match
        if (!nameMatch) {
            confidence = Math.max(0, confidence - 20);
        }

        confidence = Math.max(0, Math.min(100, confidence));

        const isValid = confidence >= 70;

        // Step 6: Generate human-readable reason
        const reasons = [];
        if (scores.documentType < 40) reasons.push("Document may not be an ID card");
        if (scores.institution < 40) reasons.push("No recognized institution found");
        if (scores.personalDetails < 40) reasons.push("Missing personal details (name/ID number)");
        if (scores.quality < 40) reasons.push("Low image quality or unreadable text");
        if (!nameMatch) reasons.push("Submitted name not found on document");
        if (reasons.length === 0) {
            reasons.push(isValid
                ? "Document appears to be a valid institutional ID card"
                : "Document partially matches ID card criteria but needs review"
            );
        }
        const reason = reasons.join(". ") + ".";

        // Step 7: Decision
        let decision = "pending";
        if (isValid && confidence >= AUTO_APPROVE_THRESHOLD) {
            decision = "verified";
        } else if (!isValid && confidence >= AUTO_REJECT_THRESHOLD) {
            decision = "rejected";
        }

        console.log(
            `  🤖 OCR Verification → valid=${isValid}, confidence=${confidence}%, decision=${decision}`
        );
        console.log(`     scores=${JSON.stringify(scores)}, nameMatch=${nameMatch}`);

        return {
            isValid,
            confidence,
            reason,
            decision,
            scores,
            extractedText: extractedText.substring(0, 20000),
            nameMatch,
        };

    } catch (err) {
        console.error("❌ OCR verification failed:", err.message);

        return {
            isValid: false,
            confidence: 0,
            reason: `OCR analysis failed: ${err.message}. Sent for manual review.`,
            decision: "pending",
            scores: null,
            extractedText: "",
            nameMatch: false,
        };
    }
}

export { AUTO_APPROVE_THRESHOLD, AUTO_REJECT_THRESHOLD };
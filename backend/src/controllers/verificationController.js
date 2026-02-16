import Verification from "../models/Verification.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

/**
 * POST /api/verify/id-card
 * Authenticated user uploads their university ID card for verification.
 * Expects multipart form with field "idcard" (file), plus "emailUsed" and optional "note".
 */
export const submitIdCard = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Check if user already has a pending verification
        const existing = await Verification.findOne({
            user: userId,
            status: "pending",
        });

        if (existing) {
            return res.status(400).json({
                message: "You already have a pending verification. Please wait for admin review.",
            });
        }

        if (!req.file) {
            return res.status(400).json({ message: "ID card file is required." });
        }

        // Build the file URL (served via express.static in server.js)
        const fileUrl = `/uploads/ids/${req.file.filename}`;

        const verification = await Verification.create({
            user: userId,
            method: "id-card",
            idDoc: {
                url: fileUrl,
                mime: req.file.mimetype,
                originalName: req.file.originalname,
            },
            emailUsed: req.body.emailUsed || req.user.email,
            note: req.body.note || "",
            submittedAt: new Date(),
        });

        console.log(`✅ Verification submitted by user ${userId}:`, verification._id);

        res.status(201).json({
            message: "Verification submitted successfully. You'll be notified after review.",
            verification: {
                _id: verification._id,
                status: verification.status,
                submittedAt: verification.submittedAt,
            },
        });
    } catch (err) {
        console.error("❌ Submit ID card error:", err);
        next(err);
    }
};

/**
 * GET /api/verify/status
 * Authenticated user checks their own verification status.
 */
export const getMyVerificationStatus = async (req, res, next) => {
    try {
        const verification = await Verification.findOne({ user: req.user._id })
            .sort({ submittedAt: -1 })
            .lean();

        if (!verification) {
            return res.json({ status: "none", verification: null });
        }

        res.json({
            status: verification.status,
            verification: {
                _id: verification._id,
                status: verification.status,
                submittedAt: verification.submittedAt,
                reviewedAt: verification.reviewedAt,
                reviewNote: verification.reviewNote || "",
            },
        });
    } catch (err) {
        console.error("❌ Get verification status error:", err);
        next(err);
    }
};

/**
 * GET /api/admin/verifications?status=pending
 * Admin lists all verifications, optionally filtered by status.
 */
export const listVerifications = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.status && req.query.status !== "all") {
            filter.status = req.query.status;
        }

        const verifications = await Verification.find(filter)
            .populate("user", "name email role avatarUrl")
            .populate("reviewedBy", "name email")
            .sort({ submittedAt: -1 })
            .lean();

        res.json(verifications);
    } catch (err) {
        console.error("❌ List verifications error:", err);
        next(err);
    }
};

/**
 * POST /api/admin/verifications/:id/approve
 * Admin approves a pending verification → sets user.verified = true.
 */
export const approveVerification = async (req, res, next) => {
    try {
        const { id } = req.params;

        const verification = await Verification.findById(id);
        if (!verification) {
            return res.status(404).json({ message: "Verification not found" });
        }

        if (verification.status !== "pending") {
            return res.status(400).json({
                message: `Verification is already ${verification.status}`,
            });
        }

        // Update verification status
        verification.status = "verified";
        verification.reviewedBy = req.user._id;
        verification.reviewedAt = new Date();
        await verification.save();

        // Mark user as verified
        await User.findByIdAndUpdate(verification.user, { verified: true });

        // Create in-app notification for the user
        await Notification.create({
            user: verification.user,
            type: "verification",
            message: "Your ID verification has been approved! ✅",
            payload: { verificationId: verification._id, status: "verified" },
        });

        console.log(`✅ Verification ${id} approved by admin ${req.user._id}`);

        res.json({
            message: "Verification approved successfully",
            verification,
        });
    } catch (err) {
        console.error("❌ Approve verification error:", err);
        next(err);
    }
};

/**
 * POST /api/admin/verifications/:id/reject
 * Admin rejects a pending verification with optional note.
 */
export const rejectVerification = async (req, res, next) => {
    try {
        const { id } = req.params;

        const verification = await Verification.findById(id);
        if (!verification) {
            return res.status(404).json({ message: "Verification not found" });
        }

        if (verification.status !== "pending") {
            return res.status(400).json({
                message: `Verification is already ${verification.status}`,
            });
        }

        verification.status = "rejected";
        verification.reviewNote = req.body.note || "";
        verification.reviewedBy = req.user._id;
        verification.reviewedAt = new Date();
        await verification.save();

        // Create in-app notification for the user
        await Notification.create({
            user: verification.user,
            type: "verification",
            message: "Your ID verification was rejected. Please re-submit.",
            payload: { verificationId: verification._id, status: "rejected", note: verification.reviewNote },
        });

        console.log(`❌ Verification ${id} rejected by admin ${req.user._id}`);

        res.json({
            message: "Verification rejected",
            verification,
        });
    } catch (err) {
        console.error("❌ Reject verification error:", err);
        next(err);
    }
};

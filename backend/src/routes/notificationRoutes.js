import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import Notification from "../models/Notification.js";

const router = Router();

// GET /api/notifications — return current user's notifications (newest first)
router.get("/", requireAuth, async (req, res, next) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.json(notifications);
    } catch (err) {
        next(err);
    }
});

// PATCH /api/notifications/:id/read — mark a single notification as read
router.patch("/:id/read", requireAuth, async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { read: true, readAt: new Date() },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.json(notification);
    } catch (err) {
        next(err);
    }
});

export default router;

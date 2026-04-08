// backend/src/controllers/connectionController.js
import Connection from "../models/Connection.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { getReceiverSocketId, io } from "../../server.js";

/**
 * POST /api/connections/request/:alumniId
 * Student sends a connection request to an alumni.
 */
export const sendConnectionRequest = async (req, res, next) => {
  try {
    const fromId = req.user._id;
    const toId = req.params.alumniId;

    // Only students (and admins) can send connection requests to alumni
    if (req.user.role !== "student" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only students can send connection requests" });
    }

    // Can't connect to yourself
    if (fromId.toString() === toId.toString()) {
      return res.status(400).json({ message: "Cannot connect to yourself" });
    }

    // Verify target is an alumni
    const targetUser = await User.findById(toId).select("role name");
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (targetUser.role !== "alumni") {
      return res.status(400).json({ message: "Can only send connection requests to alumni" });
    }

    // Check if connection already exists
    const existing = await Connection.findOne({ from: fromId, to: toId });
    if (existing) {
      if (existing.status === "pending") {
        return res.status(400).json({ message: "Connection request already pending" });
      }
      if (existing.status === "accepted") {
        return res.status(400).json({ message: "Already connected" });
      }
      // If rejected, allow re-sending by updating status back to pending
      existing.status = "pending";
      await existing.save();

      // Create notification for the alumni
      await _createConnectionNotification(fromId, toId, "connection_request", req.user.name);

      return res.status(200).json({ message: "Connection request re-sent", connection: existing });
    }

    // Create new connection
    const connection = await Connection.create({
      from: fromId,
      to: toId,
      status: "pending",
    });

    // Create notification for the alumni
    await _createConnectionNotification(fromId, toId, "connection_request", req.user.name);

    console.log(`🔗 Connection request sent: ${req.user.name} → ${targetUser.name}`);

    res.status(201).json({ message: "Connection request sent", connection });
  } catch (error) {
    // Duplicate key = already sent
    if (error.code === 11000) {
      return res.status(400).json({ message: "Connection request already exists" });
    }
    console.error("❌ Error sending connection request:", error.message);
    next(error);
  }
};

/**
 * PATCH /api/connections/:connectionId/respond
 * Alumni accepts or rejects a connection request.
 * Body: { action: "accept" | "reject" }
 */
export const respondToConnection = async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const { action } = req.body;

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ message: "Action must be 'accept' or 'reject'" });
    }

    const connection = await Connection.findById(connectionId).populate("from", "name email avatarUrl role");
    if (!connection) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    // Only the recipient (alumni) can respond
    if (connection.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to respond to this request" });
    }

    if (connection.status !== "pending") {
      return res.status(400).json({ message: `Connection already ${connection.status}` });
    }

    connection.status = action === "accept" ? "accepted" : "rejected";
    await connection.save();

    // Notify the student about the response
    const notifType = action === "accept" ? "connection_accepted" : "connection_rejected";
    const notifMessage =
      action === "accept"
        ? `${req.user.name} accepted your connection request!`
        : `${req.user.name} declined your connection request.`;

    const notification = await Notification.create({
      user: connection.from._id,
      type: notifType,
      message: notifMessage,
      payload: {
        connectionId: connection._id,
        alumniId: req.user._id,
        alumniName: req.user.name,
      },
    });

    // Real-time notification via socket
    const studentSocketId = getReceiverSocketId(connection.from._id.toString());
    if (studentSocketId) {
      io.to(studentSocketId).emit("connectionResponse", {
        connectionId: connection._id,
        status: connection.status,
        alumniName: req.user.name,
        notification,
      });
    }

    console.log(`🔗 Connection ${action}ed: ${connection.from.name} ↔ ${req.user.name}`);

    res.status(200).json({ message: `Connection ${action}ed`, connection });
  } catch (error) {
    console.error("❌ Error responding to connection:", error.message);
    next(error);
  }
};

/**
 * GET /api/connections
 * Returns all accepted connections for the current user.
 */
export const getMyConnections = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const connections = await Connection.find({
      $or: [
        { from: userId, status: "accepted" },
        { to: userId, status: "accepted" },
      ],
    })
      .populate("from", "name email avatarUrl role department graduationYear")
      .populate("to", "name email avatarUrl role department graduationYear")
      .sort({ updatedAt: -1 })
      .lean();

    // Map to connected user info
    const connectedUsers = connections.map((c) => {
      const other = c.from._id.toString() === userId.toString() ? c.to : c.from;
      return {
        connectionId: c._id,
        user: other,
        connectedAt: c.updatedAt,
      };
    });

    res.status(200).json(connectedUsers);
  } catch (error) {
    console.error("❌ Error fetching connections:", error.message);
    next(error);
  }
};

/**
 * GET /api/connections/pending
 * Returns pending incoming requests for the current user (alumni receives these).
 */
export const getPendingRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const pending = await Connection.find({
      to: userId,
      status: "pending",
    })
      .populate("from", "name email avatarUrl role department graduationYear bio interests technicalSkills")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(pending);
  } catch (error) {
    console.error("❌ Error fetching pending requests:", error.message);
    next(error);
  }
};

/**
 * GET /api/connections/sent
 * Returns sent requests by current user (student views these).
 */
export const getSentRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const sent = await Connection.find({
      from: userId,
    })
      .populate("to", "name email avatarUrl role department graduationYear")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(sent);
  } catch (error) {
    console.error("❌ Error fetching sent requests:", error.message);
    next(error);
  }
};

/**
 * GET /api/connections/status/:userId
 * Check connection status between current user and target user.
 */
export const getConnectionStatus = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    const connection = await Connection.findOne({
      $or: [
        { from: currentUserId, to: targetUserId },
        { from: targetUserId, to: currentUserId },
      ],
    }).lean();

    if (!connection) {
      return res.status(200).json({ status: "none", connection: null });
    }

    res.status(200).json({
      status: connection.status,
      connection,
      direction: connection.from.toString() === currentUserId.toString() ? "sent" : "received",
    });
  } catch (error) {
    console.error("❌ Error checking connection status:", error.message);
    next(error);
  }
};

/**
 * DELETE /api/connections/:connectionId
 * Either party can remove a connection.
 */
export const removeConnection = async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user._id;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    // Only involved parties can remove
    if (
      connection.from.toString() !== userId.toString() &&
      connection.to.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await connection.deleteOne();

    console.log(`🔗 Connection removed: ${connectionId}`);
    res.status(200).json({ message: "Connection removed" });
  } catch (error) {
    console.error("❌ Error removing connection:", error.message);
    next(error);
  }
};

/**
 * GET /api/connections/check-bulk
 * Check connection status for multiple alumni at once (for map).
 * Query: ?ids=id1,id2,id3
 */
export const checkBulkConnectionStatus = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ message: "ids query parameter required" });
    }

    const alumniIds = ids.split(",").filter(Boolean);

    const connections = await Connection.find({
      $or: [
        { from: currentUserId, to: { $in: alumniIds } },
        { from: { $in: alumniIds }, to: currentUserId },
      ],
    }).lean();

    // Build a map: alumniId -> status
    const statusMap = {};
    connections.forEach((c) => {
      const otherId =
        c.from.toString() === currentUserId.toString()
          ? c.to.toString()
          : c.from.toString();
      statusMap[otherId] = c.status;
    });

    res.status(200).json(statusMap);
  } catch (error) {
    console.error("❌ Error checking bulk connection status:", error.message);
    next(error);
  }
};

// ── Helper: create notification + emit socket event ──
async function _createConnectionNotification(fromId, toId, type, fromName) {
  const message =
    type === "connection_request"
      ? `${fromName} sent you a connection request`
      : `${fromName} accepted your connection request!`;

  const notification = await Notification.create({
    user: toId,
    type,
    message,
    payload: {
      fromUserId: fromId,
      fromUserName: fromName,
    },
  });

  // Real-time push
  const socketId = getReceiverSocketId(toId.toString());
  if (socketId) {
    io.to(socketId).emit("newNotification", notification);
    if (type === "connection_request") {
      io.to(socketId).emit("connectionRequest", {
        fromUserId: fromId,
        fromUserName: fromName,
        notification,
      });
    }
  }

  return notification;
}

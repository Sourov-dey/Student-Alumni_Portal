import User from "../models/User.js";

/** GET /api/users/:id */
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-__v");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) { next(err); }
};

/** PATCH /api/users/:id */
export const updateUserById = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).select("-__v");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) { next(err); }
};

/** POST /api/users/:id/avatar (field: avatar) */
export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Avatar file missing" });
    const url = `/${req.file.path.replace(/\\/g, "/")}`;
    const user = await User.findByIdAndUpdate(req.params.id, { avatarUrl: url }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Avatar uploaded", avatarUrl: url, user });
  } catch (err) { next(err); }
};

/** POST /api/users/:id/resume (field: resume, PDF only) */
export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Resume file missing (PDF)" });
    const url = `/${req.file.path.replace(/\\/g, "/")}`;
    const user = await User.findByIdAndUpdate(req.params.id, { resumeUrl: url }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Resume uploaded", resumeUrl: url, user });
  } catch (err) { next(err); }
};

// list users with optional role filter (paginated)
export const listUsers = async (req, res, next) => {
  try {
    const role = req.query.role;
    const filter = {};
    if (role) filter.role = role;
    const items = await User.find(filter).select('name email department role avatarUrl').limit(200);
    res.json({ items, total: items.length });
  } catch (err) { next(err); }
};

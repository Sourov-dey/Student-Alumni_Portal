
import { ZodError } from "zod";

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body ?? {},
      params: req.params ?? {},
      query: req.query ?? {},
    });
    // expose sanitized values if you want:
    req.validated = parsed;
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const fieldErrors = {};
      const formErrors = [];

      for (const issue of err.issues) {
        if (issue.path && issue.path.length > 0) {
          const key = issue.path.join('.');
          if (!fieldErrors[key]) fieldErrors[key] = [];
          fieldErrors[key].push(issue.message);
        } else {
          formErrors.push(issue.message);
        }
      }

      return res.status(400).json({ errors: { fieldErrors, formErrors } });
    }
    next(err);
  }
};

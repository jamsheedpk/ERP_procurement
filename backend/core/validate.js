const { ApiError } = require("./");

/**
 * Tiny dependency-free request validator (no zod/joi install needed).
 *
 * A schema is a map of field → rules:
 *   { entryType: { required: true, enum: ["receipt","payment"] },
 *     amount:    { required: true, type: "number" } }
 *
 * Validates req[source] (default "body") and throws ApiError(400) on the first
 * problem — Express forwards the synchronous throw to the error handler. Deeper
 * type/enum enforcement still happens in the Mongoose model; this gives callers
 * a clear 400 *before* hitting the DB.
 */
function validate(schema, source = "body") {
  return (req, _res, next) => {
    const data = req[source] || {};
    for (const [field, rule] of Object.entries(schema)) {
      const val = data[field];
      const missing = val === undefined || val === null || val === "";
      if (rule.required && missing) throw ApiError.badRequest(`"${field}" is required`);
      if (missing) continue;
      if (rule.type === "number" && isNaN(Number(val)))
        throw ApiError.badRequest(`"${field}" must be a number`);
      if (rule.enum && !rule.enum.includes(val))
        throw ApiError.badRequest(`"${field}" must be one of: ${rule.enum.join(", ")}`);
    }
    next();
  };
}

module.exports = { validate };

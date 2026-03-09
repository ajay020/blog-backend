const AppError = require("../utils/AppError");

/**
 * schemaObj = { body?, params?, query? } 
 * Each can be a Zod schema
 */
const validate = (schemaObj) => (req, res, next) => {
    try {
        if (schemaObj.body) {
            const result = schemaObj.body.safeParse(req.body);
            if (!result.success) {
                const errors = result.error.issues.map(issue => ({
                    field: issue.path.join("."),
                    message: issue.message
                }));
                throw new AppError("Validation failed (body)", 400, errors);
            }
            req.body = result.data;
        }

        if (schemaObj.params) {
            const result = schemaObj.params.safeParse(req.params);
            if (!result.success) {
                const errors = result.error.issues.map(issue => ({
                    field: issue.path.join("."),
                    message: issue.message
                }));
                throw new AppError("Validation failed (params)", 400, errors);
            }
            req.params = result.data;
        }

        if (schemaObj.query) {
            const result = schemaObj.query.safeParse(req.query);
            if (!result.success) {
                const errors = result.error.issues.map(issue => ({
                    field: issue.path.join("."),
                    message: issue.message
                }));
                throw new AppError("Validation failed (query)", 400, errors);
            }
            req.query = result.data;
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = validate;
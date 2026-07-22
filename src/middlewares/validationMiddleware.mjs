export const validateRequest = (schema) => {
    return async (req, res, next) => {
        const result = await schema.safeParseAsync(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                errors: result.error.issues.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
        }

        req.body = result.data;
        next();
    };
};

export const validateParams = (schema) => {

    return async (req, res, next) => {
        const result = await schema.safeParseAsync(req.params);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                errors: result.error.issues.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            });
        }
        req.params = result.data;
        next();
    };
};

export const validateQuery = (schema, property = "query") => {

    return async (req, res, next) => {
        try {
            const result = await schema.safeParseAsync(req[property]);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    errors: result.error.issues.map(issue => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    })),
                });
            }

            if (property === "query") {
                req.validatedQuery = result.data;
            } else {
                req[property] = result.data;
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};




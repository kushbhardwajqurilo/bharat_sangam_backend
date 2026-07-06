export const validateInfluencerRequest = (schema) => {
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

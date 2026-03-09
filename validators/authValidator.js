const { z } = require("zod");

exports.registerSchema = z.object({
    name: z.string()
        .min(3, "Name must be at least 2 characters")
        .max(10, "Name must be at most 10 characters"),
    email: z.email("Invalid email format"),
    password: z.string().min(5, "Password must be at least 5 characters")
});

exports.loginSchema = z.object({
    email: z.email("Invalid email"),
    password: z.string().min(1, "Password is required")
});
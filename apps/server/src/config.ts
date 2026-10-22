import z from "zod";
import process from 'node:process';

export const ConfigSchema = z.object({
    PORT:z.coerce.number().default(2567),
    ALLOWED_ORIGINS:z
    .string()
    .default('http://localhost:5173,http://127.0.0.1:5173')
    .transform((val)=>val.split(',').map((s)=>s.trim()).filter(Boolean)),
    TICK_HZ:z.coerce.number().default(30),
    PATCH_HZ: z.coerce.number().default(20),
    MAX_ROOMS_PER_IP: z.coerce.number().default(3),
    LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
    SESSION_SECRET: z
    .string()
    .default('dev-mutator-party-secret-key-change-in-prod'),
    REDIS_URL: z.string().optional(),
    SENTRY_DSN: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;
export const config: Config = ConfigSchema.parse(process.env);
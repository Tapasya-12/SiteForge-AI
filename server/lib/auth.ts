import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma.js";

const rawOrigins = process.env.TRUSTED_ORIGINS?.split(',').map(o => o.trim()) || [];

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        deleteUser: { enabled: true }
    },
    trustedOrigins: (request) => {
        const origin = request?.headers?.get('origin') || '';
        if (rawOrigins.includes(origin)) return rawOrigins;
        if (/https:\/\/site-forge-[a-z0-9-]+\.vercel\.app$/.test(origin)) return [origin];
        return rawOrigins;
    },
    baseUrl: process.env.BETTER_AUTH_URL!,
    secret: process.env.BETTER_AUTH_SECRET!,
    advanced: {
        cookies: {
            session_token: {
                name: 'auth_session',
                attributes: {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    path: '/',
                }
            }
        }
    }
});
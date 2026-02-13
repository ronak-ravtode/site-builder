import 'dotenv/config';
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
const trustedOrigins = [
    "http://localhost:5173",
    ...(process.env.TRUSTED_ORIGIN?.split(",") || []),
];
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        deleteUser: {
            enabled: true,
        },
    },
    trustedOrigins,
    baseURL: process.env.BETTER_AUTH_BASE_URL,
    secret: process.env.BETTER_AUTH_SECRET,
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

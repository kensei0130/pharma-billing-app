import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db } from "./db";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { wards } from "./db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ wardId: z.string(), password: z.string() })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { wardId, password } = parsedCredentials.data;

                    // Find user by ID (using 'wards' table as users)
                    // Admin is also in wards table for simplicity based on seed
                    const users = await db.select().from(wards).where(eq(wards.id, wardId));
                    const user = users[0];

                    if (!user) return null;

                    // Simple password check (should be hashed in production!)
                    if (password === user.password) {
                        return {
                            id: user.id,
                            name: user.name,
                            role: user.role,
                        };
                    }
                }
                console.log("Invalid credentials");
                return null;
            },
        }),
    ],
});

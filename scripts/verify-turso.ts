import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    console.log("Testing connection...");
    const url = process.env.DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        console.error("DATABASE_URL is missing");
        return;
    }
    if (!authToken) {
        console.error("TURSO_AUTH_TOKEN is missing");
        return;
    }

    console.log("URL:", url);
    console.log("Token length:", authToken.length);

    try {
        const client = createClient({
            url,
            authToken
        });
        // Try a simple query
        const rs = await client.execute("SELECT 1 as connected");
        console.log("Connection successful!");
        console.log("Result:", rs.rows);
    } catch (e: any) {
        console.error("Connection failed!");
        console.error("Error message:", e.message);
        console.error("Full error:", e);
    }
}

main();

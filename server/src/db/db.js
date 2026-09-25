import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const adapter = new JSONFile("./src/data/db.json");

export const db = new Low(adapter, {
    users: [],
    tasks: []
});

export async function initDb() {
    await db.read();

    db.data ||= {
        users: [],
        tasks: []
    };

    await db.write();
}
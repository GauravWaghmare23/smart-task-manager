import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const adapter = new JSONFile("./src/data/db.json");

export const db = new Low(adapter, {
  users: [],
  tasks: [],
  sessions: [],
});

export async function initDb() {
  await db.read();

  db.data ||= {
    users: [],
    tasks: [],
    sessions: [],
  };

  await db.write();
}

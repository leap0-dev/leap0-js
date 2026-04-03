import { Leap0Client } from "../src/index.js";

async function main(): Promise<void> {
  const client = new Leap0Client();
  const sandbox = await client.sandboxes.create();

  try {
    const result = await sandbox.process.execute({ command: "echo hello from leap0" });
    console.log("sandbox:", sandbox.id);
    console.log("exit code:", result.exitCode);
    console.log("result:", result.result.trim());
  } finally {
    await sandbox.delete();
    await client.close();
  }
}

void main();

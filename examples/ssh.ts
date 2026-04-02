import { Leap0Client } from "../src/index.js"

async function main(): Promise<void> {
  const client = new Leap0Client()
  const sandbox = await client.sandboxes.create()

  try {
    const access = await sandbox.ssh.createAccess()
    console.log("ssh command:", `ssh ${access.username}@${access.hostname} -p ${access.port}`)

    const validation = await sandbox.ssh.validateAccess(access.id, access.password ?? "")
    console.log("ssh valid:", validation.valid)
  } finally {
    await sandbox.delete()
    await client.close()
  }
}

void main()

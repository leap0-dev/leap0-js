import { Leap0Client } from "../src/index.js"

async function main(): Promise<void> {
  const client = new Leap0Client()
  let sandbox: Awaited<ReturnType<Leap0Client["sandboxes"]["create"]>> | undefined

  try {
    sandbox = await client.sandboxes.create()

    const access = await sandbox.ssh.createAccess()
    console.log("ssh command:", `ssh ${access.username}@${access.hostname} -p ${access.port}`)

    const validation = await sandbox.ssh.validateAccess(access.id, access.password ?? "")
    console.log("ssh valid:", validation.valid)
  } finally {
    if (sandbox) {
      try {
        await sandbox.delete()
      } catch {
      }
    }
    await client.close()
  }
}

void main()

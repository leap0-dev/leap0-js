import { writeFile } from "node:fs/promises"

import { DEFAULT_DESKTOP_TEMPLATE_NAME, Leap0Client } from "../src/index.js"

function decodeScreenshot(value: string): Uint8Array {
  const encoded = value.startsWith("data:") ? value.slice(value.indexOf(",") + 1) : value
  return Buffer.from(encoded, "base64")
}

async function main(): Promise<void> {
  const client = new Leap0Client()
  let sandbox: Awaited<ReturnType<Leap0Client["createSandbox"]>> | null = null

  try {
    sandbox = await client.sandboxes.create({ templateName: DEFAULT_DESKTOP_TEMPLATE_NAME })
    await sandbox.desktop.waitUntilReady(60)
    console.log("Desktop:", sandbox.desktop.browserUrl())

    const display = await sandbox.desktop.display()
    console.log("Display:", display)

    await sandbox.desktop.movePointer(Math.floor(display.width / 2), Math.floor(display.height / 2))
    await sandbox.desktop.click(1)

    const screenshot = await sandbox.desktop.screenshot()
    await writeFile("desktop-screenshot.png", decodeScreenshot(screenshot))
    console.log("Saved screenshot to desktop-screenshot.png")
  } finally {
    if (sandbox) {
      await sandbox.delete()
    }
    await client.close()
  }
}

void main()

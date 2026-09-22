import { Plugin } from "@opencode/plugin"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const BASE = "http://127.0.0.1:8081"
const SERVICE = "serve-qwen36.service"
const WAIT_MS = 6 * 60 * 1000

const run = promisify(execFile)

async function healthy(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(5000) })
    if (!r.ok) return false
    const j = (await r.json()) as { status?: string }
    return j.status === "ok"
  } catch {
    return false
  }
}

let starting: Promise<void> | undefined
async function ensureUp(): Promise<void> {
  if (await healthy()) return
  starting ??= (async () => {
    await run("systemctl", ["--user", "start", SERVICE])
    const t0 = Date.now()
    while (!(await healthy())) {
      if (Date.now() - t0 > WAIT_MS) throw new Error(`${SERVICE} did not become healthy`)
      await new Promise((r) => setTimeout(r, 5000))
    }
  })().finally(() => {
    starting = undefined
  })
  await starting
}

function scoped(event: { model?: { providerID?: string } }): boolean {
  return event.model?.providerID === "llamacpp"
}

export default Plugin.define({
  id: "local-llm",
  async setup(ctx) {
    await ctx.session.hook(
      "context",
      async (event) => {
        await ensureUp()
      },
      { providerID: "llamacpp" },
    )
    for (const kind of ["title", "generate"] as const) {
      await ctx.session.hook(kind, async (event) => {
        if (!scoped(event as { model?: { providerID?: string } })) return
        await ensureUp()
      })
    }
  },
})

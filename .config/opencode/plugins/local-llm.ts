import { Plugin } from "@opencode/plugin"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const BASE = "http://127.0.0.1:8081"
const SERVICE = "serve-qwen36.service"
const WAIT_MS = 6 * 60 * 1000
const IDLE_MS = Number(process.env.LOCAL_LLM_IDLE_MS ?? 30 * 60 * 1000)

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

function isLocal(event: { request?: { url?: string } }): boolean {
  try {
    return new URL(event.request?.url ?? "").port === "8081"
  } catch {
    return false
  }
}

export default Plugin.define({
  id: "local-llm",
  async setup(ctx) {
    let inFlight = 0
    let lastActivity = Date.now()

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
    await ctx.session.hook("http.request", async (event) => {
      if (!isLocal(event as { request?: { url?: string } })) return
      inFlight++
      lastActivity = Date.now()
    })
    await ctx.session.hook("http.response", async (event) => {
      if (!isLocal(event as { request?: { url?: string } })) return
      inFlight = Math.max(0, inFlight - 1)
      lastActivity = Date.now()
    })

    const timer = setInterval(async () => {
      try {
        if (inFlight > 0) return
        if (Date.now() - lastActivity < IDLE_MS) return
        if (!(await healthy())) return
        await run("systemctl", ["--user", "stop", SERVICE])
      } catch (error) {
        console.error(`[local-llm] idle stop failed: ${error}`)
      }
    }, 60_000)
    return () => clearInterval(timer)
  },
})

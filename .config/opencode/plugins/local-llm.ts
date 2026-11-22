import { Plugin } from "@opencode/plugin"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

interface LocalEntry {
  providerID: string
  base: string
  port: string
  service: string
}

const ENTRIES: LocalEntry[] = [
  { providerID: "llamacpp", base: "http://127.0.0.1:8081", port: "8081", service: "serve-qwen36.service" },
  { providerID: "inkling", base: "http://127.0.0.1:8082", port: "8082", service: "serve-inkling.service" },
]

const WAIT_MS = 6 * 60 * 1000
const IDLE_MS = Number(process.env.LOCAL_LLM_IDLE_MS ?? 30 * 60 * 1000)

const run = promisify(execFile)

const uid = process.getuid?.() ?? 1000
process.env.XDG_RUNTIME_DIR ??= `/run/user/${uid}`
process.env.DBUS_SESSION_BUS_ADDRESS ??= `unix:path=/run/user/${uid}/bus`

async function healthy(base: string): Promise<boolean> {
  try {
    const r = await fetch(`${base}/health`, { signal: AbortSignal.timeout(5000) })
    if (!r.ok) return false
    const j = (await r.json()) as { status?: string }
    return j.status === "ok"
  } catch {
    return false
  }
}

async function active(service: string): Promise<boolean> {
  try {
    const { stdout } = await run("systemctl", ["--user", "is-active", service])
    return stdout.trim() === "active"
  } catch {
    return false
  }
}

let starting: Promise<void> | undefined
async function ensureUp(entry: LocalEntry): Promise<void> {
  if (await healthy(entry.base)) return
  starting ??= (async () => {
    // Mutual exclusion: 21GB + 15GB weights exceed VRAM+RAM comfort,
    // so stop the other model before starting this one.
    for (const other of ENTRIES) {
      if (other.service !== entry.service && (await active(other.service))) {
        await run("systemctl", ["--user", "stop", other.service])
      }
    }
    await run("systemctl", ["--user", "start", entry.service])
    const t0 = Date.now()
    while (!(await healthy(entry.base))) {
      if (Date.now() - t0 > WAIT_MS) throw new Error(`${entry.service} did not become healthy`)
      await new Promise((r) => setTimeout(r, 5000))
    }
  })().finally(() => {
    starting = undefined
  })
  await starting
}

function entryForProvider(providerID?: string): LocalEntry | undefined {
  return ENTRIES.find((e) => e.providerID === providerID)
}

function entryForPort(port?: string): LocalEntry | undefined {
  return ENTRIES.find((e) => e.port === port)
}

function scoped(event: { model?: { providerID?: string } }): boolean {
  return entryForProvider(event.model?.providerID) !== undefined
}

function portOf(event: { request?: { url?: string } }): string | undefined {
  try {
    return new URL(event.request?.url ?? "").port || undefined
  } catch {
    return undefined
  }
}

export default Plugin.define({
  id: "local-llm",
  async setup(ctx) {
    let inFlight = 0
    let lastActivity = Date.now()

    for (const entry of ENTRIES) {
      await ctx.session.hook(
        "context",
        async () => {
          await ensureUp(entry)
        },
        { providerID: entry.providerID },
      )
    }
    for (const kind of ["title", "generate"] as const) {
      await ctx.session.hook(kind, async (event) => {
        const entry = entryForProvider((event as { model?: { providerID?: string } }).model?.providerID)
        if (!entry) return
        await ensureUp(entry)
      })
    }
    await ctx.session.hook("http.request", async (event) => {
      if (!entryForPort(portOf(event as { request?: { url?: string } }))) return
      inFlight++
      lastActivity = Date.now()
    })
    await ctx.session.hook("http.response", async (event) => {
      if (!entryForPort(portOf(event as { request?: { url?: string } }))) return
      inFlight = Math.max(0, inFlight - 1)
      lastActivity = Date.now()
    })

    const timer = setInterval(async () => {
      try {
        if (inFlight > 0) return
        if (Date.now() - lastActivity < IDLE_MS) return
        for (const entry of ENTRIES) {
          if (await healthy(entry.base)) {
            await run("systemctl", ["--user", "stop", entry.service])
          }
        }
      } catch (error) {
        console.error(`[local-llm] idle stop failed: ${error}`)
      }
    }, 60_000)
    return () => clearInterval(timer)
  },
})

const KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5,
  process.env.GROQ_API_KEY_6,
].filter(Boolean) as string[]

let currentIndex = 0
const cooldowns = new Map<string, number>()  // key → cooldown-until timestamp

export const keyManager = {
  getNextKey(): string {
    const now = Date.now()
    for (let i = 0; i < KEYS.length; i++) {
      const idx = (currentIndex + i) % KEYS.length
      const key = KEYS[idx]
      if ((cooldowns.get(key) ?? 0) <= now) {
        currentIndex = (idx + 1) % KEYS.length
        return key
      }
    }
    // All on cooldown — return the one that recovers soonest
    return KEYS.reduce((a, b) =>
      (cooldowns.get(a) ?? 0) < (cooldowns.get(b) ?? 0) ? a : b
    )
  },

  markRateLimited(key: string, seconds = 60) {
    cooldowns.set(key, Date.now() + seconds * 1000)
    console.warn(`[Keys] Key ...${key.slice(-4)} cooldown ${seconds}s`)
  },

  markFailed(key: string) {
    this.markRateLimited(key, 3600)
  }
}

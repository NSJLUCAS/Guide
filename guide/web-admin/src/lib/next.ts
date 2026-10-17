/**
 * Where to go once signed in. Private mode sends a signed-out visitor to the
 * panel with `next=/`, and only that exact value is honoured, so the parameter
 * cannot be used to bounce anyone off the site. It is kept in sessionStorage to
 * survive the round trip through GitHub sign-in, which lands back on /admin.
 */
const KEY = "guide-next"

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">

export function rememberNext(search: string, store: Store = sessionStorage): void {
  if (new URLSearchParams(search).get("next") !== "/") return
  try { store.setItem(KEY, "/") } catch { /* storage blocked: stay in the panel */ }
}

/** The remembered destination, at most once. */
export function takeNext(store: Store = sessionStorage): "/" | null {
  try {
    const next = store.getItem(KEY)
    store.removeItem(KEY)
    return next === "/" ? "/" : null
  } catch {
    return null
  }
}

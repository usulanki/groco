const listeners = new Set<() => void>()

export const orderEvents = {
  on:   (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn) },
  emit: () => listeners.forEach(fn => fn()),
}

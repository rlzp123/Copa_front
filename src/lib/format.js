export function formatBRL(value) {
  const n = Number(value || 0)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const pad = (n) => String(n).padStart(2, '0')

export function nowTime() {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function nowDate() {
  const d = new Date()
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

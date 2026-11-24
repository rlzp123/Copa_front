import { useApp } from '../context/AppContext'

export default function Toasts() {
  const { toasts } = useApp()
  if (!toasts.length) return null
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tipo}`}>{t.mensagem}</div>
      ))}
    </div>
  )
}

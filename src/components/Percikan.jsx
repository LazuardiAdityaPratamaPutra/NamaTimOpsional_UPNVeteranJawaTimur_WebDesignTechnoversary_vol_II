// Ledakan percik kecil dari satu titik (mis. saat mencentang atau menyimpan). Ganti `key` untuk memutar ulang.
export default function Percikan({ className = '' }) {
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute ${className}`}>
      {Array.from({ length: 8 }, (_, k) => <span key={k} className="percik-kecil absolute size-1 rounded-full bg-ember" style={{ '--a': `${k * 45}deg`, '--k': k }} />)}
    </span>
  )
}

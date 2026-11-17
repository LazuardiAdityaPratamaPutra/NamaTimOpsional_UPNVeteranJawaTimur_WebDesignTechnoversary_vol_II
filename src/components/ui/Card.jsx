// Kartu. `interaktif` untuk kartu yang bisa diklik: border menghangat dan naik 2px saat hover (hanya perangkat dengan kursor).
export default function Card({ as: Tag = 'div', interaktif = false, className = '', ...rest }) {
  const gerak = interaktif
    ? 'group transition-[border-color,transform,box-shadow] duration-200 ease-snap hover:-translate-y-0.5 hover:border-ember-ink/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30'
    : ''
  return <Tag {...rest} className={`rounded-2xl border border-line bg-surface p-6 ${gerak} ${className}`} />
}

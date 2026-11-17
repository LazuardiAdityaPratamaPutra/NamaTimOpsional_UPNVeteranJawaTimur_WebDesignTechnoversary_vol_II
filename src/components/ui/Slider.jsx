export default function Slider({ label, display, className = '', ...rest }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="flex justify-between">
        <span>{label}</span>
        {display != null && <span className="font-mono text-ink-2">{display}</span>}
      </span>
      <input type="range" className="mt-1 w-full accent-[var(--ember-ink)]" {...rest} />
    </label>
  )
}

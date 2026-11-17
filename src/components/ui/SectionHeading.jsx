export default function SectionHeading({ eyebrow, title, children, as: H = 'h2', id, className = '' }) {
  return (
    <div data-gulir className={`max-w-2xl [translate:0_calc(var(--gy,0)*-16px)] ${className}`}>
      {eyebrow && <p className="m-0 text-sm font-semibold text-ember-ink">{eyebrow}</p>}
      <H id={id} className={`${eyebrow ? 'mt-2' : ''} text-4xl leading-[1.02] sm:text-5xl`}>{title}</H>
      {children && <p className="mt-5 max-w-[56ch] text-base leading-relaxed text-ink-2">{children}</p>}
    </div>
  )
}

export default function Container({ as: Tag = 'div', className = '', ...rest }) {
  return <Tag {...rest} className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`} />
}

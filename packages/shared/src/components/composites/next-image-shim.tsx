// @ts-nocheck
import * as React from 'react'

type ShimProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'width' | 'height'> & {
  src: string | { src: string }
  alt: string
  width?: number | string
  height?: number | string
  priority?: boolean
  fill?: boolean
}

/**
 * Minimal `next/image` drop-in for the TanStack Start port. No optimization
 * pipeline yet — if we want Cloudflare Images later, swap this implementation.
 */
const Image = React.forwardRef<HTMLImageElement, ShimProps>(function Image(
  { src, alt, width, height, fill, priority: _priority, style, ...rest },
  ref
) {
  const resolvedSrc = typeof src === 'string' ? src : src?.src
  const resolvedStyle: React.CSSProperties | undefined = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }
    : style
  return (
    <img
      ref={ref}
      src={resolvedSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      style={resolvedStyle}
      loading="lazy"
      {...rest}
    />
  )
})

export default Image

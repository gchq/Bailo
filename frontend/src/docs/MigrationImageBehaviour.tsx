//Script to migrate from next/legacy/image to next/image
//paddingBottom is controlled by a width to height ratio

import Image from 'next/image'
import { CSSProperties } from 'react'

export function imageLoader({ src }: { src: string }) {
  return src
}

const css: CSSProperties = { objectFit: 'contain' }

function ResponsiveImage({ src, scaling = 50, alt, style = css }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 'auto',
        height: 'auto',
        marginLeft: 'auto',
        paddingBottom: `max(350px, ${scaling}%)`,
      }}
    >
      <Image loader={imageLoader} className='next-image' src={src} fill style={style} alt={alt} />
    </div>
  )
}

export default ResponsiveImage

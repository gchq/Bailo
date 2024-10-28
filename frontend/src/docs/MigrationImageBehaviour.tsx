//Script to migrate from next/legacy/image to next/image
//paddingBottom is controlled by a width to height ratio

import Image from 'next/image'

export function imageLoader({ src }: { src: string }) {
  return src
}

function ResponsiveImage({ src, scaling = 50, alt }) {
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
      <Image loader={imageLoader} className='next-image' src={src} layout='fill' objectFit='contain' alt={alt} />
    </div>
  )
}

export default ResponsiveImage

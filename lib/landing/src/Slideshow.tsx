import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper'
import 'swiper/css/pagination'
import Image from 'next/image'

import imageLoader from './imageLoader'
import React from 'react'

import styled from 'styled-components'

import marketplaceImage from '../public/images/bailo-marketplace.png'
import apiImage from '../public/images/bailo-api.png'
import modelImage from '../public/images/bailo-model.png'
import deploymentImage from '../public/images/bailo-deployment.png'

const StyledSwiper = styled(Swiper)`
  border-radius: 1rem;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 25px 50px -12px;
`

const slides = [
  {
    image: marketplaceImage,
    text: '',
    alt: 'Bailo shows a collection of models in a marketplace',
  },
  {
    image: modelImage,
    text: '',
    alt: 'Bailo displays a configurable set of information for a model',
  },
  {
    image: deploymentImage,
    text: '',
    alt: 'Bailo allows models to be deployed through Docker',
  },
  {
    image: apiImage,
    text: '',
    alt: 'Bailo can be used entirely by a well documented API or Python client',
  },
]

export default function Slideshow() {
  return (
    <>
      <StyledSwiper
        modules={[Autoplay, Pagination, Navigation]}
        pagination={{
          clickable: true,
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: true,
        }}
        navigation={true}
        loop={true}
        breakpoints={{
          320: {
            slidesPerView: 1,
            spaceBetween: 20,
          },
          640: {
            slidesPerView: 1,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 1,
            spaceBetween: 40,
          },
          1024: {
            slidesPerView: 1,
            spaceBetween: 50,
          },
        }}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.alt}>
            <Image
              loader={imageLoader}
              src={slide.image}
              alt={slide.alt}
              style={{ width: 'inherit', height: 'inherit' }}
            />
          </SwiperSlide>
        ))}
      </StyledSwiper>
    </>
  )
}

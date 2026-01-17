'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import FeatureSection from '@/components/FeatureSection'
import Footer from '@/components/Footer'

// Lazy load heavy below-the-fold components for better LCP
const VideoSection = dynamic(() => import('@/components/VideoSection'), {
  loading: () => <div className="py-12 flex justify-center"><div className="animate-pulse bg-gray-200 rounded-3xl w-full max-w-4xl h-96 mx-auto"></div></div>,
  ssr: false
})

const Testimonials = dynamic(() => import('@/components/Testimonials'), {
  loading: () => <div className="py-20"><div className="animate-pulse bg-gray-100 h-64 rounded-xl max-w-6xl mx-auto"></div></div>,
  ssr: false
})

const SecuritySection = dynamic(() => import('@/components/SecuritySection'), {
  loading: () => <div className="py-20"><div className="animate-pulse bg-gray-100 h-64 rounded-xl max-w-6xl mx-auto"></div></div>,
  ssr: false
})

const FAQ = dynamic(() => import('@/components/FAQ'), {
  loading: () => <div className="py-16"><div className="animate-pulse bg-gray-100 h-48 rounded-xl max-w-4xl mx-auto"></div></div>,
  ssr: false
})

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <FeatureSection />
      <VideoSection />
      <Testimonials />
      <SecuritySection />
      <FAQ />
      <Footer />
    </div>
  )
}


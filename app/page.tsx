'use client'

import dynamic from 'next/dynamic'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import FeatureSection from '@/components/FeatureSection'

// Lazy load heavy below-the-fold components for better LCP
const VideoSection = dynamic(() => import('@/components/VideoSection'), {
  loading: () => <div className="py-12 flex justify-center"><div className="animate-pulse bg-gray-200 rounded-3xl w-full max-w-4xl h-96 mx-auto"></div></div>,
  ssr: false
})

const Testimonials = dynamic(() => import('@/components/Testimonials'), {
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
      <FAQ />

      {/* Footer Minimaliste */}
      <footer className="bg-secondary py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center bg-transparent">
          <p className="text-gray-500 text-sm">© 2024 TopLinkSante. Tous droits réservés.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-500 hover:text-primary transition-colors">Mentions légales</a>
            <a href="#" className="text-gray-500 hover:text-primary transition-colors">Confidentialité</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

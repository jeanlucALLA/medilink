'use client'

import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import FeatureSection from '@/components/FeatureSection'
import VideoSection from '@/components/VideoSection'
import Testimonials from '@/components/Testimonials'
import FAQ from '@/components/FAQ'

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
            <a href="#" className="text-gray-400 hover:text-primary transition-colors">Mentions légales</a>
            <a href="#" className="text-gray-400 hover:text-primary transition-colors">Confidentialité</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

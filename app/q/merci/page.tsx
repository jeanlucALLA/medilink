'use client'

import { Heart, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function MerciPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Merci !
        </h1>
        <p className="text-gray-600 mb-6">
          Vos réponses ont été transmises à votre professionnel de santé.
        </p>
        <div className="pt-6 border-t border-gray-200">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-primary hover:text-primary-dark font-medium"
          >
            <Heart className="w-4 h-4" />
            <span>Retour à TopLinkSante</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

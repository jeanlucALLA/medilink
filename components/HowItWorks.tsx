'use client'

import React from 'react'
import { Mail, MessageSquare, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react'

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-10 right-0 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -z-10"></div>
        </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-lg text-gray-600">
            Une méthodologie simple et efficace pour transformer chaque consultation en opportunité d&apos;amélioration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-blue-200 -z-10"></div>

          {/* Étape 1 : Collecte */}
          <div className="relative group">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 mx-auto transform rotate-3 group-hover:rotate-6 transition-transform">
                <Mail className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white text-sm font-bold py-1 px-3 rounded-full shadow-md">
                Étape 1
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">Collecte Automatisée</h3>
              <p className="text-gray-600 text-center mb-6">
                Envoi automatique de questionnaires programmables par email après chaque consultation.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Sans intervention manuelle</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>100% Personnalisable</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Étape 2 : Feedback */}
          <div className="relative group">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 mx-auto transform -rotate-3 group-hover:-rotate-6 transition-transform">
                <MessageSquare className="w-10 h-10 text-indigo-600" />
              </div>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-sm font-bold py-1 px-3 rounded-full shadow-md">
                Étape 2
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">Feedback Patient</h3>
              <p className="text-gray-600 text-center mb-6">
                Le patient répond à 5 questions clés pour évaluer son expérience.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <span>Facilité de prise de RDV</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <span>Temps d&apos;attente</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <span>Clarté des explications</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <span>Qualité de l&apos;accueil</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <span>Probabilité de recommandation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Étape 3 : Benchmark */}
          <div className="relative group">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="w-20 h-20 bg-teal-100 rounded-2xl flex items-center justify-center mb-6 mx-auto transform rotate-3 group-hover:rotate-6 transition-transform">
                <BarChart3 className="w-10 h-10 text-teal-600" />
              </div>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-teal-600 text-white text-sm font-bold py-1 px-3 rounded-full shadow-md">
                Étape 3
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">Benchmark</h3>
              <p className="text-gray-600 text-center mb-6">
                Analysez vos performances par rapport à vos confrères.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <div className="bg-teal-50 p-1.5 rounded text-teal-700 mt-0.5">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                  <span className="text-gray-600">Calcul du score de performance</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-teal-50 p-1.5 rounded text-teal-700 mt-0.5">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                  <span className="text-gray-600">Comparaison moyenne régionale</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-teal-50 p-1.5 rounded text-teal-700 mt-0.5">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                  <span className="text-gray-600">Comparaison par spécialité</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

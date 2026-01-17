'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Phone, Send, CheckCircle, ArrowLeft, Calendar } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ContactDemoPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        specialty: '',
        message: ''
    })
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/demo-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'envoi')
            }

            setSubmitted(true)
        } catch (error: any) {
            alert(error.message || 'Une erreur est survenue')
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="pt-32 pb-20">
                    <div className="max-w-xl mx-auto px-4 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Demande envoyée !
                        </h1>
                        <p className="text-gray-600 text-lg mb-8">
                            Merci pour votre intérêt. Notre équipe vous contactera dans les 24 heures
                            pour planifier une démonstration personnalisée.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center space-x-2 text-primary hover:text-primary-dark font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Retour à l&apos;accueil</span>
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero */}
            <section className="pt-32 pb-12 bg-gradient-to-b from-blue-50 to-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                        <Calendar className="w-4 h-4" />
                        <span>Démonstration gratuite</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Découvrez TopLinkSante en action
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Réservez une démonstration personnalisée de 15 minutes avec notre équipe.
                    </p>
                </div>
            </section>

            {/* Form Section */}
            <section className="py-16">
                <div className="max-w-2xl mx-auto px-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                        <div className="space-y-6">

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom complet *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Dr. Jean Dupont"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email professionnel *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="jean.dupont@cabinet.fr"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Téléphone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="06 XX XX XX XX"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Specialty */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Spécialité *
                                </label>
                                <select
                                    required
                                    value={formData.specialty}
                                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                >
                                    <option value="">Sélectionnez votre spécialité</option>
                                    <option value="podologue">Podologue</option>
                                    <option value="chirurgien-orthopedique">Chirurgien orthopédique</option>
                                    <option value="kinesitherapeute">Kinésithérapeute</option>
                                    <option value="osteopathe">Ostéopathe</option>
                                    <option value="medecin-generaliste">Médecin généraliste</option>
                                    <option value="dentiste">Dentiste</option>
                                    <option value="autre">Autre</option>
                                </select>
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message (optionnel)
                                </label>
                                <textarea
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Décrivez brièvement vos besoins ou questions..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        <span>Demander une démo</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Contact Info */}
                    <div className="mt-12 text-center">
                        <p className="text-gray-600 mb-4">Vous préférez nous contacter directement ?</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-6">
                            <a
                                href="mailto:contact@toplinksante.com"
                                className="flex items-center justify-center space-x-2 text-primary hover:text-primary-dark"
                            >
                                <Mail className="w-5 h-5" />
                                <span>contact@toplinksante.com</span>
                            </a>
                            <a
                                href="tel:+33600000000"
                                className="flex items-center justify-center space-x-2 text-primary hover:text-primary-dark"
                            >
                                <Phone className="w-5 h-5" />
                                <span>+33 6 XX XX XX XX</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin, Shield, Heart, Users } from 'lucide-react'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-gray-900 text-gray-300">
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

                    {/* Brand Column */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                                <Heart className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">TopLinkSante</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            La plateforme de suivi patient éphémère pour les professionnels de santé.
                            Collectez des retours, améliorez votre pratique.
                        </p>
                        <div className="flex items-center space-x-2 text-sm">
                            <Shield className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">Zero-Data • RGPD Compliant</span>
                        </div>
                    </div>

                    {/* Qui sommes-nous */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
                            <Users className="w-5 h-5 text-primary" />
                            <span>Qui sommes-nous</span>
                        </h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/about" className="hover:text-primary transition-colors">
                                    Notre histoire
                                </Link>
                            </li>
                            <li>
                                <Link href="/about#team" className="hover:text-primary transition-colors">
                                    L&apos;équipe
                                </Link>
                            </li>
                            <li>
                                <Link href="/about#mission" className="hover:text-primary transition-colors">
                                    Notre mission
                                </Link>
                            </li>
                            <li>
                                <Link href="/abonnement" className="hover:text-primary transition-colors">
                                    Nos tarifs
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Nos engagements */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <span>Nos engagements</span>
                        </h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/confidentialite" className="hover:text-primary transition-colors">
                                    Protection des données
                                </Link>
                            </li>
                            <li>
                                <Link href="/confidentialite#zero-data" className="hover:text-primary transition-colors">
                                    Architecture Zero-Data
                                </Link>
                            </li>
                            <li>
                                <Link href="/confidentialite#rgpd" className="hover:text-primary transition-colors">
                                    Conformité RGPD
                                </Link>
                            </li>
                            <li>
                                <Link href="/mentions-legales" className="hover:text-primary transition-colors">
                                    Mentions légales
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Nous contacter */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
                            <Mail className="w-5 h-5 text-primary" />
                            <span>Nous contacter</span>
                        </h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start space-x-3">
                                <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <a href="mailto:contact@toplinksante.com" className="hover:text-primary transition-colors">
                                    contact@toplinksante.com
                                </a>
                            </li>
                            <li className="flex items-start space-x-3">
                                <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span>+33 6 XX XX XX XX</span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span>Paris, France</span>
                            </li>
                        </ul>

                        {/* CTA Button */}
                        <div className="mt-6">
                            <Link
                                href="/contact-demo"
                                className="inline-block px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Demander une démo
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-sm text-gray-500">
                            © {currentYear} TopLinkSante. Tous droits réservés.
                        </p>
                        <div className="flex items-center space-x-6 text-sm">
                            <Link href="/mentions-legales" className="text-gray-500 hover:text-primary transition-colors">
                                Mentions légales
                            </Link>
                            <Link href="/confidentialite" className="text-gray-500 hover:text-primary transition-colors">
                                Confidentialité
                            </Link>
                            <Link href="/cgu" className="text-gray-500 hover:text-primary transition-colors">
                                CGU
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

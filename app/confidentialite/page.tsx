import { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Lock, Database, Eye, Server, CheckCircle, ArrowLeft, Mail } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Politique de Confidentialité | TopLinkSante',
    description: 'Découvrez comment TopLinkSante protège vos données avec notre architecture Zero-Data. Aucune donnée de santé patient stockée.',
}

export default function ConfidentialitePage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <Link href="/" className="inline-flex items-center text-gray-600 hover:text-primary transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour à l&apos;accueil
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-50 rounded-2xl">
                            <Shield className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Politique de Confidentialité</h1>
                            <p className="text-gray-600">Dernière mise à jour : Janvier 2026</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

                {/* Zero-Data Banner */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-8 h-8" />
                        <h2 className="text-2xl font-bold">Architecture Zero-Data</h2>
                    </div>
                    <p className="text-green-100 text-lg">
                        TopLinkSante a été conçu dès le départ pour ne jamais stocker de données de santé
                        identifiables. Les informations de vos patients sont protégées : leurs emails sont
                        supprimés après envoi et leurs réponses sont entièrement anonymisées.
                    </p>
                </div>

                {/* Section 1 */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <Database className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">1. Données que nous collectons</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Données du praticien (vous)</h3>
                            <ul className="list-disc list-inside text-gray-600 space-y-1">
                                <li>Nom complet et adresse email</li>
                                <li>Spécialité et adresse du cabinet</li>
                                <li>Préférences de notification</li>
                                <li>Données de facturation (via Stripe, non stockées chez nous)</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                            <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Données patient : NON STOCKÉES
                            </h3>
                            <ul className="text-green-700 space-y-1 text-sm">
                                <li>• Les emails patients sont <strong>supprimés après envoi</strong> des questionnaires</li>
                                <li>• Les noms des patients ne sont <strong>jamais collectés</strong></li>
                                <li>• Les réponses aux questionnaires sont <strong>anonymisées</strong> (seuls les scores sont conservés)</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Section 2 */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 rounded-xl">
                            <Eye className="w-6 h-6 text-purple-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">2. Comment nous utilisons vos données</h2>
                    </div>

                    <ul className="space-y-3 text-gray-600">
                        <li className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Gérer votre compte et accès à la plateforme</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Envoyer les questionnaires à vos patients en votre nom</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Vous notifier des nouvelles réponses (selon vos préférences)</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Améliorer nos services via des statistiques anonymisées</span>
                        </li>
                    </ul>
                </section>

                {/* Section 3 */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-50 rounded-xl">
                            <Lock className="w-6 h-6 text-orange-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">3. Mesures de sécurité</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <h4 className="font-semibold text-gray-900 mb-2">🔒 Chiffrement</h4>
                            <p className="text-sm text-gray-600">Toutes les données transitent via HTTPS avec chiffrement TLS 1.3</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <h4 className="font-semibold text-gray-900 mb-2">🇪🇺 Hébergement UE</h4>
                            <p className="text-sm text-gray-600">Infrastructure Supabase hébergée en Europe (Francfort)</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <h4 className="font-semibold text-gray-900 mb-2">🗑️ Purge automatique</h4>
                            <p className="text-sm text-gray-600">Emails patients supprimés immédiatement après envoi</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <h4 className="font-semibold text-gray-900 mb-2">🔑 Authentification sécurisée</h4>
                            <p className="text-sm text-gray-600">Gestion des sessions via Supabase Auth avec tokens JWT</p>
                        </div>
                    </div>
                </section>

                {/* Section 4 */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-50 rounded-xl">
                            <Server className="w-6 h-6 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">4. Vos droits (RGPD)</h2>
                    </div>

                    <p className="text-gray-600 mb-4">
                        Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
                    </p>

                    <ul className="space-y-2 text-gray-600 mb-6">
                        <li>• <strong>Droit d&apos;accès</strong> : obtenir une copie de vos données personnelles</li>
                        <li>• <strong>Droit de rectification</strong> : corriger vos informations</li>
                        <li>• <strong>Droit à l&apos;effacement</strong> : supprimer votre compte et vos données</li>
                        <li>• <strong>Droit à la portabilité</strong> : exporter vos données</li>
                        <li>• <strong>Droit d&apos;opposition</strong> : refuser certains traitements</li>
                    </ul>

                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-blue-800 text-sm">
                            Pour exercer ces droits, contactez-nous via la page{' '}
                            <Link href="/dashboard/contact" className="underline font-medium">Contact / Support</Link>{' '}
                            ou par email.
                        </p>
                    </div>
                </section>

                {/* Contact */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                    <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Des questions ?</h2>
                    <p className="text-gray-600 mb-6">
                        Notre équipe est disponible pour répondre à toutes vos interrogations concernant
                        la protection de vos données.
                    </p>
                    <Link
                        href="/dashboard/contact"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"
                    >
                        Nous contacter
                    </Link>
                </section>

            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 py-8">
                <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
                    © 2026 TopLinkSante. Tous droits réservés.
                </div>
            </footer>
        </div>
    )
}

import { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Users, CreditCard, AlertTriangle, Ban, RefreshCw, Mail, ArrowLeft, CheckCircle, Shield } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Conditions Générales d\'Utilisation | TopLinkSante',
    description: 'CGU de TopLinkSante - Conditions d\'utilisation de la plateforme de suivi patient pour professionnels de santé.',
}

export default function CGUPage() {
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
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <FileText className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Conditions Générales d&apos;Utilisation</h1>
                            <p className="text-gray-600">Dernière mise à jour : Janvier 2026</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">

                {/* Introduction */}
                <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
                    <h2 className="text-2xl font-bold mb-4">Bienvenue sur TopLinkSante</h2>
                    <p className="text-indigo-100">
                        Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation
                        de la plateforme TopLinkSante. En créant un compte, vous acceptez ces conditions dans leur intégralité.
                    </p>
                </section>

                {/* Article 1 - Objet */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Article 1 - Objet du service</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p>
                            TopLinkSante est une plateforme SaaS (Software as a Service) destinée aux <strong>professionnels de santé</strong>
                            permettant de :
                        </p>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Envoyer des questionnaires de suivi post-consultation à leurs patients</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Collecter des retours anonymisés sur la satisfaction et l&apos;évolution des patients</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Améliorer leur pratique grâce à des statistiques et benchmarks anonymes</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Solliciter des avis Google auprès des patients satisfaits</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Article 2 - Inscription */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 rounded-xl">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Article 2 - Inscription et compte utilisateur</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p><strong>2.1 Éligibilité</strong></p>
                        <p>
                            L&apos;inscription à TopLinkSante est réservée aux professionnels de santé exerçant légalement
                            leur activité. En vous inscrivant, vous certifiez être un professionnel de santé qualifié.
                        </p>

                        <p><strong>2.2 Création de compte</strong></p>
                        <p>
                            Vous devez fournir des informations exactes et à jour lors de votre inscription.
                            Vous êtes responsable de la confidentialité de vos identifiants de connexion.
                        </p>

                        <p><strong>2.3 Période d&apos;essai</strong></p>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-blue-800">
                                Une période d&apos;essai gratuite de <strong>5 jours</strong> est offerte à chaque nouveau praticien.
                                À l&apos;issue de cette période, un abonnement payant est requis pour continuer à utiliser le service.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Article 3 - Abonnements */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-50 rounded-xl">
                            <CreditCard className="w-6 h-6 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Article 3 - Abonnements et paiements</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p><strong>3.1 Formules d&apos;abonnement</strong></p>
                        <p>
                            TopLinkSante propose plusieurs formules d&apos;abonnement (Premium, Cabinet) avec des fonctionnalités
                            et tarifs différents, détaillés sur la page <Link href="/abonnement" className="text-primary hover:underline">Abonnement</Link>.
                        </p>

                        <p><strong>3.2 Facturation</strong></p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Les abonnements sont facturés mensuellement ou annuellement selon le choix</li>
                            <li>Le paiement est prélevé automatiquement via Stripe</li>
                            <li>Les factures sont disponibles dans votre espace client</li>
                        </ul>

                        <p><strong>3.3 Modification des tarifs</strong></p>
                        <p>
                            TopLinkSante se réserve le droit de modifier ses tarifs. Les utilisateurs seront informés
                            30 jours avant toute modification tarifaire.
                        </p>
                    </div>
                </section>

                {/* Article 4 - Résiliation */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-50 rounded-xl">
                            <RefreshCw className="w-6 h-6 text-orange-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Article 4 - Résiliation</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p><strong>4.1 Résiliation par l&apos;utilisateur</strong></p>
                        <p>
                            Vous pouvez résilier votre abonnement à tout moment depuis votre espace client.
                            La résiliation prend effet à la fin de la période de facturation en cours.
                        </p>

                        <p><strong>4.2 Résiliation par TopLinkSante</strong></p>
                        <p>
                            TopLinkSante peut suspendre ou résilier votre compte en cas de violation des présentes CGU,
                            notamment en cas d&apos;utilisation frauduleuse ou abusive du service.
                        </p>

                        <p><strong>4.3 Conséquences de la résiliation</strong></p>
                        <p>
                            À la résiliation, vos données de compte seront conservées pendant 30 jours puis supprimées.
                            Les réponses anonymisées de vos patients pourront être conservées à des fins statistiques.
                        </p>
                    </div>
                </section>

                {/* Article 5 - Obligations */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <Shield className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Article 5 - Obligations de l&apos;utilisateur</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p>En utilisant TopLinkSante, vous vous engagez à :</p>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Utiliser le service conformément à sa destination (suivi patient médical)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Obtenir le consentement de vos patients avant l&apos;envoi de questionnaires</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Ne pas envoyer de communications non sollicitées (spam)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>Respecter le secret médical et les règles déontologiques de votre profession</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Article 6 - Interdictions */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-50 rounded-xl">
                            <Ban className="w-6 h-6 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Article 6 - Utilisations interdites</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p>Il est strictement interdit de :</p>
                        <ul className="space-y-2 text-red-700">
                            <li className="flex items-start gap-3">
                                <Ban className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span>Utiliser le service pour des activités illégales ou frauduleuses</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Ban className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span>Tenter d&apos;accéder aux données d&apos;autres utilisateurs</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Ban className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span>Reverse-engineering ou tentative de copie du logiciel</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Ban className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span>Surcharger intentionnellement les serveurs (attaques DDoS)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Ban className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span>Revendre ou sous-licencier l&apos;accès au service</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Article 7 - Responsabilité */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-yellow-50 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Article 7 - Limitation de responsabilité</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p>
                            <strong>7.1</strong> TopLinkSante est un outil d&apos;aide au suivi patient et ne se substitue
                            en aucun cas à l&apos;expertise médicale du praticien.
                        </p>
                        <p>
                            <strong>7.2</strong> TopLinkSante ne peut être tenu responsable des décisions médicales
                            prises par les praticiens sur la base des informations collectées via la plateforme.
                        </p>
                        <p>
                            <strong>7.3</strong> En cas d&apos;indisponibilité temporaire du service, TopLinkSante
                            s&apos;engage à rétablir l&apos;accès dans les meilleurs délais mais ne garantit pas une disponibilité 100%.
                        </p>
                        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                            <p className="text-yellow-800 text-sm">
                                ⚠️ La responsabilité de TopLinkSante est limitée au montant des sommes versées
                                par l&apos;utilisateur au cours des 12 derniers mois.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Article 8 - Données personnelles */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-50 rounded-xl">
                            <Shield className="w-6 h-6 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Article 8 - Protection des données</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p>
                            TopLinkSante applique une politique <strong>Zero-Data</strong> concernant les données de santé :
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Les emails des patients sont supprimés après envoi des questionnaires</li>
                            <li>Les réponses sont anonymisées (aucune donnée identifiante conservée)</li>
                            <li>Aucune donnée de santé identifiable n&apos;est stockée</li>
                        </ul>
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                            <p className="text-green-800 text-sm">
                                📖 Consultez notre{' '}
                                <Link href="/confidentialite" className="underline font-medium">Politique de Confidentialité</Link>{' '}
                                pour plus de détails sur le traitement de vos données.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Article 9 - Modifications */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gray-100 rounded-xl">
                            <RefreshCw className="w-6 h-6 text-gray-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Article 9 - Modifications des CGU</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p>
                            TopLinkSante se réserve le droit de modifier les présentes CGU à tout moment.
                            Les utilisateurs seront informés par email de toute modification substantielle
                            au moins 15 jours avant leur entrée en vigueur.
                        </p>
                        <p>
                            La poursuite de l&apos;utilisation du service après modification vaut acceptation
                            des nouvelles conditions.
                        </p>
                    </div>
                </section>

                {/* Article 10 - Droit applicable */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gray-100 rounded-xl">
                            <span className="text-2xl">⚖️</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Article 10 - Droit applicable</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p>
                            Les présentes CGU sont soumises au droit français. En cas de litige, les parties
                            s&apos;engagent à rechercher une solution amiable avant toute action judiciaire.
                        </p>
                        <p>
                            À défaut d&apos;accord amiable, les tribunaux de Paris seront seuls compétents.
                        </p>
                    </div>
                </section>

                {/* Contact */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                    <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Des questions sur nos CGU ?</h2>
                    <p className="text-gray-600 mb-6">
                        Notre équipe est à votre disposition pour toute clarification.
                    </p>
                    <a
                        href="mailto:contact@toplinksante.com"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"
                    >
                        contact@toplinksante.com
                    </a>
                </section>

            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 py-8">
                <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
                    © 2026 TopLinkSante. Tous droits réservés. |{' '}
                    <Link href="/mentions-legales" className="hover:text-primary">Mentions légales</Link> |{' '}
                    <Link href="/confidentialite" className="hover:text-primary">Confidentialité</Link>
                </div>
            </footer>
        </div>
    )
}

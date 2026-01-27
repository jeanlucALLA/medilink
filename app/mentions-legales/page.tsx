import { Metadata } from 'next'
import Link from 'next/link'
import { Scale, Building2, Server, Mail, Shield, ArrowLeft, Globe, CreditCard, Eye, Database, Lock, Users, FileText } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Mentions Légales | TopLinkSante',
    description: 'Mentions légales de TopLinkSante - Informations sur l\'éditeur, l\'hébergeur et les conditions d\'utilisation du site.',
}

export default function MentionsLegalesPage() {
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
                        <div className="p-3 bg-blue-50 rounded-2xl">
                            <Scale className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Mentions Légales</h1>
                            <p className="text-gray-600">Dernière mise à jour : Janvier 2026</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content - Two Column Layout like Abaseo */}
            <div className="max-w-6xl mx-auto px-4 py-12">

                {/* Title Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white mb-12">
                    <h2 className="text-2xl font-bold mb-2">MENTIONS LÉGALES ET POLITIQUE DE CONFIDENTIALITÉ</h2>
                    <p className="text-blue-100">
                        TopLinkSante attache une grande importance à la protection et confidentialité de la vie privée
                        de ses abonnés. La présente politique vous permettra de comprendre quelles données à caractère
                        personnel nous collectons et la façon dont vous pouvez protéger votre vie privée.
                    </p>
                </div>

                {/* Two Column Grid */}
                <div className="grid md:grid-cols-2 gap-8">

                    {/* Left Column */}
                    <div className="space-y-8">

                        {/* 1. Éditeur du site */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-50 rounded-xl">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">1. ÉDITEUR DU SITE</h2>
                            </div>
                            <div className="space-y-3 text-gray-600 text-sm">
                                <p>
                                    Le site <strong>TopLinkSante</strong> accessible à l&apos;adresse{' '}
                                    <a href="https://www.toplinksante.com" className="text-primary hover:underline">www.toplinksante.com</a> est édité par :
                                </p>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                                    <p><strong>Raison sociale :</strong> TopLinkSante</p>
                                    <p><strong>Forme juridique :</strong> Entreprise individuelle</p>
                                    <p><strong>Siège social :</strong> Paris, France</p>
                                    <p><strong>Email :</strong> <a href="mailto:contact@toplinksante.com" className="text-primary hover:underline">contact@toplinksante.com</a></p>
                                    <p><strong>Directeur de la publication :</strong> Marcus Diallo</p>
                                </div>
                            </div>
                        </section>

                        {/* 2. Hébergement */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-50 rounded-xl">
                                    <Server className="w-5 h-5 text-purple-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">2. HÉBERGEMENT</h2>
                            </div>
                            <div className="space-y-3 text-gray-600 text-sm">
                                <p>Le site est hébergé par :</p>
                                <div className="space-y-3">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="font-semibold text-gray-900 mb-1">🌐 Frontend</p>
                                        <p>Vercel Inc. - 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
                                        <a href="https://vercel.com" className="text-primary hover:underline text-xs">vercel.com</a>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="font-semibold text-gray-900 mb-1">🗄️ Base de données</p>
                                        <p>Supabase Inc. - Serveurs hébergés en Union Européenne (Francfort, Allemagne)</p>
                                        <a href="https://supabase.com" className="text-primary hover:underline text-xs">supabase.com</a>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. Données collectées */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-50 rounded-xl">
                                    <Database className="w-5 h-5 text-green-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">3. QUELLES DONNÉES COLLECTONS-NOUS ?</h2>
                            </div>
                            <div className="space-y-4 text-gray-600 text-sm">
                                <p>Dans le cadre de la souscription aux services de TopLinkSante, nous collectons :</p>
                                <div className="space-y-2">
                                    <p><strong>a) Données d&apos;identification :</strong> nom, prénom, adresse email, spécialité médicale</p>
                                    <p><strong>b) Données d&apos;usage :</strong> statistiques d&apos;utilisation, préférences, historique des questionnaires</p>
                                    <p><strong>c) Données de facturation :</strong> traitées par Stripe (non stockées chez nous)</p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                    <p className="text-green-800 font-semibold mb-1">✅ Architecture Zero-Data</p>
                                    <p className="text-green-700 text-xs">
                                        Les emails patients sont supprimés après envoi. Les réponses aux questionnaires sont
                                        entièrement anonymisées. Aucune donnée de santé identifiable n&apos;est stockée.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 4. Utilisation des données */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-orange-50 rounded-xl">
                                    <Eye className="w-5 h-5 text-orange-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">4. COMMENT UTILISONS-NOUS VOS DONNÉES ?</h2>
                            </div>
                            <div className="space-y-3 text-gray-600 text-sm">
                                <p>TopLinkSante utilise vos données pour :</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>La gestion de votre compte et de la relation contractuelle</li>
                                    <li>L&apos;envoi des questionnaires à vos patients en votre nom</li>
                                    <li>La maintenance et l&apos;amélioration du service</li>
                                    <li>Le traitement de vos demandes et réclamations</li>
                                    <li>L&apos;établissement de statistiques anonymisées</li>
                                </ul>
                                <p className="text-xs italic">
                                    Les données sont conservées pendant la durée de la relation contractuelle et/ou pendant
                                    la durée légale. Sans ces données, TopLinkSante ne pourrait pas exécuter les prestations souscrites.
                                </p>
                            </div>
                        </section>

                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">

                        {/* 5. Vos droits */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-50 rounded-xl">
                                    <Users className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">5. COMMENT GÉRER VOS DONNÉES ?</h2>
                            </div>
                            <div className="space-y-3 text-gray-600 text-sm">
                                <p>
                                    Conformément au RGPD, vous pouvez à tout moment accéder à vos données, les rectifier,
                                    demander leur suppression ou leur limitation, vous opposer à un traitement pour des
                                    motifs légitimes ou exercer votre droit à la portabilité.
                                </p>
                                <p>Pour exercer ces droits, vous pouvez :</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Via votre Espace Praticien (paramètres du compte)</li>
                                    <li>Par email : <a href="mailto:contact@toplinksante.com" className="text-primary hover:underline">contact@toplinksante.com</a></li>
                                </ul>
                                <p className="text-xs">
                                    En cas de réclamation non résolue, vous pouvez vous adresser à la CNIL
                                    (Commission Nationale de l&apos;Informatique et des Libertés).
                                </p>
                            </div>
                        </section>

                        {/* 6. Sécurité */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-50 rounded-xl">
                                    <Lock className="w-5 h-5 text-red-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">6. SÉCURITÉ DES DONNÉES</h2>
                            </div>
                            <div className="space-y-3 text-gray-600 text-sm">
                                <p>
                                    TopLinkSante met en œuvre les actions nécessaires afin de protéger les données
                                    personnelles qu&apos;elle traite. Vos données sont traitées de façon électronique
                                    et/ou manuelle et en tout état de cause, de façon à ce que leur sécurité,
                                    protection et confidentialité soient assurées.
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-lg mb-1">🔒</p>
                                        <p className="text-xs font-medium">Chiffrement TLS 1.3</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-lg mb-1">🇪🇺</p>
                                        <p className="text-xs font-medium">Hébergement UE</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-lg mb-1">🗑️</p>
                                        <p className="text-xs font-medium">Purge automatique</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-lg mb-1">🔑</p>
                                        <p className="text-xs font-medium">Auth sécurisée JWT</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 7. Partage des données */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-yellow-50 rounded-xl">
                                    <Globe className="w-5 h-5 text-yellow-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">7. QUI A ACCÈS À VOS DONNÉES ?</h2>
                            </div>
                            <div className="space-y-3 text-gray-600 text-sm">
                                <p>
                                    Vos données personnelles sont traitées par TopLinkSante et ses partenaires
                                    techniques dans le cadre strict de l&apos;exécution du contrat :
                                </p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li><strong>Stripe</strong> - Paiements sécurisés (conforme PCI-DSS)</li>
                                    <li><strong>Resend</strong> - Envoi d&apos;emails transactionnels</li>
                                    <li><strong>Supabase</strong> - Hébergement base de données (UE)</li>
                                    <li><strong>Vercel</strong> - Hébergement application</li>
                                </ul>
                                <p className="text-xs">
                                    Ces sous-traitants sont situés dans l&apos;Union Européenne ou ont signé les Clauses
                                    Contractuelles Types de la Commission Européenne.
                                </p>
                            </div>
                        </section>

                        {/* 8. Cookies */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-amber-50 rounded-xl">
                                    <span className="text-xl">🍪</span>
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">8. COOKIES</h2>
                            </div>
                            <div className="space-y-3 text-gray-600 text-sm">
                                <p>Le site utilise uniquement des cookies strictement nécessaires :</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li><strong>Cookies de session</strong> - Authentification et maintien de connexion</li>
                                    <li><strong>Cookies de préférences</strong> - Mémorisation de vos choix</li>
                                </ul>
                                <p className="text-xs font-medium text-green-700">
                                    ✓ Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.
                                </p>
                            </div>
                        </section>

                        {/* 9. Propriété intellectuelle */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-pink-50 rounded-xl">
                                    <Shield className="w-5 h-5 text-pink-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">9. PROPRIÉTÉ INTELLECTUELLE</h2>
                            </div>
                            <div className="space-y-3 text-gray-600 text-sm">
                                <p>
                                    Le site et l&apos;application, ainsi que leur contenu, appartiennent à TopLinkSante.
                                    L&apos;ensemble des éléments (textes, images, logos, logiciels) est protégé par les
                                    lois relatives à la propriété intellectuelle.
                                </p>
                                <p className="text-xs bg-orange-50 p-3 rounded-lg border border-orange-100 text-orange-800">
                                    ⚠️ Toute reproduction non autorisée sera considérée comme contrefaçon
                                    (articles L.335-2 et suivants du Code de la Propriété Intellectuelle).
                                </p>
                            </div>
                        </section>

                    </div>
                </div>

                {/* Bottom Section - Full Width */}
                <div className="mt-12 space-y-8">

                    {/* 10. Évolution de la politique */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gray-100 rounded-xl">
                                <FileText className="w-5 h-5 text-gray-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">10. ÉVOLUTION DES MENTIONS LÉGALES</h2>
                        </div>
                        <p className="text-gray-600 text-sm">
                            Les présentes mentions légales et politique de confidentialité peuvent être amenées à évoluer,
                            notamment en raison des évolutions législatives et réglementaires. Les utilisateurs seront
                            informés par email de toute modification substantielle au moins 15 jours avant leur entrée en vigueur.
                        </p>
                    </section>

                    {/* 11. Droit applicable */}
                    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gray-100 rounded-xl">
                                <span className="text-xl">⚖️</span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">11. DROIT APPLICABLE ET JURIDICTION</h2>
                        </div>
                        <p className="text-gray-600 text-sm">
                            Les présentes mentions légales sont régies par le droit français. En cas de litige,
                            les parties s&apos;engagent à rechercher une solution amiable avant toute action judiciaire.
                            À défaut d&apos;accord, les tribunaux de Paris seront seuls compétents.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
                        <Mail className="w-12 h-12 mx-auto mb-4 opacity-80" />
                        <h2 className="text-xl font-bold mb-2">Une question ?</h2>
                        <p className="text-blue-100 mb-6">
                            Pour toute question concernant ces mentions légales ou la protection de vos données,
                            notre équipe est à votre disposition.
                        </p>
                        <a
                            href="mailto:contact@toplinksante.com"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors"
                        >
                            contact@toplinksante.com
                        </a>
                    </section>

                </div>

            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 py-8 mt-12">
                <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
                    © 2026 TopLinkSante. Tous droits réservés. |{' '}
                    <Link href="/cgu" className="hover:text-primary">CGU</Link> |{' '}
                    <Link href="/confidentialite" className="hover:text-primary">Confidentialité</Link>
                </div>
            </footer>
        </div>
    )
}

import { Metadata } from 'next'
import Link from 'next/link'
import { Scale, Building2, Server, Mail, Shield, ArrowLeft, Globe, CreditCard } from 'lucide-react'

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

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">

                {/* Section 1 - Éditeur */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">1. Éditeur du site</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p>
                            Le site <strong>TopLinkSante</strong> (accessible à l&apos;adresse <a href="https://www.toplinksante.com" className="text-primary hover:underline">www.toplinksante.com</a>) est édité par :
                        </p>

                        <div className="bg-gray-50 rounded-xl p-6 space-y-2">
                            <p><strong>Raison sociale :</strong> TopLinkSante</p>
                            <p><strong>Forme juridique :</strong> Entreprise individuelle / Auto-entrepreneur</p>
                            <p><strong>Siège social :</strong> Paris, France</p>
                            <p><strong>Email de contact :</strong> <a href="mailto:contact@toplinksante.com" className="text-primary hover:underline">contact@toplinksante.com</a></p>
                            <p><strong>Directeur de la publication :</strong> Jean-Luc ALLA</p>
                        </div>
                    </div>
                </section>

                {/* Section 2 - Hébergeur */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 rounded-xl">
                            <Server className="w-6 h-6 text-purple-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">2. Hébergement</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p>Le site est hébergé par :</p>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-5">
                                <h4 className="font-semibold text-gray-900 mb-2">🌐 Frontend (Vercel)</h4>
                                <p className="text-sm">Vercel Inc.</p>
                                <p className="text-sm">340 S Lemon Ave #4133</p>
                                <p className="text-sm">Walnut, CA 91789, USA</p>
                                <p className="text-sm mt-2"><a href="https://vercel.com" className="text-primary hover:underline">vercel.com</a></p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-5">
                                <h4 className="font-semibold text-gray-900 mb-2">🗄️ Base de données (Supabase)</h4>
                                <p className="text-sm">Supabase Inc.</p>
                                <p className="text-sm">Serveurs hébergés en Union Européenne</p>
                                <p className="text-sm">(Francfort, Allemagne)</p>
                                <p className="text-sm mt-2"><a href="https://supabase.com" className="text-primary hover:underline">supabase.com</a></p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3 - Propriété intellectuelle */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-50 rounded-xl">
                            <Shield className="w-6 h-6 text-orange-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">3. Propriété intellectuelle</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p>
                            L&apos;ensemble du contenu du site TopLinkSante (textes, images, graphismes, logo, icônes, logiciels, etc.)
                            est la propriété exclusive de TopLinkSante ou de ses partenaires et est protégé par les lois françaises
                            et internationales relatives à la propriété intellectuelle.
                        </p>
                        <p>
                            Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments
                            du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable.
                        </p>
                        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                            <p className="text-orange-800 text-sm">
                                ⚠️ Toute exploitation non autorisée du site ou de son contenu sera considérée comme constitutive d&apos;une
                                contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de la Propriété Intellectuelle.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 4 - Données personnelles */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-50 rounded-xl">
                            <Globe className="w-6 h-6 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">4. Protection des données personnelles</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p>
                            Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés,
                            vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression et d&apos;opposition concernant vos données personnelles.
                        </p>
                        <p>
                            TopLinkSante s&apos;engage à respecter la confidentialité de vos données et applique une politique
                            <strong> Zero-Data</strong> : aucune donnée de santé identifiable n&apos;est stockée sur nos serveurs.
                        </p>
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                            <p className="text-green-800 text-sm">
                                📖 Pour plus d&apos;informations, consultez notre{' '}
                                <Link href="/confidentialite" className="underline font-medium">Politique de Confidentialité</Link>.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 5 - Paiements */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <CreditCard className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">5. Paiements sécurisés</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p>
                            Les paiements sur TopLinkSante sont gérés par <strong>Stripe</strong>, leader mondial des solutions de paiement en ligne.
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Transactions sécurisées par chiffrement SSL/TLS</li>
                            <li>Conformité PCI-DSS niveau 1 (plus haut niveau de certification)</li>
                            <li>Aucune donnée bancaire stockée sur nos serveurs</li>
                        </ul>
                        <p className="text-sm">
                            Stripe Payments Europe, Ltd. - 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irlande
                        </p>
                    </div>
                </section>

                {/* Section 6 - Cookies */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-yellow-50 rounded-xl">
                            <span className="text-2xl">🍪</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">6. Cookies</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p>
                            Le site utilise des cookies strictement nécessaires au fonctionnement de la plateforme :
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Cookies de session</strong> : authentification et maintien de la connexion</li>
                            <li><strong>Cookies de préférences</strong> : mémorisation de vos choix d&apos;affichage</li>
                        </ul>
                        <p>
                            Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé sur TopLinkSante.
                        </p>
                    </div>
                </section>

                {/* Section 7 - Limitation de responsabilité */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-50 rounded-xl">
                            <Scale className="w-6 h-6 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">7. Limitation de responsabilité</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p>
                            TopLinkSante met tout en œuvre pour assurer l&apos;exactitude des informations diffusées sur le site.
                            Toutefois, TopLinkSante ne saurait être tenu responsable des omissions, inexactitudes et carences
                            dans la mise à jour.
                        </p>
                        <p>
                            TopLinkSante est un outil d&apos;aide au suivi patient et ne se substitue en aucun cas à l&apos;avis médical
                            d&apos;un professionnel de santé qualifié.
                        </p>
                    </div>
                </section>

                {/* Section 8 - Droit applicable */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gray-100 rounded-xl">
                            <span className="text-2xl">⚖️</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">8. Droit applicable et juridiction</h2>
                    </div>

                    <div className="space-y-4 text-gray-600">
                        <p>
                            Les présentes mentions légales sont régies par le droit français. En cas de litige,
                            les tribunaux français seront seuls compétents.
                        </p>
                    </div>
                </section>

                {/* Contact */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                    <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Une question ?</h2>
                    <p className="text-gray-600 mb-6">
                        Pour toute question concernant ces mentions légales, n&apos;hésitez pas à nous contacter.
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
                    © 2026 TopLinkSante. Tous droits réservés.
                </div>
            </footer>
        </div>
    )
}

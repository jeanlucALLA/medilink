'use client'

import { Shield, Lock, Server, Eye, CheckCircle, Database } from 'lucide-react'

export default function SecuritySection() {
    const securityFeatures = [
        {
            icon: Database,
            title: "Zero-Data Medical",
            description: "Aucune donnée de santé patient stockée sur nos serveurs. Seuls vos réponses anonymisées sont conservées.",
            color: "text-green-600",
            bgColor: "bg-green-50"
        },
        {
            icon: Lock,
            title: "Chiffrement HTTPS",
            description: "Toutes les communications sont chiffrées de bout en bout avec les protocoles les plus récents.",
            color: "text-blue-600",
            bgColor: "bg-blue-50"
        },
        {
            icon: Eye,
            title: "Emails Purgés",
            description: "Les adresses email de vos patients sont supprimées après l'envoi des questionnaires.",
            color: "text-purple-600",
            bgColor: "bg-purple-50"
        },
        {
            icon: Server,
            title: "Hébergement Européen",
            description: "Infrastructure hébergée en Europe, conforme au RGPD et aux exigences de souveraineté des données.",
            color: "text-orange-600",
            bgColor: "bg-orange-50"
        }
    ]

    return (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full text-green-700 text-sm font-medium mb-6">
                        <Shield className="w-4 h-4" />
                        Sécurité & Confidentialité
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Vos données{' '}
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            protégées
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        TopLinkSante adopte une architecture &quot;Zero-Data&quot; : nous ne stockons jamais
                        les données de santé de vos patients.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {securityFeatures.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group"
                        >
                            <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <feature.icon className={`w-6 h-6 ${feature.color}`} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>

                {/* Trust Banner */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 md:p-12 text-white text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <CheckCircle className="w-8 h-8" />
                        <h3 className="text-2xl md:text-3xl font-bold">Architecture Zero-Data Certifiée</h3>
                    </div>
                    <p className="text-green-100 max-w-2xl mx-auto mb-6">
                        Les données de vos patients sont protégées par design : emails supprimés après envoi,
                        réponses anonymisées, aucune information identifiable conservée.
                    </p>
                    <a
                        href="/confidentialite"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition-colors"
                    >
                        En savoir plus sur notre politique de confidentialité
                    </a>
                </div>
            </div>
        </section>
    )
}

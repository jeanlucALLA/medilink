'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle, User, Stethoscope } from 'lucide-react'

type FAQItem = {
    question: string
    answer: string
}

type CategoryContext = 'patient' | 'praticien'

const FAQs: Record<CategoryContext, FAQItem[]> = {
    patient: [
        {
            question: "Pourquoi ai-je reçu ce lien par email ?",
            answer: "Votre praticien vous a envoyé ce lien pour assurer un suivi personnalisé de votre état de santé après votre consultation. Vos réponses lui permettent d'adapter au mieux votre prise en charge thérapeutique."
        },
        {
            question: "Mes données de santé sont-elles en sécurité ?",
            answer: "Oui, la sécurité est totale. Toutes vos données sont chiffrées de bout en bout et hébergées sur des serveurs conformes au RGPD. Elles sont strictement confidentielles et accessibles uniquement par votre praticien."
        },
        {
            question: "Est-ce que répondre est payant ou nécessite une inscription ?",
            answer: "Non, l'accès est entièrement gratuit pour vous et ne nécessite aucune création de compte. Il vous suffit de cliquer sur le lien sécurisé reçu par email pour répondre au questionnaire."
        }
    ],
    praticien: [
        {
            question: "Puis-je personnaliser les questions selon la pathologie ?",
            answer: "Absolument. Notre interface intuitive vous permet de modifier les modèles existants ou de créer vos propres questions pour s'adapter parfaitement à chaque pathologie et à vos besoins spécifiques."
        },
        {
            question: "Comment sont stockées les réponses de mes patients ?",
            answer: "Les réponses sont centralisées automatiquement dans votre tableau de bord sécurisé. Vous pouvez consulter l'historique complet de chaque patient et visualiser l'évolution de leur état de santé en un coup d'œil."
        },
        {
            question: "Le service fonctionne-t-il pour les patients à l'étranger ?",
            answer: "Oui, Medi.Link est accessible partout dans le monde via notre plateforme web. Vos patients résidant en Belgique, Suisse ou ailleurs peuvent répondre à vos questionnaires sans aucune restriction géographique."
        }
    ]
}

export default function FAQ() {
    const [activeTab, setActiveTab] = useState<CategoryContext>('patient')
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    return (
        <section className="py-24 bg-white" id="faq">
            <div className="max-w-4xl mx-auto px-6">

                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-blue-900 tracking-tight">
                        Questions Fréquentes
                    </h2>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                        Tout ce que vous devez savoir pour utiliser Medi.Link en toute sérénité.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-12">
                    <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex shadow-inner">
                        <button
                            onClick={() => { setActiveTab('patient'); setOpenIndex(0) }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'patient'
                                ? 'bg-white text-blue-900 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <User className="w-4 h-4" />
                            Espace Patients
                        </button>
                        <button
                            onClick={() => { setActiveTab('praticien'); setOpenIndex(0) }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'praticien'
                                ? 'bg-white text-blue-900 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Stethoscope className="w-4 h-4" />
                            Espace Praticiens
                        </button>
                    </div>
                </div>

                {/* Accordion List */}
                <div className="space-y-4">
                    {FAQs[activeTab].map((item, index) => (
                        <div
                            key={index}
                            className={`group border rounded-2xl transition-all duration-300 ${openIndex === index
                                ? 'border-blue-200 bg-blue-50/30'
                                : 'border-slate-200 bg-white hover:border-blue-100 hover:shadow-sm'
                                }`}
                        >
                            <button
                                onClick={() => toggleAccordion(index)}
                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                            >
                                <span className={`font-semibold text-lg transition-colors ${openIndex === index ? 'text-blue-900' : 'text-gray-700 group-hover:text-blue-800'
                                    }`}>
                                    {item.question}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-blue-600' : ''
                                        }`}
                                />
                            </button>

                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <div className="p-6 pt-0 text-gray-600 leading-relaxed border-t border-transparent">
                                    {item.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact Support Hint */}
                <div className="mt-16 text-center">
                    <p className="text-gray-500 text-sm">
                        Vous ne trouvez pas votre réponse ? {' '}
                        <a href="mailto:support@medilink.fr" className="text-blue-600 font-bold hover:underline">
                            Contactez notre support
                        </a>
                    </p>
                </div>

            </div>
        </section>
    )
}

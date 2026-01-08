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
            question: "Qu'est-ce que Medi.Link ?",
            answer: "Medi.Link est une plateforme sécurisée qui permet à votre praticien (médecin, podologue, kiné...) de vous envoyer des questionnaires de suivi personnalisés. Cela aide à mieux comprendre l'évolution de votre santé entre deux consultations."
        },
        {
            question: "Est-ce que mes données sont protégées ?",
            answer: "Absolument. La sécurité de vos données de santé est notre priorité absolue. Medi.Link respecte strictement le RGPD et utilise des serveurs sécurisés. Vos réponses ne sont accessibles qu'à votre praticien traitant."
        },
        {
            question: "Dois-je payer ou créer un compte pour répondre ?",
            answer: "Non, c'est totalement gratuit pour vous et sans inscription. Vous recevez un lien unique et sécurisé par email, vous cliquez, vous répondez, et c'est tout !"
        },
        {
            question: "Comment les réponses sont-elles transmises à mon praticien ?",
            answer: "Dès que vous validez le questionnaire, vos réponses sont instantanément et sécuritairement transmises sur le tableau de bord de votre praticien, qui pourra les analyser avant ou pendant votre prochain rendez-vous."
        }
    ],
    praticien: [
        {
            question: "Comment envoyer un suivi à un patient ?",
            answer: "C'est très simple. Depuis votre tableau de bord, cliquez sur 'Nouveau Suivi', sélectionnez le modèle de questionnaire adapté, entrez l'email du patient et validez. Le patient reçoit le lien instantanément."
        },
        {
            question: "Puis-je personnaliser les modèles de questionnaires ?",
            answer: "Oui, Medi.Link propose une bibliothèque de modèles validés par des experts, mais vous avez la liberté totale de créer vos propres questions ou d'adapter les modèles existants à votre pratique spécifique."
        },
        {
            question: "Comment sont archivées les réponses ?",
            answer: "Toutes les réponses sont automatiquement classées dans votre historique patient. Vous pouvez suivre l'évolution des symptômes graphiquement et exporter les données en PDF pour les intégrer à votre dossier médical."
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

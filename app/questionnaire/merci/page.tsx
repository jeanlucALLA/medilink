import Link from 'next/link'
import { CheckCircle, Home, Heart } from 'lucide-react'

export default function MerciPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col items-center justify-center p-4">

            {/* Header Logo */}
            <div className="absolute top-0 left-0 w-full p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                    <Link href="/" className="inline-flex items-center space-x-2">
                        <Heart className="w-6 h-6 text-primary" />
                        <span className="text-xl font-bold text-primary">Medi.Link</span>
                    </Link>
                </div>
            </div>

            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-blue-100 p-8 text-center transform transition-all hover:scale-[1.01]">
                <div className="mb-6 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-25"></div>
                        <div className="relative bg-green-100 rounded-full p-3">
                            <CheckCircle className="w-16 h-16 text-green-600" />
                        </div>
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Merci !
                </h1>

                <p className="text-gray-600 mb-8 text-lg">
                    Vos réponses ont été enregistrées avec succès.<br />
                    Elles seront transmises instantanément à votre praticien.
                </p>

                <div className="space-y-4">
                    <Link
                        href="/"
                        className="w-full inline-flex items-center justify-center px-8 py-4 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 group"
                    >
                        <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                        Retour à l'accueil
                    </Link>

                    <p className="text-sm text-gray-400">
                        Vous pouvez fermer cet onglet en toute sécurité.
                    </p>
                </div>
            </div>
        </div>
    )
}

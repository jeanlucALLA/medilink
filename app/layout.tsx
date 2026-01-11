import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Medi.Link | Questionnaires Médicaux & Suivi Patient Automatisé',
  description: 'Digitalisez votre cabinet : questionnaires de santé sur-mesure, suivi post-consultation automatisé et boostez vos avis Google. Essai gratuit.',
  keywords: ['questionnaire médical', 'suivi patient', 'logiciel cabinet médical', 'e-réputation médecin', 'avis google santé'],
  openGraph: {
    title: 'Medi.Link | Questionnaires Médicaux & Suivi Patient Automatisé',
    description: 'Digitalisez votre cabinet : questionnaires de santé sur-mesure, suivi post-consultation automatisé.',
    type: 'website',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}


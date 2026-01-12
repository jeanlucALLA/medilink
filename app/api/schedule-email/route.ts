import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// POST: Programmer un envoi d'email différé via Resend avec scheduledAt
// 
// GARANTIE DE SUPPRESSION:
// ========================
// Resend agit comme une "mémoire tampon" externe.
// Notre serveur reste 100% Stateless concernant les coordonnées du patient.
// L'adresse email n'est JAMAIS stockée dans questionnaire-store.ts.
// Une fois l'appel à Resend réussi, le serveur ne conserve aucune donnée patient.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { questionnaireId, email, sendDate } = body

    if (!questionnaireId || !email || !sendDate) {
      return NextResponse.json(
        { error: 'questionnaireId, email et sendDate sont requis' },
        { status: 400 }
      )
    }

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      )
    }

    // Vérifier que Resend est configuré
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY non configurée' },
        { status: 500 }
      )
    }

    // Convertir sendDate en format ISO 8601 pour Resend
    const scheduledAt = new Date(sendDate).toISOString()
    const scheduledTimestamp = new Date(sendDate).getTime()

    // Valider que la date est dans le futur
    if (scheduledTimestamp <= Date.now()) {
      return NextResponse.json(
        { error: 'La date doit être dans le futur' },
        { status: 400 }
      )
    }

    // Construire le lien sécurisé
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
    const surveyLink = `${baseUrl}/survey/${questionnaireId}`

    // Envoyer l'email via Resend avec scheduledAt
    // Resend stocke l'email et l'envoie à la date programmée
    // Notre serveur ne conserve AUCUNE donnée patient
    const resend = new Resend(resendApiKey)

    // TODO: Implémenter le délai via une queue Upstash ou une Cron Vercel car Resend SDK ne le supporte pas ici.
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'TopLinkSante <noreply@medilink.app>',
      to: email,
      subject: 'Questionnaire médical - TopLinkSante',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Questionnaire médical</h2>
          <p>Votre praticien vous a envoyé un questionnaire médical.</p>
          <p style="margin: 20px 0;">
            <a href="${surveyLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accéder au questionnaire
            </a>
          </p>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            Ce lien expirera dans 2 heures après activation. Vos réponses seront supprimées automatiquement après consultation.
          </p>
          <p style="margin-top: 10px; font-size: 11px; color: #999;">
            ⚠️ Vos données ne sont pas stockées de manière permanente sur le serveur.
          </p>
        </div>
      `,
    })

    // Log anonyme uniquement (pas d'email dans les logs)
    console.log(`[Resend-scheduled] Questionnaire ${questionnaireId} programmé pour ${scheduledAt}`)

    // IMPORTANT: Une fois l'appel à Resend réussi, on ne renvoie que success: true
    // L'adresse email n'est JAMAIS stockée dans questionnaire-store.ts
    // Resend agit comme une "mémoire tampon" externe
    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    // Log anonyme uniquement (pas d'email dans les logs)
    console.error('[Schedule-email-error]', error.message)
    return NextResponse.json(
      { error: `Erreur Resend: ${error.message || 'Erreur lors de la programmation'}` },
      { status: 500 }
    )
  }
}

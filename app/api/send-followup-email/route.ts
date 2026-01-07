import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

// 1. Schéma de validation avec Zod
const emailSchema = z.object({
  patientEmail: z.string().email("Email invalide"),
  questionnaireId: z.string().uuid("ID de questionnaire invalide"),
  sendDelayDays: z.number().min(0).default(0),
  // On peut ajouter d'autres champs si nécessaire
})

export async function POST(request: Request) {
  try {
    // 2. Vérification de la clé API Resend (Côté Serveur)
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error('RESEND_API_KEY manquante')
      return NextResponse.json(
        { error: 'Configuration serveur incomplète (Email)' } as any,
        { status: 500 }
      )
    }

    const resend = new Resend(resendApiKey)

    // Modification: Utilisation de createRouteHandlerClient comme demandé pour régler l'erreur 401
    const supabase = createRouteHandlerClient({ cookies })

    // 3. Vérification de la session utilisateur (Sécurité)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé. Veuillez vous connecter.' } as any,
        { status: 401 }
      )
    }

    // 4. Parsing et Validation du Body
    const body = await request.json()
    const validationResult = emailSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.flatten() } as any,
        { status: 400 }
      )
    }

    const { patientEmail, questionnaireId, sendDelayDays } = validationResult.data

    // 5. Récupération des infos du praticien (Expéditeur)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nom_complet, email, cabinet')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      console.error('Erreur profil:', profileError)
      return NextResponse.json(
        { error: 'Impossible de récupérer le profil du praticien' } as any,
        { status: 500 }
      )
    }

    const practitionerName = profile.nom_complet || 'Votre Praticien'
    const cabinetName = profile.cabinet || 'Cabinet Médical'
    // Utiliser l'email du praticien pour le Reply-To
    const practitionerEmail = profile.email || session.user.email

    // 6. Construction du lien et du contenu
    const origin = request.headers.get('origin')
    const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL
    const questionnaireLink = `${baseUrl}/q/${questionnaireId}`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0f172a;">Suivi de Consultation - ${cabinetName}</h2>
          
          <p>Bonjour,</p>
          
          <p>Suite à votre consultation avec <strong>${practitionerName}</strong>, nous souhaiterions avoir votre retour.</p>
          
          <p>Merci de prendre quelques instants pour répondre à ce questionnaire :</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${questionnaireLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Répondre au questionnaire
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            Si le bouton ne fonctionne pas : <a href="${questionnaireLink}">${questionnaireLink}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="font-size: 12px; color: #999;">
            Cet email a été envoyé via Medi.Link pour le compte de ${practitionerName}.
          </p>
        </div>
      </body>
      </html>
    `

    // 7. Logique de Planification (Scheduling)
    let scheduledAt: string | undefined = undefined

    // Si un délai est demandé (> 0 jours)
    if (sendDelayDays > 0) {
      const date = new Date()
      date.setDate(date.getDate() + sendDelayDays)
      scheduledAt = date.toISOString()
    }

    // 8. Envoi via Resend
    const data = await resend.emails.send({
      from: `Dr. ${practitionerName} via Medi.Link <onboarding@resend.dev>`, // Ou votre domaine vérifié
      to: [patientEmail],
      reply_to: practitionerEmail,
      subject: `Suivi médical - ${cabinetName}`,
      html: htmlContent,
      scheduled_at: scheduledAt, // Sera ignoré/null si envoi immédiat
    } as any)

    if (data.error) {
      console.error('Erreur API Resend:', data.error)
      // Ne pas exposer les détails techniques bruts au client si possible, mais utile pour le debug
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email (Provider)', details: data.error.message } as any,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: data.data?.id,
      scheduled: !!scheduledAt,
      date: scheduledAt || 'Immédiat'
    })

  } catch (error: any) {
    console.error('Erreur non gérée (Send Email):', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' } as any,
      { status: 500 }
    )
  }
}

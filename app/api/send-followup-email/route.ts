import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js' // Fallback for Header Auth
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

// 1. Schéma de validation avec Zod
const emailSchema = z.object({
  patientEmail: z.string().email("Email invalide"),
  questionnaireId: z.string().uuid("ID de questionnaire invalide"),
  sendDelayDays: z.number().min(0).default(0),
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
    let userSession = null
    let supabaseClient = null

    // STRATÉGIE D'AUTHENTIFICATION ROBUSTE (Cookie + Header)

    // A. Essai via Header Authorization (Prioritaire pour éviter les blocages de cookies tiers)
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      // Création d'un client temporaire juste avec le token
      const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      // On utilise supabase-js standard pour valider le token manuellement
      const supabaseHeader = createClient(sbUrl, sbKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      })

      const { data: { user }, error: userError } = await supabaseHeader.auth.getUser()
      if (user && !userError) {
        userSession = { user }
        supabaseClient = supabaseHeader
      }
    }

    // B. Fallback via Cookies (si Header échec ou absent)
    if (!userSession) {
      const cookieStore = cookies()
      const supabaseCookie = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              cookieStore.set({ name, value, ...options })
            },
            remove(name: string, options: CookieOptions) {
              cookieStore.set({ name, value: '', ...options })
            },
          },
        }
      )
      const { data: { session } } = await supabaseCookie.auth.getSession()
      if (session) {
        userSession = session
        supabaseClient = supabaseCookie
      }
    }

    // C. Vérification Finale
    if (!userSession || !supabaseClient) {
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
    // On utilise le client authentifié défini plus haut
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('nom_complet, email, cabinet')
      .eq('id', userSession.user.id)
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
    const practitionerEmail = profile.email || userSession.user.email

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
            Cet email a été envoyé via TopLinkSante pour le compte de ${practitionerName}.
          </p>
        </div>
      </body>
      </html>
    `

    // FIX #1: Si envoi programmé (sendDelayDays > 0), ne PAS envoyer via Resend.
    // Le cron Edge Function (send-scheduled-questionnaires) s'en chargera à la date prévue.
    // Cela élimine le bug de double envoi (Resend scheduled_at + cron).
    if (sendDelayDays > 0) {
      console.log(`[Email] Questionnaire ${questionnaireId} programmé pour J+${sendDelayDays}, pas d'envoi Resend immédiat.`)
      const { error: updateError } = await supabaseClient
        .from('questionnaires')
        .update({
          status: 'programmé',
          statut: 'programmé',
          sent_at: null
        })
        .eq('id', questionnaireId)

      if (updateError) {
        console.warn('[Email] Erreur mise à jour status programmé:', updateError)
      }

      return NextResponse.json({
        success: true,
        messageId: null,
        scheduled: true,
        date: new Date(Date.now() + sendDelayDays * 86400000).toISOString()
      })
    }

    // Envoi immédiat via Resend
    const envFrom = process.env.RESEND_FROM_EMAIL
    let fromEmail = 'noreply@mail.toplinksante.com'

    if (envFrom) {
      const match = envFrom.match(/<(.+)>/)
      if (match && match[1]) {
        fromEmail = match[1]
      } else {
        fromEmail = envFrom.trim()
      }
    }

    const data = await resend.emails.send({
      from: `Dr. ${practitionerName} via TopLinkSante <${fromEmail}>`,
      to: [patientEmail],
      reply_to: practitionerEmail,
      subject: `Suivi médical - ${cabinetName}`,
      html: htmlContent,
      headers: {
        'List-Unsubscribe': '<mailto:contact@toplinksante.com?subject=Unsubscribe>',
      },
    } as any)

    if (data.error) {
      console.error('Erreur API Resend:', data.error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email (Provider)', details: data.error.message } as any,
        { status: 500 }
      )
    }

    const resendEmailId = data.data?.id

    // Store the Resend email ID for tracking via webhooks
    if (resendEmailId) {
      const { error: updateError } = await supabaseClient
        .from('questionnaires')
        .update({
          resend_email_id: resendEmailId,
          status: 'envoyé',
          sent_at: new Date().toISOString()
        })
        .eq('id', questionnaireId)

      if (updateError) {
        console.warn('[Email Tracking] Failed to store resend_email_id:', updateError)
      } else {
        console.log(`[Email Tracking] Stored resend_email_id: ${resendEmailId} for questionnaire ${questionnaireId}`)
      }
    }

    return NextResponse.json({
      success: true,
      messageId: resendEmailId,
      scheduled: false,
      date: 'Immédiat'
    })

  } catch (error: any) {
    console.error('Erreur non gérée (Send Email):', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' } as any,
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { questionnairesMap, responsesMap } from '@/lib/questionnaire-store'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

// Interface pour les données d'alerte
interface AlertData {
  responseId: string
  questionnaireId: string
  userId: string
  patientEmail: string | null
  pathologie: string
  scoreTotal: number
}

// Fonction asynchrone pour envoyer une notification au praticien (non bloquant)
async function sendPractitionerNotification(questionnaireId: string, userId: string, pathologie: string) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error('RESEND_API_KEY non configurée, impossible d\'envoyer la notification')
      return
    }

    const resend = new Resend(resendApiKey)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
    const dashboardLink = `${appUrl}/dashboard`

    // Récupérer l'email du praticien depuis la table profiles
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    let practitionerEmail: string | null = null

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single()

        if (profile?.email) {
          practitionerEmail = profile.email
        }
      } catch (profileError) {
        console.error('Erreur lors de la récupération du profil:', profileError)
        return // On ne peut pas envoyer sans email
      }
    }

    if (!practitionerEmail) {
      console.error('[Notification] Email du praticien non trouvé')
      return
    }

    // Envoyer l'email de notification
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'TopLinkSante <noreply@toplinksante.com>',
      to: practitionerEmail,
      subject: `Nouvelle réponse reçue : ${pathologie}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
  <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #3b82f6; margin: 0; font-size: 24px; font-weight: 700;">Medi.Link</h1>
    </div>
    
    <p style="font-size: 16px; margin-bottom: 20px; color: #1f2937;">
      Bonjour,
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px; color: #4b5563; line-height: 1.7;">
      Un patient vient de répondre à votre suivi concernant <strong>${pathologie}</strong>.
    </p>
    
    <p style="font-size: 16px; margin-bottom: 30px; color: #4b5563; line-height: 1.7;">
      Vous pouvez consulter les détails sur votre tableau de bord.
    </p>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="${dashboardLink}" 
         style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        Accéder au tableau de bord
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
      Cet email a été envoyé automatiquement par Medi.Link<br>
      Notification de nouvelle réponse patient
    </p>
  </div>
</body>
</html>
      `,
      text: `Bonjour,\n\nUn patient vient de répondre à votre suivi concernant ${pathologie}.\n\nVous pouvez consulter les détails sur votre tableau de bord : ${dashboardLink}\n\n---\nCet email a été envoyé automatiquement par Medi.Link\nNotification de nouvelle réponse patient`,
    })

    console.log(`[Notification] Email de notification envoyé au praticien pour le questionnaire ${questionnaireId}`)
  } catch (error: any) {
    console.error('[Notification] Erreur lors de l\'envoi de l\'email de notification:', error)
    // Ne pas bloquer le processus si l'email échoue
  }
}

// Fonction asynchrone pour envoyer l'email d'alerte (non bloquant)
async function sendAlertEmail(alertData: AlertData) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error('RESEND_API_KEY non configurée, impossible d\'envoyer l\'alerte')
      return
    }

    const resend = new Resend(resendApiKey)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
    const dashboardLink = `${appUrl}/dashboard`

    // Récupérer l'email du praticien depuis la table profiles
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    let practitionerEmail: string | null = null

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', alertData.userId)
          .single()

        if (profile?.email) {
          practitionerEmail = profile.email
        }
      } catch (profileError) {
        console.error('Erreur lors de la récupération du profil:', profileError)
        return // Stop execution if we can't get the email
      }
    }

    if (!practitionerEmail) {
      console.error('[Alert] Email du praticien introuvable, alerte non envoyée.')
      return
    }

    // Envoyer l'email d'alerte
    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'TopLinkSante <noreply@toplinksante.com>',
      to: practitionerEmail,
      subject: '⚠️ ALERTE CRITIQUE : Score bas détecté pour un patient',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerte Critique</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 30px; border-radius: 8px;">
    <h1 style="color: #dc2626; margin-top: 0; font-size: 24px;">⚠️ ALERTE CRITIQUE</h1>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>Attention, un patient vient de soumettre un score de <span style="color: #dc2626; font-size: 20px; font-weight: bold;">${alertData.scoreTotal}/5</span> pour la pathologie :</strong>
    </p>
    
    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb;">
      <h2 style="color: #1f2937; margin-top: 0; font-size: 18px;">${alertData.pathologie}</h2>
    </div>
    
    <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Email du patient :</strong> ${alertData.patientEmail || 'Non renseigné'}</p>
      <p style="margin: 5px 0;"><strong>Score total :</strong> ${alertData.scoreTotal}/5</p>
      <p style="margin: 5px 0;"><strong>Date de soumission :</strong> ${new Date().toLocaleString('fr-FR')}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardLink}" 
         style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Accéder au Dashboard
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      <strong>Action recommandée :</strong> Contactez rapidement ce patient pour évaluer sa situation.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
      Cet email a été envoyé automatiquement par Medi.Link<br>
      Système d'alerte pour scores bas (≤ 2/5)
    </p>
  </div>
</body>
</html>
      `,
      text: `
⚠️ ALERTE CRITIQUE : Score bas détecté pour un patient

Attention, un patient vient de soumettre un score de ${alertData.scoreTotal}/5 pour la pathologie : ${alertData.pathologie}

Email du patient : ${alertData.patientEmail || 'Non renseigné'}
Score total : ${alertData.scoreTotal}/5
Date de soumission : ${new Date().toLocaleString('fr-FR')}

Lien vers les détails : ${dashboardLink}

Action recommandée : Contactez rapidement ce patient pour évaluer sa situation.

---
Cet email a été envoyé automatiquement par Medi.Link
Système d'alerte pour scores bas (≤ 2/5)
      `.trim(),
    })

    // Enregistrer le log de l'alerte dans Supabase
    if (supabaseUrl && supabaseKey && emailResult.data?.id) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey)

        await supabase
          .from('alerts_log')
          .insert({
            response_id: alertData.responseId,
            questionnaire_id: alertData.questionnaireId,
            user_id: alertData.userId,
            patient_email: alertData.patientEmail,
            pathologie: alertData.pathologie,
            score_total: alertData.scoreTotal,
            alert_sent: true,
            alert_sent_at: new Date().toISOString(),
          })
      } catch (logError) {
        console.error('Erreur lors de l\'enregistrement du log d\'alerte:', logError)
        // On continue même si le log échoue
      }
    }

    console.log(`[Alert] Email d'alerte envoyé pour le score ${alertData.scoreTotal}/5 (Pathologie: ${alertData.pathologie})`)
  } catch (error: any) {
    console.error('[Alert] Erreur lors de l\'envoi de l\'email d\'alerte:', error)

    // Enregistrer le log même en cas d'erreur
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey)

        await supabase
          .from('alerts_log')
          .insert({
            response_id: alertData.responseId,
            questionnaire_id: alertData.questionnaireId,
            user_id: alertData.userId,
            patient_email: alertData.patientEmail,
            pathologie: alertData.pathologie,
            score_total: alertData.scoreTotal,
            alert_sent: false,
            alert_sent_at: null,
          })
      }
    } catch (logError) {
      console.error('Erreur lors de l\'enregistrement du log d\'alerte (erreur):', logError)
    }

    throw error
  }
}

// POST: Soumettre les réponses d'un questionnaire
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const body = await request.json()
    const { answers } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID requis' },
        { status: 400 }
      )
    }

    const questionnaire = questionnairesMap.get(id)

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire non trouvé ou expiré' },
        { status: 404 }
      )
    }

    if (!answers || !Array.isArray(answers) || answers.length !== questionnaire.questions.length) {
      return NextResponse.json(
        { error: 'Nombre de réponses incorrect' },
        { status: 400 }
      )
    }

    const now = Date.now()
    const expiresAt = now + 2 * 60 * 60 * 1000 // 2 heures

    // Convertir les réponses en nombres (1-5)
    const numericAnswers = answers.map((a: string | number) => {
      const num = typeof a === 'number' ? a : parseInt(String(a))
      // Valider que c'est entre 1 et 5
      if (isNaN(num) || num < 1 || num > 5) {
        throw new Error('Réponses invalides: doivent être entre 1 et 5')
      }
      return num
    })

    const response = {
      questionnaireId: id,
      answers: numericAnswers, // Stocker comme nombres
      submittedAt: now,
      viewedAt: null,
      expiresAt,
    }

    responsesMap.set(id, response)

    // Sauvegarder dans Supabase pour les statistiques (non bloquant)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Récupérer le questionnaire pour obtenir la pathologie, user_id et patient_email
        const { data: questionnaireData } = await supabase
          .from('questionnaires')
          .select('pathologie, user_id, patient_email')
          .eq('id', id)
          .single()

        if (questionnaireData) {
          // Calculer le score moyen
          const averageScore = numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length

          // Calculer le score_total (arrondi entre 1 et 5)
          const scoreTotal = Math.max(1, Math.min(5, Math.round(averageScore)))

          // Sauvegarder dans la table responses
          const { data: insertedResponse, error: insertError } = await supabase
            .from('responses')
            .insert({
              questionnaire_id: id,
              user_id: questionnaireData.user_id,
              pathologie: questionnaireData.pathologie || 'Non spécifiée',
              answers: numericAnswers,
              average_score: averageScore,
              score_total: scoreTotal,
              submitted_at: new Date(now).toISOString(),
            })
            .select()
            .single()

          if (insertError) {
            console.error('Erreur lors de l\'insertion dans responses:', insertError)
            // On continue même si l'insertion échoue
          } else if (insertedResponse && scoreTotal <= 2) {
            // ALERTE : Score bas détecté (<= 2)
            // Envoyer l'email d'alerte de manière asynchrone (non bloquant)
            sendAlertEmail({
              responseId: insertedResponse.id,
              questionnaireId: id,
              userId: questionnaireData.user_id,
              patientEmail: questionnaireData.patient_email || null,
              pathologie: questionnaireData.pathologie || 'Non spécifiée',
              scoreTotal: scoreTotal,
            }).catch((error) => {
              console.error('Erreur lors de l\'envoi de l\'alerte (non bloquant):', error)
            })
          }
        }
      }
    } catch (supabaseError) {
      console.error('Erreur lors de la sauvegarde Supabase (non bloquant):', supabaseError)
      // On continue même si Supabase échoue
    }

    // Programmer la suppression automatique
    setTimeout(() => {
      responsesMap.delete(id)
      questionnairesMap.delete(id)
      console.log(`[Auto-delete] Réponse ${id} supprimée automatiquement`)
    }, 2 * 60 * 60 * 1000)

    return NextResponse.json({
      message: 'Réponses enregistrées',
      note: 'Vos réponses seront supprimées après consultation par votre praticien ou dans 2 heures maximum.',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement' },
      { status: 500 }
    )
  }
}


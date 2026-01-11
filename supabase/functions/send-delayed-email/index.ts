// Edge Function Supabase pour envoyer les emails programmés
// Cette fonction est appelée quotidiennement par pg_cron

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const APP_URL = Deno.env.get('NEXT_PUBLIC_BASE_URL') || 'https://medilink-kjl7.vercel.app'

// Clé de service pour sécuriser l'appel (à définir dans les secrets Supabase)
const SERVICE_KEY = Deno.env.get('SERVICE_KEY') || ''

serve(async (req) => {
  try {
    // Vérification de sécurité : vérifier la clé de service ou l'origine
    const authHeader = req.headers.get('authorization')
    const providedKey = authHeader?.replace('Bearer ', '') || req.headers.get('x-service-key') || ''

    if (SERVICE_KEY && providedKey !== SERVICE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid service key' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier si c'est un envoi forcé (forceSend)
    const body = await req.json().catch(() => ({}))
    const forceSendId = body.forceSend || null

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Créer le client Supabase avec les droits admin
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Date actuelle
    const now = new Date()
    const nowTimestamp = now.toISOString()

    // Récupérer les questionnaires programmés qui doivent être envoyés
    let query = supabase
      .from('questionnaires')
      .select('id, pathologie, patient_email, send_after_days, created_at, user_id, statut')
      .not('patient_email', 'is', null)

    // Si forceSend est spécifié, envoyer uniquement ce questionnaire (peu importe le status)
    if (forceSendId) {
      query = query.eq('id', forceSendId)
    } else {
      // Sinon, récupérer uniquement ceux avec statut = 'programmé' et send_after_days renseigné
      query = query.eq('statut', 'programmé').not('send_after_days', 'is', null)
    }

    const { data: questionnaires, error: fetchError } = await query

    if (fetchError) {
      console.error('Erreur lors de la récupération des questionnaires:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Database error', details: fetchError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!questionnaires || questionnaires.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No questionnaires to send',
          count: 0
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Filtrer les questionnaires dont la date d'envoi est atteinte
    // Si forceSend est spécifié, on envoie immédiatement sans vérifier la date
    const questionnairesToSend = forceSendId
      ? questionnaires // Envoi forcé : envoyer immédiatement
      : questionnaires.filter((q) => {
        if (!q.send_after_days || !q.created_at) return false

        const createdDate = new Date(q.created_at)
        const sendDate = new Date(createdDate)
        sendDate.setDate(sendDate.getDate() + q.send_after_days)

        return sendDate <= now
      })

    if (questionnairesToSend.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No questionnaires ready to send',
          checked: questionnaires.length
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer les informations du praticien pour chaque questionnaire
    const results = []

    for (const questionnaire of questionnairesToSend) {
      try {
        // Récupérer le profil du praticien
        const { data: profile } = await supabase
          .from('profiles')
          .select('nom_complet, email')
          .eq('id', questionnaire.user_id)
          .single()

        const practitionerName = profile?.nom_complet || 'Votre praticien'
        const practitionerEmail = profile?.email

        if (!practitionerEmail) {
          console.error(`Email du praticien introuvable pour le profil ${questionnaire.user_id}`)
          results.push({
            questionnaire_id: questionnaire.id,
            status: 'error',
            error: 'Practitioner email not found',
          })
          continue
        }


        // Construire le lien du questionnaire
        const questionnaireLink = `${APP_URL}/survey/${questionnaire.id}`

        // Préparer l'email
        const emailSubject = `Questionnaire de suivi - ${questionnaire.pathologie}`
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Questionnaire de suivi</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; border-left: 4px solid #3b82f6;">
    <h1 style="color: #3b82f6; margin-top: 0;">Questionnaire de suivi médical</h1>
    
    <p>Bonjour,</p>
    
    <p>Votre praticien <strong>${practitionerName}</strong> (${practitionerEmail}) vous a préparé un questionnaire de suivi pour votre pathologie :</p>
    
    <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb;">
      <h2 style="color: #1f2937; margin-top: 0; font-size: 18px;">${questionnaire.pathologie}</h2>
    </div>
    
    <p>Ce questionnaire vous permettra de faire un point sur votre état de santé et d'aider votre praticien à mieux vous suivre.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${questionnaireLink}" 
         style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Accéder au questionnaire
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      <strong>Important :</strong> Ce lien est personnel et confidentiel. Ne le partagez pas avec d'autres personnes.
    </p>
    
    <p style="font-size: 14px; color: #6b7280;">
      Si vous avez des questions, n'hésitez pas à contacter votre praticien.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
      Cet email a été envoyé automatiquement par Medi.Link<br>
      Vos données sont traitées de manière sécurisée et confidentielle.
    </p>
  </div>
</body>
</html>
        `

        const emailText = `
Questionnaire de suivi médical

Bonjour,

Votre praticien ${practitionerName} (${practitionerEmail}) vous a préparé un questionnaire de suivi pour votre pathologie : ${questionnaire.pathologie}

Ce questionnaire vous permettra de faire un point sur votre état de santé et d'aider votre praticien à mieux vous suivre.

Accéder au questionnaire : ${questionnaireLink}

Important : Ce lien est personnel et confidentiel. Ne le partagez pas avec d'autres personnes.

Si vous avez des questions, n'hésitez pas à contacter votre praticien.

---
Cet email a été envoyé automatiquement par Medi.Link
Vos données sont traitées de manière sécurisée et confidentielle.
        `.trim()

        // Envoyer l'email via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: Deno.env.get('RESEND_FROM_EMAIL') || 'Medi.Link <onboarding@resend.dev>',
            to: questionnaire.patient_email,
            subject: emailSubject,
            html: emailHtml,
            text: emailText,
          }),
        })

        if (!resendResponse.ok) {
          const errorData = await resendResponse.text()
          console.error(`Erreur Resend pour le questionnaire ${questionnaire.id}:`, errorData)
          results.push({
            questionnaire_id: questionnaire.id,
            status: 'error',
            error: `Resend API error: ${resendResponse.status}`,
          })
          continue
        }

        const resendData = await resendResponse.json()

        // Mettre à jour le statut du questionnaire en 'envoyé'
        const { error: updateError } = await supabase
          .from('questionnaires')
          .update({ statut: 'envoyé' })
          .eq('id', questionnaire.id)

        if (updateError) {
          console.error(`Erreur lors de la mise à jour du questionnaire ${questionnaire.id}:`, updateError)
          results.push({
            questionnaire_id: questionnaire.id,
            status: 'email_sent_but_update_failed',
            error: updateError.message,
          })
        } else {
          results.push({
            questionnaire_id: questionnaire.id,
            status: 'sent',
            email_id: resendData.id,
          })
        }
      } catch (error: any) {
        console.error(`Erreur lors du traitement du questionnaire ${questionnaire.id}:`, error)
        results.push({
          questionnaire_id: questionnaire.id,
          status: 'error',
          error: error.message || 'Unknown error',
        })
      }
    }

    const successCount = results.filter(r => r.status === 'sent').length
    const errorCount = results.filter(r => r.status === 'error').length

    return new Response(
      JSON.stringify({
        message: 'Processing complete',
        total_checked: questionnaires.length,
        total_to_send: questionnairesToSend.length,
        success: successCount,
        errors: errorCount,
        results: results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error: any) {
    console.error('Erreur générale:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})


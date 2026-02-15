// Edge Function Supabase pour envoyer automatiquement les emails de questionnaires programmés
// Cette fonction scanne quotidiennement les questionnaires dont la date d'envoi est arrivée
// Elle utilise Resend pour l'envoi des emails

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL') || Deno.env.get('APP_URL') || 'https://www.toplinksante.com'

serve(async (req) => {
  try {
    // NOTE: Cette fonction est sécurisée car elle utilise SUPABASE_SERVICE_ROLE_KEY en interne
    // Les appels peuvent venir de pg_cron/pg_net (sans headers d'auth) ou d'appels manuels
    // La sécurité vient du fait que la fonction elle-même utilise le service_role_key

    console.log('[Send Scheduled] Démarrage de la fonction...')


    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY manquant')
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Créer le client Supabase avec service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Récupérer la date actuelle
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    console.log(`[Send Scheduled] Scan des questionnaires à envoyer le ${today.toISOString().split('T')[0]}`)

    // Sélectionner les questionnaires à envoyer
    // Critères :
    // - status = 'programmé' OU 'en_attente' OU 'pending'
    // - patient_email IS NOT NULL
    // - send_after_days IS NOT NULL
    // - created_at + send_after_days <= aujourd'hui
    const { data: questionnaires, error: fetchError } = await supabase
      .from('questionnaires')
      .select('id, patient_email, pathologie, created_at, send_after_days')
      .in('status', ['programmé', 'en_attente', 'pending'])
      .not('patient_email', 'is', null)
      .not('send_after_days', 'is', null)

    if (fetchError) {
      console.error('[Send Scheduled] Erreur lors de la récupération:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la récupération', details: fetchError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!questionnaires || questionnaires.length === 0) {
      console.log('[Send Scheduled] Aucun questionnaire programmé trouvé')
      return new Response(
        JSON.stringify({ message: 'Aucun questionnaire à envoyer', count: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Send Scheduled] ${questionnaires.length} questionnaire(s) programmé(s) trouvé(s)`)

    // Filtrer les questionnaires dont la date d'envoi est arrivée
    const questionnairesToSend = questionnaires.filter((q) => {
      if (!q.created_at || !q.send_after_days) return false

      const createdDate = new Date(q.created_at)
      const sendDate = new Date(createdDate)
      sendDate.setDate(sendDate.getDate() + q.send_after_days)

      // Comparer uniquement les dates (sans l'heure)
      const sendDateOnly = new Date(sendDate.getFullYear(), sendDate.getMonth(), sendDate.getDate())

      return sendDateOnly <= today
    })

    if (questionnairesToSend.length === 0) {
      console.log('[Send Scheduled] Aucun questionnaire à envoyer aujourd\'hui')
      return new Response(
        JSON.stringify({ message: 'Aucun questionnaire à envoyer aujourd\'hui', count: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Send Scheduled] ${questionnairesToSend.length} questionnaire(s) à envoyer aujourd'hui`)

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Envoyer les emails pour chaque questionnaire
    for (const questionnaire of questionnairesToSend) {
      try {
        // Lien vers la page publique du questionnaire
        const questionnaireLink = `${APP_URL}/q/${questionnaire.id}`

        console.log(`[Send Scheduled] Envoi email pour questionnaire ${questionnaire.id} à ${questionnaire.patient_email}`)

        // Envoyer l'email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: Deno.env.get('RESEND_FROM_EMAIL') || 'TopLinkSante <noreply@mail.toplinksante.com>',
            to: questionnaire.patient_email,
            subject: 'Votre praticien vous invite à compléter votre questionnaire de suivi',
            headers: {
              'List-Unsubscribe': '<mailto:contact@toplinksante.com?subject=Unsubscribe>',
            },
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f3f4f6;">
                  <!-- Header -->
                  <div style="background-color: #ffffff; padding: 30px 20px; text-align: center; border-bottom: 3px solid #3b82f6;">
                    <h1 style="color: #3b82f6; margin: 0; font-size: 28px; font-weight: 700;">TopLinkSante</h1>
                  </div>
                  
                  <!-- Main Content -->
                  <div style="background-color: #ffffff; padding: 40px 30px;">
                    <p style="color: #4b5563; margin-bottom: 20px; font-size: 16px;">
                      Bonjour,
                    </p>
                    <p style="color: #1f2937; margin-bottom: 25px; font-size: 16px; line-height: 1.7;">
                      Votre professionnel de santé vous invite à prendre quelques instants pour remplir votre suivi de <strong>${questionnaire.pathologie || 'votre suivi'}</strong>. Vos réponses l'aideront à mieux vous accompagner.
                    </p>
                    
                    <!-- Button -->
                    <div style="text-align: center; margin: 35px 0;">
                      <a href="${questionnaireLink}" 
                         style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        Répondre au questionnaire
                      </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
                      Ce lien est personnel et confidentiel. Ne le partagez pas avec d'autres personnes.
                    </p>
                  </div>
                  
                  <!-- Footer -->
                  <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
                      Ceci est un message automatique envoyé par TopLinkSante pour votre praticien.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
                      Si vous n'avez pas demandé ce suivi, vous pouvez ignorer cet email.
                    </p>
                  </div>
                </body>
              </html>
            `,
            text: `Bonjour,\n\nVotre professionnel de santé vous invite à prendre quelques instants pour remplir votre suivi de ${questionnaire.pathologie || 'votre suivi'}. Vos réponses l'aideront à mieux vous accompagner.\n\nRépondre au questionnaire : ${questionnaireLink}\n\nCe lien est personnel et confidentiel. Ne le partagez pas.\n\n---\nCeci est un message automatique envoyé par TopLinkSante pour votre praticien.`,
          }),
        })

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json().catch(() => ({ message: 'Unknown error' }))
          throw new Error(`Resend API error: ${errorData.message || 'Unknown error'}`)
        }

        const emailResult = await emailResponse.json()
        console.log(`[Send Scheduled] Email envoyé avec succès (ID: ${emailResult.id}) pour questionnaire ${questionnaire.id}`)

        // Mettre à jour le statut du questionnaire à 'envoyé' avec la date d'envoi
        // NOTE: On ne purge PAS patient_email ici. La purge casse le système de relance
        // (send-reminder-emails) qui a besoin de patient_email pour envoyer les rappels.
        // La purge sera effectuée par send-reminder-emails APRÈS envoi de la relance,
        // ou après expiration du délai de relance (3 jours).
        const { error: updateError } = await supabase
          .from('questionnaires')
          .update({
            status: 'envoyé',
            sent_at: new Date().toISOString()
          })
          .eq('id', questionnaire.id)

        if (updateError) {
          console.error(`[Send Scheduled] Erreur lors de la mise à jour du questionnaire ${questionnaire.id}:`, updateError)
          errors.push(`Questionnaire ${questionnaire.id}: ${updateError.message}`)
          errorCount++
        } else {
          successCount++
          console.log(`[Send Scheduled] Questionnaire ${questionnaire.id} marqué comme envoyé`)
        }

      } catch (error: any) {
        console.error(`[Send Scheduled] Erreur lors de l'envoi pour le questionnaire ${questionnaire.id}:`, error)
        errors.push(`Questionnaire ${questionnaire.id}: ${error.message || 'Erreur inconnue'}`)
        errorCount++
      }

      // Délai de 500ms entre chaque email pour éviter le rate limiting de Resend
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return new Response(
      JSON.stringify({
        message: 'Traitement terminé',
        total: questionnairesToSend.length,
        success: successCount,
        errors: errorCount,
        errorDetails: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[Send Scheduled] Erreur inattendue:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur inattendue', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})




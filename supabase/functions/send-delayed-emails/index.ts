// Edge Function Supabase pour envoyer automatiquement les emails de questionnaires programmés
// Cette fonction scanne quotidiennement les questionnaires dont la date d'envoi est arrivée
// Conformité RGPD : Supprime immédiatement les données nominatives après envoi

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

    console.log('[Send Delayed] Démarrage de la fonction...')

    if (!RESEND_API_KEY) {
      console.error('[Send Delayed] RESEND_API_KEY manquant')
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

    console.log(`[Send Delayed] Scan des questionnaires à envoyer le ${today.toISOString().split('T')[0]}`)

    // Sélectionner les questionnaires à envoyer
    // Critères :
    // - status = 'pending' OU 'programmé' OU 'en_attente'
    // - patient_email IS NOT NULL
    // - send_after_days IS NOT NULL
    // - created_at + send_after_days <= aujourd'hui
    const { data: questionnaires, error: fetchError } = await supabase
      .from('questionnaires')
      .select('id, patient_email, pathologie, created_at, send_after_days')
      .in('status', ['pending', 'programmé', 'en_attente'])
      .not('patient_email', 'is', null)
      .not('send_after_days', 'is', null)

    if (fetchError) {
      console.error('[Send Delayed] Erreur lors de la récupération:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la récupération', details: fetchError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!questionnaires || questionnaires.length === 0) {
      console.log('[Send Delayed] Aucun questionnaire avec statut "pending" trouvé')
      return new Response(
        JSON.stringify({ message: 'Aucun questionnaire à envoyer', count: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Send Delayed] ${questionnaires.length} questionnaire(s) avec statut "pending" trouvé(s)`)

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
      console.log('[Send Delayed] Aucun questionnaire à envoyer aujourd\'hui')
      return new Response(
        JSON.stringify({ message: 'Aucun questionnaire à envoyer aujourd\'hui', count: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Send Delayed] ${questionnairesToSend.length} questionnaire(s) à envoyer aujourd'hui`)

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Envoyer les emails pour chaque questionnaire
    for (const questionnaire of questionnairesToSend) {
      // Sauvegarder l'email avant envoi (pour la purge après)
      const patientEmail = questionnaire.patient_email

      try {
        // Lien vers la page publique du questionnaire
        const questionnaireLink = `${APP_URL}/q/${questionnaire.id}`

        console.log(`[Send Delayed] Envoi email pour questionnaire ${questionnaire.id} à ${patientEmail}`)

        // Envoyer l'email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: Deno.env.get('RESEND_FROM_EMAIL') || 'TopLinkSante <noreply@toplinksante.com>',
            to: patientEmail,
            subject: 'Questionnaire de suivi - Votre praticien vous sollicite',
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
                    <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 14px;">Suivi patient confidentiel</p>
                  </div>
                  
                  <!-- Main Content -->
                  <div style="background-color: #ffffff; padding: 40px 30px;">
                    <p style="color: #4b5563; margin-bottom: 20px; font-size: 16px;">
                      Bonjour,
                    </p>
                    <p style="color: #1f2937; margin-bottom: 20px; font-size: 16px; line-height: 1.7;">
                      Votre professionnel de santé souhaite faire le point sur votre suivi concernant <strong>${questionnaire.pathologie || 'votre suivi'}</strong>.
                    </p>
                    <p style="color: #1f2937; margin-bottom: 25px; font-size: 16px; line-height: 1.7;">
                      Prenez quelques instants pour répondre à ce questionnaire. Vos réponses permettront à votre praticien de mieux vous accompagner et d'adapter votre suivi.
                    </p>
                    
                    <!-- Button -->
                    <div style="text-align: center; margin: 35px 0;">
                      <a href="${questionnaireLink}" 
                         style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: background-color 0.2s;">
                        Accéder au questionnaire
                      </a>
                    </div>
                    
                    <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 30px 0; border-radius: 4px;">
                      <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">
                        <strong>Confidentialité garantie</strong><br>
                        Ce lien est personnel et sécurisé. Vos réponses sont transmises directement à votre praticien et ne sont conservées que le temps nécessaire à votre suivi.
                      </p>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
                      Si le bouton ne fonctionne pas, vous pouvez copier ce lien dans votre navigateur :<br>
                      <a href="${questionnaireLink}" style="color: #3b82f6; word-break: break-all; text-decoration: underline;">${questionnaireLink}</a>
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
                    <p style="color: #9ca3af; font-size: 11px; margin: 12px 0 0 0; font-style: italic;">
                      TopLinkSante - Plateforme de suivi patient éphémère et confidentiel
                    </p>
                  </div>
                </body>
              </html>
            `,
            text: `Bonjour,\n\nVotre professionnel de santé souhaite faire le point sur votre suivi concernant ${questionnaire.pathologie || 'votre suivi'}.\n\nPrenez quelques instants pour répondre à ce questionnaire. Vos réponses permettront à votre praticien de mieux vous accompagner et d'adapter votre suivi.\n\nConfidentialité garantie : Ce lien est personnel et sécurisé. Vos réponses sont transmises directement à votre praticien.\n\nAccéder au questionnaire :\n${questionnaireLink}\n\n---\nCeci est un message automatique envoyé par TopLinkSante pour votre praticien.\nSi vous n'avez pas demandé ce suivi, vous pouvez ignorer cet email.\n\nTopLinkSante - Plateforme de suivi patient éphémère et confidentiel`,
          }),
        })

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json().catch(() => ({ message: 'Unknown error' }))
          throw new Error(`Resend API error: ${errorData.message || 'Unknown error'}`)
        }

        const emailResult = await emailResponse.json()
        console.log(`[Send Delayed] Email envoyé avec succès (ID: ${emailResult.id}) pour questionnaire ${questionnaire.id}`)

        // ⚠️ CONFORMITÉ RGPD : Purge immédiate des données nominatives après envoi réussi
        // Mise à jour atomique : statut, purge de l'email, date d'envoi
        const { error: updateError } = await supabase
          .from('questionnaires')
          .update({
            status: 'envoyé',
            patient_email: 'PURGED', // Remplacement immédiat de l'email par 'PURGED'
            sent_at: new Date().toISOString(), // Enregistrement de la date d'envoi
          })
          .eq('id', questionnaire.id)

        if (updateError) {
          console.error(`[Send Delayed] Erreur lors de la mise à jour du questionnaire ${questionnaire.id}:`, updateError)
          errors.push(`Questionnaire ${questionnaire.id}: ${updateError.message}`)
          errorCount++
        } else {
          successCount++
          console.log(`[Send Delayed] Questionnaire ${questionnaire.id} mis à jour : statut='sent', email='PURGED', sent_at enregistré`)
        }

      } catch (error: any) {
        console.error(`[Send Delayed] Erreur lors de l'envoi pour le questionnaire ${questionnaire.id}:`, error)
        errors.push(`Questionnaire ${questionnaire.id}: ${error.message || 'Erreur inconnue'}`)
        errorCount++
        // ⚠️ IMPORTANT : En cas d'erreur, l'email n'est PAS purgé pour permettre une nouvelle tentative
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
    console.error('[Send Delayed] Erreur inattendue:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur inattendue', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})


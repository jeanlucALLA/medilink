// Edge Function Supabase pour envoyer les emails de relance
// Envoie UNE SEULE relance aux patients qui n'ont pas répondu après 3 jours

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL') || Deno.env.get('APP_URL') || 'https://www.medilink-sante.com'

// Nombre de jours avant d'envoyer la relance
const REMINDER_DELAY_DAYS = 3

serve(async (req) => {
    try {
        console.log('[Send Reminder] Démarrage de la fonction de relance...')

        if (!RESEND_API_KEY) {
            console.error('RESEND_API_KEY manquant')
            return new Response(
                JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // Créer le client Supabase avec service role key
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Calculer la date limite (il y a 3 jours)
        const reminderThreshold = new Date()
        reminderThreshold.setDate(reminderThreshold.getDate() - REMINDER_DELAY_DAYS)

        console.log(`[Send Reminder] Recherche des questionnaires envoyés avant le ${reminderThreshold.toISOString()}`)

        // Récupérer les questionnaires qui:
        // - ont été envoyés (status = 'envoyé')
        // - n'ont pas encore reçu de relance (reminder_sent_at IS NULL)
        // - ont été envoyés il y a plus de X jours
        const { data: questionnaires, error: fetchError } = await supabase
            .from('questionnaires')
            .select('id, patient_email, pathologie, sent_at')
            .eq('status', 'envoyé')
            .is('reminder_sent_at', null)
            .not('patient_email', 'is', null)
            .lt('sent_at', reminderThreshold.toISOString())

        if (fetchError) {
            console.error('[Send Reminder] Erreur lors de la récupération:', fetchError)
            return new Response(
                JSON.stringify({ error: 'Erreur lors de la récupération', details: fetchError.message }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
        }

        if (!questionnaires || questionnaires.length === 0) {
            console.log('[Send Reminder] Aucun questionnaire à relancer')
            return new Response(
                JSON.stringify({ message: 'Aucune relance à envoyer', count: 0 }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
        }

        console.log(`[Send Reminder] ${questionnaires.length} questionnaire(s) à relancer`)

        // Vérifier lesquels n'ont pas reçu de réponse
        const questionnairesToRemind = []

        for (const q of questionnaires) {
            // Vérifier s'il y a une réponse pour ce questionnaire
            const { data: responses, error: respError } = await supabase
                .from('responses')
                .select('id')
                .eq('questionnaire_id', q.id)
                .limit(1)

            if (respError) {
                console.error(`[Send Reminder] Erreur vérification réponse pour ${q.id}:`, respError)
                continue
            }

            // Si pas de réponse, ajouter à la liste des relances
            if (!responses || responses.length === 0) {
                questionnairesToRemind.push(q)
            }
        }

        if (questionnairesToRemind.length === 0) {
            console.log('[Send Reminder] Tous les questionnaires ont déjà reçu une réponse')
            return new Response(
                JSON.stringify({ message: 'Tous les questionnaires ont reçu une réponse', count: 0 }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
        }

        console.log(`[Send Reminder] ${questionnairesToRemind.length} questionnaire(s) sans réponse à relancer`)

        let successCount = 0
        let errorCount = 0
        const errors: string[] = []

        // Envoyer les emails de relance
        for (const questionnaire of questionnairesToRemind) {
            try {
                const questionnaireLink = `${APP_URL}/questionnaire/${questionnaire.id}`

                console.log(`[Send Reminder] Envoi relance pour questionnaire ${questionnaire.id} à ${questionnaire.patient_email}`)

                // Envoyer l'email de relance via Resend
                const emailResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: Deno.env.get('RESEND_FROM_EMAIL') || 'TopLinkSante <noreply@toplinksante.com>',
                        to: questionnaire.patient_email,
                        subject: '⏰ Rappel : Votre questionnaire de suivi vous attend',
                        html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f3f4f6;">
                  <!-- Header -->
                  <div style="background-color: #ffffff; padding: 30px 20px; text-align: center; border-bottom: 3px solid #f59e0b;">
                    <h1 style="color: #f59e0b; margin: 0; font-size: 28px; font-weight: 700;">⏰ Rappel</h1>
                  </div>
                  
                  <!-- Main Content -->
                  <div style="background-color: #ffffff; padding: 40px 30px;">
                    <p style="color: #4b5563; margin-bottom: 20px; font-size: 16px;">
                      Bonjour,
                    </p>
                    <p style="color: #1f2937; margin-bottom: 25px; font-size: 16px; line-height: 1.7;">
                      Nous n'avons pas encore reçu votre retour concernant votre suivi de <strong>${questionnaire.pathologie || 'votre suivi'}</strong>.
                    </p>
                    <p style="color: #1f2937; margin-bottom: 25px; font-size: 16px; line-height: 1.7;">
                      Votre avis est précieux pour votre praticien. Cela ne prend que <strong>2 minutes</strong>.
                    </p>
                    
                    <!-- Button -->
                    <div style="text-align: center; margin: 35px 0;">
                      <a href="${questionnaireLink}" 
                         style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        Répondre maintenant
                      </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
                      Ce lien est personnel et confidentiel.
                    </p>
                  </div>
                  
                  <!-- Footer -->
                  <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
                      Ceci est un rappel automatique envoyé par TopLinkSante.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
                      Vous ne recevrez plus de rappel pour ce questionnaire.
                    </p>
                  </div>
                </body>
              </html>
            `,
                        text: `Bonjour,\n\nNous n'avons pas encore reçu votre retour concernant votre suivi de ${questionnaire.pathologie || 'votre suivi'}.\n\nVotre avis est précieux. Cela ne prend que 2 minutes.\n\nRépondre au questionnaire : ${questionnaireLink}\n\n---\nCeci est un rappel automatique. Vous ne recevrez plus de rappel pour ce questionnaire.`,
                    }),
                })

                if (!emailResponse.ok) {
                    const errorData = await emailResponse.json().catch(() => ({ message: 'Unknown error' }))
                    throw new Error(`Resend API error: ${errorData.message || 'Unknown error'}`)
                }

                const emailResult = await emailResponse.json()
                console.log(`[Send Reminder] Relance envoyée avec succès (ID: ${emailResult.id}) pour questionnaire ${questionnaire.id}`)

                // Marquer la relance comme envoyée
                const { error: updateError } = await supabase
                    .from('questionnaires')
                    .update({ reminder_sent_at: new Date().toISOString() })
                    .eq('id', questionnaire.id)

                if (updateError) {
                    console.error(`[Send Reminder] Erreur lors de la mise à jour du questionnaire ${questionnaire.id}:`, updateError)
                    errors.push(`Questionnaire ${questionnaire.id}: ${updateError.message}`)
                    errorCount++
                } else {
                    successCount++
                    console.log(`[Send Reminder] Questionnaire ${questionnaire.id} marqué comme relancé`)
                }

            } catch (error: any) {
                console.error(`[Send Reminder] Erreur lors de l'envoi pour le questionnaire ${questionnaire.id}:`, error)
                errors.push(`Questionnaire ${questionnaire.id}: ${error.message || 'Erreur inconnue'}`)
                errorCount++
            }
        }

        return new Response(
            JSON.stringify({
                message: 'Relances terminées',
                total: questionnairesToRemind.length,
                success: successCount,
                errors: errorCount,
                errorDetails: errors.length > 0 ? errors : undefined,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('[Send Reminder] Erreur inattendue:', error)
        return new Response(
            JSON.stringify({ error: 'Erreur inattendue', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})

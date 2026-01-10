import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Réponses invalides' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    // Utiliser Service Role Key pour bypass RLS (Patient anonyme)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Vérifier que le questionnaire existe
    const { data: questionnaire, error: fetchError } = await supabase
      .from('questionnaires')
      .select('id, pathologie, questions, user_id, patient_email, status')
      .eq('id', id)
      .single()

    if (fetchError || !questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si déjà complété
    if (questionnaire.status === 'Complété') {
      return NextResponse.json(
        { error: 'Ce questionnaire a déjà été complété' },
        { status: 400 }
      )
    }

    // Calculer le score global (Moyenne des réponses 1-5)
    const totalScore = answers.reduce((acc: number, curr: number) => acc + curr, 0)
    const averageScore = totalScore / answers.length
    const scoreResultat = Math.round(averageScore) // Arrondi pour l'affichage note globale

    // Préparer les réponses au format JSONB
    const reponses = {
      answers: answers,
      comment: body.comment || '',
      submittedAt: new Date().toISOString(),
      scoreCalculated: averageScore
    }

    // 1. D'abord insérer les réponses dans la table 'responses' (Source de vérité)
    // On utilise insert() standard. Si échec, on arrête tout.
    const { error: insertError } = await supabase
      .from('responses')
      .insert({
        questionnaire_id: id,
        user_id: questionnaire.user_id,
        pathologie: questionnaire.pathologie,
        answers: answers, // Tableau des réponses
        score_total: scoreResultat,
        average_score: averageScore,
        patient_email: questionnaire.patient_email,
        submitted_at: new Date().toISOString(),
        // On sauvegarde aussi le commentaire et le JSON complet pour référence future si besoin
        comment: body.comment || '',
        metadata: { scoreCalculated: averageScore }
      })

    if (insertError) {
      console.error('Erreur insertion responses:', insertError)
      return NextResponse.json(
        { error: `Erreur sauvegarde (Table Responses): ${insertError.message}` },
        { status: 500 }
      )
    }

    // 2. Ensuite mettre à jour le statut du questionnaire (Link invalidation)
    // On retire 'reponses' et 'score_resultat' qui n'existent pas dans cette table
    const { error: updateError } = await supabase
      .from('questionnaires')
      .update({
        statut: 'Complété',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    // Si la mise à jour du statut échoue, ce n'est pas critique pour les données, mais on le log
    if (updateError) {
      console.warn('Warning: Impossible de mettre à jour le statut du questionnaire:', updateError)
    }

    // Envoyer une notification email au praticien (non bloquant)
    try {
      if (questionnaire.user_id) {
        // Récupérer l'email et le nom du praticien depuis la table profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email, nom_complet')
          .eq('id', questionnaire.user_id)
          .single()

        if (!profileError && profile?.email) {
          const resendApiKey = process.env.RESEND_API_KEY

          if (resendApiKey) {
            const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
            const pathologie = questionnaire.pathologie || 'votre suivi'
            const praticienNom = profile.nom_complet ? `Dr. ${profile.nom_complet.split(' ')[0]}` : 'Docteur'
            const historyLink = `${dashboardUrl}/dashboard/history`

            // Envoyer l'email via Resend
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: 'Medi.Link <noreply@medilink.fr>',
                to: profile.email,
                subject: `✅ Nouvelle réponse patient : ${pathologie}`,
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
                        <h1 style="color: #3b82f6; margin: 0; font-size: 28px; font-weight: 700;">Medi.Link</h1>
                      </div>
                      
                      <!-- Main Content -->
                      <div style="background-color: #ffffff; padding: 40px 30px;">
                        <p style="color: #4b5563; margin-bottom: 20px; font-size: 16px;">
                          Bonjour ${praticienNom},
                        </p>
                        <p style="color: #1f2937; margin-bottom: 20px; font-size: 16px; line-height: 1.7;">
                          Un patient vient de compléter son questionnaire de suivi pour la pathologie : <strong>${pathologie}</strong>.
                        </p>
                        <p style="color: #1f2937; margin-bottom: 30px; font-size: 16px; line-height: 1.7;">
                          Vous pouvez dès maintenant consulter le détail de ses réponses et son score de récupération sur votre espace sécurisé.
                        </p>
                        
                        <!-- Button -->
                        <div style="text-align: center; margin: 35px 0;">
                          <a href="${historyLink}" 
                             style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            Consulter la réponse
                          </a>
                        </div>

                        <!-- Note RGPD -->
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0; border-radius: 4px;">
                          <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                            <strong>Note :</strong> Conformément à votre politique de confidentialité, l'email du patient a été purgé de nos systèmes après l'envoi du questionnaire.
                          </p>
                        </div>
                      </div>
                      
                      <!-- Footer -->
                      <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.6;">
                          Bien cordialement,
                        </p>
                        <p style="color: #3b82f6; font-size: 14px; font-weight: 600; margin: 8px 0 0 0;">
                          L'équipe Medi.Link
                        </p>
                      </div>
                    </body>
                  </html>
                `,
                text: `Bonjour ${praticienNom},\n\nUn patient vient de compléter son questionnaire de suivi pour la pathologie : ${pathologie}.\n\nVous pouvez dès maintenant consulter le détail de ses réponses et son score de récupération sur votre espace sécurisé.\n\nConsulter la réponse : ${historyLink}\n\nNote : Conformément à votre politique de confidentialité, l'email du patient a été purgé de nos systèmes après l'envoi du questionnaire.\n\nBien cordialement,\nL'équipe Medi.Link`,
              }),
            })

            if (emailResponse.ok) {
              console.log(`[Notification] Email envoyé au praticien ${profile.email} pour le questionnaire ${id}`)
            } else {
              const errorData = await emailResponse.json().catch(() => ({ message: 'Unknown error' }))
              console.error(`[Notification] Erreur lors de l'envoi de l'email au praticien:`, errorData)
            }
          } else {
            console.warn('[Notification] RESEND_API_KEY non configurée, notification email ignorée')
          }
        } else {
          console.warn(`[Notification] Email du praticien non trouvé pour user_id ${questionnaire.user_id}`)
        }
      }
    } catch (emailError) {
      // Ne pas bloquer la soumission si l'email échoue
      console.error('[Notification] Erreur lors de l\'envoi de la notification email:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Réponses enregistrées avec succès',
    })
  } catch (error) {
    console.error('Erreur lors de la soumission:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la soumission' },
      { status: 500 }
    )
  }
}


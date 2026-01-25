import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST: Annuler la relance automatique pour un questionnaire
export async function POST(request: NextRequest) {
    try {
        const { questionnaireId } = await request.json()

        if (!questionnaireId) {
            return NextResponse.json(
                { error: 'questionnaireId requis' },
                { status: 400 }
            )
        }

        // Vérifier l'authentification
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            )
        }

        const token = authHeader.replace('Bearer ', '')

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { error: 'Configuration Supabase manquante' },
                { status: 500 }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Vérifier le token utilisateur
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Session expirée' },
                { status: 401 }
            )
        }

        // Vérifier que le questionnaire appartient à l'utilisateur
        const { data: questionnaire, error: fetchError } = await supabase
            .from('questionnaires')
            .select('id, user_id, status')
            .eq('id', questionnaireId)
            .eq('user_id', user.id)
            .single()

        if (fetchError || !questionnaire) {
            return NextResponse.json(
                { error: 'Questionnaire non trouvé ou accès refusé' },
                { status: 404 }
            )
        }

        // Marquer la relance comme "annulée" en définissant reminder_sent_at à maintenant
        // Cela empêchera l'Edge Function send-reminder-emails d'envoyer une relance
        const { error: updateError } = await supabase
            .from('questionnaires')
            .update({
                reminder_sent_at: new Date().toISOString(),
                reminder_cancelled: true, // Flag additionnel pour clarté
            })
            .eq('id', questionnaireId)

        if (updateError) {
            console.error('[Cancel Reminder] Erreur update:', updateError)
            return NextResponse.json(
                { error: 'Erreur lors de l\'annulation' },
                { status: 500 }
            )
        }

        console.log(`[Cancel Reminder] Relance annulée pour questionnaire ${questionnaireId}`)

        return NextResponse.json({
            success: true,
            message: 'Relance annulée avec succès'
        })

    } catch (error: any) {
        console.error('[Cancel Reminder] Erreur:', error)
        return NextResponse.json(
            { error: 'Erreur interne' },
            { status: 500 }
        )
    }
}

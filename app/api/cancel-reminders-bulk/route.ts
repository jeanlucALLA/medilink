import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST: Annuler les relances automatiques pour plusieurs questionnaires
export async function POST(request: NextRequest) {
    try {
        const { questionnaireIds } = await request.json()

        if (!questionnaireIds || !Array.isArray(questionnaireIds) || questionnaireIds.length === 0) {
            return NextResponse.json(
                { error: 'questionnaireIds requis (array)' },
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

        // Annuler toutes les relances en une seule requête
        const { data, error: updateError } = await supabase
            .from('questionnaires')
            .update({
                reminder_sent_at: new Date().toISOString(),
                reminder_cancelled: true,
            })
            .eq('user_id', user.id)
            .in('id', questionnaireIds)
            .select('id')

        if (updateError) {
            console.error('[Cancel Reminders Bulk] Erreur update:', updateError)
            return NextResponse.json(
                { error: 'Erreur lors de l\'annulation' },
                { status: 500 }
            )
        }

        const cancelledCount = data?.length || 0
        console.log(`[Cancel Reminders Bulk] ${cancelledCount} relances annulées pour l'utilisateur ${user.id}`)

        return NextResponse.json({
            success: true,
            message: `${cancelledCount} relance(s) annulée(s) avec succès`,
            cancelledCount
        })

    } catch (error: any) {
        console.error('[Cancel Reminders Bulk] Erreur:', error)
        return NextResponse.json(
            { error: 'Erreur interne' },
            { status: 500 }
        )
    }
}

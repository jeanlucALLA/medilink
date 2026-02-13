import { NextRequest, NextResponse } from 'next/server'
import { questionnairesMap } from '@/lib/questionnaire-store'
import { createClient } from '@supabase/supabase-js'

// GET: Récupérer un questionnaire par ID (pour le patient)
// MAIL-04: Fallback Supabase si la Map mémoire est vide (serverless = Map vidée fréquemment)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json(
        { error: 'ID requis' },
        { status: 400 }
      )
    }

    // 1. Essayer depuis la Map mémoire (rapide)
    const questionnaire = questionnairesMap.get(id)

    if (questionnaire) {
      // Vérifier si expiré
      if (questionnaire.expiresAt <= Date.now()) {
        questionnairesMap.delete(id)
        return NextResponse.json(
          { error: 'Questionnaire expiré' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        id: questionnaire.id,
        title: questionnaire.title,
        questions: questionnaire.questions,
        pathologyName: questionnaire.pathologyName,
        googleReviewUrl: questionnaire.googleReviewUrl,
      })
    }

    // 2. Fallback Supabase si pas en mémoire (redémarrage serverless)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data, error } = await supabase
        .from('questionnaires')
        .select('id, pathologie, questions')
        .eq('id', id)
        .in('status', ['envoyé', 'programmé', 'en_attente', 'pending', 'non programmé'])
        .single()

      if (!error && data) {
        console.log(`[Survey] Fallback Supabase pour questionnaire ${id}`)
        return NextResponse.json({
          id: data.id,
          title: data.pathologie || 'Questionnaire de suivi',
          questions: data.questions || [],
          pathologyName: data.pathologie,
        })
      }
    }

    return NextResponse.json(
      { error: 'Questionnaire non trouvé ou expiré' },
      { status: 404 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}

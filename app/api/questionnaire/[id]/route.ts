import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET: Récupérer un questionnaire par ID (pour le patient)
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Récupérer le questionnaire depuis la base de données
    const { data: questionnaire, error } = await supabase
      .from('questionnaires')
      .select('id, pathologie, questions, status, patient_email, patient_name')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erreur lors de la récupération:', error)
      return NextResponse.json(
        { error: 'Questionnaire non trouvé' },
        { status: 404 }
      )
    }

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le questionnaire est envoyé (statut = 'Envoyé') ou programmé
    if (questionnaire.status !== 'Envoyé' && questionnaire.status !== 'Programmé') {
      return NextResponse.json(
        { error: 'Questionnaire non disponible' },
        { status: 403 }
      )
    }

    // Vérifier si déjà complété
    if (questionnaire.status === 'Complété') {
      return NextResponse.json({
        id: questionnaire.id,
        pathologie: questionnaire.pathologie,
        status: 'Complété',
        patient_name: questionnaire.patient_name,
        patient_email: questionnaire.patient_email,
      })
    }

    // Retourner uniquement les données nécessaires
    return NextResponse.json({
      id: questionnaire.id,
      pathologie: questionnaire.pathologie,
      status: questionnaire.status,
      patient_name: questionnaire.patient_name,
      patient_email: questionnaire.patient_email,
      questions: questionnaire.questions || [],
    })
  } catch (error) {
    console.error('Erreur lors de la récupération:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}


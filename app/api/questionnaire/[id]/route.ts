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
    // Utiliser la clé Service Role pour contourner RLS (car le patient n'est pas authentifié)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY manquant server-side')
      return NextResponse.json(
        { error: 'Configuration serveur incomplète' },
        { status: 500 }
      )
    }

    // Client Admin (Bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Récupérer le questionnaire depuis la base de données
    // Note: La colonne peut s'appeler 'status' ou 'statut' selon la migration
    const { data: questionnaire, error } = await supabase
      .from('questionnaires')
      .select('id, pathologie, questions, statut, patient_email, patient_name')
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

    // Sécurisation : Utiliser 'statut' (FR)
    // Normaliser en minuscules pour la comparaison
    const currentStatus = (questionnaire.statut || '').toLowerCase()

    // Vérifier que le questionnaire est envoyé ou programmé/en_attente
    // Accepte: 'envoyé', 'Envoyé', 'programmé', 'Programmé', 'en_attente'
    if (currentStatus !== 'envoyé' && currentStatus !== 'programmé' && currentStatus !== 'en_attente') {
      return NextResponse.json(
        { error: 'Questionnaire non disponible' },
        { status: 403 }
      )
    }

    // Vérifier si déjà complété
    if (currentStatus === 'Complété') {
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
      status: currentStatus, // Le frontend attend "status"
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


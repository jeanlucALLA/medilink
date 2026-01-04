import { NextRequest, NextResponse } from 'next/server'
import { questionnairesMap } from '@/lib/questionnaire-store'

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

    const questionnaire = questionnairesMap.get(id)

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire non trouvé ou expiré' },
        { status: 404 }
      )
    }

    // Vérifier si expiré
    if (questionnaire.expiresAt <= Date.now()) {
      questionnairesMap.delete(id)
      return NextResponse.json(
        { error: 'Questionnaire expiré' },
        { status: 404 }
      )
    }

    // Retourner uniquement les données nécessaires (sans expiresAt)
    return NextResponse.json({
      id: questionnaire.id,
      title: questionnaire.title,
      questions: questionnaire.questions,
      pathologyName: questionnaire.pathologyName,
      googleReviewUrl: questionnaire.googleReviewUrl,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}


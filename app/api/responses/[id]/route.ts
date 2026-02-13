import { NextRequest, NextResponse } from 'next/server'
import { questionnairesMap, responsesMap } from '@/lib/questionnaire-store'

// GET: Récupérer les réponses d'un questionnaire (pour le praticien)
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
    const response = responsesMap.get(id)

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire non trouvé' },
        { status: 404 }
      )
    }

    if (!response) {
      return NextResponse.json(
        { error: 'Aucune réponse pour ce questionnaire' },
        { status: 404 }
      )
    }

    // Marquer comme consulté
    if (response.viewedAt === null) {
      response.viewedAt = Date.now()
      responsesMap.set(id, response)

      // Programmer la suppression après consultation (dans 1 minute)
      setTimeout(() => {
        responsesMap.delete(id)
        questionnairesMap.delete(id)
        console.log(`[Auto-delete] Réponse ${id} supprimée après consultation`)
      }, 60 * 1000) // 1 minute après consultation
    }

    return NextResponse.json({
      questionnaire: {
        title: questionnaire.title,
        questions: questionnaire.questions,
      },
      response: {
        answers: response.answers,
        submittedAt: response.submittedAt,
        viewedAt: response.viewedAt,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}

// DELETE: Supprimer manuellement une réponse
export async function DELETE(
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

    const deletedResponse = responsesMap.delete(id)
    const deletedQuestionnaire = questionnairesMap.delete(id)

    if (deletedResponse || deletedQuestionnaire) {
      console.log(`[Manual-delete] Questionnaire ${id} supprimé manuellement`)
      return NextResponse.json({ message: 'Supprimé' })
    }

    return NextResponse.json(
      { error: 'Non trouvé' },
      { status: 404 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}


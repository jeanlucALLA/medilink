import { NextRequest, NextResponse } from 'next/server'
import { sendFollowupConfirmationEmail } from '@/lib/emails/followup'

/**
 * API Route pour envoyer un email de suivi patient
 * POST /api/send-followup-email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      to,
      patientName,
      cabinetName,
      sessionDate,
      questionnaireId,
      cabinetPhone,
      cabinetEmail,
      practitionerName,
    } = body

    // Validation des champs requis
    if (!to || !patientName || !cabinetName || !sessionDate || !questionnaireId) {
      return NextResponse.json(
        { error: 'Champs requis manquants: to, patientName, cabinetName, sessionDate, questionnaireId' },
        { status: 400 }
      )
    }

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      )
    }

    // Envoyer l'email
    const result = await sendFollowupConfirmationEmail({
      to,
      patientName,
      cabinetName,
      sessionDate,
      questionnaireId,
      cabinetPhone,
      cabinetEmail,
      practitionerName,
    })

    return NextResponse.json({
      success: true,
      message: 'Email de suivi envoyé avec succès',
      id: result.id,
    })
  } catch (error: any) {
    console.error('[SendFollowupEmail] Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    )
  }
}



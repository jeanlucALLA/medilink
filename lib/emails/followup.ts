import { Resend } from 'resend'
import { FollowUpEmail } from '@/components/emails/FollowUpEmail'

const resend = new Resend(process.env.RESEND_API_KEY || 're_123')

interface SendFollowupEmailParams {
  to: string
  patientName: string
  cabinetName: string
  sessionDate: string
  questionnaireId: string
  cabinetPhone?: string
  cabinetEmail?: string
  practitionerName?: string
}

/**
 * Envoie un email de suivi professionnel au patient
 */
export async function sendFollowupConfirmationEmail({
  to,
  patientName,
  cabinetName,
  sessionDate,
  questionnaireId,
  cabinetPhone,
  cabinetEmail,
  practitionerName,
}: SendFollowupEmailParams) {
  try {
    // Vérifier que Resend est configuré
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY n\'est pas configurée dans les variables d\'environnement')
    }

    // Construire l'URL du questionnaire
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const questionnaireUrl = `${baseUrl}/questionnaire/${questionnaireId}`

    // Générer le HTML de l'email
    const html = FollowUpEmail({
      patientName,
      cabinetName,
      sessionDate,
      questionnaireUrl,
      cabinetPhone,
      cabinetEmail,
      practitionerName,
    })

    // Envoyer l'email via Resend
    const result = await resend.emails.send({
      from: 'Medi.Link <onboarding@resend.dev>',
      to,
      subject: `Suivi de votre séance - ${cabinetName}`,
      html,
    })

    if (result.error) {
      throw new Error(result.error.message || 'Erreur lors de l\'envoi de l\'email')
    }

    return {
      success: true,
      id: result.data?.id,
    }
  } catch (error: any) {
    console.error('[FollowUpEmail] Erreur:', error)
    throw error
  }
}



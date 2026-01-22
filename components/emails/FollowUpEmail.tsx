/**
 * Template d'email professionnel pour le suivi patient
 * Utilise HTML avec Tailwind inline CSS pour compatibilité email
 */

interface FollowUpEmailProps {
  patientName: string
  cabinetName: string
  sessionDate: string
  questionnaireUrl: string
  cabinetPhone?: string
  cabinetEmail?: string
  practitionerName?: string
}

export function FollowUpEmail({
  patientName,
  cabinetName,
  sessionDate,
  questionnaireUrl,
  cabinetPhone,
  cabinetEmail,
  practitionerName,
}: FollowUpEmailProps) {
  // Formater la date en français
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const formattedDate = formatDate(sessionDate)

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Suivi de votre séance - ${cabinetName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Container principal -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          
          <!-- Header avec logo -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <div style="margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #3b82f6; letter-spacing: -0.5px;">
                  TopLinkSante
                </h1>
              </div>
              <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 500;">
                ${cabinetName}
              </p>
            </td>
          </tr>

          <!-- Contenu principal -->
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #111827;">
                Bonjour <strong>${patientName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Merci pour votre confiance lors de votre séance du <strong>${formattedDate}</strong>.
              </p>

              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Pour nous aider à optimiser votre accompagnement, pourriez-vous prendre <strong>1 minute</strong> pour répondre à quelques questions ?
              </p>

              <!-- Bouton CTA principal -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${questionnaireUrl}" 
                       style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">
                      Répondre au questionnaire
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Informations complémentaires -->
              <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #111827;">
                  💡 Pourquoi ce questionnaire ?
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                  Vos retours nous permettent d'améliorer continuellement la qualité de votre prise en charge et d'adapter notre approche à vos besoins spécifiques.
                </p>
              </div>
            </td>
          </tr>

          <!-- Section Urgence -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 20px;">
                <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #991b1b;">
                  🚨 Besoin d'aide immédiate ?
                </p>
                <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #7f1d1d;">
                  Si vous avez une urgence médicale ou une question nécessitant une réponse rapide, n'hésitez pas à nous contacter directement.
                </p>
                ${cabinetPhone ? `
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td>
                      <a href="tel:${cabinetPhone.replace(/\s/g, '')}" 
                         style="display: inline-block; padding: 10px 20px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                        📞 Appeler le cabinet
                      </a>
                    </td>
                  </tr>
                </table>
                ` : ''}
              </div>
            </td>
          </tr>

          <!-- Footer avec signature -->
          <tr>
            <td style="padding: 30px 40px 40px 40px; border-top: 1px solid #e5e7eb; background-color: #f9fafb;">
              <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #111827;">
                ${practitionerName || 'L\'équipe médicale'}
              </p>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">
                ${cabinetName}
              </p>
              ${cabinetEmail ? `
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">
                📧 ${cabinetEmail}
              </p>
              ` : ''}
              ${cabinetPhone ? `
              <p style="margin: 0 0 20px 0; font-size: 13px; color: #6b7280;">
                📞 ${cabinetPhone}
              </p>
              ` : ''}
              
              <!-- Ligne de séparation -->
              <div style="border-top: 1px solid #e5e7eb; margin: 20px 0;"></div>
              
              <!-- Mentions légales -->
              <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 1.5;">
                Cet email a été envoyé automatiquement par TopLinkSante. Vos données sont traitées de manière sécurisée et conformément au RGPD.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}



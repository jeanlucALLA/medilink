import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_123')

export async function sendInvoiceEmail(email: string, invoiceUrl: string, planName: string) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY missing, skipping invoice email')
        return
    }

    // Protection environnements de test/dev sans domaine vérifié
    // Utiliser toujours le domaine vérifié toplinksante.com
    const from = process.env.RESEND_FROM_EMAIL || 'TopLinkSante Billing <noreply@toplinksante.com>'

    // Si on est en dev et qu'on utilise le domaine de test Resend, il faut envoyer uniquement à l'adresse du compte Resend (souvent celle du dév)
    // Sauf si on a un domaine vérifié. Pour la démo, on envoie, Resend blocquera si non autorisé.

    try {
        await resend.emails.send({
            from: from,
            to: email, // En mode test Resend, ça ne marche que vers l'email, compte. 
            subject: `Votre facture Medi.Link disponible : ${planName}`,
            html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #0052FF; font-size: 24px; font-weight: bold; margin: 0;">Medi.Link</h1>
                </div>
                
                <div style="background-color: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #f3f4f6;">
                    <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">
                        Votre facture est prête
                    </h2>
                    
                    <p style="margin-bottom: 24px; line-height: 1.5;">
                        Bonjour,
                        <br><br>
                        Le paiement pour votre abonnement <strong>${planName}</strong> a été validé avec succès.
                        <br>
                        Vous pouvez consulter et télécharger votre facture directement via le lien sécurisé ci-dessous.
                    </p>

                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${invoiceUrl}" style="background-color: #0052FF; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 82, 255, 0.2);">
                            Télécharger ma facture
                        </a>
                    </div>

                    <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 24px;">
                        Si le bouton ne fonctionne pas, copiez ce lien :<br>
                        <a href="${invoiceUrl}" style="color: #0052FF;">${invoiceUrl}</a>
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af;">
                    <p>© 2026 Medi.Link. Tous droits réservés.</p>
                    <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
                </div>
            </div>
            `
        })
        console.log(`Email facture envoyé à ${email}`)
    } catch (error) {
        console.error('Erreur envoi email facture:', error)
    }
}

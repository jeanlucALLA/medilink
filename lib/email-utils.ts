import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@toplinksante.com';

export async function sendWelcomeEmail(toEmail: string, practitionerName: string) {
  try {
    const data = await resend.emails.send({
      from: `Medi-Link <${fromEmail}>`,
      to: [toEmail],
      subject: 'Bienvenue chez Medi-Link ! Votre cabinet va passer un cap 🚀',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563EB;">Bienvenue Dr ${practitionerName},</h1>
          <p>C’est un plaisir de vous compter parmi nous ! Votre abonnement à Medi-Link est désormais actif pour <strong>9,99 € / mois</strong>.</p>
          <p>Vous avez fait le bon choix pour développer votre cabinet médical et optimiser le suivi de vos patients.</p>
          
          <h3>Voici ce que vous pouvez faire dès maintenant :</h3>
          <ul>
            <li><strong>Créer votre premier questionnaire</strong> : Utilisez notre bibliothèque de modèles pour gagner du temps.</li>
            <li><strong>Booster vos avis Google</strong> : Configurez votre lien de redirection pour récolter les notes 5/5 de vos patients satisfaits.</li>
            <li><strong>Suivre vos statistiques</strong> : Accédez à votre tableau de bord complet pour analyser les retours de vos patients.</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://medilink-kjl7.vercel.app/dashboard" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accéder à mon Espace Praticien</a>
          </div>

          <p>Nous sommes impatients de vous aider à digitaliser votre relation patient. Si vous avez la moindre question, répondez simplement à cet email.</p>
          <p>À très vite,<br/>L’équipe Medi-Link</p>
        </div>
      `
    });

    console.log('Welcome email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}

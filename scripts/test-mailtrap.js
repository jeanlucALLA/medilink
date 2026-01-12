require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
  // 1. Configuration du transporteur (Transporter)
  // Récupération des identifiants depuis le fichier .env
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS
    }
  });

  try {
    // 2. Vérification de la connexion au serveur SMTP
    console.log('🔄 Tentative de connexion au serveur SMTP Mailtrap...');
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie ! Prêt à envoyer des messages.');

    // 3. Envoi du mail
    const info = await transporter.sendMail({
      from: '"Test Script" <test@medilink.local>', // Adresse expéditeur
      to: "test@example.com", // Adresse destinataire (interceptée par Mailtrap)
      subject: "Test de connexion Mailtrap - TopLinkSante 🚀", // Objet
      text: "Ceci est un message de test en texte brut. Si vous voyez ça, le fallback fonctionne.", // Fallback texte brut
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #2563eb;">Connexion Réussie !</h1>
          <p>Votre configuration <strong>Mailtrap</strong> fonctionne parfaitement avec Nodemailer.</p>
          <hr>
          <ul>
            <li>Host: ${process.env.MAILTRAP_HOST}</li>
            <li>Port: ${process.env.MAILTRAP_PORT}</li>
            <li>Timestamp: ${new Date().toISOString()}</li>
          </ul>
          <p style="font-size: 12px; color: #666;">Envoyé depuis le script de test TopLinkSante</p>
        </div>
      `, // Contenu HTML
    });

    console.log("📨 Message envoyé: %s", info.messageId);
    console.log("🔗 URL de prévisualisation: %s", nodemailer.getTestMessageUrl(info));

  } catch (error) {
    console.error("❌ Erreur lors de l'envoi :", error);
  }
}

main().catch(console.error);

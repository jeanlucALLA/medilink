// Système de planification d'envoi d'emails différés
// Stockage en mémoire uniquement

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

interface ScheduledEmail {
  questionnaireId: string
  encryptedEmail: string
  encryptedLink: string
  emailIv: string // IV pour l'email
  linkIv: string // IV pour le lien
  scheduledFor: number
  createdAt: number
}

// Map pour stocker les emails programmés
// Structure: Map<questionnaireId, ScheduledEmail>
export const scheduledEmailsMap = new Map<string, ScheduledEmail>()

// Clé de chiffrement (en production, utiliser une variable d'environnement de 32 bytes)
const getEncryptionKey = (): Buffer => {
  const key = process.env.EMAIL_ENCRYPTION_KEY
  if (key && key.length === 64) {
    // Clé hex de 64 caractères = 32 bytes
    return Buffer.from(key, 'hex')
  }
  // Générer une clé temporaire (en production, toujours utiliser une clé fixe)
  return randomBytes(32)
}

const ENCRYPTION_KEY = getEncryptionKey()
const ALGORITHM = 'aes-256-cbc'

// Chiffrer une donnée
export function encrypt(text: string): { encrypted: string; iv: string } {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return { encrypted, iv: iv.toString('hex') }
}

// Déchiffrer une donnée
export function decrypt(encrypted: string, iv: string): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(iv, 'hex')
  )
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// Programmer un envoi d'email
export function scheduleEmail(
  questionnaireId: string,
  email: string,
  link: string,
  scheduledFor: number
): void {
  // Chiffrer l'email et le lien avec des IV différents
  const encryptedEmailData = encrypt(email)
  const encryptedLinkData = encrypt(link)

  const scheduledEmail: ScheduledEmail = {
    questionnaireId,
    encryptedEmail: encryptedEmailData.encrypted,
    encryptedLink: encryptedLinkData.encrypted,
    emailIv: encryptedEmailData.iv,
    linkIv: encryptedLinkData.iv,
    scheduledFor,
    createdAt: Date.now(),
  }

  scheduledEmailsMap.set(questionnaireId, scheduledEmail)

  // Calculer le délai jusqu'à l'envoi
  const delay = scheduledFor - Date.now()

  if (delay > 0) {
    // Programmer l'envoi
    setTimeout(async () => {
      await sendScheduledEmail(questionnaireId)
    }, delay)
  } else {
    // Si la date est passée, envoyer immédiatement
    sendScheduledEmail(questionnaireId)
  }
}

// Envoyer l'email programmé
async function sendScheduledEmail(questionnaireId: string): Promise<void> {
  const scheduledEmail = scheduledEmailsMap.get(questionnaireId)

  if (!scheduledEmail) {
    return // Déjà supprimé ou annulé
  }

  try {
    // Déchiffrer les données
    const email = decrypt(scheduledEmail.encryptedEmail, scheduledEmail.emailIv)
    const link = decrypt(scheduledEmail.encryptedLink, scheduledEmail.linkIv)

    // Envoyer l'email (simulation ou service réel)
    await sendEmail(email, link, questionnaireId)

    // Supprimer la tâche après envoi
    scheduledEmailsMap.delete(questionnaireId)
    console.log(`[Email-sent] Email envoyé pour questionnaire ${questionnaireId}`)
  } catch (error) {
    console.error(`[Email-error] Erreur lors de l'envoi pour ${questionnaireId}:`, error)
    // En cas d'erreur, supprimer quand même pour éviter les tentatives répétées
    scheduledEmailsMap.delete(questionnaireId)
  }
}

// Fonction d'envoi d'email (à adapter selon le service utilisé)
async function sendEmail(email: string, link: string, questionnaireId: string): Promise<void> {
  // Option 1: Simulation (pour développement)
  if (process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY) {
    console.log(`[Email-simulation] Envoi à ${email}`)
    console.log(`[Email-simulation] Lien: ${link}`)
    return
  }

  // Option 2: Resend (production)
  try {
    const resend = await import('resend')
    const resendClient = new resend.Resend(process.env.RESEND_API_KEY)

    await resendClient.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@medilink.app',
      to: email,
      subject: 'Questionnaire médical - Medi.Link',
      html: `
        <h2>Questionnaire médical</h2>
        <p>Votre praticien vous a envoyé un questionnaire médical.</p>
        <p><a href="${link}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Accéder au questionnaire</a></p>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          Ce lien expirera dans 2 heures. Vos réponses seront supprimées automatiquement après consultation.
        </p>
      `,
    })
  } catch (error) {
    console.error('Erreur Resend:', error)
    throw error
  }
}

// Annuler un envoi programmé
export function cancelScheduledEmail(questionnaireId: string): boolean {
  return scheduledEmailsMap.delete(questionnaireId)
}

// Vérifier si un email est programmé
export function hasScheduledEmail(questionnaireId: string): boolean {
  return scheduledEmailsMap.has(questionnaireId)
}

// Récupérer la date d'envoi programmée (sans déchiffrer les données)
export function getScheduledDate(questionnaireId: string): number | null {
  const scheduled = scheduledEmailsMap.get(questionnaireId)
  return scheduled ? scheduled.scheduledFor : null
}


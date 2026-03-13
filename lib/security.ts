/**
 * Utilitaires de sécurité pour TopLinkSanté
 */

/**
 * Échappe les caractères HTML dangereux pour prévenir les injections XSS
 * dans les templates email et le HTML dynamique.
 */
export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/**
 * Retourne l'URL de base de l'application depuis les variables d'environnement.
 * NE PAS utiliser le header `origin` pour les URLs critiques (Stripe, emails).
 */
export function getBaseUrl(): string {
    return (
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'https://www.toplinksante.com'
    )
}

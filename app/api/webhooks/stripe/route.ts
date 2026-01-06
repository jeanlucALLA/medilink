import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { sendInvoiceEmail } from '@/lib/emails/invoice'
import { Resend } from 'resend'

// Initialiser Supabase Admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
    const body = await req.text()
    const signature = headers().get('Stripe-Signature') as string

    let event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (error: any) {
        console.error('Webhook Error:', error.message)
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
    }

    // Gestion des événements
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as any

            // Récupérer les métadonnées
            const userId = session.metadata?.userId || session.client_reference_id
            const tier = session.metadata?.tier

            if (userId && tier) {
                console.log(`Paiement validé pour ${userId} -> Tier: ${tier}`)

                // Mappage du tier 'pro' vers le rôle interne (ex: 'premium' ou garder 'pro' si la DB supporte)
                // Pour l'instant, on considère que 'pro' donne accès au statut 'premium'
                const dbTier = tier === 'pro' ? 'premium' : tier
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        subscription_tier: dbTier,
                        stripe_customer_id: session.customer,
                        stripe_subscription_id: session.subscription
                    })
                    .eq('id', userId)

                if (error) {
                    console.error('Erreur update Supabase:', error)
                    return new NextResponse('Erreur update database', { status: 500 })
                }

                // --- ENVOI EMAIL DE BIENVENUE (RESEND) ---
                const customerEmail = session.customer_details?.email
                if (customerEmail) {
                    try {
                        const resendApiKey = process.env.RESEND_API_KEY
                        if (resendApiKey) {
                            const resend = new Resend(resendApiKey)

                            const welcomeHtml = `
                                <!DOCTYPE html>
                                <html>
                                <body style="font-family: sans-serif; color: #333; line-height: 1.6;">
                                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                                        <h2 style="color: #2563eb;">Bienvenue sur Medi.Link !</h2>
                                        <p>Bonjour,</p>
                                        <p>Merci pour votre confiance. Votre abonnement <strong>Professionnel Complet</strong> est désormais actif.</p>
                                        
                                        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                            <h3 style="margin-top: 0;">Ce que vous avez débloqué :</h3>
                                            <ul style="padding-left: 20px;">
                                                <li>✅ Questionnaires illimités</li>
                                                <li>✅ Statistiques de satisfaction précises (Score NPS & Average)</li>
                                                <li>✅ Redirection vers Google Avis</li>
                                                <li>✅ Sécurité maximale (Badge Zéro Persistance)</li>
                                            </ul>
                                        </div>

                                        <p>Votre espace est prêt. Vous pouvez dès maintenant configurer vos premiers envois automatiques.</p>
                                        
                                        <div style="text-align: center; margin: 30px 0;">
                                            <a href="https://medi-link-official.vercel.app/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                                Accéder à mon Tableau de Bord
                                            </a>
                                        </div>
                                        
                                        <p style="font-size: 14px; color: #666;">
                                            Une question ? Répondez simplement à cet email, notre équipe support est là pour vous.
                                        </p>
                                    </div>
                                </body>
                                </html>
                            `

                            await resend.emails.send({
                                from: 'Medi.Link <onboarding@resend.dev>', // A modifier avec votre domaine pro si configuré
                                to: [customerEmail],
                                subject: 'Bienvenue sur Medi.Link - Votre compte est actif 🚀',
                                html: welcomeHtml
                            } as any)

                            console.log(`✅ Email de bienvenue envoyé à ${customerEmail}`)
                        } else {
                            console.warn('⚠️ RESEND_API_KEY manquante, email de bienvenue non envoyé.')
                        }
                    } catch (emailError) {
                        console.error('❌ Erreur envoi email bienvenue:', emailError)
                        // On ne bloque pas la réponse car le paiement est validé
                    }
                }
            } else {
                console.warn('Metadata manquantes dans la session Stripe', session.id)
            }
            break

        case 'invoice.payment_succeeded':
            const invoice = event.data.object as any
            const invoicePdf = invoice.invoice_pdf
            const hostedInvoiceUrl = invoice.hosted_invoice_url
            const customerEmail = invoice.customer_email

            // Tenter de retrouver l'user ID via l'email si pas de metadata
            // Les invoices récurrentes n'ont pas forcément les metadonnées de la session initiale facilement accessibles
            // On peut chercher l'user par email
            let invoiceUserId = invoice.subscription_details?.metadata?.userId // Pas standard

            if (!invoiceUserId && customerEmail) {
                // Recherche via email
                const { data: { users } } = await supabase.auth.admin.listUsers()
                const user = users?.find(u => u.email === customerEmail)
                if (user) invoiceUserId = user.id
            }

            // Enregistrer le log avec l'URL hébergée (plus facile à visualiser)
            await supabase.from('logs_paiement').insert({
                user_id: invoiceUserId, // Peut être null si non trouvé
                user_email: customerEmail,
                event_type: 'invoice.payment_succeeded',
                amount_cents: invoice.amount_paid,
                currency: invoice.currency,
                status: invoice.status,
                stripe_event_id: event.id,
                invoice_url: hostedInvoiceUrl || invoicePdf // Préférence pour la version hébergée
            })

            // Envoyer l'email
            if (customerEmail && hostedInvoiceUrl) {
                const planName = invoice.lines?.data[0]?.description || 'Abonnement Medi.Link'
                // Filtrer un peu le nom pour qu'il soit joli
                // Ex: "1 × Medi.Link Premium (at €9.99 / month)" -> "Medi.Link Premium"
                // On garde la description telle quelle pour l'instant ou on nettoie

                await sendInvoiceEmail(customerEmail, hostedInvoiceUrl, planName)
            }

            console.log(`Facture enregistrée et email envoyé pour ${customerEmail}`)
            break

        default:
            console.log(`Type d'événement non géré: ${event.type}`)
    }

    return new NextResponse(null, { status: 200 })
}

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { sendInvoiceEmail } from '@/lib/emails/invoice'

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

                // Mettre à jour le profil Supabase
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        subscription_tier: tier,
                        // On pourrait aussi stocker le customer_id ou subscription_id
                        // stripe_customer_id: session.customer,
                        // stripe_subscription_id: session.subscription
                    })
                    .eq('id', userId)

                if (error) {
                    console.error('Erreur update Supabase:', error)
                    return new NextResponse('Erreur update database', { status: 500 })
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

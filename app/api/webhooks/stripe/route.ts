export const dynamic = 'force-dynamic'

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/email-utils'

export async function POST(req: Request) {
    try {
        // Instanciation à l'intérieur du handler pour éviter les crashs cold-start
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

        if (!supabaseUrl || !supabaseServiceKey || !webhookSecret) {
            console.error('❌ Variables manquantes pour webhook Stripe')
            return new NextResponse('Server configuration error', { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false }
        })

        const body = await req.text()
        const signature = headers().get('stripe-signature')

        if (!signature) {
            return new NextResponse('Signature manquante', { status: 400 })
        }

        let event

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
        } catch (err: any) {
            console.error(`⚠️  Webhook signature verification failed.`, err.message)
            return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
        }

        // Handle the event
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as any
            const userId = session.metadata?.userId
            const tier = session.metadata?.tier

            if (userId && tier) {
                console.log(`✅ Paiement réussi pour user ${userId}, activation tier ${tier}`)

                // Mise à jour du profil utilisateur
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        subscription_tier: tier,
                        stripe_customer_id: session.customer,
                        stripe_subscription_id: session.subscription,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId)

                if (error) {
                    console.error('❌ Erreur update supabase:', error)
                    return new NextResponse('Database Error', { status: 500 })
                }

                // --- ENVOI EMAIL DE BIENVENUE ---
                try {
                    // Récupérer l'email et le nom du praticien en une seule requête optimisée
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('email, nom_complet')
                        .eq('id', userId)
                        .single()

                    if (profile?.email) {
                        const name = profile.nom_complet || 'Docteur'
                        console.log(`📧 Envoi email de bienvenue pour user ${userId}`)
                        await sendWelcomeEmail(profile.email, name)
                    }
                } catch (emailErr) {
                    console.error('⚠️ Avertissement: Echec envoi email bienvenue:', emailErr)
                    // On ne bloque pas le retour 200 à Stripe car le paiement est valide
                }
            }
        }

        // Handle subscription cancellation (via Customer Portal)
        if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object as any
            const customerId = subscription.customer

            console.log(`🚫 Abonnement annulé pour customer ${customerId}`)

            // Désactiver l'abonnement dans la base de données
            const { error } = await supabase
                .from('profiles')
                .update({
                    subscription_tier: 'inactive',
                    stripe_subscription_id: null,
                    updated_at: new Date().toISOString()
                })
                .eq('stripe_customer_id', customerId)

            if (error) {
                console.error('❌ Erreur désactivation abonnement:', error)
                return new NextResponse('Database Error', { status: 500 })
            }

            console.log(`✅ Abonnement désactivé avec succès pour customer ${customerId}`)
        }

        // Handle payment failure — notifier le praticien et downgrade après 3 échecs
        if (event.type === 'invoice.payment_failed') {
            const invoice = event.data.object as any
            const customerId = invoice.customer
            const attemptCount = invoice.attempt_count

            console.warn(`⚠️ Échec paiement pour customer ${customerId} (tentative ${attemptCount})`)

            const { data: profile } = await supabase
                .from('profiles')
                .select('id, email, nom_complet')
                .eq('stripe_customer_id', customerId)
                .single()

            if (profile) {
                // Notifier le praticien
                await supabase.from('notifications').insert({
                    practitioner_id: profile.id,
                    type: 'warning',
                    message: attemptCount >= 3
                        ? 'Votre abonnement a été suspendu après plusieurs échecs de paiement. Mettez à jour vos informations bancaires dans Paramètres.'
                        : `Échec de paiement (tentative ${attemptCount}/3). Veuillez vérifier vos informations bancaires.`,
                    metadata: { attempt_count: attemptCount, customer_id: customerId }
                })

                // Downgrade après 3 tentatives échouées
                if (attemptCount >= 3) {
                    await supabase.from('profiles').update({
                        subscription_tier: 'inactive',
                        updated_at: new Date().toISOString()
                    }).eq('stripe_customer_id', customerId)
                    console.warn(`🚫 Abonnement désactivé pour customer ${customerId} après ${attemptCount} échecs`)
                }
            }
        }

        return NextResponse.json({ received: true })

    } catch (err: any) {
        console.error('Erreur interne webhook:', err)
        return new NextResponse('Erreur interne du serveur', { status: 500 })
    }
}

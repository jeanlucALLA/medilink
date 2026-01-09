export const dynamic = 'force-dynamic'

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
    try {
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
                        stripe_customer_id: session.customer, // On sauvegarde aussi l'ID client si pas déjà fait
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId)

                if (error) {
                    console.error('❌ Erreur update supabase:', error)
                    return new NextResponse('Database Error', { status: 500 })
                }
            }
        }

        return NextResponse.json({ received: true })

    } catch (err: any) {
        console.error('Erreur interne webhook:', err)
        return new NextResponse(`Server Error: ${err.message}`, { status: 500 })
    }
}

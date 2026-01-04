import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
    try {
        const { priceId, tier, userId } = await req.json()
        const origin = req.headers.get('origin') || 'http://localhost:3000'

        if (!priceId) {
            return new NextResponse('Price ID manquante', { status: 400 })
        }

        // 2. Créer la session Stripe
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            billing_address_collection: 'required',
            customer_update: {
                address: 'auto',
                name: 'auto',
            },
            automatic_tax: {
                enabled: true,
            },
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                userId: userId,
                tier: tier,
            },
            success_url: `${origin}/dashboard?payment=success&tier=${tier}`,
            cancel_url: `${origin}/abonnement?payment=cancelled`,
            subscription_data: {
                trial_period_days: 14,
                metadata: {
                    userId: userId,
                    tier: tier
                }
            },
            client_reference_id: userId,
        })

        return NextResponse.json({ sessionId: session.id, url: session.url })

    } catch (error: any) {
        console.error('Erreur Stripe Checkout:', error)
        return new NextResponse(`Erreur interne: ${error.message}`, { status: 500 })
    }
}

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { getBaseUrl } from '@/lib/security'

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return new NextResponse('Configuration serveur incomplète', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
    })
    try {
        // AUDIT FIX CRIT-04: Vérifier l'authentification via token
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new NextResponse('Non autorisé', { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return new NextResponse('Non autorisé', { status: 401 })
        }

        const { priceId, tier } = await req.json()
        const userId = user.id // Source de vérité : le token, pas le body
        const origin = getBaseUrl()

        if (!priceId) {
            return new NextResponse('Price ID manquante', { status: 400 })
        }

        // 1. Récupérer le user profile pour vérifier s'il a déjà un ID Stripe
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id, email')
            .eq('id', userId)
            .single()

        const sessionParams: any = {
            mode: 'subscription',
            payment_method_types: ['card'],
            billing_address_collection: 'required',
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
            success_url: `${origin}/abonnement/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/abonnement?payment=cancelled`,
            subscription_data: {
                metadata: {
                    userId: userId,
                    tier: tier
                }
            },
            client_reference_id: userId,
        }

        // Logique conditionnelle pour le client
        if (profile?.stripe_customer_id) {
            // Utilisateur existant côté Stripe
            sessionParams.customer = profile.stripe_customer_id
            sessionParams.customer_update = {
                address: 'auto',
                name: 'auto',
            }
        } else {
            // Nouvel utilisateur Stripe
            // On pré-remplit l'email pour éviter qu'il ne le ressaisisse
            if (profile?.email) {
                sessionParams.customer_email = profile.email
            }
        }

        // 2. Créer la session Stripe
        const session = await stripe.checkout.sessions.create(sessionParams)

        return NextResponse.json({ sessionId: session.id, url: session.url })

    } catch (error: any) {
        console.error('[Stripe Checkout] Erreur:', error.message)
        return new NextResponse('Erreur lors de la création de la session de paiement', { status: 500 })
    }
}

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialiser Supabase Admin pour pouvoir bypasser la RLS et écrire dans logs_paiement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
    // Sécurité basique : on pourrait vérifier une clé d'API secrète ici si c'était en prod
    // const { secret } = await req.json()
    // if (secret !== process.env.TEST_API_SECRET) return new NextResponse('Unauthorized', { status: 401 })

    try {
        const { email, priceId } = await req.json()

        if (!email) {
            return new NextResponse('Email requis', { status: 400 })
        }

        console.log(`[TEST] Simulation Webhook pour: ${email}`)

        // 1. Récupérer l'ID user via l'email
        // Note: On cherche dans auth.users via l'admin API, ou on suppose qu'il est déjà dans public.profiles si synchronisé
        // Pour être sûr, on requête la table profiles (qui devrait avoir l'email si on l'a ajouté, sinon auth)
        // Mais public.profiles n'a pas forcément l'email selon notre schéma. 
        // Si le schéma profiles a 'email', on l'utilise. Sinon on doit interroger auth.users (admin only).

        // Tentative via profiles d'abord (supposant qu'il y a une colonne email)
        let userId: string | null = null

        // Vérifions si on peut trouver l'user dans profiles (si email présent)
        const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single()

        if (profileByEmail) {
            userId = profileByEmail.id
        } else {
            // Sinon, on requête l'API admin auth (plus lourd mais plus sûr)
            const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers()
            if (!listUsersError && users) {
                const foundUser = users.find(u => u.email === email)
                if (foundUser) userId = foundUser.id
            }
        }

        if (!userId) {
            return new NextResponse(`Utilisateur non trouvé pour l'email: ${email}`, { status: 404 })
        }

        // 2. Déterminer le tier
        let tier = 'discovery'
        // Simulation: "Si le paiement concerne le produit à 9,99€" -> on suppose un priceId fictif ou un montant
        // Simplification pour le script de test : on accepte 'premium' ou 'cabinet' comme paramètre ou on déduit

        // Logique demandée: "Si le paiement concerne le produit à 9,99€, passe... à premium"
        // On va dire que si priceId contient 'premium' ou n'est pas spécifié (défaut test), c'est premium.
        if (!priceId || priceId.includes('premium') || priceId === 'price_999') {
            tier = 'premium'
        } else if (priceId.includes('cabinet')) {
            tier = 'cabinet'
        }

        console.log(`[TEST] Update Tier -> ${tier} pour User ${userId}`)

        // 3. Mise à jour Supabase
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ subscription_tier: tier })
            .eq('id', userId)

        if (updateError) {
            console.error('[TEST] Erreur update:', updateError)
            return new NextResponse(`Erreur lors de la mise à jour: ${updateError.message}`, { status: 500 })
        }

        // 4. Logs de sécurité (Zéro Persistance : on masque les détails sensibles s'il y en avait)
        // Ici on simule, donc pas de vraie donnée bancaire.
        const { error: logError } = await supabase
            .from('logs_paiement')
            .insert({
                user_id: userId,
                user_email: email,
                event_type: 'SIMULATION_customer.subscription.created',
                amount_cents: tier === 'premium' ? 999 : 3999,
                currency: 'eur',
                status: 'succeeded',
                stripe_event_id: 'simulated_evt_' + Date.now()
            })

        if (logError) {
            console.error('[TEST] Erreur logging:', logError)
            // On ne bloque pas la réponse pour un log
        }

        return NextResponse.json({
            success: true,
            message: `Simulation réussie. Utilisateur ${email} passé en ${tier}.`,
            details: {
                userId,
                tier,
                log_created: !logError
            }
        })

    } catch (error: any) {
        console.error('[TEST] Erreur interne:', error)
        return new NextResponse(`Erreur interne: ${error.message}`, { status: 500 })
    }
}

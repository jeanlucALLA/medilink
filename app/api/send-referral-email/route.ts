export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

// MAIL-01: Crash on missing env vars instead of using placeholders
const resendApiKey = process.env.RESEND_API_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!resendApiKey || !supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Variables manquantes pour send-referral-email (RESEND_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)'
  )
}

const resend = new Resend(resendApiKey)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
  try {
    const { referrerId } = await req.json()

    if (!referrerId) {
      return new NextResponse('Referrer ID missing', { status: 400 })
    }

    // 1. Récupérer les infos du parrain (email + code)
    const { data: referrer, error: referrerError } = await supabase
      .from('profiles')
      .select('email, nom_complet, referral_code')
      .eq('id', referrerId)
      .single()

    if (referrerError || !referrer || !referrer.email) {
      console.error('[Referral] Parrain introuvable:', referrerError?.message)
      return new NextResponse('Referrer not found or no email', { status: 404 })
    }

    // 2. Compter le nombre de parrainages (RPC ou count direct)
    let referralCount = 0
    const { data: rpcCount, error: rpcError } = await supabase
      .rpc('get_referral_count', { user_id: referrerId })

    if (!rpcError && typeof rpcCount === 'number') {
      referralCount = rpcCount
    } else {
      // Fallback: comptage manuel
      const { count } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', referrerId)

      referralCount = count || 0
    }

    // 3. Calculer les variables pour le message
    const goal = 5
    const remaining = Math.max(0, goal - referralCount)

    // 4. Envoyer l'email via Resend
    let subject = 'Bonne nouvelle ! Un confrère a rejoint TopLinkSante grâce à vous'
    let progressMessage = ''

    if (referralCount >= goal) {
      progressMessage = `
        <p style="font-size: 16px; color: #166534; font-weight: bold; background-color: #dcfce7; padding: 12px; border-radius: 8px;">
          Félicitations ! Vous avez atteint l'objectif de ${goal} parrainages !
        </p>
        <p style="font-size: 14px; margin-top: 10px;">
          Votre accès aux <strong>Statistiques Avancées à vie</strong> est débloqué. Vous n'avez rien à faire, c'est automatique.
        </p>
      `
    } else {
      progressMessage = `
        <p style="font-size: 16px; color: #1e40af; font-weight: bold; background-color: #dbeafe; padding: 12px; border-radius: 8px;">
          Vous en êtes à <strong>${referralCount} / ${goal}</strong> parrainages.
        </p>
        <p style="font-size: 14px; margin-top: 10px;">
          Plus que <strong>${remaining}</strong> confrère${remaining > 1 ? 's' : ''} pour débloquer votre récompense exclusive !
        </p>
      `
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'TopLinkSante <noreply@mail.toplinksante.com>',
      to: referrer.email,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Bravo ${referrer.nom_complet} !</h1>
          <p style="font-size: 16px; color: #374151;">
            Un nouveau professionnel de santé vient de s'inscrire sur TopLinkSante en utilisant votre code parrain.
          </p>
          
          ${progressMessage}

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

          <p style="font-size: 14px; color: #6b7280;">
            Merci de faire grandir la communauté TopLinkSante.<br/>
            L'équipe TopLinkSante
          </p>
        </div>
      `,
      headers: {
        'List-Unsubscribe': '<mailto:contact@toplinksante.com?subject=Unsubscribe>',
      },
    })

    if (error) {
      console.error('[Referral] Erreur Resend:', error.message)
      return NextResponse.json({ error: 'Erreur lors de l\'envoi' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('[Referral] Erreur interne:', error.message)
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    )
  }
}

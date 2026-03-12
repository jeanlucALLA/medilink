import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET: Récupérer un questionnaire par ID (pour le patient)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json(
        { error: 'ID requis' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    // Utiliser la clé Service Role pour contourner RLS (car le patient n'est pas authentifié)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY manquant server-side')
      // DEBUG: Renvoyer l'erreur exacte au client pour le diagnostic
      return NextResponse.json(
        { error: 'Configuration serveur incomplète: SUPABASE_SERVICE_ROLE_KEY manquant ou invalide sur Vercel' },
        { status: 500 }
      )
    }

    // Client Admin (Bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Récupérer le questionnaire depuis la base de données
    const { data: questionnaire, error } = await supabase
      .from('questionnaires')
      .select('id, pathologie, questions, status, user_id, created_at')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erreur lors de la récupération:', error)
      return NextResponse.json(
        { error: 'Questionnaire non trouvé' },
        { status: 404 }
      )
    }

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire non trouvé' },
        { status: 404 }
      )
    }

    // Normaliser en minuscules pour la comparaison
    const currentStatus = (questionnaire.status || '').toLowerCase()

    // Vérifier si déjà complété
    if (currentStatus === 'complété') {
      return NextResponse.json({
        id: questionnaire.id,
        pathologie: questionnaire.pathologie,
        status: 'Complété',
      })
    }

    // Vérifier expiration du lien (30 jours max)
    if (questionnaire.created_at) {
      const createdAt = new Date(questionnaire.created_at)
      const maxAgeMs = 30 * 24 * 60 * 60 * 1000 // 30 jours
      if (Date.now() - createdAt.getTime() > maxAgeMs) {
        return NextResponse.json(
          { error: 'Ce lien a expiré. Veuillez contacter votre praticien.' },
          { status: 410 }
        )
      }
    }

    // Vérifier que le questionnaire est envoyé ou programmé/en_attente
    // Accepte: 'envoyé', 'programmé', 'en_attente'
    if (currentStatus !== 'envoyé' && currentStatus !== 'programmé' && currentStatus !== 'en_attente') {
      return NextResponse.json(
        { error: 'Questionnaire non disponible' },
        { status: 403 }
      )
    }

    // Retourner uniquement les données nécessaires (sans PII patient)
    const response_data: any = {
      id: questionnaire.id,
      pathologie: questionnaire.pathologie,
      status: currentStatus,
      questions: questionnaire.questions || [],
      google_review_url: null,
    }

    // Récupérer le lien Google Reviews du praticien si disponible
    if (questionnaire.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('google_review_url')
        .eq('id', questionnaire.user_id)
        .single()

      if (profile && profile.google_review_url) {
        response_data.google_review_url = profile.google_review_url
      }
    }

    return NextResponse.json(response_data)
  } catch (error) {
    console.error('Erreur lors de la récupération:', error)
    const errorMessage = error instanceof Error ? error.message : 'Détails inconnus'
    return NextResponse.json(
      { error: `Erreur interne: ${errorMessage}` },
      { status: 500 }
    )
  }
}


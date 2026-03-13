import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API Route: /api/consultation
 * 
 * Gère les consultations actives (notes temporaires) avec stockage Supabase.
 * Les consultations expirent automatiquement après 60 minutes.
 * 
 * CRIT-06 FIX: Remplace le stockage en mémoire (Map + setInterval)
 * qui ne fonctionnait pas sur Vercel serverless.
 * 
 * Nettoyage des expirations :
 * - Passif : chaque GET/POST filtre `expires_at > now()`
 * - Actif  : pg_cron exécute `cleanup_expired_consultations()` toutes les 10 min
 */

// Initialiser le client Supabase (Service Role pour bypass RLS — route serveur uniquement)
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Configuration Supabase manquante')
  }

  return createClient(url, key, {
    auth: { persistSession: false }
  })
}

// Extraire et vérifier le token JWT de l'utilisateur
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = getSupabase()
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) return null
  return user
}

// POST: Créer une consultation
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { patientId, notes } = body

    if (!patientId || !notes) {
      return NextResponse.json(
        { error: 'patientId et notes sont requis' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Insérer dans Supabase — expires_at est calculé par le DEFAULT SQL (now() + 60 min)
    const { data, error } = await supabase
      .from('active_consultations')
      .insert({
        user_id: user.id,
        patient_id: patientId.trim(),
        notes: notes.trim(),
      })
      .select('id, created_at, expires_at')
      .single()

    if (error) {
      console.error('[Consultation POST] Erreur insertion:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: data.id,
      expiresAt: new Date(data.expires_at).getTime(),
      message: 'Consultation créée',
    })
  } catch (error) {
    console.error('[Consultation POST] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création' },
      { status: 500 }
    )
  }
}

// GET: Récupérer une consultation (nettoyage passif : filtre expires_at)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Récupérer uniquement si non expirée ET appartient à l'utilisateur
    const { data, error } = await supabase
      .from('active_consultations')
      .select('id, patient_id, notes, created_at, expires_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Consultation non trouvée ou expirée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: data.id,
      patientId: data.patient_id,
      notes: data.notes,
      createdAt: new Date(data.created_at).getTime(),
      expiresAt: new Date(data.expires_at).getTime(),
    })
  } catch (error) {
    console.error('[Consultation GET] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}

// DELETE: Supprimer une consultation immédiatement
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Supprimer uniquement si appartient à l'utilisateur
    const { data, error } = await supabase
      .from('active_consultations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')

    if (error) {
      console.error('[Consultation DELETE] Erreur:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Consultation non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Consultation supprimée' })
  } catch (error) {
    console.error('[Consultation DELETE] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}

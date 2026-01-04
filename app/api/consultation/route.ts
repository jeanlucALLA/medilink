import { NextRequest, NextResponse } from 'next/server'

// Map en mémoire pour stocker les consultations
// Structure: Map<id, { data: ConsultationData, expiresAt: number }>
const consultationsMap = new Map<string, { data: ConsultationData; expiresAt: number }>()

interface ConsultationData {
  patientId: string
  notes: string
  createdAt: number
}

// Nettoyage automatique des entrées expirées
const cleanupExpired = () => {
  const now = Date.now()
  let deletedCount = 0
  
  for (const [id, entry] of Array.from(consultationsMap.entries())) {
    if (entry.expiresAt <= now) {
      consultationsMap.delete(id)
      deletedCount++
    }
  }
  
  if (deletedCount > 0) {
    // Log anonyme uniquement (pas de données patients)
    console.log(`[Cleanup] ${deletedCount} entrée(s) expirée(s) supprimée(s)`)
  }
}

// Nettoyage toutes les 5 minutes
setInterval(cleanupExpired, 5 * 60 * 1000)

// POST: Créer une consultation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, notes } = body

    if (!patientId || !notes) {
      return NextResponse.json(
        { error: 'patientId et notes sont requis' },
        { status: 400 }
      )
    }

    // Générer un ID unique
    const id = `consult-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()
    const expiresAt = now + 60 * 60 * 1000 // 60 minutes

    const consultationData: ConsultationData = {
      patientId: patientId.trim(),
      notes: notes.trim(),
      createdAt: now,
    }

    // Stocker en mémoire
    consultationsMap.set(id, {
      data: consultationData,
      expiresAt,
    })

    // Programmer la suppression automatique
    setTimeout(() => {
      consultationsMap.delete(id)
      // Log anonyme uniquement
      console.log(`[Auto-delete] Consultation ${id} supprimée automatiquement`)
    }, 60 * 60 * 1000)

    // Nettoyage immédiat des expirées
    cleanupExpired()

    return NextResponse.json({
      id,
      expiresAt,
      message: 'Consultation créée',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la création' },
      { status: 500 }
    )
  }
}

// GET: Récupérer une consultation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID requis' },
        { status: 400 }
      )
    }

    const entry = consultationsMap.get(id)

    if (!entry) {
      return NextResponse.json(
        { error: 'Consultation non trouvée ou expirée' },
        { status: 404 }
      )
    }

    // Vérifier si expirée
    if (entry.expiresAt <= Date.now()) {
      consultationsMap.delete(id)
      return NextResponse.json(
        { error: 'Consultation expirée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id,
      ...entry.data,
      expiresAt: entry.expiresAt,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}

// DELETE: Supprimer une consultation immédiatement
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID requis' },
        { status: 400 }
      )
    }

    const deleted = consultationsMap.delete(id)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Consultation non trouvée' },
        { status: 404 }
      )
    }

    // Log anonyme uniquement
    console.log(`[Manual-delete] Consultation ${id} supprimée manuellement`)

    return NextResponse.json({
      message: 'Consultation supprimée',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}


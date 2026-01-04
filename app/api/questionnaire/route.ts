import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { questionnairesMap, responsesMap } from '@/lib/questionnaire-store'
import { createClient } from '@supabase/supabase-js'

// POST: Créer un questionnaire
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, questions, isScheduled, pathologyId, pathologyName, googleReviewUrl, patientEmail, sendDelayDays, userId } = body

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Titre et questions sont requis' },
        { status: 400 }
      )
    }

    const id = randomUUID()
    const now = Date.now()

    // Si le questionnaire est programmé, il reste en attente jusqu'à l'envoi effectif
    // Sinon, expiration standard de 2 heures
    const expiresAt = isScheduled
      ? now + 14 * 24 * 60 * 60 * 1000 // 14 jours max si programmé (sécurité)
      : now + 2 * 60 * 60 * 1000 // 2 heures par défaut

    const questionnaire = {
      id,
      title: title.trim(),
      questions: questions.filter((q: any) => {
        // Filtrer les questions valides (avec texte et type)
        if (typeof q === 'string') {
          return q.trim().length > 0
        }
        return q && q.question && q.question.trim().length > 0 && q.type
      }),
      pathologyId: pathologyId || undefined,
      pathologyName: pathologyName || undefined,
      googleReviewUrl: googleReviewUrl && googleReviewUrl.trim() ? googleReviewUrl.trim() : undefined,
      createdAt: now,
      expiresAt,
      isScheduled: isScheduled || false,
    }

    questionnairesMap.set(id, questionnaire)

    // Log pour debug : afficher le contenu actuel du store
    console.log('[Debug] Contenu actuel du store:')
    console.log(`[Debug] Nombre de questionnaires dans la Map: ${questionnairesMap.size}`)
    console.log(`[Debug] Questionnaire créé - ID: ${id}, Titre: ${questionnaire.title}`)
    console.log(`[Debug] Tous les IDs dans la Map:`, Array.from(questionnairesMap.keys()))

    // Sauvegarder dans Supabase (Superviseur de Sauvegarde)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseKey) {
        console.error('CRITIQUE: SUPABASE_SERVICE_ROLE_KEY manquant. La sauvegarde base de données va échouer si RLS est actif.')
      }

      const keyToUse = supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && keyToUse) {
        const supabase = createClient(supabaseUrl, keyToUse)

        // 1. Initialisation : Créer le log de sauvegarde 'processing'
        let backupLogId: string | null = null
        try {
          const { data: logData, error: logError } = await supabase
            .from('backups_logs')
            .insert({
              name: `questionnaire_backup_${id}`,
              status: 'processing'
            })
            .select('id')
            .single()

          if (logData) backupLogId = logData.id
          if (logError) console.warn('[Backup Supervisor] Failed to init log:', logError.message)
        } catch (e) {
          console.warn('[Backup Supervisor] Log init error:', e)
        }

        // 2. Exécution : Sauvegarder le questionnaire
        if (userId) {
          try {
            const { error: dbError } = await supabase
              .from('questionnaires')
              .insert({
                id: id,
                user_id: userId,
                pathologie: pathologyName || questionnaire.title,
                questions: questionnaire.questions,
                patient_email: patientEmail || null,
                status: isScheduled ? 'pending' : (patientEmail ? 'envoyé' : 'non programmé'),
                send_after_days: sendDelayDays || null,
              })

            if (dbError) throw dbError

            // 3. Finalisation (Succès)
            if (backupLogId) {
              await supabase
                .from('backups_logs')
                .update({
                  status: 'completed',
                  completed_at: new Date().toISOString()
                })
                .eq('id', backupLogId)
            }
            console.log('[Debug] Questionnaire sauvegardé dans Supabase avec succès et loggué.')

          } catch (execError: any) {
            // 4. Gestion d'Erreur (Échec)
            console.error('[Debug] Erreur sauvegarde Supabase:', execError)
            if (backupLogId) {
              await supabase
                .from('backups_logs')
                .update({
                  status: 'failed',
                  error_message: execError.message || JSON.stringify(execError)
                })
                .eq('id', backupLogId)
            }
          }
        } else {
          console.log('[Debug] Pas de user_id, sauvegarde ignorée.')
        }
      }
    } catch (supabaseError: any) {
      console.error('[Debug] Erreur critique configuration Supabase:', supabaseError.message || supabaseError)
    }

    // Programmer la suppression automatique
    // Pour les questionnaires programmés, le délai est plus long (2h après l'envoi effectif)
    const deleteDelay = isScheduled
      ? 14 * 24 * 60 * 60 * 1000 // 14 jours max
      : 2 * 60 * 60 * 1000 // 2 heures

    setTimeout(() => {
      questionnairesMap.delete(id)
      responsesMap.delete(id)
      console.log(`[Auto-delete] Questionnaire ${id} supprimé automatiquement`)
    }, deleteDelay)

    return NextResponse.json({
      id,
      link: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/survey/${id}`,
      expiresAt,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la création' },
      { status: 500 }
    )
  }
}

// GET: Récupérer tous les questionnaires (pour le dashboard)
export async function GET() {
  try {
    // Log pour debug
    console.log('[Debug GET] Nombre de questionnaires dans la Map:', questionnairesMap.size)
    console.log('[Debug GET] IDs présents:', Array.from(questionnairesMap.keys()))

    const questionnaires = Array.from(questionnairesMap.values()).map((q) => ({
      id: q.id,
      title: q.title,
      questionCount: q.questions.length,
      createdAt: q.createdAt,
      expiresAt: q.expiresAt,
      hasResponse: responsesMap.has(q.id),
      responseViewed: responsesMap.get(q.id)?.viewedAt !== null,
    }))

    // Enrichir avec les données Supabase (is_favorite, pathologie, questions)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Récupérer les questionnaires depuis Supabase pour obtenir is_favorite
        const questionnaireIds = questionnaires.map(q => q.id)
        if (questionnaireIds.length > 0) {
          const { data: supabaseData } = await supabase
            .from('questionnaires')
            .select('id, pathologie, questions, is_favorite')
            .in('id', questionnaireIds)

          if (supabaseData) {
            const supabaseMap = new Map(
              supabaseData.map((q: any) => [q.id, {
                pathologie: q.pathologie,
                questions: q.questions,
                is_favorite: q.is_favorite || false
              }])
            )

            // Enrichir les questionnaires avec les données Supabase
            questionnaires.forEach((q: any) => {
              const supabaseInfo = supabaseMap.get(q.id)
              if (supabaseInfo) {
                q.pathologie = supabaseInfo.pathologie
                q.questions = supabaseInfo.questions
                q.is_favorite = supabaseInfo.is_favorite
              }
            })
          }
        }
      }
    } catch (supabaseError) {
      console.error('[Debug GET] Erreur Supabase (non bloquant):', supabaseError)
      // On continue même si Supabase échoue
    }

    console.log('[Debug GET] Questionnaires retournés:', questionnaires.length)

    const response = NextResponse.json({ questionnaires })
    response.headers.set('X-Debug-Antigravity', 'v1')
    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs';

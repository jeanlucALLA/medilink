import { NextRequest, NextResponse } from 'next/server'

// API Route pour forcer l'envoi immédiat d'un email
// Cette route agit comme un proxy vers l'Edge Function Supabase
// Note: L'authentification est vérifiée par le middleware.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { questionnaireId } = body

    if (!questionnaireId) {
      return NextResponse.json(
        { error: 'questionnaireId est requis' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_KEY

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Configuration serveur incomplète' },
        { status: 500 }
      )
    }

    if (!serviceKey) {
      return NextResponse.json(
        { error: 'Configuration serveur incomplète' },
        { status: 500 }
      )
    }

    // Appeler l'Edge Function Supabase pour forcer l'envoi
    const response = await fetch(`${supabaseUrl}/functions/v1/send-delayed-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ forceSend: questionnaireId }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('[send-email-now] Erreur Edge Function:', response.status)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: response.status }
      )
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Email envoyé avec succès',
      result,
    })
  } catch (error: any) {
    console.error('[send-email-now] Erreur:', error.message)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Send Email Now API is ready (POST only)' })
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}

export const runtime = 'nodejs';

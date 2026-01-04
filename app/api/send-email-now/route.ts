import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// API Route pour forcer l'envoi immédiat d'un email
// Cette route agit comme un proxy vers l'Edge Function Supabase
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
        { error: 'NEXT_PUBLIC_SUPABASE_URL non configurée' },
        { status: 500 }
      )
    }

    if (!serviceKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY ou SERVICE_KEY non configurée' },
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
      console.error('Erreur Edge Function:', errorData)
      return NextResponse.json(
        { error: 'Erreur lors de l\'appel de l\'Edge Function' },
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
    console.error('Erreur lors de l\'envoi immédiat:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'envoi' },
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


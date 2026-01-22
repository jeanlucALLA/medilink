import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const resend = new Resend(process.env.RESEND_API_KEY || 're_123')

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, recipients, subject, message } = body

        if ((!email && !recipients) || !subject || !message) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        // 1. Initialisation Resend sécurisée
        const resendApiKey = process.env.RESEND_API_KEY
        if (!resendApiKey) {
            console.error('RESEND_API_KEY manquante')
            return NextResponse.json({ error: 'Configuration serveur incomplète (Email)' }, { status: 500 })
        }
        const resend = new Resend(resendApiKey)

        // 2. Authentification Robuste (Dual Strategy: Header + Cookie)
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name) { return cookieStore.get(name)?.value },
                    set(name, value, options) { cookieStore.set({ name, value, ...options }) },
                    remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
                },
            }
        )

        // Try Header Auth first (for simulator/client-side calls)
        let user
        const authHeader = req.headers.get('Authorization')
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '')
            const { data: { user: headerUser } } = await supabase.auth.getUser(token)
            user = headerUser
        } else {
            const { data: { user: cookieUser } } = await supabase.auth.getUser()
            user = cookieUser
        }

        if (!user) {
            return new NextResponse(JSON.stringify({ error: 'Non autorisé' }), { status: 401 })
        }

        // 3. Vérification Admin
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

        if (profileError || !profile?.is_admin) {
            return new NextResponse(JSON.stringify({ error: 'Accès interdit: Réservé aux administrateurs' }), { status: 403 })
        }

        // 4. Préparation HTML
        const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; margin-bottom: 24px;">Message de l'équipe TopLinkSante</h2>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
            ${message.replace(/\n/g, '<br/>')}
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            Cet email a été envoyé par un administrateur de TopLinkSante.
          </p>
        </div>
      `

        // 5. Envoi (Bulk ou Single)
        let results
        if (recipients && Array.isArray(recipients) && recipients.length > 0) {
            // Bulk Send using Batch (Max 100 per batch recommended, but Resend handles loop well too)
            // Implementation: Simple loop for now to avoid batch complexity limits (batch is 100 max)
            // Or Batch if < 100. Let's start with single calls loop for safety and feedback, 
            // or use batch if small.

            // NOTE: Resend Batch API requires array of objects.
            const chunks = []
            const chunkSize = 50 // Safe batch size

            for (let i = 0; i < recipients.length; i += chunkSize) {
                const chunk = recipients.slice(i, i + chunkSize);
                const batch = chunk.map((r: string) => ({
                    from: process.env.RESEND_FROM_EMAIL || 'TopLinkSante <noreply@toplinksante.com>',
                    to: r,
                    subject: subject,
                    html: htmlContent
                }))

                // Fire and forget or await? Await to ensure delivery.
                await resend.batch.send(batch)
            }
            results = { count: recipients.length }
        } else {
            // Single Send
            await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'TopLinkSante <noreply@toplinksante.com>',

                to: email,
                subject: subject,
                html: htmlContent,
            })
            results = { count: 1 }
        }

        return NextResponse.json({ success: true, ...results })

    } catch (error: any) {
        console.error('Internal Error:', error)
        return new NextResponse(JSON.stringify({ error: error.message || 'Erreur serveur interne' }), { status: 500 })
    }
}

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
    try {
        const { email, subject, message } = await req.json()

        if (!email || !subject || !message) {
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
        let userSession = null
        let supabaseClient = null

        // A. Essai via Header Authorization
        const authHeader = req.headers.get('Authorization')
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '')
            const { createClient } = await import('@supabase/supabase-js')
            const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            const supabaseHeader = createClient(sbUrl, sbKey, {
                global: { headers: { Authorization: `Bearer ${token}` } }
            })
            const { data: { user }, error } = await supabaseHeader.auth.getUser()
            if (user && !error) {
                userSession = { user }
                supabaseClient = supabaseHeader
            }
        }

        // B. Fallback via Cookies
        if (!userSession) {
            const cookieStore = cookies()
            const supabaseCookie = createServerClient(
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
            const { data: { session } } = await supabaseCookie.auth.getSession()
            if (session) {
                userSession = session
                supabaseClient = supabaseCookie
            }
        }

        if (!userSession || !supabaseClient) {
            return new NextResponse(JSON.stringify({ error: 'Non autorisé. Veuillez vous reconnecter.' }), { status: 401 })
        }

        // 3. Vérification Admin
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('is_admin')
            .eq('id', userSession.user.id)
            .single()

        if (profileError || !profile?.is_admin) {
            return new NextResponse(JSON.stringify({ error: 'Accès interdit: Réservé aux administrateurs' }), { status: 403 })
        }

        // 4. Envoi de l'email via Resend
        const { data, error } = await resend.emails.send({
            from: 'Medi.Link <onboarding@resend.dev>',
            to: email,
            subject: subject,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; margin-bottom: 24px;">Message de l'équipe Medi.Link</h2>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
            ${message.replace(/\n/g, '<br/>')}
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            Cet email a été envoyé par un administrateur de Medi.Link.
          </p>
        </div>
      `,
        })

        if (error) {
            console.error('Resend Error:', error)
            return new NextResponse(JSON.stringify({ error: error.message || 'Erreur provider email', details: error }), { status: 500 })
        }

        return NextResponse.json({ success: true, data })

    } catch (error: any) {
        console.error('Internal Error:', error)
        return new NextResponse(JSON.stringify({ error: error.message || 'Erreur serveur interne' }), { status: 500 })
    }
}

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

        // 1. Vérification Admin sécurisée
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

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

        if (profileError || !profile?.is_admin) {
            return new NextResponse('Forbidden: Admin access required', { status: 403 })
        }

        // 2. Envoi de l'email via Resend
        const { data, error } = await resend.emails.send({
            from: 'Medi.Link <onboarding@resend.dev>', // Ou votre domaine vérifié
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
            return new NextResponse(JSON.stringify({ error }), { status: 500 })
        }

        return NextResponse.json({ success: true, data })

    } catch (error: any) {
        console.error('Internal Error:', error)
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}

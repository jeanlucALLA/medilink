import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options })
                    },
                },
            }
        )

        // Echange le code contre une session
        const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

        if (user) {
            // Vérifier le statut de l'abonnement
            const { data: profile } = await supabase
                .from('profiles')
                .select('subscription_tier')
                .eq('id', user.id)
                .single()

            // Redirection intelligente
            if (profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'cabinet') {
                return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
            } else {
                // Rediriger vers la page d'abonnement si pas encore abonné
                // On ajoute un paramètre pour afficher un message si besoin
                return NextResponse.redirect(`${requestUrl.origin}/abonnement?verified=true`)
            }
        }
    }

    // Fallback si pas de code ou erreur
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}

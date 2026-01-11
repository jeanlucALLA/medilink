import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js' // Use direct supabase-js for Service Role
import { createServerClient } from '@supabase/ssr' // For auth check
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'


// Admin Client to access auth.users
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function GET(req: Request) {
    try {
        // 1. Authentification & Auth Check (Client context)
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

        // 2. Vérification Admin
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

        if (profileError || !profile?.is_admin) {
            return new NextResponse(JSON.stringify({ error: 'Accès interdit' }), { status: 403 })
        }

        // 3. Fetch Data (Server-Side Join basically)
        console.log('[Admin Users] Starting fetch...')

        // A. Get Profiles
        const { data: profiles, error: dbError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (dbError) {
            console.error('[Admin Users] DB Error:', dbError)
            throw dbError
        }

        console.log(`[Admin Users] Profiles fetched: ${profiles?.length ?? 0}`)

        // B. Get Users (Auth)
        const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers({
            perPage: 1000
        })

        if (authError) {
            console.error('[Admin Users] Auth Error:', authError)
            throw authError
        }

        console.log(`[Admin Users] Auth Users fetched: ${authUsers?.length ?? 0}`)

        // C. Merge (Auth-First Strategy to reveal users without confirmed profiles)
        const mergedUsers = authUsers.map(u => {
            const p = profiles?.find(prof => prof.id === u.id)

            // Si pas de profil, on en crée un temporaire pour l'affichage
            return {
                id: u.id,
                email: u.email,
                created_at: u.created_at, // Use Auth creation date by default
                nom_complet: p?.nom_complet || u.email?.split('@')[0] || 'Utilisateur',
                cabinet: p?.cabinet || 'Non renseigné',
                ville: p?.city || p?.ville || '',
                specialite: p?.specialty || p?.specialite || 'Inconnu',
                subscription_tier: p?.subscription_tier || 'discovery', // Default to discovery if missing
                satisfaction_score: p?.satisfaction_score || 0,
                is_profile_missing: !p // Flag for UI if needed
            }
        })

        // Sort by most recent signup
        mergedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        console.log(`[Admin Users] Final Merged Count (Auth-based): ${mergedUsers.length}`)

        return NextResponse.json({ users: mergedUsers })

    } catch (error: any) {
        console.error('Admin API Error:', error)
        return new NextResponse(JSON.stringify({ error: error.message || 'Server Error' }), { status: 500 })
    }
}

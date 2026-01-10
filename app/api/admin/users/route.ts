import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js' // Use direct supabase-js for Service Role
import { createServerClient } from '@supabase/ssr' // For auth check
import { cookies } from 'next/headers'

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
        // A. Get Profiles
        const { data: profiles, error: dbError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (dbError) throw dbError

        // B. Get Users (Auth) - List Users (Requires Service Role)
        // Limitation: listUsers pages. Default 50. We need all.
        // For now, let's fetch first 1000? page 1, 1000 per page?
        // Note: listUsers is deprecated somewhat in favor of managing users via DB if possible, but for admin lists we need it.
        const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers({
            perPage: 1000
        })

        if (authError) throw authError

        // C. Merge
        const mergedUsers = profiles.map(p => {
            const u = authUsers.find(a => a.id === p.id)
            return {
                ...p,
                email: u?.email || null, // Inject Email
            }
        })

        return NextResponse.json({ users: mergedUsers })

    } catch (error: any) {
        console.error('Admin API Error:', error)
        return new NextResponse(JSON.stringify({ error: error.message || 'Server Error' }), { status: 500 })
    }
}

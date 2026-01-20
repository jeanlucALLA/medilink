import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// Admin Client with Service Role for auth.admin operations
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

export async function DELETE(req: Request) {
    try {
        // 1. Parse request body
        const { userId } = await req.json()

        if (!userId) {
            return new NextResponse(
                JSON.stringify({ error: 'ID utilisateur requis' }),
                { status: 400 }
            )
        }

        // 2. Authentication & Admin Check
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

        // Try Header Auth first (for client-side calls)
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
            return new NextResponse(
                JSON.stringify({ error: 'Non autorisé' }),
                { status: 401 }
            )
        }

        // 3. Verify Admin Status
        const { data: adminProfile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

        if (profileError || !adminProfile?.is_admin) {
            console.warn(`[Delete User] Non-admin attempt by user ${user.id}`)
            return new NextResponse(
                JSON.stringify({ error: 'Accès interdit - Droits administrateur requis' }),
                { status: 403 }
            )
        }

        // 4. Prevent self-deletion
        if (userId === user.id) {
            return new NextResponse(
                JSON.stringify({ error: 'Vous ne pouvez pas supprimer votre propre compte' }),
                { status: 400 }
            )
        }

        // 5. Get user info for logging
        const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId)
        const targetEmail = targetUser?.user?.email || 'inconnu'

        console.log(`[Delete User] Admin ${user.id} deleting user ${userId} (${targetEmail})`)

        // 6. Delete profile first (cascade will handle related data)
        const { error: profileDeleteError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (profileDeleteError) {
            console.error('[Delete User] Profile delete error:', profileDeleteError)
            // Continue anyway - profile might not exist but auth user does
        }

        // 7. Delete auth user (this is the definitive deletion)
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (authDeleteError) {
            console.error('[Delete User] Auth delete error:', authDeleteError)
            return new NextResponse(
                JSON.stringify({
                    error: 'Erreur lors de la suppression du compte',
                    details: authDeleteError.message
                }),
                { status: 500 }
            )
        }

        console.log(`[Delete User] Successfully deleted user ${userId} (${targetEmail})`)

        return NextResponse.json({
            success: true,
            message: `Compte ${targetEmail} supprimé avec succès`,
            deletedUserId: userId
        })

    } catch (error: any) {
        console.error('[Delete User] Server Error:', error)
        return new NextResponse(
            JSON.stringify({ error: error.message || 'Erreur serveur' }),
            { status: 500 }
        )
    }
}

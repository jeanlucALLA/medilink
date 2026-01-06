import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
    try {
        // 1. Validate Auth Token
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new NextResponse('Missing Authorization Header', { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')

        // Initialize Supabase Client (Anon is sufficient to verify token)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            console.error('Auth Error:', authError)
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // 2. Get Customer ID (Use Service Role to ensure we can read the profile field securely)
        const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

        if (profileError || !profile?.stripe_customer_id) {
            console.error('No Stripe Customer ID found for user:', user.id)
            return NextResponse.json(
                { error: 'No subscription found' },
                { status: 404 }
            )
        }

        // 3. Create Portal Session
        const returnUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: `${returnUrl}/dashboard/settings`,
        })

        return NextResponse.json({ url: portalSession.url })

    } catch (error: any) {
        console.error('Error creating portal session:', error)
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}

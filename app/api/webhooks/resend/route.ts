import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Resend Webhook Event Types
type ResendEventType =
    | 'email.sent'
    | 'email.delivered'
    | 'email.opened'
    | 'email.clicked'
    | 'email.bounced'
    | 'email.complained'
    | 'email.delivery_delayed'

interface ResendWebhookPayload {
    type: ResendEventType
    created_at: string
    data: {
        email_id: string
        to: string[]
        from: string
        subject?: string
        bounce?: {
            message: string
            type: string
        }
        click?: {
            link: string
        }
    }
}

// Hash email for privacy
function hashEmail(email: string): string {
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex')
}

// Map Resend event type to our simplified type
function mapEventType(resendType: ResendEventType): string {
    return resendType.replace('email.', '')
}

export async function POST(request: Request) {
    try {
        // 1. Verify the webhook (Resend uses SVix for signing)
        const svixId = request.headers.get('svix-id')
        const svixTimestamp = request.headers.get('svix-timestamp')
        const svixSignature = request.headers.get('svix-signature')

        // Note: For production, verify the signature with Resend's webhook secret
        // For now, we check basic headers existence
        if (!svixId || !svixTimestamp) {
            console.warn('[Resend Webhook] Missing SVix headers')
            return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
        }

        // 2. Parse payload
        const payload: ResendWebhookPayload = await request.json()

        if (!payload.type || !payload.data?.email_id) {
            console.error('[Resend Webhook] Invalid payload:', payload)
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        console.log(`[Resend Webhook] Event: ${payload.type} for email ${payload.data.email_id}`)

        // 3. Connect to Supabase with service role (to bypass RLS for insert)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('[Resend Webhook] Missing Supabase env vars')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false }
        })

        // 4. Find the questionnaire linked to this email
        const { data: questionnaire } = await supabase
            .from('questionnaires')
            .select('id, user_id')
            .eq('resend_email_id', payload.data.email_id)
            .single()

        // 5. Prepare event data
        const eventData: Record<string, any> = {}

        if (payload.data.bounce) {
            eventData.bounce_message = payload.data.bounce.message
            eventData.bounce_type = payload.data.bounce.type
        }

        if (payload.data.click) {
            eventData.clicked_link = payload.data.click.link
        }

        // 6. Insert tracking record
        const recipientEmail = payload.data.to?.[0]

        const { error: insertError } = await supabase
            .from('email_tracking')
            .insert({
                resend_email_id: payload.data.email_id,
                questionnaire_id: questionnaire?.id || null,
                user_id: questionnaire?.user_id || null,
                recipient_email_hash: recipientEmail ? hashEmail(recipientEmail) : null,
                event_type: mapEventType(payload.type),
                event_data: eventData,
                created_at: payload.created_at
            })

        if (insertError) {
            console.error('[Resend Webhook] Insert error:', insertError)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        // 7. Special handling for bounces - could trigger alerts
        if (payload.type === 'email.bounced' || payload.type === 'email.complained') {
            console.warn(`[Resend Webhook] ALERT: Email ${payload.data.email_id} ${payload.type}`)
            // TODO: Could send notification to admin or practitioner
        }

        return NextResponse.json({
            received: true,
            event: payload.type,
            email_id: payload.data.email_id
        })

    } catch (error: any) {
        console.error('[Resend Webhook] Unhandled error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Reject other methods
export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { escapeHtml } from '@/lib/security'

// API pour recevoir les demandes de démo (utilisateurs non-connectés)
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, email, phone, specialty, message } = body

        // Validation
        if (!name || !email || !specialty) {
            return NextResponse.json(
                { error: 'Nom, email et spécialité sont requis' },
                { status: 400 }
            )
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Email invalide' },
                { status: 400 }
            )
        }

        // Supabase avec service role pour bypass RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase credentials')
            return NextResponse.json(
                { error: 'Configuration serveur manquante' },
                { status: 500 }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Construire le message formaté
        const formattedMessage = `
📋 DEMANDE DE DÉMONSTRATION

👤 Nom: ${name}
📧 Email: ${email}
📱 Téléphone: ${phone || 'Non renseigné'}
🏥 Spécialité: ${specialty}

💬 Message:
${message || 'Aucun message supplémentaire'}
    `.trim()

        // Insérer dans support_messages
        // Note: On utilise un user_id générique pour les demandes anonymes
        // On va d'abord chercher s'il existe un profil "demo-requests" ou utiliser null

        // Alternative: Créer une entrée dans les notifications admin directement
        const { data, error } = await supabase
            .from('admin_notifications')
            .insert({
                type: 'demo_request',
                title: `Demande de démo - ${name}`,
                message: formattedMessage,
                metadata: {
                    name,
                    email,
                    phone,
                    specialty,
                    original_message: message,
                    source: 'contact-demo-page'
                },
                is_read: false
            })
            .select()
            .single()

        if (error) {
            // Si admin_notifications n'existe pas, on log l'erreur
            console.error('Erreur insertion notification:', error)
        }

        // TOUJOURS envoyer un email à l'admin pour être informé immédiatement
        if (process.env.RESEND_API_KEY) {
            try {
                const { Resend } = await import('resend')
                const resend = new Resend(process.env.RESEND_API_KEY)

                // Email vers l'administrateur - fallback sur Yahoo pour garantir réception
                const adminEmail = process.env.ADMIN_EMAIL || 'jeanlucallaa@yahoo.fr'
                console.log(`📧 Tentative d'envoi email à: ${adminEmail}`)

                const emailResult = await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || 'TopLinkSante <noreply@toplinksante.com>',
                    to: adminEmail,
                    subject: `🎯 Nouvelle demande de démo - ${name}`,
                    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0052FF;">Nouvelle demande de démonstration</h2>
              <hr style="border: 1px solid #eee;">
              <p><strong>Nom:</strong> ${escapeHtml(name)}</p>
              <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
              <p><strong>Téléphone:</strong> ${escapeHtml(phone || 'Non renseigné')}</p>
              <p><strong>Spécialité:</strong> ${escapeHtml(specialty)}</p>
              <hr style="border: 1px solid #eee;">
              <p><strong>Message:</strong></p>
              <p style="background: #f5f5f5; padding: 15px; border-radius: 8px;">${escapeHtml(message || 'Aucun message')}</p>
              <hr style="border: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                Reçu le ${new Date().toLocaleString('fr-FR')} via toplinksante.com/contact-demo
              </p>
            </div>
          `
                })
                console.log(`✅ Email de notification envoyé à ${adminEmail}`, emailResult)
            } catch (emailError) {
                console.error('Erreur envoi email admin:', emailError)
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Demande de démo enregistrée'
        })

    } catch (error: any) {
        console.error('Erreur API demo-request:', error)
        return NextResponse.json(
            { error: 'Erreur interne du serveur' },
            { status: 500 }
        )
    }
}

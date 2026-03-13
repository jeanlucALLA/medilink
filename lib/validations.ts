import { z } from 'zod'

/**
 * Schémas de validation Zod centralisés pour toutes les routes API.
 * WARN-02 FIX: Remplace la validation manuelle dispersée.
 */

// ============================================================
// Helpers
// ============================================================

/** Parse un body avec un schéma Zod et retourne le résultat ou les erreurs formatées */
export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: true; data: T
} | {
    success: false; errors: { field: string; message: string }[]
} {
    const result = schema.safeParse(data)

    if (result.success) {
        return { success: true, data: result.data }
    }

    const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
    }))

    return { success: false, errors }
}

// ============================================================
// Schémas — Questionnaire
// ============================================================

/** POST /api/questionnaire/[id]/submit */
export const QuestionnaireSubmitSchema = z.object({
    answers: z.array(
        z.number().min(1, 'Score minimum : 1').max(5, 'Score maximum : 5')
    ).min(1, 'Au moins une réponse est requise'),
    comment: z.string().max(500, 'Le commentaire ne doit pas dépasser 500 caractères').optional(),
})

export type QuestionnaireSubmitInput = z.infer<typeof QuestionnaireSubmitSchema>

// ============================================================
// Schémas — Demo Request
// ============================================================

/** POST /api/demo-request */
export const DemoRequestSchema = z.object({
    name: z.string().min(2, 'Le nom est requis').max(100).trim(),
    email: z.string().email('Email invalide').max(254).trim().toLowerCase(),
    phone: z.string().max(20).trim().optional().or(z.literal('')),
    specialty: z.string().min(2, 'La spécialité est requise').max(100).trim(),
    message: z.string().max(1000, 'Le message ne doit pas dépasser 1000 caractères').trim().optional().or(z.literal('')),
})

export type DemoRequestInput = z.infer<typeof DemoRequestSchema>

// ============================================================
// Schémas — Stripe Checkout
// ============================================================

/** POST /api/stripe/checkout */
export const StripeCheckoutSchema = z.object({
    priceId: z.string().min(1, 'Price ID requis').startsWith('price_', 'Price ID invalide'),
    tier: z.enum(['pro', 'cabinet'], { message: 'Tier invalide (pro ou cabinet)' }),
})

export type StripeCheckoutInput = z.infer<typeof StripeCheckoutSchema>

// ============================================================
// Schémas — Send Email Now
// ============================================================

/** POST /api/send-email-now */
export const SendEmailNowSchema = z.object({
    questionnaireId: z.string().uuid('ID de questionnaire invalide'),
})

export type SendEmailNowInput = z.infer<typeof SendEmailNowSchema>

// ============================================================
// Schémas — Cancel Reminder
// ============================================================

/** POST /api/cancel-reminder */
export const CancelReminderSchema = z.object({
    questionnaireId: z.string().uuid('ID de questionnaire invalide'),
})

export type CancelReminderInput = z.infer<typeof CancelReminderSchema>

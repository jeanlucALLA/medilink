import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
        'STRIPE_SECRET_KEY manquante. Vérifiez vos variables d\'environnement.'
    )
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
    appInfo: {
        name: 'TopLinkSante',
        version: '0.1.0',
    },
    typescript: true,
})

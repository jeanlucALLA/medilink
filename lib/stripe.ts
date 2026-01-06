import Stripe from 'stripe';

// Fallback to a mock key during build if variable is missing
// The key is required for runtime but not for build-time static analysis of imports
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16' as any,
    appInfo: {
        name: 'Medi.Link',
        version: '0.1.0'
    },
    typescript: true,
});



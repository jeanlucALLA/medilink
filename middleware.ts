import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes publiques (pas de vérification d'auth)
const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/register',
    '/about',
    '/cgu',
    '/confidentialite',
    '/mentions-legales',
    '/contact-demo',
    '/abonnement',
    '/survey',
    '/q',
    '/consultation',
]

// Routes API publiques (webhooks, survey submission, etc.)
const PUBLIC_API_ROUTES = [
    '/api/webhooks',
    '/api/survey',
    '/api/hello',
    '/api/test',
    '/api/consultation',
    '/api/demo-request',
    '/api/responses',
]

function isPublicRoute(pathname: string): boolean {
    // Exact match or starts with
    return PUBLIC_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(route + '/')
    )
}

function isPublicApiRoute(pathname: string): boolean {
    return PUBLIC_API_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(route + '/')
    )
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Skip static assets and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/icon') ||
        pathname.includes('.') // Static files (.css, .js, .svg, etc.)
    ) {
        return NextResponse.next()
    }

    // Allow public routes
    if (isPublicRoute(pathname)) {
        return NextResponse.next()
    }

    // Allow public API routes (webhooks, survey, etc.)
    if (isPublicApiRoute(pathname)) {
        return NextResponse.next()
    }

    // For protected routes (/dashboard/*, /api/*), verify auth
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) =>
                            request.cookies.set(name, value)
                        )
                        response = NextResponse.next({
                            request,
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        const {
            data: { user },
        } = await supabase.auth.getUser()

        // For dashboard routes: redirect to login if not authenticated
        if (pathname.startsWith('/dashboard') && !user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // For protected API routes: return 401 if not authenticated
        if (pathname.startsWith('/api/') && !isPublicApiRoute(pathname) && !user) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            )
        }
    } catch (e) {
        // If Supabase auth fails, redirect to login for pages or 401 for API
        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Erreur d\'authentification' },
                { status: 401 }
            )
        }
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that don't require authentication
const publicRoutes = ['/', '/auth/signin', '/auth/register', '/auth/error']

// Routes that are only accessible to specific roles
const roleBasedRoutes = {
	admin: ['/admin'],
}

export async function middleware(request: NextRequest) {
	const token = await getToken({ req: request })
	const { pathname } = request.nextUrl

	// Allow access to public routes
	if (
		publicRoutes.some(
			(route) => pathname === route || pathname.startsWith(`${route}/`)
		)
	) {
		return NextResponse.next()
	}

	// Check authentication for protected routes
	if (!token) {
		// Redirect to login if not authenticated
		const url = new URL('/auth/signin', request.url)
		url.searchParams.set('callbackUrl', encodeURI(pathname))
		return NextResponse.redirect(url)
	}

	// Check for role-based authorization
	const userRole = (token.role as string) || 'USER'

	// Check if the route is admin-only
	if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
		// Redirect to home page if not authorized
		return NextResponse.redirect(new URL('/', request.url))
	}

	// Continue if authenticated and authorized
	return NextResponse.next()
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico).*)',
	],
}

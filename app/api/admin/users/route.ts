import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/auth'

export async function GET(request: NextRequest) {
	try {
		// Get the authenticated user's session
		const session = await getServerSession(authOptions)

		// Check if the user is authenticated and is an admin
		if (!session?.user || session.user.role !== 'ADMIN') {
			return NextResponse.json(
				{ error: 'Unauthorized - Admin access required' },
				{ status: 403 }
			)
		}

		// Fetch all users
		const users = await prisma.user.findMany({
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				createdAt: true,
				// Exclude sensitive information like password
			},
			orderBy: { createdAt: 'desc' },
		})

		return NextResponse.json(users)
	} catch (error) {
		console.error('Error fetching users:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch users' },
			{ status: 500 }
		)
	}
}

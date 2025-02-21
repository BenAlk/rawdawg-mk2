import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authOptions } from '../auth/[...nextauth]/auth'

// Schema for validating dog creation/update
const dogSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	weight: z
		.string()
		.or(z.number())
		.pipe(z.coerce.number().positive('Weight must be positive')),
	age: z
		.string()
		.or(z.number())
		.pipe(z.coerce.number().positive('Age must be positive')),
	activityLevel: z.string().min(1, 'Activity level is required'),
	portionSize: z
		.string()
		.or(z.number())
		.pipe(z.coerce.number().positive('Portion size must be positive')),
})

export async function GET(request: NextRequest) {
	try {
		// Get the authenticated user's session
		const session = await getServerSession(authOptions)

		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Only return the dogs owned by the current user
		const dogs = await prisma.dog.findMany({
			where: {
				userId: session.user.id,
			},
			orderBy: { name: 'asc' },
		})

		return NextResponse.json(dogs)
	} catch (error) {
		console.error('Error fetching dogs:', error)
		return NextResponse.json({ error: 'Failed to fetch dogs' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		// Get the authenticated user's session
		const session = await getServerSession(authOptions)

		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()

		// Validate request body
		const validatedData = dogSchema.parse(body)

		// Create the dog with the user ID
		const newDog = await prisma.dog.create({
			data: {
				...validatedData,
				userId: session.user.id, // Associate with the current user
			},
		})

		return NextResponse.json(newDog, { status: 201 })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.errors },
				{ status: 400 }
			)
		}

		console.error('Error creating dog:', error)
		return NextResponse.json({ error: 'Failed to create dog' }, { status: 500 })
	}
}

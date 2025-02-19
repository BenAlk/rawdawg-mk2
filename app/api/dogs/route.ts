import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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
		const dogs = await prisma.dog.findMany({
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
		const body = await request.json()

		// Validate request body
		const validatedData = dogSchema.parse(body)

		const newDog = await prisma.dog.create({
			data: validatedData,
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

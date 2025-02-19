import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for dog updates
const dogUpdateSchema = z.object({
	name: z.string().min(1, 'Name is required').optional(),
	weight: z
		.string()
		.or(z.number())
		.pipe(z.coerce.number().positive('Weight must be positive'))
		.optional(),
	age: z
		.string()
		.or(z.number())
		.pipe(z.coerce.number().positive('Age must be positive'))
		.optional(),
	activityLevel: z.string().min(1, 'Activity level is required').optional(),
	portionSize: z
		.string()
		.or(z.number())
		.pipe(z.coerce.number().positive('Portion size must be positive'))
		.optional(),
})

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params

		const dog = await prisma.dog.findUnique({
			where: { id },
			include: {
				mealPlans: true,
			},
		})

		if (!dog) {
			return NextResponse.json({ error: 'Dog not found' }, { status: 404 })
		}

		return NextResponse.json(dog)
	} catch (error) {
		console.error(`Error fetching dog ${params.id}:`, error)
		return NextResponse.json({ error: 'Failed to fetch dog' }, { status: 500 })
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params
		const body = await request.json()

		// Validate request body
		const validatedData = dogUpdateSchema.parse(body)

		// Check if dog exists
		const existingDog = await prisma.dog.findUnique({
			where: { id },
		})

		if (!existingDog) {
			return NextResponse.json({ error: 'Dog not found' }, { status: 404 })
		}

		// Update the dog
		const updatedDog = await prisma.dog.update({
			where: { id },
			data: validatedData,
		})

		return NextResponse.json(updatedDog)
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.errors },
				{ status: 400 }
			)
		}

		console.error(`Error updating dog ${params.id}:`, error)
		return NextResponse.json({ error: 'Failed to update dog' }, { status: 500 })
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params

		// Check if dog exists
		const existingDog = await prisma.dog.findUnique({
			where: { id },
		})

		if (!existingDog) {
			return NextResponse.json({ error: 'Dog not found' }, { status: 404 })
		}

		// Check if dog has meal plans
		const dogMealPlans = await prisma.mealPlan.findMany({
			where: { dogId: id },
		})

		if (dogMealPlans.length > 0) {
			// Option 1: Prevent deletion if dog has meal plans
			return NextResponse.json(
				{ error: 'Cannot delete dog with associated meal plans' },
				{ status: 400 }
			)

			// Option 2: Alternatively, you could cascade delete or update meal plans
			// await prisma.mealPlan.updateMany({
			//   where: { dogId: id },
			//   data: { dogId: null },
			// });
		}

		// Delete the dog
		await prisma.dog.delete({
			where: { id },
		})

		return NextResponse.json({ success: true }, { status: 200 })
	} catch (error) {
		console.error(`Error deleting dog ${params.id}:`, error)
		return NextResponse.json({ error: 'Failed to delete dog' }, { status: 500 })
	}
}

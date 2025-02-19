import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Reuse the same schema for validation with the same fixes
const foodItemUpdateSchema = z.object({
	brand: z.string().min(1, 'Brand is required').optional(),
	type: z.string().min(1, 'Type is required').optional(),
	weight: z
		.string()
		.or(z.number())
		.pipe(z.coerce.number().positive('Weight must be positive'))
		.optional(),
	cost: z
		.string()
		.or(z.number())
		.pipe(z.coerce.number().positive('Cost must be positive'))
		.optional(),
	description: z.string().optional().nullable().or(z.literal('')),
	imageUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
	isActive: z.boolean().optional(),
	protein: z
		.union([
			z.string().or(z.number()).pipe(z.coerce.number().positive()),
			z.literal(''),
			z.null(),
		])
		.optional(),
	fat: z
		.union([
			z.string().or(z.number()).pipe(z.coerce.number().positive()),
			z.literal(''),
			z.null(),
		])
		.optional(),
	fiber: z
		.union([
			z.string().or(z.number()).pipe(z.coerce.number().positive()),
			z.literal(''),
			z.null(),
		])
		.optional(),
})

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params

		const item = await prisma.foodItem.findUnique({
			where: { id },
		})

		if (!item) {
			return NextResponse.json(
				{ error: 'Food item not found' },
				{ status: 404 }
			)
		}

		return NextResponse.json(item)
	} catch (error) {
		console.error(`Error fetching food item ${params.id}:`, error)
		return NextResponse.json(
			{ error: 'Failed to fetch food item' },
			{ status: 500 }
		)
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
		const validatedData = foodItemUpdateSchema.parse(body)

		// Clean up empty string values to be null for database storage
		const cleanedData = {
			...validatedData,
			description:
				validatedData.description === '' ? null : validatedData.description,
			imageUrl: validatedData.imageUrl === '' ? null : validatedData.imageUrl,
			protein: validatedData.protein === '' ? null : validatedData.protein,
			fat: validatedData.fat === '' ? null : validatedData.fat,
			fiber: validatedData.fiber === '' ? null : validatedData.fiber,
		}

		// Check if item exists
		const existingItem = await prisma.foodItem.findUnique({
			where: { id },
		})

		if (!existingItem) {
			return NextResponse.json(
				{ error: 'Food item not found' },
				{ status: 404 }
			)
		}

		// Update the item
		const updatedItem = await prisma.foodItem.update({
			where: { id },
			data: cleanedData,
		})

		return NextResponse.json(updatedItem)
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.errors },
				{ status: 400 }
			)
		}

		console.error(`Error updating food item ${params.id}:`, error)
		return NextResponse.json(
			{ error: 'Failed to update food item' },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params

		// Check if item exists
		const existingItem = await prisma.foodItem.findUnique({
			where: { id },
		})

		if (!existingItem) {
			return NextResponse.json(
				{ error: 'Food item not found' },
				{ status: 404 }
			)
		}

		// Delete the item
		await prisma.foodItem.delete({
			where: { id },
		})

		return NextResponse.json({ success: true }, { status: 200 })
	} catch (error) {
		console.error(`Error deleting food item ${params.id}:`, error)
		return NextResponse.json(
			{ error: 'Failed to delete food item' },
			{ status: 500 }
		)
	}
}

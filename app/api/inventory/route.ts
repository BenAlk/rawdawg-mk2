import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for validating food item creation/update
const foodItemSchema = z.object({
	brand: z.string().min(1, 'Brand is required'),
	type: z.string().min(1, 'Type is required'),
	weight: z
		.string()
		.or(z.number())
		.pipe(z.coerce.number().positive('Weight must be positive')),
	cost: z
		.string()
		.or(z.number())
		.pipe(z.coerce.number().positive('Cost must be positive')),
	description: z.string().optional().nullable().or(z.literal('')),
	imageUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
	isActive: z.boolean().default(true),
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

export async function GET(request: NextRequest) {
	try {
		// Parse query parameters
		const searchParams = request.nextUrl.searchParams
		const active = searchParams.get('active')

		const where: any = {}

		// Filter by active status if specified, but not when "all" is requested
		if (active === 'true') {
			where.isActive = true
		} else if (active === 'false') {
			where.isActive = false
		}
		// When active === 'all' or null/undefined, no filter is applied

		console.log('Inventory query:', { where }) // Add logging

		const items = await prisma.foodItem.findMany({
			where,
			orderBy: { createdAt: 'desc' },
		})

		console.log(`Found ${items.length} inventory items`) // Add logging

		return NextResponse.json(items)
	} catch (error) {
		console.error('Error fetching inventory items:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch inventory items' },
			{ status: 500 }
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()

		// Validate request body
		const validatedData = foodItemSchema.parse(body)

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

		const newItem = await prisma.foodItem.create({
			data: cleanedData,
		})

		return NextResponse.json(newItem, { status: 201 })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.errors },
				{ status: 400 }
			)
		}

		console.error('Error creating inventory item:', error)
		return NextResponse.json(
			{ error: 'Failed to create inventory item' },
			{ status: 500 }
		)
	}
}

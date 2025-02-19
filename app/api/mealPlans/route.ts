import { prisma } from '@/lib/prisma'
import { Decimal } from 'decimal.js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for validating meal plan items
const mealPlanItemSchema = z.object({
	foodItemId: z.string(),
	quantityPerMeal: z
		.string()
		.or(z.number())
		.pipe(z.coerce.number().positive('Quantity per meal must be positive')),
	totalQuantity: z
		.string()
		.or(z.number())
		.pipe(z.coerce.number().positive('Total quantity must be positive')),
})

// Schema for validating meal plan creation
const mealPlanSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	startDate: z
		.string()
		.optional()
		.nullable()
		.transform((val) => (val ? new Date(val) : null)),
	endDate: z
		.string()
		.optional()
		.nullable()
		.transform((val) => (val ? new Date(val) : null)),
	durationDays: z
		.number()
		.int()
		.positive('Duration must be a positive integer'),
	mealsPerDay: z
		.number()
		.int()
		.positive('Meals per day must be a positive integer'),
	dogId: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
	items: z.array(mealPlanItemSchema),
})

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams
		const dogId = searchParams.get('dogId')

		const where: any = {}
		if (dogId) {
			where.dogId = dogId
		}

		const mealPlans = await prisma.mealPlan.findMany({
			where,
			orderBy: { updatedAt: 'desc' },
			include: {
				dog: true,
				items: {
					include: {
						foodItem: true,
					},
				},
			},
		})

		// Always return a valid response, even if empty
		return NextResponse.json(mealPlans)
	} catch (error) {
		console.error('Error fetching meal plans:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch meal plans' },
			{ status: 500 }
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()

		// Validate request body
		const validatedData = mealPlanSchema.parse(body)

		// Calculate total cost based on food items
		let totalCost = new Decimal(0)
		const itemsData: any[] = []

		// If there are no items, create plan with empty items array
		if (validatedData.items.length === 0) {
			const newMealPlan = await prisma.mealPlan.create({
				data: {
					name: validatedData.name,
					startDate: validatedData.startDate,
					endDate: validatedData.endDate,
					durationDays: validatedData.durationDays,
					mealsPerDay: validatedData.mealsPerDay,
					dogId: validatedData.dogId,
					notes: validatedData.notes,
					totalCost: '0',
				},
				include: {
					dog: true,
					items: true,
				},
			})

			return NextResponse.json(newMealPlan, { status: 201 })
		}

		// Fetch food items to calculate costs
		const foodItemIds = validatedData.items.map((item) => item.foodItemId)
		const foodItems = await prisma.foodItem.findMany({
			where: {
				id: {
					in: foodItemIds,
				},
			},
		})

		// Prepare items data and calculate total cost
		for (const item of validatedData.items) {
			const foodItem = foodItems.find((f) => f.id === item.foodItemId)
			if (!foodItem) {
				return NextResponse.json(
					{ error: `Food item with ID ${item.foodItemId} not found` },
					{ status: 400 }
				)
			}

			const itemCost = new Decimal(foodItem.cost).mul(
				new Decimal(item.totalQuantity)
			)
			totalCost = totalCost.add(itemCost)

			itemsData.push({
				foodItemId: item.foodItemId,
				quantityPerMeal: new Decimal(item.quantityPerMeal).toString(),
				totalQuantity: new Decimal(item.totalQuantity).toString(),
			})
		}

		// Create the meal plan with calculated total cost
		const newMealPlan = await prisma.mealPlan.create({
			data: {
				name: validatedData.name,
				startDate: validatedData.startDate,
				endDate: validatedData.endDate,
				durationDays: validatedData.durationDays,
				mealsPerDay: validatedData.mealsPerDay,
				dogId: validatedData.dogId,
				notes: validatedData.notes,
				totalCost: totalCost.toString(),
				items: {
					create: itemsData.map((item) => ({
						foodItemId: item.foodItemId,
						quantityPerMeal: item.quantityPerMeal,
						totalQuantity: item.totalQuantity,
					})),
				},
			},
			include: {
				dog: true,
				items: {
					include: {
						foodItem: true,
					},
				},
			},
		})

		return NextResponse.json(newMealPlan, { status: 201 })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.errors },
				{ status: 400 }
			)
		}

		console.error('Error creating meal plan:', error)
		return NextResponse.json(
			{ error: 'Failed to create meal plan' },
			{ status: 500 }
		)
	}
}

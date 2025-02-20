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
	numberOfMeals: z
		.number()
		.int()
		.positive('Number of meals must be positive')
		.optional(),
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
		const mealPlans = await prisma.mealPlan.findMany({
			include: {
				dog: true,
				items: {
					include: {
						foodItem: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		})

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

		// If there are no items, create plan with zero cost
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

		// Calculate total cost with corrected cost calculation
		let totalCost = new Decimal(0)
		const itemsData: any[] = []

		for (const item of validatedData.items) {
			const foodItem = foodItems.find((f) => f.id === item.foodItemId)
			if (!foodItem) {
				return NextResponse.json(
					{ error: `Food item with ID ${item.foodItemId} not found` },
					{ status: 400 }
				)
			}

			// CORRECTED COST CALCULATION:
			// Calculate cost per unit by dividing total package cost by total package weight
			const costPerUnit = new Decimal(foodItem.cost).div(
				new Decimal(foodItem.weight)
			)

			// Calculate item cost by multiplying cost per unit by total quantity used
			const itemCost = costPerUnit.mul(new Decimal(item.totalQuantity))
			totalCost = totalCost.add(itemCost)

			// Prepare item data for creating meal plan items
			const itemData: any = {
				foodItemId: item.foodItemId,
				quantityPerMeal: new Decimal(item.quantityPerMeal).toString(),
				totalQuantity: new Decimal(item.totalQuantity).toString(),
			}

			// Include number of meals if provided
			if (item.numberOfMeals) {
				itemData.numberOfMeals = item.numberOfMeals
			}

			itemsData.push(itemData)
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
				totalCost: totalCost.toString(), // Store cost as string for Decimal compatibility
				items: {
					create: itemsData,
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

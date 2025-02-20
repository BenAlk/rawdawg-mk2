import { prisma } from '@/lib/prisma'
import { Decimal } from 'decimal.js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for meal plan updates
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

const mealPlanUpdateSchema = z.object({
	name: z.string().min(1, 'Name is required').optional(),
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
		.positive('Duration must be a positive integer')
		.optional(),
	mealsPerDay: z
		.number()
		.int()
		.positive('Meals per day must be a positive integer')
		.optional(),
	dogId: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
	items: z.array(mealPlanItemSchema).optional(),
})

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params

		const mealPlan = await prisma.mealPlan.findUnique({
			where: { id },
			include: {
				dog: true,
				items: {
					include: {
						foodItem: true,
					},
				},
			},
		})

		if (!mealPlan) {
			return NextResponse.json(
				{ error: 'Meal plan not found' },
				{ status: 404 }
			)
		}

		return NextResponse.json(mealPlan)
	} catch (error) {
		console.error(`Error fetching meal plan ${params.id}:`, error)
		return NextResponse.json(
			{ error: 'Failed to fetch meal plan' },
			{ status: 500 }
		)
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params
		const body = await request.json()

		// Validate request body
		const validatedData = mealPlanUpdateSchema.parse(body)

		// Check if meal plan exists
		const existingMealPlan = await prisma.mealPlan.findUnique({
			where: { id },
			include: {
				items: true,
			},
		})

		if (!existingMealPlan) {
			return NextResponse.json(
				{ error: 'Meal plan not found' },
				{ status: 404 }
			)
		}

		// If there are items to update
		if (validatedData.items) {
			// Calculate total cost based on food items
			let totalCost = new Decimal(0)

			// Fetch food items to calculate costs
			const foodItemIds = validatedData.items.map((item) => item.foodItemId)
			const foodItems = await prisma.foodItem.findMany({
				where: {
					id: {
						in: foodItemIds,
					},
				},
			})

			// Calculate total cost with CORRECTED calculation
			for (const item of validatedData.items) {
				const foodItem = foodItems.find((f) => f.id === item.foodItemId)
				if (!foodItem) {
					return NextResponse.json(
						{ error: `Food item with ID ${item.foodItemId} not found` },
						{ status: 400 }
					)
				}

				// NEW COST CALCULATION: Use cost per unit * total quantity
				const costPerUnit = new Decimal(foodItem.cost).div(
					new Decimal(foodItem.weight)
				)
				const itemCost = costPerUnit.mul(new Decimal(item.totalQuantity))
				totalCost = totalCost.add(itemCost)
			}

			// Update meal plan with transaction to ensure data consistency
			const updatedMealPlan = await prisma.$transaction(async (tx) => {
				// Delete existing items
				await tx.mealPlanItem.deleteMany({
					where: { mealPlanId: id },
				})

				// Create new items
				const itemsPromises = validatedData.items!.map((item) =>
					tx.mealPlanItem.create({
						data: {
							mealPlanId: id,
							foodItemId: item.foodItemId,
							quantityPerMeal: new Decimal(item.quantityPerMeal).toString(),
							totalQuantity: new Decimal(item.totalQuantity).toString(),
							numberOfMeals: item.numberOfMeals,
						},
					})
				)

				await Promise.all(itemsPromises)

				// Update the meal plan
				return tx.mealPlan.update({
					where: { id },
					data: {
						name: validatedData.name,
						startDate: validatedData.startDate,
						endDate: validatedData.endDate,
						durationDays: validatedData.durationDays,
						mealsPerDay: validatedData.mealsPerDay,
						dogId: validatedData.dogId,
						notes: validatedData.notes,
						totalCost: totalCost.toString(),
						updatedAt: new Date(),
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
			})

			return NextResponse.json(updatedMealPlan)
		} else {
			// Just update the meal plan details without touching items
			const updatedMealPlan = await prisma.mealPlan.update({
				where: { id },
				data: {
					name: validatedData.name,
					startDate: validatedData.startDate,
					endDate: validatedData.endDate,
					durationDays: validatedData.durationDays,
					mealsPerDay: validatedData.mealsPerDay,
					dogId: validatedData.dogId,
					notes: validatedData.notes,
					updatedAt: new Date(),
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

			return NextResponse.json(updatedMealPlan)
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.errors },
				{ status: 400 }
			)
		}

		console.error(`Error updating meal plan ${params.id}:`, error)
		return NextResponse.json(
			{ error: 'Failed to update meal plan' },
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

		// Check if meal plan exists
		const existingMealPlan = await prisma.mealPlan.findUnique({
			where: { id },
		})

		if (!existingMealPlan) {
			return NextResponse.json(
				{ error: 'Meal plan not found' },
				{ status: 404 }
			)
		}

		// Delete the meal plan (cascade delete will handle items)
		await prisma.mealPlan.delete({
			where: { id },
		})

		return NextResponse.json({ success: true }, { status: 200 })
	} catch (error) {
		console.error(`Error deleting meal plan ${params.id}:`, error)
		return NextResponse.json(
			{ error: 'Failed to delete meal plan' },
			{ status: 500 }
		)
	}
}

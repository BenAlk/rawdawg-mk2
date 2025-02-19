import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for validating preferences
const preferencesSchema = z.object({
	weightUnit: z.enum(['kg', 'lbs']),
	measureUnit: z.enum(['g', 'oz']),
	currency: z.string().min(1, 'Currency is required'),
	defaultMealsPerDay: z
		.number()
		.int()
		.min(1, 'Meals per day must be at least 1')
		.max(6, 'Meals per day cannot exceed 6'),
	theme: z.enum(['light', 'dark', 'system']),
})

export async function GET(request: NextRequest) {
	try {
		// Get the first preferences record or create default preferences
		let preferences = await prisma.userPreference.findFirst()

		if (!preferences) {
			// Create default preferences if none exist
			preferences = await prisma.userPreference.create({
				data: {
					weightUnit: 'kg',
					measureUnit: 'g',
					currency: 'GBP',
					defaultMealsPerDay: 2,
					theme: 'light',
				},
			})
		}

		return NextResponse.json(preferences)
	} catch (error) {
		console.error('Error fetching preferences:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch preferences' },
			{ status: 500 }
		)
	}
}

export async function PUT(request: NextRequest) {
	try {
		const body = await request.json()

		// Validate request body
		const validatedData = preferencesSchema.parse(body)

		// Get the first preferences record or create new one if it doesn't exist
		let preferences = await prisma.userPreference.findFirst()

		if (preferences) {
			// Update existing preferences
			preferences = await prisma.userPreference.update({
				where: { id: preferences.id },
				data: validatedData,
			})
		} else {
			// Create new preferences
			preferences = await prisma.userPreference.create({
				data: validatedData,
			})
		}

		return NextResponse.json(preferences)
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.errors },
				{ status: 400 }
			)
		}

		console.error('Error updating preferences:', error)
		return NextResponse.json(
			{ error: 'Failed to update preferences' },
			{ status: 500 }
		)
	}
}

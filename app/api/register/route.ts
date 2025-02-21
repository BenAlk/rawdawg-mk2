import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for validating registration data
const registerSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Invalid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()

		// Validate request body
		const result = registerSchema.safeParse(body)
		if (!result.success) {
			return NextResponse.json(
				{ error: 'Validation error', details: result.error.format() },
				{ status: 400 }
			)
		}

		const { name, email, password } = result.data

		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email },
		})

		if (existingUser) {
			return NextResponse.json(
				{ error: 'User already exists with this email' },
				{ status: 409 }
			)
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 10)

		// Create the user first
		const user = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
			},
		})

		// Then create preferences separately
		await prisma.userPreference.create({
			data: {
				userId: user.id, // Connect to the newly created user
				weightUnit: 'kg',
				measureUnit: 'g',
				currency: 'GBP',
				defaultMealsPerDay: 2,
				theme: 'light',
			},
		})

		// Return the user without the password
		const { password: _, ...userWithoutPassword } = user
		return NextResponse.json(
			{ message: 'User registered successfully', user: userWithoutPassword },
			{ status: 201 }
		)
	} catch (error) {
		console.error(
			'Error registering user:',
			error instanceof Error ? error.message : String(error)
		)

		return NextResponse.json(
			{
				error: 'Failed to register user',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}

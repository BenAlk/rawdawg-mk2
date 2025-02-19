import React, { useState, useEffect } from 'react'
import { usePreferencesStore } from '@/lib/store'
import { Decimal } from 'decimal.js'
import { z } from 'zod'
import { useForm, FieldError } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Constants for different activity levels
const ACTIVITY_MULTIPLIERS = {
	low: new Decimal(0.02), // 2% of body weight for low activity
	moderate: new Decimal(0.025), // 2.5% for moderate activity
	high: new Decimal(0.03), // 3% for high activity
	puppy: new Decimal(0.04), // 4% for puppies
	senior: new Decimal(0.0175), // 1.75% for senior dogs
}

// Constants for weight conversion
const LBS_TO_KG = new Decimal(0.45359237)
const KG_TO_LBS = new Decimal(2.20462262185)

// Constants for measurement conversion
const G_TO_OZ = new Decimal(0.03527396195)
const OZ_TO_G = new Decimal(28.3495231)

// Form input types (before transformation)
interface FormInputs {
	dogName: string
	weight: string
	age: string
	activityLevel: 'puppy' | 'low' | 'moderate' | 'high' | 'senior'
	mealsPerDay: string
}

// Zod schema for form validation
const calculatorSchema = z.object({
	dogName: z.string().min(1, 'Dog name is required'),
	weight: z
		.string()
		.min(1, 'Weight is required')
		.refine(
			(val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
			'Weight must be a positive number'
		),
	age: z
		.string()
		.min(1, 'Age is required')
		.refine(
			(val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
			'Age must be a positive number'
		),
	activityLevel: z.enum(['puppy', 'low', 'moderate', 'high', 'senior']),
	mealsPerDay: z
		.string()
		.min(1, 'Meals per day is required')
		.refine(
			(val) => !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) <= 6,
			'Meals per day must be between 1 and 6'
		),
})

interface PortionCalculatorProps {
	onSaveDog?: (dogData: {
		name: string
		weight: Decimal
		age: Decimal
		activityLevel: string
		portionSize: Decimal
	}) => Promise<void>
}

const PortionCalculator: React.FC<PortionCalculatorProps> = ({ onSaveDog }) => {
	const { settings } = usePreferencesStore()
	const { weightUnit, measureUnit } = settings

	const [dogType, setDogType] = useState<'puppy' | 'adult' | 'senior'>('adult')
	const [dailyPortion, setDailyPortion] = useState<Decimal | null>(null)
	const [mealPortion, setMealPortion] = useState<Decimal | null>(null)
	const [isSaving, setIsSaving] = useState(false)

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors, isValid },
	} = useForm<FormInputs>({
		resolver: zodResolver(calculatorSchema),
		defaultValues: {
			dogName: '',
			weight: '',
			age: '',
			activityLevel: 'moderate',
			mealsPerDay: '2',
		},
		mode: 'onChange',
	})

	const watchAge = watch('age')
	const watchActivityLevel = watch('activityLevel')
	const watchWeight = watch('weight')
	const watchMealsPerDay = watch('mealsPerDay')

	// Update dog type based on age
	useEffect(() => {
		if (watchAge && !isNaN(parseFloat(watchAge))) {
			const ageValue = new Decimal(watchAge)

			if (ageValue.lessThan(1)) {
				setDogType('puppy')
				setValue('activityLevel', 'puppy')
			} else if (ageValue.greaterThanOrEqualTo(7)) {
				setDogType('senior')
				if (watchActivityLevel !== 'low' && watchActivityLevel !== 'moderate') {
					setValue('activityLevel', 'senior')
				}
			} else {
				setDogType('adult')
				if (watchActivityLevel === 'puppy' || watchActivityLevel === 'senior') {
					setValue('activityLevel', 'moderate')
				}
			}
		}
	}, [watchAge, setValue, watchActivityLevel])

	// Calculate portion when inputs change
	useEffect(() => {
		if (watchWeight && watchActivityLevel && !isNaN(parseFloat(watchWeight))) {
			try {
				// Convert weight to kg if needed
				let weightInKg = new Decimal(watchWeight)
				if (weightUnit === 'lbs') {
					weightInKg = weightInKg.mul(LBS_TO_KG)
				}

				// Calculate daily portion in grams
				const multiplier = ACTIVITY_MULTIPLIERS[watchActivityLevel]
				let dailyPortionGrams = weightInKg.mul(1000).mul(multiplier)

				// Convert to oz if needed
				if (measureUnit === 'oz') {
					dailyPortionGrams = dailyPortionGrams.mul(G_TO_OZ)
				}

				setDailyPortion(dailyPortionGrams.toDecimalPlaces(0))

				// Calculate per meal portion
				if (watchMealsPerDay && !isNaN(parseInt(watchMealsPerDay))) {
					const mealsPerDay = parseInt(watchMealsPerDay, 10)
					if (mealsPerDay > 0) {
						setMealPortion(
							dailyPortionGrams.div(mealsPerDay).toDecimalPlaces(0)
						)
					}
				}
			} catch (e) {
				// Handle parsing errors
				setDailyPortion(null)
				setMealPortion(null)
			}
		} else {
			setDailyPortion(null)
			setMealPortion(null)
		}
	}, [
		watchWeight,
		watchActivityLevel,
		watchMealsPerDay,
		weightUnit,
		measureUnit,
	])

	const onSubmit = async (data: FormInputs) => {
		if (onSaveDog && dailyPortion !== null) {
			setIsSaving(true)
			try {
				let weightValue = new Decimal(data.weight)

				// Ensure weight is stored in kg regardless of display unit
				if (weightUnit === 'lbs') {
					weightValue = weightValue.mul(LBS_TO_KG)
				}

				await onSaveDog({
					name: data.dogName,
					weight: weightValue,
					age: new Decimal(data.age),
					activityLevel: data.activityLevel,
					portionSize: dailyPortion,
				})

				// Reset form
				setValue('dogName', '')
				setValue('weight', '')
				setValue('age', '')
				setValue('activityLevel', 'moderate')
				setValue('mealsPerDay', '2')

				setDailyPortion(null)
				setMealPortion(null)
			} catch (error) {
				console.error('Failed to save dog:', error)
			} finally {
				setIsSaving(false)
			}
		}
	}

	// Helper function to safely access error messages
	const getErrorMessage = (error: FieldError | undefined): string => {
		if (error && error.message) {
			return error.message
		}
		return ''
	}

	return (
		<div className='rounded-lg border border-gray-200 bg-white p-6 shadow'>
			<h2 className='mb-6 text-xl font-semibold text-gray-900'>
				Portion Calculator
			</h2>

			<form
				onSubmit={handleSubmit(onSubmit)}
				className='space-y-6'
			>
				<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
					{/* Dog Name */}
					<div className='space-y-2'>
						<label
							htmlFor='dogName'
							className='block text-sm font-medium text-gray-700'
						>
							Dog Name
						</label>
						<input
							id='dogName'
							type='text'
							className='block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
							placeholder="Enter dog's name"
							{...register('dogName')}
						/>
						{errors.dogName && errors.dogName.message && (
							<p className='text-sm text-red-600'>{errors.dogName.message}</p>
						)}
					</div>

					{/* Weight */}
					<div className='space-y-2'>
						<label
							htmlFor='weight'
							className='block text-sm font-medium text-gray-700'
						>
							Weight ({weightUnit})
						</label>
						<input
							id='weight'
							type='number'
							step='0.1'
							min='0.1'
							className='block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
							placeholder={`Enter weight in ${weightUnit}`}
							{...register('weight')}
						/>
						{errors.weight && errors.weight.message && (
							<p className='text-sm text-red-600'>{errors.weight.message}</p>
						)}
					</div>

					{/* Age */}
					<div className='space-y-2'>
						<label
							htmlFor='age'
							className='block text-sm font-medium text-gray-700'
						>
							Age (years)
						</label>
						<input
							id='age'
							type='number'
							step='0.1'
							min='0.1'
							className='block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
							placeholder='Enter age in years'
							{...register('age')}
						/>
						{errors.age && errors.age.message && (
							<p className='text-sm text-red-600'>{errors.age.message}</p>
						)}
					</div>

					{/* Activity Level */}
					<div className='space-y-2'>
						<label
							htmlFor='activityLevel'
							className='block text-sm font-medium text-gray-700'
						>
							Activity Level
						</label>
						<select
							id='activityLevel'
							className='block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
							{...register('activityLevel')}
						>
							{dogType === 'puppy' && (
								<option value='puppy'>Puppy (4% of body weight)</option>
							)}
							{dogType !== 'puppy' && (
								<>
									<option value='low'>Low (2% of body weight)</option>
									<option value='moderate'>
										Moderate (2.5% of body weight)
									</option>
									<option value='high'>High (3% of body weight)</option>
								</>
							)}
							{dogType === 'senior' && (
								<option value='senior'>Senior (1.75% of body weight)</option>
							)}
						</select>
						{errors.activityLevel && errors.activityLevel.message && (
							<p className='text-sm text-red-600'>
								{errors.activityLevel.message}
							</p>
						)}
					</div>

					{/* Meals Per Day */}
					<div className='space-y-2'>
						<label
							htmlFor='mealsPerDay'
							className='block text-sm font-medium text-gray-700'
						>
							Meals Per Day
						</label>
						<select
							id='mealsPerDay'
							className='block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
							{...register('mealsPerDay')}
						>
							<option value='1'>1 meal per day</option>
							<option value='2'>2 meals per day</option>
							<option value='3'>3 meals per day</option>
							<option value='4'>4 meals per day</option>
							{dogType === 'puppy' && (
								<>
									<option value='5'>5 meals per day</option>
									<option value='6'>6 meals per day</option>
								</>
							)}
						</select>
						{errors.mealsPerDay && errors.mealsPerDay.message && (
							<p className='text-sm text-red-600'>
								{errors.mealsPerDay.message}
							</p>
						)}
					</div>
				</div>

				{/* Results */}
				<div className='rounded-md bg-blue-50 p-4'>
					<div className='flex'>
						<div className='flex-shrink-0'>
							<svg
								className='h-5 w-5 text-blue-400'
								viewBox='0 0 20 20'
								fill='currentColor'
							>
								<path
									fillRule='evenodd'
									d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
									clipRule='evenodd'
								/>
							</svg>
						</div>
						<div className='ml-3 flex-1 md:flex md:justify-between'>
							<div className='space-y-1'>
								<p className='text-sm text-blue-700'>
									Recommended Daily Portion:
								</p>
								<p className='text-lg font-bold text-blue-900'>
									{dailyPortion !== null
										? `${dailyPortion.toString()} ${measureUnit}/day`
										: 'Complete the form to calculate'}
								</p>
								<p className='text-sm text-blue-700'>Per Meal Portion:</p>
								<p className='text-lg font-bold text-blue-900'>
									{mealPortion !== null
										? `${mealPortion.toString()} ${measureUnit}/meal`
										: 'Complete the form to calculate'}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				{onSaveDog && (
					<div className='flex justify-end'>
						<button
							type='submit'
							disabled={!isValid || dailyPortion === null || isSaving}
							className='inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
						>
							{isSaving ? 'Saving...' : 'Save Dog Profile'}
						</button>
					</div>
				)}
			</form>
		</div>
	)
}

export default PortionCalculator

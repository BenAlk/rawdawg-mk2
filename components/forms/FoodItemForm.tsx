import { usePreferencesStore } from '@/lib/store'
import { zodResolver } from '@hookform/resolvers/zod'
import { FoodItem } from '@prisma/client'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Zod schema for food item validation
const foodItemSchema = z.object({
	brand: z.string().min(1, 'Brand is required'),
	type: z.string().min(1, 'Type is required'),
	weight: z.coerce
		.number()
		.positive('Weight must be positive')
		.min(0.01, 'Weight must be greater than 0'),
	cost: z.coerce
		.number()
		.positive('Cost must be positive')
		.min(0.01, 'Cost must be greater than 0'),
	description: z.string().optional(),
	imageUrl: z.union([z.string().url('Invalid URL'), z.literal('')]).optional(),
	isActive: z.boolean().default(true),
	protein: z.preprocess(
		(val) => (val === '' ? null : val),
		z.coerce.number().positive().nullable().optional()
	),
	fat: z.preprocess(
		(val) => (val === '' ? null : val),
		z.coerce.number().positive().nullable().optional()
	),
	fiber: z.preprocess(
		(val) => (val === '' ? null : val),
		z.coerce.number().positive().nullable().optional()
	),
})

// Infer TypeScript type from the schema
type FoodItemFormData = z.infer<typeof foodItemSchema>

interface FoodItemFormProps {
	initialData?: Partial<FoodItem>
	onSubmit: (data: FoodItemFormData) => void
	onCancel: () => void
	isSubmitting?: boolean
}

const FoodItemForm: React.FC<FoodItemFormProps> = ({
	initialData,
	onSubmit,
	onCancel,
	isSubmitting = false,
}) => {
	const { settings } = usePreferencesStore()
	const { weightUnit, measureUnit, currency } = settings

	// Initialize react-hook-form
	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
		reset,
	} = useForm<FoodItemFormData>({
		resolver: zodResolver(foodItemSchema),
		defaultValues: {
			brand: initialData?.brand || '',
			type: initialData?.type || '',
			weight: initialData?.weight ? Number(initialData.weight) : undefined,
			cost: initialData?.cost ? Number(initialData.cost) : undefined,
			description: initialData?.description || '',
			imageUrl: initialData?.imageUrl || '',
			isActive: initialData?.isActive ?? true,
			protein: initialData?.protein ? Number(initialData.protein) : null,
			fat: initialData?.fat ? Number(initialData.fat) : null,
			fiber: initialData?.fiber ? Number(initialData.fiber) : null,
		},
	})

	// Handle form submission
	const handleFormSubmit = (data: FoodItemFormData) => {
		onSubmit(data)
	}

	// Reset form
	const handleReset = () => {
		reset()
		onCancel()
	}

	return (
		<form
			onSubmit={handleSubmit(handleFormSubmit)}
			className='space-y-6'
		>
			<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
				{/* Brand */}
				<div className='space-y-2'>
					<label
						htmlFor='brand'
						className='text-sm font-medium'
					>
						Brand <span className='text-red-500'>*</span>
					</label>
					<input
						id='brand'
						type='text'
						className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
						placeholder='Enter brand name'
						{...register('brand')}
					/>
					{errors.brand && (
						<p className='text-sm text-red-600'>{errors.brand.message}</p>
					)}
				</div>

				{/* Type */}
				<div className='space-y-2'>
					<label
						htmlFor='type'
						className='text-sm font-medium'
					>
						Type <span className='text-red-500'>*</span>
					</label>
					<input
						id='type'
						type='text'
						className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
						placeholder='E.g., chicken, beef, organ mix'
						{...register('type')}
					/>
					{errors.type && (
						<p className='text-sm text-red-600'>{errors.type.message}</p>
					)}
				</div>

				{/* Weight */}
				<div className='space-y-2'>
					<label
						htmlFor='weight'
						className='text-sm font-medium'
					>
						Weight ({measureUnit}) <span className='text-red-500'>*</span>
					</label>
					<input
						id='weight'
						type='number'
						step='0.01'
						min='0.01'
						className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
						placeholder={`Enter weight in ${measureUnit}`}
						{...register('weight')}
					/>
					{errors.weight && (
						<p className='text-sm text-red-600'>{errors.weight.message}</p>
					)}
				</div>

				{/* Cost */}
				<div className='space-y-2'>
					<label
						htmlFor='cost'
						className='text-sm font-medium'
					>
						Cost ({currency}) <span className='text-red-500'>*</span>
					</label>
					<input
						id='cost'
						type='number'
						step='0.01'
						min='0.01'
						className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
						placeholder={`Enter cost in ${currency}`}
						{...register('cost')}
					/>
					{errors.cost && (
						<p className='text-sm text-red-600'>{errors.cost.message}</p>
					)}

					{/* Add the cost per kg display here */}
					<div className='space-y-2'>
						<label className='block text-sm font-medium text-gray-700'>
							Calculated Price per kg
						</label>
						<div className='flex items-center space-x-2'>
							<div className='rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm'>
								{watch('cost') &&
								watch('weight') &&
								!isNaN(parseFloat(String(watch('cost')))) &&
								!isNaN(parseFloat(String(watch('weight')))) &&
								parseFloat(String(watch('weight'))) > 0
									? `${currency} ${((parseFloat(String(watch('cost'))) / parseFloat(String(watch('weight')))) * 1000).toFixed(2)}/kg`
									: `${currency} 0.00/kg`}
							</div>
							<div className='text-xs text-gray-500'>
								(Automatically calculated)
							</div>
						</div>
					</div>
				</div>

				{/* Description */}
				<div className='space-y-2 md:col-span-2'>
					<label
						htmlFor='description'
						className='text-sm font-medium'
					>
						Description
					</label>
					<textarea
						id='description'
						rows={3}
						className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
						placeholder='Optional description of the food item'
						{...register('description')}
					/>
					{errors.description && (
						<p className='text-sm text-red-600'>{errors.description.message}</p>
					)}
				</div>

				{/* Image URL */}
				<div className='space-y-2 md:col-span-2'>
					<label
						htmlFor='imageUrl'
						className='text-sm font-medium'
					>
						Image URL
					</label>
					<input
						id='imageUrl'
						type='text'
						className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
						placeholder='https://example.com/image.jpg'
						{...register('imageUrl')}
					/>
					{errors.imageUrl && (
						<p className='text-sm text-red-600'>{errors.imageUrl.message}</p>
					)}
				</div>

				{/* Nutritional Information */}
				<div className='space-y-4 md:col-span-2'>
					<h3 className='text-md font-medium'>
						Nutritional Information (Optional)
					</h3>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
						{/* Protein */}
						<div className='space-y-2'>
							<label
								htmlFor='protein'
								className='text-sm font-medium'
							>
								Protein ({measureUnit}/100{measureUnit})
							</label>
							<input
								id='protein'
								type='number'
								step='0.1'
								min='0'
								className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
								placeholder='e.g., 22.5'
								{...register('protein')}
							/>
							{errors.protein && (
								<p className='text-sm text-red-600'>{errors.protein.message}</p>
							)}
						</div>

						{/* Fat */}
						<div className='space-y-2'>
							<label
								htmlFor='fat'
								className='text-sm font-medium'
							>
								Fat ({measureUnit}/100{measureUnit})
							</label>
							<input
								id='fat'
								type='number'
								step='0.1'
								min='0'
								className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
								placeholder='e.g., 15.2'
								{...register('fat')}
							/>
							{errors.fat && (
								<p className='text-sm text-red-600'>{errors.fat.message}</p>
							)}
						</div>

						{/* Fiber */}
						<div className='space-y-2'>
							<label
								htmlFor='fiber'
								className='text-sm font-medium'
							>
								Fiber ({measureUnit}/100{measureUnit})
							</label>
							<input
								id='fiber'
								type='number'
								step='0.1'
								min='0'
								className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
								placeholder='e.g., 0.5'
								{...register('fiber')}
							/>
							{errors.fiber && (
								<p className='text-sm text-red-600'>{errors.fiber.message}</p>
							)}
						</div>
					</div>
				</div>

				{/* Active Status */}
				<div className='flex items-center space-x-2 md:col-span-2'>
					<input
						id='isActive'
						type='checkbox'
						className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
						{...register('isActive')}
					/>
					<label
						htmlFor='isActive'
						className='text-sm font-medium'
					>
						Item is active and available for meal planning
					</label>
				</div>
			</div>

			{/* Form Actions */}
			<div className='flex justify-end space-x-4'>
				<button
					type='button'
					className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
					onClick={handleReset}
					disabled={isSubmitting}
				>
					Cancel
				</button>
				<button
					type='submit'
					className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
					disabled={isSubmitting}
				>
					{isSubmitting
						? 'Saving...'
						: initialData?.id
							? 'Update Item'
							: 'Add Item'}
				</button>
			</div>
		</form>
	)
}

export default FoodItemForm

'use client'

import React, { useState, useEffect } from 'react'
import { usePreferencesStore } from '@/lib/store'
import { Dog } from '@prisma/client'
import { Decimal } from 'decimal.js'
import PortionCalculator from '@/components/planner/PortionCalculator'
import { format } from 'date-fns'

export default function DogsPage() {
	const { settings, fetchPreferences } = usePreferencesStore()

	const [dogs, setDogs] = useState<Dog[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
		null
	)

	useEffect(() => {
		fetchPreferences()
		fetchDogs()
	}, [fetchPreferences])

	const fetchDogs = async () => {
		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/dogs')

			if (!response.ok) {
				throw new Error('Failed to fetch dogs')
			}

			const data = await response.json()

			// Convert string decimal values to Decimal objects
			const processedDogs = data.map((dog: any) => ({
				...dog,
				weight: new Decimal(dog.weight),
				age: new Decimal(dog.age),
				portionSize: new Decimal(dog.portionSize),
			}))

			setDogs(processedDogs)
		} catch (error) {
			console.error('Error fetching dogs:', error)
			setError((error as Error).message)
		} finally {
			setIsLoading(false)
		}
	}

	const handleDeleteDog = async (dogId: string) => {
		try {
			const response = await fetch(`/api/dogs/${dogId}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Failed to delete dog')
			}

			// Remove the dog from the local state
			setDogs(dogs.filter((dog) => dog.id !== dogId))
			setShowDeleteConfirm(null)
		} catch (error) {
			console.error('Error deleting dog:', error)
			setError((error as Error).message)
		}
	}

	const handleSaveDog = async (dogData: {
		name: string
		weight: Decimal
		age: Decimal
		activityLevel: string
		portionSize: Decimal
	}) => {
		try {
			const response = await fetch('/api/dogs', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...dogData,
					weight: dogData.weight.toString(),
					age: dogData.age.toString(),
					portionSize: dogData.portionSize.toString(),
				}),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Failed to create dog profile')
			}

			// Refresh the dogs list
			await fetchDogs()
		} catch (error) {
			console.error('Error saving dog:', error)
			setError((error as Error).message)
		}
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<header className='mb-8'>
				<h1 className='mb-2 text-3xl font-bold text-gray-900'>Dog Profiles</h1>
				<p className='text-gray-600'>
					Manage your dogs' profiles and calculate appropriate portions
				</p>
			</header>

			{/* Error display */}
			{error && (
				<div className='mb-6 rounded-md bg-red-50 p-4'>
					<div className='flex'>
						<div className='flex-shrink-0'>
							<svg
								className='h-5 w-5 text-red-400'
								xmlns='http://www.w3.org/2000/svg'
								viewBox='0 0 20 20'
								fill='currentColor'
								aria-hidden='true'
							>
								<path
									fillRule='evenodd'
									d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
									clipRule='evenodd'
								/>
							</svg>
						</div>
						<div className='ml-3'>
							<h3 className='text-sm font-medium text-red-800'>
								Error: {error}
							</h3>
						</div>
					</div>
				</div>
			)}

			<div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
				{/* Portion Calculator */}
				<div className='flex flex-col lg:order-2'>
					<h2 className='mb-4 text-xl font-semibold text-gray-900'>
						Add New Dog
					</h2>
					<PortionCalculator onSaveDog={handleSaveDog} />
				</div>

				{/* Dog Profiles List */}
				<div className='lg:order-1'>
					<h2 className='mb-4 text-xl font-semibold text-gray-900'>
						Your Dogs
					</h2>
					<div className='rounded-lg border border-gray-200 bg-white shadow'>
						{isLoading ? (
							<div className='p-6 text-center text-gray-500'>
								Loading dog profiles...
							</div>
						) : dogs.length === 0 ? (
							<div className='p-6 text-center text-gray-500'>
								No dog profiles yet. Use the calculator to add your first dog.
							</div>
						) : (
							<ul className='divide-y divide-gray-200'>
								{dogs.map((dog) => (
									<li
										key={dog.id}
										className='p-6'
									>
										<div className='flex items-start justify-between'>
											<div>
												<h3 className='text-lg font-medium text-gray-900'>
													{dog.name}
												</h3>
												<div className='mt-1 space-y-1 text-sm text-gray-500'>
													<p>
														<span className='font-medium'>Weight:</span>{' '}
														{dog.weight.toFixed(1)} {settings.weightUnit}
													</p>
													<p>
														<span className='font-medium'>Age:</span>{' '}
														{dog.age.toFixed(1)} years
													</p>
													<p>
														<span className='font-medium'>Activity Level:</span>{' '}
														{dog.activityLevel}
													</p>
													<p>
														<span className='font-medium'>Daily Portion:</span>{' '}
														{dog.portionSize.toFixed(0)} {settings.measureUnit}
													</p>
												</div>
												<p className='mt-2 text-xs text-gray-400'>
													Added: {format(new Date(dog.createdAt), 'PPP')}
												</p>
											</div>
											<div>
												{showDeleteConfirm === dog.id ? (
													<div className='flex space-x-2'>
														<button
															type='button'
															onClick={() => handleDeleteDog(dog.id)}
															className='rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700'
														>
															Confirm
														</button>
														<button
															type='button'
															onClick={() => setShowDeleteConfirm(null)}
															className='rounded-md bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300'
														>
															Cancel
														</button>
													</div>
												) : (
													<button
														type='button'
														onClick={() => setShowDeleteConfirm(dog.id)}
														className='rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100'
													>
														Delete
													</button>
												)}
											</div>
										</div>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

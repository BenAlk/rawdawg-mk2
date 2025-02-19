'use client'

import MealPlanner from '@/components/planner/MealPlanner'
import { usePlannerStore, usePreferencesStore } from '@/lib/store'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'

export default function PlannerPage() {
	const {
		savedPlans,
		currentPlan,
		fetchSavedPlans,
		loadPlan,
		createNewPlan,
		deletePlan,
		isLoading,
		error,
		clearError,
	} = usePlannerStore()

	const { settings, fetchPreferences } = usePreferencesStore()

	const [showPlanner, setShowPlanner] = useState(false)
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
		null
	)
	const [initialFetchDone, setInitialFetchDone] = useState(false)

	useEffect(() => {
		// Load preferences and fetch plans on initial load
		const loadInitialData = async () => {
			try {
				await fetchPreferences()
				await fetchSavedPlans()
			} catch (err) {
				console.error('Error loading initial data:', err)
			} finally {
				setInitialFetchDone(true)
			}
		}

		loadInitialData()
	}, [fetchPreferences, fetchSavedPlans])

	const handleNewPlan = () => {
		// Clear any existing errors before creating a new plan
		clearError()

		createNewPlan({
			name: `New Plan - ${format(new Date(), 'MMM d, yyyy')}`,
			durationDays: 7,
			mealsPerDay: settings.defaultMealsPerDay,
		})
		setShowPlanner(true)
		setSelectedPlanId(null)
	}

	const handleLoadPlan = async (planId: string) => {
		clearError()
		try {
			await loadPlan(planId)
			setShowPlanner(true)
			setSelectedPlanId(planId)
		} catch (err) {
			console.error(`Error loading plan ${planId}:`, err)
		}
	}

	const handleDeletePlan = async (planId: string) => {
		clearError()
		try {
			await deletePlan(planId)
			setShowDeleteConfirm(null)

			// If we're currently showing this plan, close the planner
			if (selectedPlanId === planId) {
				setShowPlanner(false)
				setSelectedPlanId(null)
			}
		} catch (err) {
			console.error(`Error deleting plan ${planId}:`, err)
		}
	}

	const handleClosePlanner = () => {
		setShowPlanner(false)
		clearError()
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<header className='mb-8'>
				<h1 className='mb-2 text-3xl font-bold text-gray-900'>Meal Planner</h1>
				<p className='text-gray-600'>
					Create and manage meal plans for your dogs
				</p>
			</header>

			{/* Error display with dismiss button */}
			{error && (
				<div className='mb-6 rounded-md bg-red-50 p-4'>
					<div className='flex justify-between'>
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
						<button
							onClick={clearError}
							className='text-red-500 hover:text-red-700'
						>
							<svg
								className='h-5 w-5'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M6 18L18 6M6 6l12 12'
								/>
							</svg>
						</button>
					</div>
				</div>
			)}

			{/* Show either the planner or the saved plans list */}
			{showPlanner ? (
				<div>
					<div className='mb-4 flex items-center justify-between'>
						<h2 className='text-xl font-semibold text-gray-900'>
							{currentPlan?.name || 'New Meal Plan'}
						</h2>
						<button
							type='button'
							onClick={handleClosePlanner}
							className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
						>
							Back to Plans
						</button>
					</div>

					<MealPlanner onClose={handleClosePlanner} />
				</div>
			) : (
				<div>
					{/* Action buttons */}
					<div className='mb-6'>
						<button
							type='button'
							onClick={handleNewPlan}
							className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
							disabled={isLoading && !initialFetchDone}
						>
							Create New Plan
						</button>
					</div>

					{/* Saved plans list */}
					<div className='rounded-lg border border-gray-200 bg-white shadow'>
						<div className='border-b border-gray-200 bg-gray-50 px-6 py-4'>
							<h2 className='text-lg font-medium text-gray-900'>
								Saved Meal Plans
							</h2>
						</div>

						{isLoading && !initialFetchDone ? (
							<div className='p-6 text-center text-gray-500'>
								Loading saved plans...
							</div>
						) : savedPlans.length === 0 ? (
							<div className='p-6 text-center text-gray-500'>
								{initialFetchDone
									? 'No saved meal plans yet. Click "Create New Plan" to get started.'
									: 'Unable to fetch meal plans. Please try again later.'}
							</div>
						) : (
							<ul className='divide-y divide-gray-200'>
								{savedPlans.map((plan) => (
									<li
										key={plan.id}
										className='p-6'
									>
										<div className='flex items-start justify-between'>
											<div className='flex-1'>
												<h3 className='text-lg font-medium text-gray-900'>
													{plan.name}
												</h3>
												<div className='mt-1 grid grid-cols-1 gap-2 text-sm text-gray-500 sm:grid-cols-3'>
													<div>
														<span className='font-medium'>Duration:</span>{' '}
														{plan.durationDays || 0} days,{' '}
														{plan.mealsPerDay || 0} meals/day
													</div>
													<div>
														<span className='font-medium'>Total Cost:</span>{' '}
														{settings.currency}{' '}
														{plan.totalCost?.toFixed?.(2) || '0.00'}
													</div>
													<div>
														<span className='font-medium'>Food Items:</span>{' '}
														{Array.isArray(plan.items) ? plan.items.length : 0}
													</div>
												</div>
												{plan.notes && (
													<p className='mt-2 text-sm text-gray-600'>
														{plan.notes}
													</p>
												)}
												<p className='mt-2 text-xs text-gray-400'>
													Last updated:{' '}
													{plan.updatedAt
														? format(new Date(plan.updatedAt), 'PPP')
														: 'Unknown'}
												</p>
											</div>
											<div className='ml-4 flex space-x-2'>
												<button
													type='button'
													onClick={() => handleLoadPlan(plan.id)}
													className='rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100'
												>
													Open
												</button>

												{showDeleteConfirm === plan.id ? (
													<>
														<button
															type='button'
															onClick={() => handleDeletePlan(plan.id)}
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
													</>
												) : (
													<button
														type='button'
														onClick={() => setShowDeleteConfirm(plan.id)}
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
			)}
		</div>
	)
}

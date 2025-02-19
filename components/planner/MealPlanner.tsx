import { usePlannerStore, usePreferencesStore } from '@/lib/store'
import { Dog, FoodItem } from '@prisma/client'
import { Decimal } from 'decimal.js'
import React, { useEffect, useState } from 'react'

interface MealPlannerProps {
	onClose?: () => void
}

const MealPlanner: React.FC<MealPlannerProps> = ({ onClose }) => {
	const {
		currentPlan,
		availableDogs,
		availableFoods,
		isLoading,
		error,
		fetchAvailableDogs,
		fetchAvailableFoods,
		fetchSavedPlans,
		createNewPlan,
		savePlan,
		updatePlanDetails,
		addFoodItem,
		updateFoodItemQuantity,
		removeFoodItem,
		undo,
		redo,
	} = usePlannerStore()

	const { settings } = usePreferencesStore()
	const { weightUnit, measureUnit, currency, defaultMealsPerDay } = settings

	const [selectedDog, setSelectedDog] = useState<Dog | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>([])
	const [showFoodSelector, setShowFoodSelector] = useState(false)

	// Load initial data
	useEffect(() => {
		fetchAvailableDogs()
		fetchAvailableFoods()
		fetchSavedPlans()
	}, [fetchAvailableDogs, fetchAvailableFoods, fetchSavedPlans])

	// Create a new plan if none exists
	useEffect(() => {
		if (!currentPlan && !isLoading) {
			createNewPlan({
				name: 'New Meal Plan',
				durationDays: 7,
				mealsPerDay: defaultMealsPerDay,
			})
		}
	}, [currentPlan, isLoading, createNewPlan, defaultMealsPerDay])

	// Filter available foods based on search query
	useEffect(() => {
		if (searchQuery.trim() === '') {
			setFilteredFoods(availableFoods)
		} else {
			const lowercaseQuery = searchQuery.toLowerCase()
			setFilteredFoods(
				availableFoods.filter(
					(food) =>
						food.brand.toLowerCase().includes(lowercaseQuery) ||
						food.type.toLowerCase().includes(lowercaseQuery) ||
						food.description?.toLowerCase().includes(lowercaseQuery)
				)
			)
		}
	}, [searchQuery, availableFoods])

	// Handle dog selection
	useEffect(() => {
		if (selectedDog && currentPlan && currentPlan.dogId !== selectedDog.id) {
			updatePlanDetails({
				dogId: selectedDog.id,
			})
		}
	}, [selectedDog, currentPlan])

	const handleDogChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const dogId = e.target.value
		if (dogId === '') {
			setSelectedDog(null)
			return
		}

		const dog = availableDogs.find((d) => d.id === dogId)
		if (dog) {
			setSelectedDog(dog)
		}
	}

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updatePlanDetails({ name: e.target.value })
	}

	const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const duration = parseInt(e.target.value, 10)
		if (!isNaN(duration) && duration > 0) {
			updatePlanDetails({ durationDays: duration })
		}
	}

	const handleMealsPerDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const meals = parseInt(e.target.value, 10)
		if (!isNaN(meals) && meals > 0) {
			updatePlanDetails({ mealsPerDay: meals })
		}
	}

	const handleSavePlan = () => {
		savePlan().then(() => {
			if (onClose) {
				onClose()
			}
		})
	}

	const handleAddFood = (food: FoodItem) => {
		// Default quantity based on dog's portion size if available
		let defaultQuantity = new Decimal(100) // Default to 100g or oz per meal

		if (selectedDog && currentPlan) {
			// Calculate individual portion size based on dog's daily needs and meals per day
			defaultQuantity = selectedDog.portionSize.div(currentPlan.mealsPerDay)
		}

		addFoodItem(food, defaultQuantity)
		setShowFoodSelector(false)
	}

	const handleQuantityChange = (
		foodId: string,
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const quantity = parseFloat(e.target.value)
		if (!isNaN(quantity) && quantity > 0) {
			updateFoodItemQuantity(foodId, quantity)
		}
	}

	if (isLoading && !currentPlan) {
		return (
			<div className='flex justify-center p-8'>Loading meal planner...</div>
		)
	}

	if (error) {
		return (
			<div className='rounded-md bg-red-50 p-4'>
				<div className='flex'>
					<div className='text-red-700'>
						<span>Error: {error}</span>
					</div>
				</div>
			</div>
		)
	}

	if (!currentPlan) {
		return <div>No plan loaded</div>
	}

	// Calculate totals
	const totalCost = currentPlan.items.reduce(
		(sum, item) => sum.add(item.totalCost),
		new Decimal(0)
	)

	const totalWeight = currentPlan.items.reduce(
		(sum, item) => sum.add(item.totalQuantity),
		new Decimal(0)
	)

	const dailyCost = totalCost.div(currentPlan.durationDays)

	return (
		<div className='space-y-6'>
			{/* Plan Header */}
			<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
				<div className='space-y-4'>
					<div>
						<label
							htmlFor='planName'
							className='block text-sm font-medium text-gray-700'
						>
							Plan Name
						</label>
						<input
							type='text'
							id='planName'
							value={currentPlan.name}
							onChange={handleNameChange}
							className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
						/>
					</div>

					<div>
						<label
							htmlFor='dogSelect'
							className='block text-sm font-medium text-gray-700'
						>
							Dog
						</label>
						<select
							id='dogSelect'
							value={selectedDog?.id || ''}
							onChange={handleDogChange}
							className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
						>
							<option value=''>Select a dog (optional)</option>
							{availableDogs.map((dog) => (
								<option
									key={dog.id}
									value={dog.id}
								>
									{dog.name} ({dog.weight.toFixed(1)} {weightUnit},{' '}
									{dog.portionSize.toFixed(0)} {measureUnit}/day)
								</option>
							))}
						</select>
					</div>
				</div>

				<div className='space-y-4'>
					<div className='grid grid-cols-2 gap-4'>
						<div>
							<label
								htmlFor='duration'
								className='block text-sm font-medium text-gray-700'
							>
								Duration (days)
							</label>
							<input
								type='number'
								id='duration'
								min='1'
								value={currentPlan.durationDays}
								onChange={handleDurationChange}
								className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
							/>
						</div>

						<div>
							<label
								htmlFor='mealsPerDay'
								className='block text-sm font-medium text-gray-700'
							>
								Meals Per Day
							</label>
							<input
								type='number'
								id='mealsPerDay'
								min='1'
								max='10'
								value={currentPlan.mealsPerDay}
								onChange={handleMealsPerDayChange}
								className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
							/>
						</div>
					</div>

					<div>
						<label
							htmlFor='totalMeals'
							className='block text-sm font-medium text-gray-700'
						>
							Total Meals
						</label>
						<div className='mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm'>
							{currentPlan.durationDays * currentPlan.mealsPerDay} meals
						</div>
					</div>
				</div>
			</div>

			{/* Plan Actions */}
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<div className='flex space-x-2'>
					<button
						type='button'
						onClick={() => setShowFoodSelector(true)}
						className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
					>
						Add Food Item
					</button>

					<button
						type='button'
						onClick={undo}
						disabled={usePlannerStore.getState().history.past.length === 0}
						className='rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50'
					>
						Undo
					</button>

					<button
						type='button'
						onClick={redo}
						disabled={usePlannerStore.getState().history.future.length === 0}
						className='rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50'
					>
						Redo
					</button>
				</div>

				<button
					type='button'
					onClick={handleSavePlan}
					className='rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
				>
					{currentPlan.id ? 'Update Plan' : 'Save Plan'}
				</button>
			</div>

			{/* Food Items */}
			<div className='rounded-lg border border-gray-200 shadow'>
				<div className='border-b border-gray-200 bg-gray-50 px-4 py-3'>
					<h3 className='text-lg font-medium text-gray-700'>Food Items</h3>
				</div>

				{currentPlan.items.length === 0 ? (
					<div className='p-6 text-center text-gray-500'>
						No food items added yet. Click "Add Food Item" to get started.
					</div>
				) : (
					<div className='overflow-x-auto'>
						<table className='min-w-full divide-y divide-gray-200'>
							<thead className='bg-gray-50'>
								<tr>
									<th
										scope='col'
										className='py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
									>
										Brand
									</th>
									<th
										scope='col'
										className='px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
									>
										Type
									</th>
									<th
										scope='col'
										className='px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'
									>
										Per Meal
									</th>
									<th
										scope='col'
										className='px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'
									>
										Total Quantity
									</th>
									<th
										scope='col'
										className='px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'
									>
										Unit Cost
									</th>
									<th
										scope='col'
										className='px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'
									>
										Total Cost
									</th>
									<th
										scope='col'
										className='px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500'
									>
										Actions
									</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-gray-200 bg-white'>
								{currentPlan.items.map((item) => (
									<tr key={item.id}>
										<td className='whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900'>
											{item.brand}
										</td>
										<td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
											{item.type}
										</td>
										<td className='whitespace-nowrap px-3 py-4 text-right text-sm'>
											<div className='flex items-center justify-end'>
												<input
													type='number'
													min='0.1'
													step='0.1'
													value={item.quantityPerMeal.toNumber()}
													onChange={(e) => handleQuantityChange(item.id, e)}
													className='w-20 rounded-md border border-gray-300 px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
												/>
												<span className='ml-1 text-gray-500'>
													{measureUnit}
												</span>
											</div>
										</td>
										<td className='whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500'>
											{item.totalQuantity.toFixed(1)} {measureUnit}
										</td>
										<td className='whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500'>
											{currency}{' '}
											{(
												item.costPerKg || item.cost.div(item.weight).mul(1000)
											).toFixed(2)}
											/kg
										</td>
										<td className='whitespace-nowrap px-3 py-4 text-right text-sm font-medium text-gray-900'>
											{currency} {item.totalCost.toFixed(2)}
										</td>
										<td className='whitespace-nowrap px-3 py-4 text-center text-sm'>
											<button
												type='button'
												onClick={() => removeFoodItem(item.id)}
												className='rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100'
											>
												Remove
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Summary Statistics */}
			{currentPlan.items.length > 0 && (
				<div className='grid grid-cols-1 gap-6 rounded-lg border border-gray-200 bg-gray-50 p-6 shadow md:grid-cols-2 lg:grid-cols-4'>
					<div>
						<h4 className='text-sm font-medium text-gray-500'>Total Cost</h4>
						<p className='mt-1 text-2xl font-semibold text-gray-900'>
							{currency} {totalCost.toFixed(2)}
						</p>
					</div>
					<div>
						<h4 className='text-sm font-medium text-gray-500'>Daily Cost</h4>
						<p className='mt-1 text-2xl font-semibold text-gray-900'>
							{currency} {dailyCost.toFixed(2)}/day
						</p>
					</div>
					<div>
						<h4 className='text-sm font-medium text-gray-500'>Total Weight</h4>
						<p className='mt-1 text-2xl font-semibold text-gray-900'>
							{totalWeight.toFixed(1)} {measureUnit}
						</p>
					</div>
					<div>
						<h4 className='text-sm font-medium text-gray-500'>
							Average Meal Size
						</h4>
						<p className='mt-1 text-2xl font-semibold text-gray-900'>
							{totalWeight
								.div(currentPlan.durationDays * currentPlan.mealsPerDay)
								.toFixed(1)}{' '}
							{measureUnit}
						</p>
					</div>
				</div>
			)}

			{/* Food Selector Modal */}
			{showFoodSelector && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
					<div className='relative max-h-[80vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-6 shadow-xl'>
						<button
							type='button'
							onClick={() => setShowFoodSelector(false)}
							className='absolute right-4 top-4 text-gray-400 hover:text-gray-500'
						>
							<span className='sr-only'>Close</span>
							<svg
								className='h-6 w-6'
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

						<h2 className='text-xl font-semibold text-gray-900'>
							Select Food Item
						</h2>

						<div className='mt-4'>
							<input
								type='text'
								placeholder='Search foods...'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className='block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
							/>
						</div>

						<div className='mt-4 max-h-[60vh] overflow-y-auto'>
							{filteredFoods.length === 0 ? (
								<p className='py-4 text-center text-gray-500'>
									No matching food items found
								</p>
							) : (
								<ul className='divide-y divide-gray-200'>
									{filteredFoods.map((food) => (
										<li
											key={food.id}
											className='cursor-pointer px-4 py-3 hover:bg-gray-50'
											onClick={() => handleAddFood(food)}
										>
											<div className='flex items-start justify-between'>
												<div>
													<p className='font-medium text-gray-900'>
														{food.brand}
													</p>
													<p className='text-sm text-gray-500'>{food.type}</p>
													{food.description && (
														<p className='mt-1 text-xs text-gray-500'>
															{food.description}
														</p>
													)}
												</div>
												<div className='text-right'>
													<p className='text-sm font-medium text-gray-900'>
														{currency} {new Decimal(food.cost).toFixed(2)} (
														{currency}{' '}
														{new Decimal(food.cost)
															.div(food.weight)
															.mul(1000)
															.toFixed(2)}
														/kg)
													</p>
													<p className='text-xs text-gray-500'>
														{new Decimal(food.weight).toFixed(0)} {measureUnit}{' '}
														package
													</p>
												</div>
											</div>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default MealPlanner

import { Dog, FoodItem, MealPlan } from '@prisma/client'
import { Decimal } from 'decimal.js'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Extended types with calculated fields
interface PlannerFoodItem
	extends Omit<FoodItem, 'weight' | 'cost' | 'protein' | 'fat' | 'fiber'> {
	weight: Decimal
	cost: Decimal
	protein: Decimal | null
	fat: Decimal | null
	fiber: Decimal | null
	quantityPerMeal: Decimal
	totalQuantity: Decimal
	totalCost: Decimal
	costPerKg: Decimal
	numberOfMeals: number // New field to store how many meals this food appears in
}

interface PlannerMealPlan extends Omit<MealPlan, 'totalCost'> {
	totalCost: Decimal
	items: PlannerFoodItem[]
}

// History tracking for undo/redo
interface HistoryState {
	past: PlannerMealPlan[]
	future: PlannerMealPlan[]
}

interface PlannerState {
	currentPlan: PlannerMealPlan | null
	savedPlans: PlannerMealPlan[]
	availableDogs: Dog[]
	availableFoods: FoodItem[]
	history: HistoryState
	isLoading: boolean
	error: string | null
	weightUnit: 'kg' | 'lbs'
	measureUnit: 'g' | 'oz'
	currency: string
}

interface PlannerActions {
	// Data fetching
	fetchAvailableDogs: () => Promise<void>
	fetchAvailableFoods: () => Promise<void>
	fetchSavedPlans: () => Promise<void>
	clearError: () => void

	// Plan creation and management
	createNewPlan: (initialData: Partial<MealPlan>) => void
	savePlan: () => Promise<void>
	loadPlan: (planId: string) => Promise<void>
	updatePlanDetails: (updates: Partial<MealPlan>) => void
	deletePlan: (planId: string) => Promise<void>

	// Food item management within plan
	addFoodItem: (
		foodItem: FoodItem,
		quantityPerMeal: number | Decimal,
		numberOfMeals?: number
	) => void
	updateFoodItemQuantity: (
		foodItemId: string,
		quantityPerMeal: number | Decimal
	) => void
	updateFoodItemMealCount: (foodItemId: string, numberOfMeals: number) => void
	removeFoodItem: (foodItemId: string) => void

	// Unit conversion
	setUnits: (
		weightUnit: 'kg' | 'lbs',
		measureUnit: 'g' | 'oz',
		currency: string
	) => void

	// History management (undo/redo)
	undo: () => void
	redo: () => void
	clearHistory: () => void
}

type PlannerStore = PlannerState & PlannerActions

// Convert Decimal objects for serialization in persist middleware
const decimalReplacer = (_: string, value: any) => {
	if (value instanceof Decimal) {
		return { __decimal: value.toString() }
	}
	return value
}

const decimalReviver = (_: string, value: any) => {
	if (value && typeof value === 'object' && '__decimal' in value) {
		return new Decimal(value.__decimal)
	}
	return value
}

export const usePlannerStore = create<PlannerStore>()(
	persist(
		immer((set, get) => ({
			// Initial state
			currentPlan: null,
			savedPlans: [],
			availableDogs: [],
			availableFoods: [],
			history: {
				past: [],
				future: [],
			},
			isLoading: false,
			error: null,
			weightUnit: 'kg',
			measureUnit: 'g',
			currency: 'GBP',

			// Actions
			clearError: () => {
				set((state) => {
					state.error = null
				})
			},

			fetchAvailableDogs: async () => {
				set((state) => {
					state.isLoading = true
					state.error = null
				})

				try {
					const response = await fetch('/api/dogs')

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}))
						throw new Error(errorData.error || 'Failed to fetch dogs')
					}

					const dogs = await response.json()

					// Handle empty array case
					if (!Array.isArray(dogs)) {
						throw new Error('Invalid response format for dogs')
					}

					// Convert string decimal values to Decimal objects
					const processedDogs = dogs.map((dog: any) => ({
						...dog,
						weight: new Decimal(dog.weight),
						age: new Decimal(dog.age),
						portionSize: new Decimal(dog.portionSize),
					}))

					set((state) => {
						state.availableDogs = processedDogs
						state.isLoading = false
					})
				} catch (error) {
					console.error('Error fetching dogs:', error)
					set((state) => {
						state.isLoading = false
						state.error = (error as Error).message
						// Still keep empty array in case of error
						state.availableDogs = []
					})
				}
			},

			fetchAvailableFoods: async () => {
				set((state) => {
					state.isLoading = true
					state.error = null
				})

				try {
					const response = await fetch('/api/inventory?active=true')

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}))
						throw new Error(errorData.error || 'Failed to fetch food items')
					}

					const foods = await response.json()

					// Handle empty array case
					if (!Array.isArray(foods)) {
						throw new Error('Invalid response format for food items')
					}

					// Convert string decimal values to Decimal objects
					const processedFoods = foods.map((food: any) => ({
						...food,
						weight: new Decimal(food.weight),
						cost: new Decimal(food.cost),
						protein: food.protein ? new Decimal(food.protein) : null,
						fat: food.fat ? new Decimal(food.fat) : null,
						fiber: food.fiber ? new Decimal(food.fiber) : null,
					}))

					set((state) => {
						state.availableFoods = processedFoods
						state.isLoading = false
					})
				} catch (error) {
					console.error('Error fetching food items:', error)
					set((state) => {
						state.isLoading = false
						state.error = (error as Error).message
						// Still keep empty array in case of error
						state.availableFoods = []
					})
				}
			},

			fetchSavedPlans: async () => {
				set((state) => {
					state.isLoading = true
					state.error = null
				})

				try {
					const response = await fetch('/api/mealplans')

					// For 404 or empty results, just use an empty array without error
					if (response.status === 404) {
						set((state) => {
							state.savedPlans = []
							state.isLoading = false
							state.error = null
						})
						return
					}

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}))
						throw new Error(errorData.error || 'Failed to fetch meal plans')
					}

					const plans = await response.json()

					// Handle empty array case
					if (!Array.isArray(plans)) {
						set((state) => {
							state.savedPlans = []
							state.isLoading = false
							state.error = null
						})
						return
					}

					// Process plans and convert decimal values
					const processedPlans = plans.map((plan: any) => ({
						...plan,
						totalCost: new Decimal(plan.totalCost || 0),
						items: Array.isArray(plan.items)
							? plan.items
									.map((item: any) => {
										// Ensure foodItem exists to prevent errors
										if (!item.foodItem) {
											return null
										}

										// Calculate cost per kg
										const costPerUnit = new Decimal(
											item.foodItem.cost || 0
										).div(
											new Decimal(item.foodItem.weight || 1) // Avoid division by zero
										)
										const costPerKg = costPerUnit.mul(1000)

										// Extract the number of meals this item is used in
										// If not available in the data, calculate from quantity
										const mealCount =
											item.numberOfMeals ||
											Math.ceil(
												new Decimal(item.totalQuantity || 0)
													.div(new Decimal(item.quantityPerMeal || 1))
													.toNumber()
											)

										return {
											...item.foodItem,
											weight: new Decimal(item.foodItem.weight || 0),
											cost: new Decimal(item.foodItem.cost || 0),
											protein: item.foodItem.protein
												? new Decimal(item.foodItem.protein)
												: null,
											fat: item.foodItem.fat
												? new Decimal(item.foodItem.fat)
												: null,
											fiber: item.foodItem.fiber
												? new Decimal(item.foodItem.fiber)
												: null,
											quantityPerMeal: new Decimal(item.quantityPerMeal || 0),
											totalQuantity: new Decimal(item.totalQuantity || 0),
											totalCost: costPerUnit.mul(
												new Decimal(item.totalQuantity || 0)
											),
											costPerKg: costPerKg, // Add cost per kg
											numberOfMeals: mealCount,
										}
									})
									.filter(Boolean)
							: [], // Filter out null items
					}))

					set((state) => {
						state.savedPlans = processedPlans
						state.isLoading = false
						state.error = null
					})
				} catch (error) {
					console.error('Error fetching meal plans:', error)
					set((state) => {
						state.isLoading = false
						state.error = (error as Error).message
						// Keep empty array in case of error
						state.savedPlans = []
					})
				}
			},

			createNewPlan: (initialData) => {
				// Save current plan to history before creating new one
				const { currentPlan } = get()

				if (currentPlan) {
					set((state) => {
						state.history.past.push(currentPlan)
						state.history.future = []
					})
				}

				// Clear any existing errors
				set((state) => {
					state.error = null
				})

				const emptyPlan: PlannerMealPlan = {
					id: '', // Will be assigned when saved
					createdAt: new Date(),
					updatedAt: new Date(),
					name: initialData.name || 'New Meal Plan',
					startDate: initialData.startDate || null,
					endDate: initialData.endDate || null,
					durationDays: initialData.durationDays || 7,
					mealsPerDay: initialData.mealsPerDay || 2,
					dogId: initialData.dogId || null,
					totalCost: new Decimal(0),
					notes: initialData.notes || '',
					items: [],
				}

				set((state) => {
					state.currentPlan = emptyPlan
				})
			},

			savePlan: async () => {
				const { currentPlan } = get()
				if (!currentPlan) return

				set((state) => {
					state.isLoading = true
					state.error = null
				})

				try {
					// Convert plan to proper format for API
					const planToSave = {
						...currentPlan,
						items: currentPlan.items.map((item) => ({
							foodItemId: item.id,
							quantityPerMeal: item.quantityPerMeal.toString(),
							totalQuantity: item.totalQuantity.toString(),
							numberOfMeals: item.numberOfMeals,
						})),
					}

					// Log data being sent to API
					console.log(
						'Submitting plan data:',
						JSON.stringify(planToSave, null, 2)
					)

					const method = currentPlan.id ? 'PUT' : 'POST'
					const url = currentPlan.id
						? `/api/mealplans/${currentPlan.id}`
						: '/api/mealplans'

					const response = await fetch(url, {
						method,
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(planToSave),
					})

					// Check the raw response text first for debugging
					const responseText = await response.text()
					console.log(`API ${method} response status:`, response.status)
					console.log('Raw API response:', responseText)

					// Try to parse the response as JSON
					let responseData
					try {
						responseData = responseText ? JSON.parse(responseText) : {}
					} catch (parseError) {
						console.error('Error parsing API response:', parseError)
						throw new Error(
							`API returned invalid JSON: ${responseText.substring(0, 100)}...`
						)
					}

					if (!response.ok) {
						// Extract detailed error message if available
						const errorMessage =
							responseData.error ||
							responseData.message ||
							`Failed to ${currentPlan.id ? 'update' : 'create'} meal plan`

						// Include validation details if available
						const errorDetails = responseData.details
							? `: ${JSON.stringify(responseData.details)}`
							: ''

						throw new Error(errorMessage + errorDetails)
					}

					const savedPlan = responseData

					// Process saved plan with proper decimal values
					const processedPlan: PlannerMealPlan = {
						...savedPlan,
						totalCost: new Decimal(savedPlan.totalCost || 0),
						items: Array.isArray(savedPlan.items)
							? savedPlan.items
									.map((item: any) => {
										// Skip items with missing foodItem
										if (!item.foodItem) {
											console.warn('Item missing foodItem:', item)
											return null
										}

										// Get the number of meals this food appears in
										const mealCount =
											item.numberOfMeals ||
											Math.ceil(
												new Decimal(item.totalQuantity || 0)
													.div(new Decimal(item.quantityPerMeal || 1))
													.toNumber()
											)

										return {
											...item.foodItem,
											weight: new Decimal(item.foodItem.weight || 0),
											cost: new Decimal(item.foodItem.cost || 0),
											protein: item.foodItem.protein
												? new Decimal(item.foodItem.protein)
												: null,
											fat: item.foodItem.fat
												? new Decimal(item.foodItem.fat)
												: null,
											fiber: item.foodItem.fiber
												? new Decimal(item.foodItem.fiber)
												: null,
											quantityPerMeal: new Decimal(item.quantityPerMeal || 0),
											totalQuantity: new Decimal(item.totalQuantity || 0),
											totalCost: new Decimal(item.foodItem.cost || 0).mul(
												new Decimal(item.totalQuantity || 0)
											),
											costPerKg: new Decimal(item.foodItem.cost || 0)
												.div(new Decimal(item.foodItem.weight || 1))
												.mul(1000),
											numberOfMeals: mealCount,
										}
									})
									.filter(Boolean)
							: [], // Filter out null items
					}

					set((state) => {
						state.currentPlan = processedPlan
						state.error = null

						// Update saved plans list if this is a new plan
						if (!currentPlan.id) {
							state.savedPlans.push(processedPlan)
						} else {
							// Update existing plan in savedPlans
							const index = state.savedPlans.findIndex(
								(p) => p.id === processedPlan.id
							)
							if (index !== -1) {
								state.savedPlans[index] = processedPlan
							}
						}

						state.isLoading = false

						// Add to history
						state.history.past.push(processedPlan)
						state.history.future = []
					})
				} catch (error) {
					console.error('Error saving meal plan:', error)
					set((state) => {
						state.isLoading = false
						state.error = (error as Error).message
					})
				}
			},

			loadPlan: async (planId) => {
				set((state) => {
					state.isLoading = true
					state.error = null
				})

				try {
					const response = await fetch(`/api/mealplans/${planId}`)

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}))
						throw new Error(errorData.error || 'Failed to load meal plan')
					}

					const plan = await response.json()

					// Process plan with proper decimal values
					const processedPlan: PlannerMealPlan = {
						...plan,
						totalCost: new Decimal(plan.totalCost || 0),
						items: Array.isArray(plan.items)
							? plan.items
									.map((item: any) => {
										// Skip items with missing foodItem
										if (!item.foodItem) return null

										// Calculate cost per kg
										const costPerUnit = new Decimal(item.foodItem.cost).div(
											new Decimal(item.foodItem.weight)
										)
										const costPerKg = costPerUnit.mul(1000)

										// Get the number of meals this food appears in
										const mealCount =
											item.numberOfMeals ||
											Math.ceil(
												new Decimal(item.totalQuantity || 0)
													.div(new Decimal(item.quantityPerMeal || 1))
													.toNumber()
											)

										return {
											...item.foodItem,
											weight: new Decimal(item.foodItem.weight || 0),
											cost: new Decimal(item.foodItem.cost || 0),
											protein: item.foodItem.protein
												? new Decimal(item.foodItem.protein)
												: null,
											fat: item.foodItem.fat
												? new Decimal(item.foodItem.fat)
												: null,
											fiber: item.foodItem.fiber
												? new Decimal(item.foodItem.fiber)
												: null,
											quantityPerMeal: new Decimal(item.quantityPerMeal || 0),
											totalQuantity: new Decimal(item.totalQuantity || 0),
											totalCost: costPerUnit.mul(
												new Decimal(item.totalQuantity || 0)
											),
											costPerKg: costPerKg, // Add cost per kg
											numberOfMeals: mealCount,
										}
									})
									.filter(Boolean)
							: [], // Filter out null items
					}

					// Save current plan to history before loading new one
					const { currentPlan } = get()

					set((state) => {
						if (currentPlan) {
							state.history.past.push(currentPlan)
						}
						state.history.future = []
						state.currentPlan = processedPlan
						state.isLoading = false
						state.error = null
					})
				} catch (error) {
					console.error(`Error loading meal plan ${planId}:`, error)
					set((state) => {
						state.isLoading = false
						state.error = (error as Error).message
					})
				}
			},

			updatePlanDetails: (updates) => {
				const { currentPlan } = get()
				if (!currentPlan) return

				// Save current state to history before updating
				set((state) => {
					state.history.past.push(currentPlan)
					state.history.future = []

					if (state.currentPlan) {
						Object.assign(state.currentPlan, updates)
						state.currentPlan.updatedAt = new Date()

						// Recalculate quantities if duration or meals per day changed
						if (
							updates.durationDays !== undefined ||
							updates.mealsPerDay !== undefined
						) {
							state.currentPlan.items.forEach((item) => {
								// Preserve quantity per meal and number of meals but update total based on new meal count
								const durationDays =
									updates.durationDays || state.currentPlan!.durationDays
								const mealsPerDay =
									updates.mealsPerDay || state.currentPlan!.mealsPerDay
								const totalMeals = durationDays * mealsPerDay

								// Adjust numberOfMeals if it exceeds the new total meals
								if (item.numberOfMeals > totalMeals) {
									item.numberOfMeals = totalMeals
								}

								// Recalculate total quantity based on meals this food appears in
								item.totalQuantity = item.quantityPerMeal.mul(
									item.numberOfMeals
								)
								item.totalCost = item.cost
									.div(item.weight)
									.mul(item.totalQuantity)
							})

							// Recalculate total plan cost
							recalculateTotalCost(state.currentPlan)
						}
					}
				})
			},

			deletePlan: async (planId) => {
				set((state) => {
					state.isLoading = true
					state.error = null
				})

				try {
					const response = await fetch(`/api/mealplans/${planId}`, {
						method: 'DELETE',
					})

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}))
						throw new Error(errorData.error || 'Failed to delete meal plan')
					}

					set((state) => {
						// Remove from saved plans
						state.savedPlans = state.savedPlans.filter(
							(plan) => plan.id !== planId
						)

						// Clear current plan if it was the deleted one
						if (state.currentPlan && state.currentPlan.id === planId) {
							state.currentPlan = null
						}

						state.isLoading = false
						state.error = null
					})
				} catch (error) {
					console.error(`Error deleting meal plan ${planId}:`, error)
					set((state) => {
						state.isLoading = false
						state.error = (error as Error).message
					})
				}
			},

			addFoodItem: (foodItem, quantityPerMeal, numberOfMeals) => {
				const { currentPlan } = get()
				if (!currentPlan) return

				// Convert quantity to Decimal if it's not already
				const decimalQuantity =
					quantityPerMeal instanceof Decimal
						? quantityPerMeal
						: new Decimal(quantityPerMeal)

				// Determine how many meals this food will be used in
				const totalMeals = currentPlan.durationDays * currentPlan.mealsPerDay
				const mealCount =
					numberOfMeals !== undefined
						? Math.min(numberOfMeals, totalMeals) // Don't exceed total meals
						: totalMeals // Default: use in all meals

				// Calculate total quantity based on quantity per meal and number of meals
				const totalQuantity = decimalQuantity.mul(mealCount)

				// Calculate cost per gram/ounce (package cost divided by package weight)
				const costPerUnit = new Decimal(foodItem.cost).div(foodItem.weight)

				// Store cost per kg for display purposes (cost per unit * 1000)
				const costPerKg = costPerUnit.mul(1000)

				// Calculate total cost for this item (cost per unit * quantity used)
				const totalCost = costPerUnit.mul(totalQuantity)

				// Create the new food item for the plan
				const newPlannerFoodItem: PlannerFoodItem = {
					...foodItem,
					// Convert decimals if they're not already Decimal instances
					weight:
						foodItem.weight instanceof Decimal
							? foodItem.weight
							: new Decimal(foodItem.weight),
					cost:
						foodItem.cost instanceof Decimal
							? foodItem.cost
							: new Decimal(foodItem.cost),
					protein: foodItem.protein
						? foodItem.protein instanceof Decimal
							? foodItem.protein
							: new Decimal(foodItem.protein)
						: null,
					fat: foodItem.fat
						? foodItem.fat instanceof Decimal
							? foodItem.fat
							: new Decimal(foodItem.fat)
						: null,
					fiber: foodItem.fiber
						? foodItem.fiber instanceof Decimal
							? foodItem.fiber
							: new Decimal(foodItem.fiber)
						: null,
					quantityPerMeal: decimalQuantity,
					totalQuantity,
					totalCost,
					costPerKg,
					numberOfMeals: mealCount,
				}

				// Save current state to history
				set((state) => {
					if (state.currentPlan) {
						state.history.past.push(state.currentPlan)
						state.history.future = []

						// Add the new item
						state.currentPlan.items.push(newPlannerFoodItem)

						// Recalculate total plan cost
						recalculateTotalCost(state.currentPlan)
						state.currentPlan.updatedAt = new Date()
					}
				})
			},

			updateFoodItemQuantity: (foodItemId, quantityPerMeal) => {
				const { currentPlan } = get()
				if (!currentPlan) return

				// Convert quantity to Decimal if it's not already
				const decimalQuantity =
					quantityPerMeal instanceof Decimal
						? quantityPerMeal
						: new Decimal(quantityPerMeal)

				// Save current state to history
				set((state) => {
					if (state.currentPlan) {
						state.history.past.push(state.currentPlan)
						state.history.future = []

						const itemIndex = state.currentPlan.items.findIndex(
							(item) => item.id === foodItemId
						)
						if (itemIndex === -1) return

						// Keep the same number of meals, just update the quantity per meal
						const numberOfMeals =
							state.currentPlan.items[itemIndex].numberOfMeals

						// Calculate new total quantity based on quantity per meal and number of meals
						const totalQuantity = decimalQuantity.mul(numberOfMeals)

						// Calculate cost per gram/ounce (package cost divided by package weight)
						const costPerUnit = state.currentPlan.items[itemIndex].cost.div(
							state.currentPlan.items[itemIndex].weight
						)

						// Store cost per kg for display purposes (cost per unit * 1000)
						const costPerKg = costPerUnit.mul(1000)

						// Update the item
						state.currentPlan.items[itemIndex].quantityPerMeal = decimalQuantity
						state.currentPlan.items[itemIndex].totalQuantity = totalQuantity
						state.currentPlan.items[itemIndex].totalCost =
							costPerUnit.mul(totalQuantity)
						state.currentPlan.items[itemIndex].costPerKg = costPerKg

						// Recalculate total plan cost
						recalculateTotalCost(state.currentPlan)
						state.currentPlan.updatedAt = new Date()
					}
				})
			},

			updateFoodItemMealCount: (foodItemId, mealCount) => {
				const { currentPlan } = get()
				if (!currentPlan) return

				// Save current state to history
				set((state) => {
					if (state.currentPlan) {
						state.history.past.push(state.currentPlan)
						state.history.future = []

						const itemIndex = state.currentPlan.items.findIndex(
							(item) => item.id === foodItemId
						)
						if (itemIndex === -1) return

						const totalMeals =
							state.currentPlan.durationDays * state.currentPlan.mealsPerDay
						// Ensure meal count doesn't exceed total meals in plan
						const validMealCount = Math.min(mealCount, totalMeals)

						// Keep the same quantity per meal, update the number of meals and total
						const quantityPerMeal =
							state.currentPlan.items[itemIndex].quantityPerMeal

						// Calculate new total quantity based on quantity per meal and number of meals
						const totalQuantity = quantityPerMeal.mul(validMealCount)

						// Calculate cost per gram/ounce (package cost divided by package weight)
						const costPerUnit = state.currentPlan.items[itemIndex].cost.div(
							state.currentPlan.items[itemIndex].weight
						)

						// Update the item
						state.currentPlan.items[itemIndex].numberOfMeals = validMealCount
						state.currentPlan.items[itemIndex].totalQuantity = totalQuantity
						state.currentPlan.items[itemIndex].totalCost =
							costPerUnit.mul(totalQuantity)

						// Recalculate total plan cost
						recalculateTotalCost(state.currentPlan)
						state.currentPlan.updatedAt = new Date()
					}
				})
			},

			removeFoodItem: (foodItemId) => {
				const { currentPlan } = get()
				if (!currentPlan) return

				// Save current state to history
				set((state) => {
					if (state.currentPlan) {
						state.history.past.push(state.currentPlan)
						state.history.future = []

						// Remove the item
						state.currentPlan.items = state.currentPlan.items.filter(
							(item) => item.id !== foodItemId
						)

						// Recalculate total plan cost
						recalculateTotalCost(state.currentPlan)
						state.currentPlan.updatedAt = new Date()
					}
				})
			},

			setUnits: (weightUnit, measureUnit, currency) => {
				set((state) => {
					state.weightUnit = weightUnit
					state.measureUnit = measureUnit
					state.currency = currency
				})
			},

			undo: () => {
				const { history, currentPlan } = get()
				if (history.past.length === 0) return

				set((state) => {
					// Get the last state from the past
					const previous = state.history.past.pop()

					if (previous && state.currentPlan) {
						// Add current state to future
						state.history.future.push(state.currentPlan)

						// Set the previous state as current
						state.currentPlan = previous
					}
				})
			},

			redo: () => {
				const { history } = get()
				if (history.future.length === 0) return

				set((state) => {
					// Get the next state from the future
					const next = state.history.future.pop()

					if (next && state.currentPlan) {
						// Add current state to past
						state.history.past.push(state.currentPlan)

						// Set the next state as current
						state.currentPlan = next
					}
				})
			},

			clearHistory: () => {
				set((state) => {
					state.history = {
						past: [],
						future: [],
					}
				})
			},
		})),
		{
			name: 'rawdawg-planner',
			storage: createJSONStorage(() => localStorage),
			partialize: (state: PlannerState) => ({
				weightUnit: state.weightUnit,
				measureUnit: state.measureUnit,
				currency: state.currency,
			}),
			// @ts-ignore - serialize and deserialize are valid but TypeScript doesn't recognize them
			serialize: (state: Record<string, any>) =>
				JSON.stringify(state, decimalReplacer),
			deserialize: (str: string) => JSON.parse(str, decimalReviver),
		}
	)
)

// Helper function to recalculate the total cost of a meal plan
const recalculateTotalCost = (plan: PlannerMealPlan) => {
	plan.totalCost = plan.items.reduce(
		(total, item) => total.add(item.totalCost),
		new Decimal(0)
	)
}

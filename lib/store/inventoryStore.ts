import { FoodItem } from '@prisma/client'
import { Decimal } from 'decimal.js'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Extend FoodItem with additional UI state
interface InventoryFoodItem extends FoodItem {
	quantity: Decimal
	isSelected?: boolean
}

interface InventoryState {
	items: InventoryFoodItem[]
	filteredItems: InventoryFoodItem[]
	isLoading: boolean
	error: string | null
	filter: {
		search: string
		brands: string[]
		types: string[]
		onlyActive: boolean
		sortBy: 'brand' | 'type' | 'cost' | 'protein' | 'added'
		sortDirection: 'asc' | 'desc'
	}
}

interface InventoryActions {
	// Data fetching
	fetchItems: () => Promise<void>
	addItem: (
		item: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'>
	) => Promise<void>
	updateItem: (id: string, updates: Partial<FoodItem>) => Promise<void>
	deleteItem: (id: string) => Promise<void>
	toggleItemActive: (id: string) => Promise<void>

	// UI state management
	setFilter: (filter: Partial<InventoryState['filter']>) => void
	clearFilters: () => void
	toggleItemSelection: (id: string) => void
	selectAllItems: () => void
	deselectAllItems: () => void
	updateItemQuantity: (id: string, quantity: number | Decimal) => void
}

type InventoryStore = InventoryState & InventoryActions

// Helper function to sanitize form data before sending to API
const sanitizeFormData = (data: any) => {
	// Convert empty strings to null for optional fields
	return {
		...data,
		description: data.description === '' ? null : data.description,
		imageUrl: data.imageUrl === '' ? null : data.imageUrl,
		protein: data.protein === '' ? null : data.protein,
		fat: data.fat === '' ? null : data.fat,
		fiber: data.fiber === '' ? null : data.fiber,
	}
}

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

export const useInventoryStore = create<InventoryStore>()(
	persist(
		immer((set, get) => ({
			// Initial state
			items: [],
			filteredItems: [],
			isLoading: false,
			error: null,
			filter: {
				search: '',
				brands: [],
				types: [],
				onlyActive: false, // Changed from true to false to show all items by default
				sortBy: 'added',
				sortDirection: 'desc',
			},

			// Actions
			fetchItems: async () => {
				set((state) => {
					state.isLoading = true
					state.error = null
				})

				try {
					// Request all items, regardless of active status
					const response = await fetch('/api/inventory?active=all')

					if (!response.ok) {
						throw new Error('Failed to fetch inventory items')
					}

					const items = await response.json()
					console.log('Fetched items:', items) // Add logging to debug

					// Convert string decimal values to Decimal objects
					const processedItems = items.map((item: any) => ({
						...item,
						weight: new Decimal(item.weight),
						cost: new Decimal(item.cost),
						protein: item.protein ? new Decimal(item.protein) : null,
						fat: item.fat ? new Decimal(item.fat) : null,
						fiber: item.fiber ? new Decimal(item.fiber) : null,
						quantity: new Decimal(0),
					}))

					set((state) => {
						state.items = processedItems
						state.isLoading = false
						// Apply current filters to update filteredItems
						applyFilters(state)
					})
				} catch (error) {
					console.error('Error fetching inventory:', error) // Add more detailed logging
					set((state) => {
						state.isLoading = false
						state.error = (error as Error).message
					})
				}
			},

			addItem: async (newItem) => {
				set((state) => {
					state.isLoading = true
					state.error = null
				})

				try {
					// Sanitize form data before sending to API
					const sanitizedItem = sanitizeFormData(newItem)

					const response = await fetch('/api/inventory', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(sanitizedItem),
					})

					if (!response.ok) {
						throw new Error('Failed to add item to inventory')
					}

					const addedItem = await response.json()

					// Convert string decimal values to Decimal objects
					const processedItem = {
						...addedItem,
						weight: new Decimal(addedItem.weight),
						cost: new Decimal(addedItem.cost),
						protein: addedItem.protein ? new Decimal(addedItem.protein) : null,
						fat: addedItem.fat ? new Decimal(addedItem.fat) : null,
						fiber: addedItem.fiber ? new Decimal(addedItem.fiber) : null,
						quantity: new Decimal(0),
					}

					set((state) => {
						state.items.push(processedItem)
						state.isLoading = false
						applyFilters(state)
					})
				} catch (error) {
					set((state) => {
						state.isLoading = false
						state.error = (error as Error).message
					})
				}
			},

			updateItem: async (id, updates) => {
				set((state) => {
					state.isLoading = true
					state.error = null
				})

				try {
					// Sanitize form data before sending to API
					const sanitizedUpdates = sanitizeFormData(updates)

					const response = await fetch(`/api/inventory/${id}`, {
						method: 'PATCH',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(sanitizedUpdates),
					})

					if (!response.ok) {
						throw new Error('Failed to update inventory item')
					}

					const updatedItem = await response.json()

					// Convert string decimal values to Decimal objects
					const processedUpdates = {
						...updatedItem,
						weight: new Decimal(updatedItem.weight),
						cost: new Decimal(updatedItem.cost),
						protein: updatedItem.protein
							? new Decimal(updatedItem.protein)
							: null,
						fat: updatedItem.fat ? new Decimal(updatedItem.fat) : null,
						fiber: updatedItem.fiber ? new Decimal(updatedItem.fiber) : null,
					}

					set((state) => {
						const index = state.items.findIndex((item) => item.id === id)
						if (index !== -1) {
							// Preserve quantity and selection state
							const quantity = state.items[index].quantity
							const isSelected = state.items[index].isSelected

							state.items[index] = {
								...processedUpdates,
								quantity,
								isSelected,
							}
						}
						state.isLoading = false
						applyFilters(state)
					})
				} catch (error) {
					set((state) => {
						state.isLoading = false
						state.error = (error as Error).message
					})
				}
			},

			deleteItem: async (id) => {
				set((state) => {
					state.isLoading = true
					state.error = null
				})

				try {
					const response = await fetch(`/api/inventory/${id}`, {
						method: 'DELETE',
					})

					if (!response.ok) {
						throw new Error('Failed to delete inventory item')
					}

					set((state) => {
						state.items = state.items.filter((item) => item.id !== id)
						state.isLoading = false
						applyFilters(state)
					})
				} catch (error) {
					set((state) => {
						state.isLoading = false
						state.error = (error as Error).message
					})
				}
			},

			toggleItemActive: async (id) => {
				const item = get().items.find((item) => item.id === id)
				if (!item) return

				await get().updateItem(id, { isActive: !item.isActive })
			},

			setFilter: (filterUpdates) => {
				set((state) => {
					state.filter = { ...state.filter, ...filterUpdates }
					applyFilters(state)
				})
			},

			clearFilters: () => {
				set((state) => {
					state.filter = {
						search: '',
						brands: [],
						types: [],
						onlyActive: true,
						sortBy: 'added',
						sortDirection: 'desc',
					}
					applyFilters(state)
				})
			},

			toggleItemSelection: (id) => {
				set((state) => {
					const index = state.items.findIndex((item) => item.id === id)
					if (index !== -1) {
						state.items[index].isSelected = !state.items[index].isSelected
					}
					// Update selection in filtered items as well
					const filteredIndex = state.filteredItems.findIndex(
						(item) => item.id === id
					)
					if (filteredIndex !== -1) {
						state.filteredItems[filteredIndex].isSelected =
							state.items[index].isSelected
					}
				})
			},

			selectAllItems: () => {
				set((state) => {
					state.items.forEach((item) => {
						item.isSelected = true
					})
					state.filteredItems.forEach((item) => {
						item.isSelected = true
					})
				})
			},

			deselectAllItems: () => {
				set((state) => {
					state.items.forEach((item) => {
						item.isSelected = false
					})
					state.filteredItems.forEach((item) => {
						item.isSelected = false
					})
				})
			},

			updateItemQuantity: (id, quantity) => {
				const decimalQuantity =
					quantity instanceof Decimal ? quantity : new Decimal(quantity)

				set((state) => {
					const index = state.items.findIndex((item) => item.id === id)
					if (index !== -1) {
						state.items[index].quantity = decimalQuantity
					}

					// Update quantity in filtered items as well
					const filteredIndex = state.filteredItems.findIndex(
						(item) => item.id === id
					)
					if (filteredIndex !== -1) {
						state.filteredItems[filteredIndex].quantity = decimalQuantity
					}
				})
			},
		})),
		{
			name: 'rawdawg-inventory',
			storage: createJSONStorage(() => localStorage),
			partialize: (state: InventoryState) => ({
				filter: state.filter,
			}),
			// @ts-ignore - serialize and deserialize are valid but TypeScript doesn't recognize them
			serialize: (state: Record<string, any>) =>
				JSON.stringify(state, decimalReplacer),
			deserialize: (str: string) => JSON.parse(str, decimalReviver),
		}
	)
)

// Helper function to apply filters and sorting
const applyFilters = (state: InventoryState) => {
	const { items, filter } = state
	let filtered = [...items]

	// Apply active filter
	if (filter.onlyActive) {
		filtered = filtered.filter((item) => item.isActive)
	}

	// Apply search filter
	if (filter.search) {
		const searchLower = filter.search.toLowerCase()
		filtered = filtered.filter(
			(item) =>
				item.brand.toLowerCase().includes(searchLower) ||
				item.type.toLowerCase().includes(searchLower) ||
				item.description?.toLowerCase().includes(searchLower)
		)
	}

	// Apply brand filter
	if (filter.brands.length > 0) {
		filtered = filtered.filter((item) => filter.brands.includes(item.brand))
	}

	// Apply type filter
	if (filter.types.length > 0) {
		filtered = filtered.filter((item) => filter.types.includes(item.type))
	}

	// Apply sorting
	filtered.sort((a, b) => {
		const direction = filter.sortDirection === 'asc' ? 1 : -1

		switch (filter.sortBy) {
			case 'brand':
				return direction * a.brand.localeCompare(b.brand)
			case 'type':
				return direction * a.type.localeCompare(b.type)
			case 'cost':
				return direction * a.cost.comparedTo(b.cost)
			case 'protein':
				// Handle null values in protein
				if (a.protein === null && b.protein === null) return 0
				if (a.protein === null) return direction
				if (b.protein === null) return -direction
				return direction * a.protein.comparedTo(b.protein)
			case 'added':
			default:
				return (
					direction *
					(new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
				)
		}
	})

	state.filteredItems = filtered
}

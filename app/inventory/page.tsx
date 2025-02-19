'use client'

import FoodItemForm from '@/components/forms/FoodItemForm'
import InventoryDisplay from '@/components/inventory/InventoryDisplay'
import { useInventoryStore, usePreferencesStore } from '@/lib/store'
import { FoodItem } from '@prisma/client'
import { useEffect, useState } from 'react'

export default function InventoryPage() {
	const { fetchItems, addItem, updateItem, error, isLoading, items } =
		useInventoryStore()
	const { settings, fetchPreferences } = usePreferencesStore()

	const [showAddForm, setShowAddForm] = useState(false)
	const [editingItem, setEditingItem] = useState<FoodItem | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [debugInfo, setDebugInfo] = useState({ items: 0, loaded: false })

	useEffect(() => {
		fetchPreferences()
		fetchItems().then(() => {
			// Add debugging info after items are loaded
			const store = useInventoryStore.getState()
			setDebugInfo({
				items: store.items.length,
				loaded: true,
			})
		})
	}, [fetchPreferences, fetchItems])

	const handleAddItem = async (itemData: any) => {
		setIsSubmitting(true)
		try {
			await addItem(itemData)
			setShowAddForm(false)
		} catch (error) {
			console.error('Failed to add item:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleUpdateItem = async (itemData: any) => {
		if (!editingItem) return

		setIsSubmitting(true)
		try {
			await updateItem(editingItem.id, itemData)
			setEditingItem(null)
		} catch (error) {
			console.error('Failed to update item:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleEditItem = (item: FoodItem) => {
		setEditingItem(item)
		setShowAddForm(false)
	}

	const handleCancelEdit = () => {
		setEditingItem(null)
	}

	const handleCancelAdd = () => {
		setShowAddForm(false)
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<header className='mb-8'>
				<h1 className='mb-2 text-3xl font-bold text-gray-900'>
					Food Inventory
				</h1>
				<p className='text-gray-600'>
					Manage your raw food ingredients, costs, and nutritional information
				</p>

				{/* Debug info - remove in production */}
				<div className='mt-2 text-xs text-gray-400'>
					Debug:{' '}
					{debugInfo.loaded ? `${debugInfo.items} items loaded` : 'Loading...'}
				</div>
			</header>

			{/* Action buttons */}
			<div className='mb-6 flex justify-between'>
				<button
					type='button'
					onClick={() => {
						setShowAddForm(true)
						setEditingItem(null)
					}}
					className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
				>
					Add New Food Item
				</button>
			</div>

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

			{/* Add/Edit Form */}
			{(showAddForm || editingItem) && (
				<div className='mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow'>
					<h2 className='mb-4 text-xl font-semibold text-gray-900'>
						{editingItem ? 'Edit Food Item' : 'Add New Food Item'}
					</h2>
					<FoodItemForm
						initialData={editingItem || undefined}
						onSubmit={editingItem ? handleUpdateItem : handleAddItem}
						onCancel={editingItem ? handleCancelEdit : handleCancelAdd}
						isSubmitting={isSubmitting}
					/>
				</div>
			)}

			{/* Inventory Table */}
			<div className='rounded-lg border border-gray-200 bg-white p-6 shadow'>
				<InventoryDisplay
					onEdit={handleEditItem}
					showActions={true}
				/>
			</div>
		</div>
	)
}

import { useInventoryStore, usePreferencesStore } from '@/lib/store'
import { FoodItem } from '@prisma/client'
import React, { useEffect, useState } from 'react'

interface InventoryDisplayProps {
	onEdit?: (item: FoodItem) => void
	onSelect?: (item: FoodItem) => void
	showActions?: boolean
	selectable?: boolean
}

const InventoryDisplay: React.FC<InventoryDisplayProps> = ({
	onEdit,
	onSelect,
	showActions = true,
	selectable = false,
}) => {
	const {
		filteredItems,
		items,
		isLoading,
		error,
		filter,
		fetchItems,
		toggleItemActive,
		deleteItem,
		setFilter,
		toggleItemSelection,
		selectAllItems,
		deselectAllItems,
	} = useInventoryStore()

	const { settings } = usePreferencesStore()
	const { measureUnit, currency } = settings

	const [brands, setBrands] = useState<string[]>([])
	const [types, setTypes] = useState<string[]>([])
	const [searchInput, setSearchInput] = useState(filter.search)
	const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(
		null
	)

	// Fetch items on initial load
	useEffect(() => {
		fetchItems()
	}, [fetchItems])

	// Extract unique brands and types when items change
	useEffect(() => {
		if (items.length > 0) {
			const uniqueBrands = [...new Set(items.map((item) => item.brand))].sort()
			const uniqueTypes = [...new Set(items.map((item) => item.type))].sort()

			setBrands(uniqueBrands)
			setTypes(uniqueTypes)
		}
	}, [items])

	// Handle search input with debounce
	useEffect(() => {
		const timer = setTimeout(() => {
			setFilter({ search: searchInput })
		}, 300)

		return () => clearTimeout(timer)
	}, [searchInput, setFilter])

	const handleSort = (sortBy: typeof filter.sortBy) => {
		// Toggle direction if clicking the same column
		if (filter.sortBy === sortBy) {
			setFilter({
				sortDirection: filter.sortDirection === 'asc' ? 'desc' : 'asc',
			})
		} else {
			setFilter({
				sortBy,
				sortDirection: 'asc',
			})
		}
	}

	const handleFilterChange = (
		value: string,
		filterType: 'brands' | 'types'
	) => {
		// For single select, we pass an array with just the selected value,
		// or an empty array if "All" is selected
		setFilter({
			[filterType]: value === 'all' ? [] : [value],
		})
	}

	const handleToggleActive = async (id: string, e: React.MouseEvent) => {
		e.stopPropagation() // Prevent row selection when clicking toggle
		await toggleItemActive(id)
	}

	const handleConfirmDelete = async (id: string) => {
		await deleteItem(id)
		setShowConfirmDelete(null)
	}

	const handleCancelDelete = () => {
		setShowConfirmDelete(null)
	}

	const handleRequestDelete = (id: string, e: React.MouseEvent) => {
		e.stopPropagation() // Prevent row selection when clicking delete
		setShowConfirmDelete(id)
	}

	const handleRowClick = (item: FoodItem) => {
		if (selectable) {
			toggleItemSelection(item.id)
		} else if (onSelect) {
			onSelect(item)
		}
	}

	// Error display
	if (error) {
		return (
			<div className='rounded-md bg-red-50 p-4'>
				<div className='flex'>
					<div className='text-red-700'>
						<span>Error loading inventory: {error}</span>
					</div>
				</div>
			</div>
		)
	}

	// Loading display
	if (isLoading && filteredItems.length === 0) {
		return <div className='flex justify-center p-8'>Loading inventory...</div>
	}

	return (
		<div>
			{/* Selection Tools (when selectable is true) */}
			{selectable && (
				<div className='mb-4 flex items-center justify-between'>
					<div className='text-sm text-gray-500'>
						{filteredItems.filter((item) => item.isSelected).length} of{' '}
						{filteredItems.length} items selected
					</div>
					<div className='space-x-2'>
						<button
							type='button'
							onClick={selectAllItems}
							className='rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200'
						>
							Select All
						</button>
						<button
							type='button'
							onClick={deselectAllItems}
							className='rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200'
						>
							Deselect All
						</button>
					</div>
				</div>
			)}

			{/* Filter Controls */}
			<div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
				<div>
					<label
						htmlFor='search'
						className='mb-1 block text-sm font-medium text-gray-700'
					>
						Search
					</label>
					<input
						id='search'
						type='text'
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						placeholder='Search brand, type, or description...'
						className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
					/>
				</div>
				<div>
					<label
						htmlFor='brandFilter'
						className='mb-1 block text-sm font-medium text-gray-700'
					>
						Brand
					</label>
					<select
						id='brandFilter'
						value={filter.brands.length > 0 ? filter.brands[0] : 'all'}
						onChange={(e) => handleFilterChange(e.target.value, 'brands')}
						className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
					>
						<option value='all'>All Brands</option>
						{brands.map((brand) => (
							<option
								key={brand}
								value={brand}
							>
								{brand}
							</option>
						))}
					</select>
				</div>
				<div>
					<label
						htmlFor='typeFilter'
						className='mb-1 block text-sm font-medium text-gray-700'
					>
						Type
					</label>
					<select
						id='typeFilter'
						value={filter.types.length > 0 ? filter.types[0] : 'all'}
						onChange={(e) => handleFilterChange(e.target.value, 'types')}
						className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
					>
						<option value='all'>All Types</option>
						{types.map((type) => (
							<option
								key={type}
								value={type}
							>
								{type}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Active/Inactive Filter Toggle */}
			<div className='mb-4'>
				<label className='inline-flex items-center'>
					<input
						type='checkbox'
						checked={filter.onlyActive}
						onChange={(e) => setFilter({ onlyActive: e.target.checked })}
						className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
					/>
					<span className='ml-2 text-sm text-gray-700'>
						Show only active items
					</span>
				</label>
			</div>

			{/* Inventory Table */}
			<div className='overflow-x-auto rounded-lg border border-gray-200 shadow'>
				<table className='min-w-full divide-y divide-gray-200'>
					<thead className='bg-gray-50'>
						<tr>
							{selectable && (
								<th
									scope='col'
									className='w-12 py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
								>
									Select
								</th>
							)}
							<th
								scope='col'
								className='cursor-pointer py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
								onClick={() => handleSort('brand')}
							>
								Brand
								{filter.sortBy === 'brand' && (
									<span className='ml-1'>
										{filter.sortDirection === 'asc' ? '↑' : '↓'}
									</span>
								)}
							</th>
							<th
								scope='col'
								className='cursor-pointer px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'
								onClick={() => handleSort('type')}
							>
								Type
								{filter.sortBy === 'type' && (
									<span className='ml-1'>
										{filter.sortDirection === 'asc' ? '↑' : '↓'}
									</span>
								)}
							</th>
							<th
								scope='col'
								className='cursor-pointer px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'
								onClick={() => handleSort('cost')}
							>
								Cost
								{filter.sortBy === 'cost' && (
									<span className='ml-1'>
										{filter.sortDirection === 'asc' ? '↑' : '↓'}
									</span>
								)}
							</th>
							<th className='px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'>
								Weight
							</th>
							{showActions && (
								<th
									scope='col'
									className='px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500'
								>
									Actions
								</th>
							)}
						</tr>
					</thead>
					<tbody className='divide-y divide-gray-200 bg-white'>
						{filteredItems.length === 0 ? (
							<tr>
								<td
									colSpan={selectable ? 5 : 4 + (showActions ? 1 : 0)}
									className='py-8 text-center text-gray-500'
								>
									No items found matching your criteria
								</td>
							</tr>
						) : (
							filteredItems.map((item) => (
								<tr
									key={item.id}
									onClick={() => handleRowClick(item)}
									className={`${
										!item.isActive ? 'bg-gray-50 text-gray-400' : ''
									} ${
										selectable && item.isSelected ? 'bg-blue-50' : ''
									} cursor-pointer hover:bg-gray-100`}
								>
									{selectable && (
										<td className='py-4 pl-4 pr-3'>
											<input
												type='checkbox'
												checked={!!item.isSelected}
												onChange={() => toggleItemSelection(item.id)}
												onClick={(e) => e.stopPropagation()}
												className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
											/>
										</td>
									)}
									<td className='whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium'>
										{item.brand}
									</td>
									<td className='whitespace-nowrap px-3 py-4 text-sm'>
										{item.type}
									</td>
									<td className='whitespace-nowrap px-3 py-4 text-right text-sm'>
										<div>
											{currency} {item.cost.toFixed(2)}
										</div>
										<div className='text-xs text-gray-500'>
											{currency}{' '}
											{item.cost.div(item.weight).mul(1000).toFixed(2)}/kg
										</div>
									</td>
									<td className='whitespace-nowrap px-3 py-4 text-right text-sm'>
										{item.weight.toFixed(0)} {measureUnit}
									</td>
									{showActions && (
										<td className='whitespace-nowrap px-3 py-4 text-center text-sm'>
											<div className='flex justify-center space-x-2'>
												{onEdit && (
													<button
														type='button'
														onClick={(e) => {
															e.stopPropagation()
															onEdit(item)
														}}
														className='rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100'
													>
														Edit
													</button>
												)}
												<button
													type='button'
													onClick={(e) => handleToggleActive(item.id, e)}
													className={`rounded-md px-2 py-1 text-xs font-medium ${
														item.isActive
															? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
															: 'bg-green-50 text-green-700 hover:bg-green-100'
													}`}
												>
													{item.isActive ? 'Deactivate' : 'Activate'}
												</button>
												{showConfirmDelete === item.id ? (
													<>
														<button
															type='button'
															onClick={() => handleConfirmDelete(item.id)}
															className='rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700'
														>
															Confirm
														</button>
														<button
															type='button'
															onClick={handleCancelDelete}
															className='rounded-md bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300'
														>
															Cancel
														</button>
													</>
												) : (
													<button
														type='button'
														onClick={(e) => handleRequestDelete(item.id, e)}
														className='rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100'
													>
														Delete
													</button>
												)}
											</div>
										</td>
									)}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Items count */}
			<div className='mt-4 text-sm text-gray-500'>
				Showing {filteredItems.length} of {items.length} items
			</div>
		</div>
	)
}

export default InventoryDisplay

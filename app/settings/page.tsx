'use client'

import { usePreferencesStore } from '@/lib/store'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
	const {
		settings,
		isLoading,
		error,
		fetchPreferences,
		updatePreference,
		savePreferences,
		resetToDefaults,
	} = usePreferencesStore()

	const [isSaving, setIsSaving] = useState(false)
	const [saveMessage, setSaveMessage] = useState<string | null>(null)
	const [showResetConfirm, setShowResetConfirm] = useState(false)

	useEffect(() => {
		fetchPreferences()
	}, [fetchPreferences])

	const handleSaveSettings = async () => {
		setIsSaving(true)
		setSaveMessage(null)

		try {
			await savePreferences()
			setSaveMessage('Settings saved successfully')

			// Clear the message after 3 seconds
			setTimeout(() => {
				setSaveMessage(null)
			}, 3000)
		} catch (error) {
			console.error('Failed to save settings:', error)
		} finally {
			setIsSaving(false)
		}
	}

	const handleResetDefaults = async () => {
		resetToDefaults()
		setShowResetConfirm(false)

		// Save the reset settings to the server
		await handleSaveSettings()
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<header className='mb-8'>
				<h1 className='mb-2 text-3xl font-bold text-gray-900'>Settings</h1>
				<p className='text-gray-600'>
					Customize your preferences for units, currency, and application
					appearance
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

			{/* Success message */}
			{saveMessage && (
				<div className='mb-6 rounded-md bg-green-50 p-4'>
					<div className='flex'>
						<div className='flex-shrink-0'>
							<svg
								className='h-5 w-5 text-green-400'
								xmlns='http://www.w3.org/2000/svg'
								viewBox='0 0 20 20'
								fill='currentColor'
								aria-hidden='true'
							>
								<path
									fillRule='evenodd'
									d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
									clipRule='evenodd'
								/>
							</svg>
						</div>
						<div className='ml-3'>
							<p className='text-sm font-medium text-green-800'>
								{saveMessage}
							</p>
						</div>
					</div>
				</div>
			)}

			{isLoading ? (
				<div className='rounded-lg border border-gray-200 bg-white p-8 text-center shadow'>
					Loading settings...
				</div>
			) : (
				<div className='rounded-lg border border-gray-200 bg-white p-8 shadow'>
					<div className='space-y-8'>
						{/* Units Section */}
						<section>
							<h2 className='mb-4 text-lg font-semibold text-gray-900'>
								Measurement Units
							</h2>
							<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
								<div className='space-y-2'>
									<label
										htmlFor='weightUnit'
										className='block text-sm font-medium text-gray-700'
									>
										Weight Unit
									</label>
									<select
										id='weightUnit'
										value={settings.weightUnit}
										onChange={(e) =>
											updatePreference(
												'weightUnit',
												e.target.value as 'kg' | 'lbs'
											)
										}
										className='block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
									>
										<option value='kg'>Kilograms (kg)</option>
										<option value='lbs'>Pounds (lbs)</option>
									</select>
									<p className='text-xs text-gray-500'>
										Used for dog weights and portion calculations
									</p>
								</div>

								<div className='space-y-2'>
									<label
										htmlFor='measureUnit'
										className='block text-sm font-medium text-gray-700'
									>
										Measurement Unit
									</label>
									<select
										id='measureUnit'
										value={settings.measureUnit}
										onChange={(e) =>
											updatePreference(
												'measureUnit',
												e.target.value as 'g' | 'oz'
											)
										}
										className='block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
									>
										<option value='g'>Grams (g)</option>
										<option value='oz'>Ounces (oz)</option>
									</select>
									<p className='text-xs text-gray-500'>
										Used for food quantities and portions
									</p>
								</div>
							</div>
						</section>

						{/* Currency Section */}
						<section>
							<h2 className='mb-4 text-lg font-semibold text-gray-900'>
								Currency Settings
							</h2>
							<div className='space-y-2'>
								<label
									htmlFor='currency'
									className='block text-sm font-medium text-gray-700'
								>
									Currency
								</label>
								<select
									id='currency'
									value={settings.currency}
									onChange={(e) => updatePreference('currency', e.target.value)}
									className='block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
								>
									<option value='GBP'>British Pound (£)</option>
									<option value='USD'>US Dollar ($)</option>
									<option value='EUR'>Euro (€)</option>
									<option value='CAD'>Canadian Dollar (CA$)</option>
									<option value='AUD'>Australian Dollar (A$)</option>
								</select>
								<p className='text-xs text-gray-500'>
									Used for displaying food costs and meal plan totals
								</p>
							</div>
						</section>

						{/* Meal Planning Defaults */}
						<section>
							<h2 className='mb-4 text-lg font-semibold text-gray-900'>
								Meal Planning Defaults
							</h2>
							<div className='space-y-2'>
								<label
									htmlFor='defaultMealsPerDay'
									className='block text-sm font-medium text-gray-700'
								>
									Default Meals Per Day
								</label>
								<select
									id='defaultMealsPerDay'
									value={settings.defaultMealsPerDay}
									onChange={(e) =>
										updatePreference(
											'defaultMealsPerDay',
											parseInt(e.target.value)
										)
									}
									className='block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
								>
									<option value={1}>1 meal per day</option>
									<option value={2}>2 meals per day</option>
									<option value={3}>3 meals per day</option>
									<option value={4}>4 meals per day</option>
								</select>
								<p className='text-xs text-gray-500'>
									Default number of meals per day when creating new meal plans
								</p>
							</div>
						</section>

						{/* Theme Settings */}
						<section>
							<h2 className='mb-4 text-lg font-semibold text-gray-900'>
								Appearance
							</h2>
							<div className='space-y-2'>
								<label
									htmlFor='theme'
									className='block text-sm font-medium text-gray-700'
								>
									Theme
								</label>
								<select
									id='theme'
									value={settings.theme}
									onChange={(e) =>
										updatePreference(
											'theme',
											e.target.value as 'light' | 'dark' | 'system'
										)
									}
									className='block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
								>
									<option value='light'>Light</option>
									<option value='dark'>Dark</option>
									<option value='system'>System Default</option>
								</select>
								<p className='text-xs text-gray-500'>
									Application appearance theme
								</p>
							</div>
						</section>

						{/* Action buttons */}
						<div className='flex justify-between pt-6'>
							<div>
								{showResetConfirm ? (
									<div className='flex items-center space-x-2'>
										<span className='text-sm text-gray-700'>Are you sure?</span>
										<button
											type='button'
											onClick={handleResetDefaults}
											className='rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
										>
											Reset All
										</button>
										<button
											type='button'
											onClick={() => setShowResetConfirm(false)}
											className='rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
										>
											Cancel
										</button>
									</div>
								) : (
									<button
										type='button'
										onClick={() => setShowResetConfirm(true)}
										className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
									>
										Reset to Defaults
									</button>
								)}
							</div>

							<button
								type='button'
								onClick={handleSaveSettings}
								disabled={isSaving}
								className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
							>
								{isSaving ? 'Saving...' : 'Save Settings'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

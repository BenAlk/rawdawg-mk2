import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { UserPreference } from '@prisma/client'

interface PreferencesState {
	settings: {
		weightUnit: 'kg' | 'lbs'
		measureUnit: 'g' | 'oz'
		currency: string
		defaultMealsPerDay: number
		theme: 'light' | 'dark' | 'system'
	}
	isLoading: boolean
	error: string | null
	hasLoadedFromDB: boolean
}

interface PreferencesActions {
	fetchPreferences: () => Promise<void>
	savePreferences: () => Promise<void>
	updatePreference: <K extends keyof PreferencesState['settings']>(
		key: K,
		value: PreferencesState['settings'][K]
	) => void
	resetToDefaults: () => void
}

type PreferencesStore = PreferencesState & PreferencesActions

const DEFAULT_PREFERENCES: PreferencesState['settings'] = {
	weightUnit: 'kg',
	measureUnit: 'g',
	currency: 'GBP',
	defaultMealsPerDay: 2,
	theme: 'light',
}

export const usePreferencesStore = create<PreferencesStore>()(
	persist(
		immer((set, get) => ({
			// Initial state
			settings: { ...DEFAULT_PREFERENCES },
			isLoading: false,
			error: null,
			hasLoadedFromDB: false,

			// Actions
			fetchPreferences: async () => {
				set((state) => {
					state.isLoading = true
					state.error = null
				})

				try {
					const response = await fetch('/api/preferences')

					if (!response.ok) {
						throw new Error('Failed to fetch preferences')
					}

					const preferences = await response.json()

					set((state) => {
						state.settings = {
							weightUnit: preferences.weightUnit as 'kg' | 'lbs',
							measureUnit: preferences.measureUnit as 'g' | 'oz',
							currency: preferences.currency,
							defaultMealsPerDay: preferences.defaultMealsPerDay,
							theme: preferences.theme as 'light' | 'dark' | 'system',
						}
						state.isLoading = false
						state.hasLoadedFromDB = true
					})
				} catch (error) {
					set((state) => {
						state.isLoading = false
						state.error = (error as Error).message
						// If we can't load from DB, make sure we still have defaults
						if (!state.hasLoadedFromDB) {
							state.settings = { ...DEFAULT_PREFERENCES }
						}
					})
				}
			},

			savePreferences: async () => {
				const { settings } = get()

				set((state) => {
					state.isLoading = true
					state.error = null
				})

				try {
					const response = await fetch('/api/preferences', {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(settings),
					})

					if (!response.ok) {
						throw new Error('Failed to save preferences')
					}

					set((state) => {
						state.isLoading = false
						state.hasLoadedFromDB = true
					})
				} catch (error) {
					set((state) => {
						state.isLoading = false
						state.error = (error as Error).message
					})
				}
			},

			updatePreference: (key, value) => {
				set((state) => {
					state.settings[key] = value
				})
			},

			resetToDefaults: () => {
				set((state) => {
					state.settings = { ...DEFAULT_PREFERENCES }
				})
			},
		})),
		{
			name: 'rawdawg-preferences',
			storage: createJSONStorage(() => localStorage),
		}
	)
)

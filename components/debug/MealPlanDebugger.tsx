import { usePlannerStore } from '@/lib/store'
import { useState } from 'react'

// Define response type
interface ApiResponse {
	status: number
	statusText: string
	data: any
}

const MealPlanDebugger = () => {
	const { currentPlan } = usePlannerStore()
	const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)
	const [rawResponse, setRawResponse] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Convert data to displayable format
	const getDisplayData = () => {
		if (!currentPlan) return null

		// Convert plan to API submission format
		const planToSave = {
			...currentPlan,
			items: currentPlan.items.map((item) => ({
				foodItemId: item.id,
				quantityPerMeal: item.quantityPerMeal.toString(),
				totalQuantity: item.totalQuantity.toString(),
				numberOfMeals: item.numberOfMeals,
			})),
		}

		return planToSave
	}

	const testSavePlan = async () => {
		if (!currentPlan) return

		setIsLoading(true)
		setError(null)
		setRawResponse(null)
		setApiResponse(null)

		try {
			// Convert plan to API submission format
			const planToSave = getDisplayData()

			// Test with POST (new plan) or PUT (update)
			const method = currentPlan.id ? 'PUT' : 'POST'
			const url = currentPlan.id
				? `/api/mealplans/${currentPlan.id}`
				: '/api/mealplans'

			console.log(`Sending ${method} request to ${url}`)

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(planToSave),
			})

			// Get raw response
			const responseText = await response.text()
			setRawResponse(responseText)

			// Try to parse as JSON
			let responseData
			try {
				responseData = responseText ? JSON.parse(responseText) : {}

				setApiResponse({
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				})

				if (!response.ok) {
					const errorMsg =
						responseData.error ||
						responseData.message ||
						`Failed to ${currentPlan.id ? 'update' : 'create'} meal plan`

					setError(errorMsg)
				}
			} catch (parseError) {
				console.error('Error parsing response:', parseError)
				setError(
					`Failed to parse API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
				)
			}
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: typeof err === 'string'
						? err
						: 'An unknown error occurred'
			)
		} finally {
			setIsLoading(false)
		}
	}

	// Simple API check
	const testApiConnection = async () => {
		setIsLoading(true)
		setError(null)
		setRawResponse(null)
		setApiResponse(null)

		try {
			const response = await fetch('/api/mealplans')
			const responseText = await response.text()
			setRawResponse(responseText)

			try {
				const responseData = responseText ? JSON.parse(responseText) : {}
				setApiResponse({
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				})
			} catch (parseError) {
				setError(
					`Failed to parse API test response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
				)
			}
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: typeof err === 'string'
						? err
						: 'An unknown error occurred'
			)
		} finally {
			setIsLoading(false)
		}
	}

	if (!currentPlan) {
		return (
			<div className='p-4 bg-yellow-50 text-yellow-800 rounded-md'>
				No meal plan is currently loaded
			</div>
		)
	}

	return (
		<div className='bg-white rounded-lg shadow p-6 max-w-4xl mx-auto my-8'>
			<h2 className='text-xl font-semibold mb-4'>Meal Plan Debugger</h2>

			<div className='mb-6 flex space-x-4'>
				<button
					onClick={testSavePlan}
					disabled={isLoading}
					className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50'
				>
					{isLoading ? 'Testing...' : 'Test Save Plan API Call'}
				</button>

				<button
					onClick={testApiConnection}
					disabled={isLoading}
					className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:opacity-50'
				>
					Test API Connection
				</button>
			</div>

			{error && (
				<div className='mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
					<h3 className='font-semibold'>Error:</h3>
					<p className='font-mono text-sm whitespace-pre-wrap'>{error}</p>
				</div>
			)}

			{rawResponse && !apiResponse && (
				<div className='mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md'>
					<h3 className='font-semibold'>Raw Response (not valid JSON):</h3>
					<div className='overflow-auto max-h-60'>
						<pre className='font-mono text-sm whitespace-pre-wrap'>
							{rawResponse}
						</pre>
					</div>
				</div>
			)}

			{apiResponse && (
				<div
					className={`mb-6 px-4 py-3 rounded-md ${apiResponse.status >= 200 && apiResponse.status < 300 ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}
				>
					<h3 className='font-semibold'>API Response:</h3>
					<p className='mb-1'>
						Status: {apiResponse.status} {apiResponse.statusText}
					</p>
					<div className='overflow-auto max-h-60'>
						<pre className='font-mono text-sm whitespace-pre-wrap'>
							{JSON.stringify(apiResponse.data, null, 2)}
						</pre>
					</div>
				</div>
			)}

			<div className='mb-4'>
				<h3 className='font-semibold mb-2'>Plan Data to be Submitted:</h3>
				<div className='overflow-auto max-h-96 bg-gray-50 p-4 rounded-md'>
					<pre className='font-mono text-sm whitespace-pre-wrap'>
						{JSON.stringify(getDisplayData(), null, 2)}
					</pre>
				</div>
			</div>

			<div className='text-xs text-gray-500 mt-4'>
				<p>Common issues to check:</p>
				<ul className='list-disc ml-5 space-y-1 mt-1'>
					<li>Missing required fields in the meal plan data</li>
					<li>Invalid foodItemId references</li>
					<li>Negative or zero values in quantities</li>
					<li>Decimal conversion issues</li>
					<li>Missing dogId reference (if one is required)</li>
					<li>Server errors (check Next.js server console)</li>
				</ul>
			</div>
		</div>
	)
}

export default MealPlanDebugger

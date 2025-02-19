import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
	title: 'RawDawg - Raw Dog Food Meal Planner',
	description: 'Plan and manage raw dog food diets',
}

export default async function Home() {
	return (
		<div className='container mx-auto px-4 py-8'>
			<header className='mb-12 text-center'>
				<h1 className='mb-4 text-4xl font-bold text-gray-900'>RawDawg</h1>
				<p className='text-xl text-gray-600'>
					Plan, manage, and optimize your dog's raw food diet
				</p>
			</header>

			<div className='mb-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
				{/* Inventory Card */}
				<Link
					href='/inventory'
					className='group flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-md transition hover:shadow-lg'
				>
					<div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							className='h-6 w-6'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
							/>
						</svg>
					</div>
					<h2 className='mb-2 text-xl font-semibold text-gray-900 group-hover:text-blue-600'>
						Food Inventory
					</h2>
					<p className='text-gray-600'>
						Manage your raw food ingredients, costs, and nutritional information
					</p>
				</Link>

				{/* Meal Planning Card */}
				<Link
					href='/planner'
					className='group flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-md transition hover:shadow-lg'
				>
					<div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							className='h-6 w-6'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
							/>
						</svg>
					</div>
					<h2 className='mb-2 text-xl font-semibold text-gray-900 group-hover:text-green-600'>
						Meal Planner
					</h2>
					<p className='text-gray-600'>
						Create meal plans, calculate portions, and track costs
					</p>
				</Link>

				{/* Dog Profiles Card */}
				<Link
					href='/dogs'
					className='group flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-md transition hover:shadow-lg'
				>
					<div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							className='h-6 w-6'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
							/>
						</svg>
					</div>
					<h2 className='mb-2 text-xl font-semibold text-gray-900 group-hover:text-amber-600'>
						Dog Profiles
					</h2>
					<p className='text-gray-600'>
						Manage your dogs' profiles, weights, and dietary requirements
					</p>
				</Link>

				{/* Settings Card */}
				<Link
					href='/settings'
					className='group flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-md transition hover:shadow-lg'
				>
					<div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							className='h-6 w-6'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
							/>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
							/>
						</svg>
					</div>
					<h2 className='mb-2 text-xl font-semibold text-gray-900 group-hover:text-purple-600'>
						Settings
					</h2>
					<p className='text-gray-600'>
						Customize units, currency, and application preferences
					</p>
				</Link>
			</div>

			<div className='rounded-lg bg-gray-50 p-6'>
				<h2 className='mb-4 text-2xl font-semibold text-gray-900'>
					Getting Started
				</h2>
				<ol className='ml-6 list-decimal space-y-3 text-gray-700'>
					<li>
						<strong>Add your food items</strong> in the Inventory section.
						Include weights, costs, and nutritional information.
					</li>
					<li>
						<strong>Create dog profiles</strong> with their weights and activity
						levels to calculate appropriate portions.
					</li>
					<li>
						<strong>Create meal plans</strong> by selecting food items and
						specifying quantities for each meal.
					</li>
					<li>
						<strong>Adjust your preferences</strong> in Settings to use your
						preferred units and currency.
					</li>
				</ol>
			</div>
		</div>
	)
}

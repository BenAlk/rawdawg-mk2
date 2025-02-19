import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: {
		template: '%s | RawDawg',
		default: 'RawDawg - Raw Dog Food Meal Planner',
	},
	description: 'Plan and manage raw dog food diets',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang='en'>
			<body className={`${inter.className} min-h-screen bg-gray-50`}>
				<div className='flex min-h-screen flex-col'>
					<header className='bg-white shadow'>
						<nav className='container mx-auto flex flex-wrap items-center justify-between px-4 py-4'>
							<Link
								href='/'
								className='flex items-center'
							>
								<span className='text-xl font-bold text-gray-900'>
									🐾 RawDawg
								</span>
							</Link>

							<div className='hidden md:block'>
								<ul className='flex space-x-8'>
									<li>
										<Link
											href='/inventory'
											className='text-gray-600 hover:text-blue-600'
										>
											Inventory
										</Link>
									</li>
									<li>
										<Link
											href='/planner'
											className='text-gray-600 hover:text-blue-600'
										>
											Meal Planner
										</Link>
									</li>
									<li>
										<Link
											href='/dogs'
											className='text-gray-600 hover:text-blue-600'
										>
											Dogs
										</Link>
									</li>
									<li>
										<Link
											href='/settings'
											className='text-gray-600 hover:text-blue-600'
										>
											Settings
										</Link>
									</li>
								</ul>
							</div>

							<div className='block md:hidden'>
								<button
									type='button'
									className='rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none'
									aria-label='Toggle menu'
								>
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
											d='M4 6h16M4 12h16M4 18h16'
										/>
									</svg>
								</button>
							</div>
						</nav>
					</header>

					<main className='flex-grow'>{children}</main>

					<footer className='bg-white py-6 text-center'>
						<div className='container mx-auto px-4'>
							<p className='text-sm text-gray-600'>
								&copy; {new Date().getFullYear()} RawDawg | Raw Dog Food
								Planning Tool
							</p>
						</div>
					</footer>
				</div>
			</body>
		</html>
	)
}

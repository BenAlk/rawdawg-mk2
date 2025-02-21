'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'

export default function UserNavClient() {
	const { data: session, status } = useSession()
	const [isMenuOpen, setIsMenuOpen] = useState(false)

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen)
	}

	const closeMenu = () => {
		setIsMenuOpen(false)
	}

	if (status === 'loading') {
		return (
			<div className='h-10 w-10 animate-pulse rounded-full bg-gray-200'></div>
		)
	}

	if (status === 'unauthenticated') {
		return (
			<div className='flex space-x-4'>
				<Link
					href='/auth/signin'
					className='rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500'
				>
					Sign In
				</Link>
				<Link
					href='/auth/register'
					className='rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
				>
					Sign Up
				</Link>
			</div>
		)
	}

	return (
		<div className='relative'>
			<button
				onClick={toggleMenu}
				className='flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
				aria-expanded={isMenuOpen}
				aria-haspopup='true'
			>
				<span className='sr-only'>Open user menu</span>
				<div className='flex items-center'>
					<span className='mr-2 text-sm font-medium text-gray-700'>
						{session?.user?.name || 'User'}
					</span>
					<div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white'>
						{session?.user?.name
							? session.user.name.charAt(0).toUpperCase()
							: 'U'}
					</div>
				</div>
			</button>

			{isMenuOpen && (
				<div className='absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
					<div className='border-b border-gray-100 px-4 py-2'>
						<p className='text-sm font-medium text-gray-900'>
							{session?.user?.name}
						</p>
						<p className='truncate text-xs text-gray-500'>
							{session?.user?.email}
						</p>
					</div>
					<Link
						href='/settings'
						className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
						onClick={closeMenu}
					>
						Settings
					</Link>
					{session?.user?.role === 'ADMIN' && (
						<Link
							href='/admin'
							className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
							onClick={closeMenu}
						>
							Admin Dashboard
						</Link>
					)}
					<button
						onClick={() => {
							closeMenu()
							signOut({ callbackUrl: '/' })
						}}
						className='block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100'
					>
						Sign Out
					</button>
				</div>
			)}
		</div>
	)
}

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Define types for our data
interface User {
	id: string
	name: string | null
	email: string | null
	role: string
	createdAt: string
}

export default function AdminDashboard() {
	const { data: session, status } = useSession()
	const router = useRouter()

	const [users, setUsers] = useState<User[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Fetch users data
	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const response = await fetch('/api/admin/users')

				if (!response.ok) {
					throw new Error('Failed to fetch users')
				}

				const data = await response.json()
				setUsers(data)
			} catch (error) {
				setError((error as Error).message)
			} finally {
				setIsLoading(false)
			}
		}

		if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
			fetchUsers()
		} else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
			router.push('/')
		}
	}, [status, session, router])

	// Loading state
	if (status === 'loading' || isLoading) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<h1 className='mb-8 text-3xl font-bold'>Admin Dashboard</h1>
				<div className='flex justify-center'>
					<div className='h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600'></div>
				</div>
			</div>
		)
	}

	// Not authorized
	if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
		router.push('/')
		return null
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<h1 className='mb-8 text-3xl font-bold'>Admin Dashboard</h1>

			{error && (
				<div className='mb-6 rounded-md bg-red-50 p-4'>
					<div className='flex'>
						<div className='text-sm text-red-700'>{error}</div>
					</div>
				</div>
			)}

			<div className='mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow'>
				<h2 className='mb-4 text-xl font-semibold'>User Management</h2>

				<div className='overflow-x-auto'>
					<table className='min-w-full divide-y divide-gray-200'>
						<thead className='bg-gray-50'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
									Name
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
									Email
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
									Role
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
									Created
								</th>
								<th className='px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'>
									Actions
								</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-gray-200 bg-white'>
							{users.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className='px-6 py-4 text-center text-sm text-gray-500'
									>
										No users found
									</td>
								</tr>
							) : (
								users.map((user) => (
									<tr key={user.id}>
										<td className='whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900'>
											{user.name || 'No name'}
										</td>
										<td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500'>
											{user.email}
										</td>
										<td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500'>
											<span
												className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
													user.role === 'ADMIN'
														? 'bg-purple-100 text-purple-800'
														: 'bg-green-100 text-green-800'
												}`}
											>
												{user.role}
											</span>
										</td>
										<td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500'>
											{new Date(user.createdAt).toLocaleDateString()}
										</td>
										<td className='whitespace-nowrap px-6 py-4 text-right text-sm font-medium'>
											<button className='text-blue-600 hover:text-blue-900'>
												Edit
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			<div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
				<div className='rounded-lg border border-gray-200 bg-white p-6 shadow'>
					<h3 className='mb-2 text-lg font-medium'>Total Users</h3>
					<p className='text-3xl font-bold'>{users.length}</p>
				</div>

				<div className='rounded-lg border border-gray-200 bg-white p-6 shadow'>
					<h3 className='mb-2 text-lg font-medium'>Admins</h3>
					<p className='text-3xl font-bold'>
						{users.filter((user) => user.role === 'ADMIN').length}
					</p>
				</div>

				<div className='rounded-lg border border-gray-200 bg-white p-6 shadow'>
					<h3 className='mb-2 text-lg font-medium'>Regular Users</h3>
					<p className='text-3xl font-bold'>
						{users.filter((user) => user.role === 'USER').length}
					</p>
				</div>
			</div>
		</div>
	)
}

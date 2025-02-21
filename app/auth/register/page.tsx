'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function Register() {
	const router = useRouter()

	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
	})

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const validateForm = () => {
		if (formData.password !== formData.confirmPassword) {
			setError('Passwords do not match')
			return false
		}

		if (formData.password.length < 8) {
			setError('Password must be at least 8 characters long')
			return false
		}

		return true
	}

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		if (!validateForm()) {
			return
		}

		setIsLoading(true)
		setError('')

		try {
			const response = await fetch('/api/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: formData.name,
					email: formData.email,
					password: formData.password,
				}),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to register')
			}

			// Registration successful, now sign in automatically
			await signIn('credentials', {
				redirect: false,
				email: formData.email,
				password: formData.password,
			})

			// Redirect to dashboard after sign in
			router.push('/')
		} catch (error: any) {
			setError(error.message || 'An error occurred during registration')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8'>
			<div className='w-full max-w-md space-y-8'>
				<div>
					<h2 className='mt-6 text-center text-3xl font-bold tracking-tight text-gray-900'>
						Create a new account
					</h2>
					<p className='mt-2 text-center text-sm text-gray-600'>
						Or{' '}
						<Link
							href='/auth/signin'
							className='font-medium text-blue-600 hover:text-blue-500'
						>
							sign in to your existing account
						</Link>
					</p>
				</div>

				{error && (
					<div className='rounded-md bg-red-50 p-4'>
						<div className='flex'>
							<div className='text-sm text-red-700'>{error}</div>
						</div>
					</div>
				)}

				<form
					className='mt-8 space-y-6'
					onSubmit={handleSubmit}
				>
					<div className='space-y-4'>
						<div>
							<label
								htmlFor='name'
								className='block text-sm font-medium text-gray-700'
							>
								Full Name
							</label>
							<input
								id='name'
								name='name'
								type='text'
								autoComplete='name'
								required
								className='relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3'
								placeholder='John Doe'
								value={formData.name}
								onChange={handleChange}
							/>
						</div>

						<div>
							<label
								htmlFor='email'
								className='block text-sm font-medium text-gray-700'
							>
								Email address
							</label>
							<input
								id='email'
								name='email'
								type='email'
								autoComplete='email'
								required
								className='relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3'
								placeholder='example@example.com'
								value={formData.email}
								onChange={handleChange}
							/>
						</div>

						<div>
							<label
								htmlFor='password'
								className='block text-sm font-medium text-gray-700'
							>
								Password
							</label>
							<input
								id='password'
								name='password'
								type='password'
								autoComplete='new-password'
								required
								className='relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3'
								placeholder='********'
								value={formData.password}
								onChange={handleChange}
							/>
							<p className='mt-1 text-xs text-gray-500'>
								Must be at least 8 characters long
							</p>
						</div>

						<div>
							<label
								htmlFor='confirmPassword'
								className='block text-sm font-medium text-gray-700'
							>
								Confirm Password
							</label>
							<input
								id='confirmPassword'
								name='confirmPassword'
								type='password'
								autoComplete='new-password'
								required
								className='relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3'
								placeholder='********'
								value={formData.confirmPassword}
								onChange={handleChange}
							/>
						</div>
					</div>

					<div>
						<button
							type='submit'
							disabled={isLoading}
							className='group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70'
						>
							{isLoading ? 'Creating account...' : 'Create account'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

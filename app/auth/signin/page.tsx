'use client'

import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useState } from 'react'

export default function SignIn() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const callbackUrl = searchParams.get('callbackUrl') || '/'
	const error = searchParams.get('error')

	const [isLoading, setIsLoading] = useState(false)
	const [formError, setFormError] = useState('')
	const [formData, setFormData] = useState({
		email: '',
		password: '',
	})

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setIsLoading(true)
		setFormError('')

		try {
			const res = await signIn('credentials', {
				redirect: false,
				email: formData.email,
				password: formData.password,
				callbackUrl,
			})

			if (!res?.error) {
				router.push(callbackUrl)
			} else {
				setFormError(res.error)
			}
		} catch (error: any) {
			setFormError(error.message || 'An error occurred during sign in')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8'>
			<div className='w-full max-w-md space-y-8'>
				<div>
					<h2 className='mt-6 text-center text-3xl font-bold tracking-tight text-gray-900'>
						Sign in to your account
					</h2>
					<p className='mt-2 text-center text-sm text-gray-600'>
						Or{' '}
						<Link
							href='/auth/register'
							className='font-medium text-blue-600 hover:text-blue-500'
						>
							create a new account
						</Link>
					</p>
				</div>

				{(error || formError) && (
					<div className='rounded-md bg-red-50 p-4'>
						<div className='flex'>
							<div className='text-sm text-red-700'>
								{error === 'CredentialsSignin'
									? 'Invalid email or password'
									: formError || 'An error occurred. Please try again.'}
							</div>
						</div>
					</div>
				)}

				<form
					className='mt-8 space-y-6'
					onSubmit={handleSubmit}
				>
					<div className='-space-y-px rounded-md shadow-sm'>
						<div>
							<label
								htmlFor='email'
								className='sr-only'
							>
								Email address
							</label>
							<input
								id='email'
								name='email'
								type='email'
								autoComplete='email'
								required
								className='relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3'
								placeholder='Email address'
								value={formData.email}
								onChange={handleChange}
							/>
						</div>
						<div>
							<label
								htmlFor='password'
								className='sr-only'
							>
								Password
							</label>
							<input
								id='password'
								name='password'
								type='password'
								autoComplete='current-password'
								required
								className='relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3'
								placeholder='Password'
								value={formData.password}
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
							{isLoading ? 'Signing in...' : 'Sign in'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

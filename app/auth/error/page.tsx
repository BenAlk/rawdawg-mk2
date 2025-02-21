'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function AuthError() {
	const searchParams = useSearchParams()
	const error = searchParams.get('error')

	const errorMessages: { [key: string]: string } = {
		Configuration: 'There is a problem with the server configuration.',
		AccessDenied: 'You do not have permission to sign in.',
		Verification: 'The verification link is invalid or has expired.',
		CredentialsSignin: 'Invalid email or password.',
		default: 'An error occurred during authentication.',
	}

	const errorMessage = error
		? errorMessages[error] || errorMessages.default
		: errorMessages.default

	return (
		<div className='flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8'>
			<div className='w-full max-w-md space-y-8'>
				<div>
					<h2 className='mt-6 text-center text-3xl font-bold tracking-tight text-gray-900'>
						Authentication Error
					</h2>
				</div>

				<div className='rounded-md bg-red-50 p-4'>
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
								{errorMessage}
							</h3>
						</div>
					</div>
				</div>

				<div className='flex items-center justify-center space-x-4'>
					<Link
						href='/auth/signin'
						className='text-sm font-medium text-blue-600 hover:text-blue-500'
					>
						Back to Sign In
					</Link>
					<Link
						href='/'
						className='text-sm font-medium text-blue-600 hover:text-blue-500'
					>
						Go to Home
					</Link>
				</div>
			</div>
		</div>
	)
}

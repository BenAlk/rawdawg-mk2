import { prisma } from '@/lib/prisma'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcrypt'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(prisma) as any,
	providers: [
		CredentialsProvider({
			name: 'credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					throw new Error('Invalid credentials')
				}

				const user = await prisma.user.findUnique({
					where: {
						email: credentials.email,
					},
				})

				if (!user || !user.password) {
					throw new Error('User not found')
				}

				const isPasswordValid = await bcrypt.compare(
					credentials.password,
					user.password
				)

				if (!isPasswordValid) {
					throw new Error('Invalid password')
				}

				return {
					id: user.id,
					email: user.email,
					name: user.name,
					role: user.role,
				}
			},
		}),
	],
	session: {
		strategy: 'jwt',
	},
	callbacks: {
		async jwt({ token, user }) {
			// Add custom user properties to token
			if (user) {
				token.id = user.id
				token.role = user.role
			}
			return token
		},
		async session({ session, token }) {
			// Pass properties from the token to the session
			if (session.user) {
				session.user.id = token.id as string
				session.user.role = token.role as string
			}
			return session
		},
	},
	pages: {
		signIn: '/auth/signin',
		error: '/auth/error',
	},
	secret: process.env.NEXTAUTH_SECRET,
}

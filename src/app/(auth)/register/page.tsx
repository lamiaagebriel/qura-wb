import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Icons } from '@/components/icons'
import { UserAuthRegisterForm } from '@/components/_users/register-form'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

type RegisterProps = Readonly<{}>
export const metadata: Metadata = {
	title: 'Register',
}

export default async function Register({}: RegisterProps) {
	return (
		<div className="grid flex-1 items-center justify-center overflow-auto lg:max-w-none lg:grid-cols-2 lg:px-0">
			<Link
				href="/login"
				className={cn(buttonVariants({ variant: 'ghost' }), 'absolute right-4 top-4')}
			>
				Login
			</Link>

			<div className="hidden h-full bg-muted lg:block" />
			<section className="container flex w-full max-w-sm flex-col justify-center space-y-6">
				<div className="flex flex-col space-y-2 text-center">
					<Icons.logo className="mx-auto mb-5 h-16 w-16" />

					<h1 className="text-2xl font-semibold tracking-tight">Create an account! 🎉</h1>
					<p className="text-sm text-muted-foreground">
						Join our community and unlock amazing features to streamline your work and boost your
						productivity.
					</p>
				</div>
				<div className="grid gap-4">
					<Suspense>
						<UserAuthRegisterForm />
					</Suspense>

					<p className="px-8 text-center text-sm text-muted-foreground">
						By clicking continue, you agree to our{' '}
						<Link href="/terms" className="hover:text-brand underline underline-offset-4">
							Terms of Service
						</Link>{' '}
						and{' '}
						<Link href="/privacy" className="hover:text-brand underline underline-offset-4">
							Privacy Policy
						</Link>
						.
					</p>
				</div>
			</section>
		</div>
	)
}

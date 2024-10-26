import { Metadata } from 'next'
import { Suspense } from 'react'

import { Icons } from '@/components/icons'
import { UserAuthLoginForm } from '@/components/_users/login-form'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type LoginProps = Readonly<{}>
export const metadata: Metadata = {
	title: 'Login',
}
export default function Login({}: LoginProps) {
	return (
		<div className="grid flex-1 items-center justify-center overflow-auto">
			<Link
				href="/"
				className={cn(
					buttonVariants({ variant: 'ghost' }),
					'absolute left-4 top-4 gap-2 rtl:flex-row-reverse',
				)}
			>
				<Icons.chevronLeft />
				Back Home
			</Link>

			<section className="container flex w-full max-w-sm flex-col justify-center space-y-5">
				<div className="flex flex-col space-y-2 text-center">
					<Icons.logo className="mx-auto mb-5 h-16 w-16" />

					<h1 className="text-2xl font-semibold tracking-tight">Welcome back! 🎉</h1>
					<p className="text-sm text-muted-foreground">
						Join our community and unlock amazing features to streamline your work and boost your
						productivity.
					</p>
				</div>
				<div className="grid gap-6">
					<Suspense>
						<UserAuthLoginForm />
					</Suspense>

					<p className="text-center text-sm text-muted-foreground">
						<Link href="/register" className="underline underline-offset-4 hover:text-primary">
							Don't have an account? Sign up now
						</Link>
					</p>
				</div>
			</section>
		</div>
	)
}

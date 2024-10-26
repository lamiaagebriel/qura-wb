import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

type RootLayoutProps = Readonly<{
	children: React.ReactNode;
}>;
export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<html lang="en">
			<body>
				{children}

				<Toaster />
			</body>
		</html>
	);
}

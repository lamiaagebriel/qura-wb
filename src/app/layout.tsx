import "./globals.css";

type RootLayoutProps =  Readonly<React.PropsWithChildren<{}>>
export default function RootLayout({ children }:RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

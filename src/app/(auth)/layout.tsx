type AuthLayoutProps = Readonly<React.PropsWithChildren<{}>>;
export default async function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen place-items-center p-4">{children}</div>
  );
}

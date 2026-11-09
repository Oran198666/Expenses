// Centered card layout shared by Login, Registration and Recover Password.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex w-full flex-1 items-center justify-center px-4 py-10">
      {children}
    </main>
  );
}

import Link from "next/link";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="border-b border-border bg-secondary px-6 py-4">
        <Link
          href="/"
          className="text-base font-bold tracking-tight text-foreground"
        >
          Sports League
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-16">
        <div className="w-full max-w-sm border border-border bg-card p-6 shadow-[0_8px_24px_rgba(10,10,10,0.08)]">
          {children}
        </div>
      </main>
    </div>
  );
}

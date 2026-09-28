import Link from "next/link";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="border-b border-border bg-sidebar px-6 py-4">
        <Link
          href="/"
          className="font-heading text-lg font-extrabold tracking-tight text-sidebar-foreground"
        >
          Sports League
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-16">
        <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-[0_10px_28px_rgba(25,25,25,0.08)]">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mat-black gritty-bg flex flex-col">
      <div className="flex items-center justify-center flex-1 px-4 py-12">
        {children}
      </div>
      <div className="text-center text-mat-text-dim text-xs uppercase tracking-widest pb-8">
        MatLogic — BJJ Training Intelligence
      </div>
    </div>
  )
}

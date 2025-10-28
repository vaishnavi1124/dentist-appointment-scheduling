// frontend/src/components/MobileShell.tsx
type Props = {
  children: React.ReactNode;
  title?: string;            // optional fake status bar title
};

export default function MobileShell({ children, title = "Neha" }: Props) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-indigo-50 to-white flex items-center justify-center p-2 sm:p-6">
      {/* Phone frame */}
      <div className="relative w-full max-w-[420px] h-[90vh] sm:h-[820px] bg-white rounded-[2rem] shadow-2xl ring-1 ring-black/5 overflow-hidden flex flex-col">
        {/* Fake notch/status bar */}
        <div className="relative pt-[env(safe-area-inset-top)]">
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-2 h-5 w-40 bg-black/80 rounded-full" />
          <div className="h-12 flex items-center justify-center px-4">
            <span className="text-sm font-semibold text-slate-700">{title}</span>
          </div>
        </div>

        {/* Scrollable app area */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>

        {/* Safe-area bottom padding (for iOS home bar) */}
        <div className="pb-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}

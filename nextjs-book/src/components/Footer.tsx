import Link from 'next/link';
import LogoMark from './LogoMark';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-16 border-t border-zinc-200 bg-[#f7f8fa]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 py-12 md:flex-row md:items-center md:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <LogoMark className="h-9 w-9" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-zinc-900">
                Interactive Coding
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wide text-indigo-600/80">
                Learn • Practice • Progress
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-wrap items-center justify-start gap-x-7 gap-y-3 text-[13px] font-medium">
            <Link href="/contact" className="text-zinc-600 transition-colors hover:text-zinc-900">
              Contact
            </Link>
            <Link href="/privacy" className="text-zinc-600 transition-colors hover:text-zinc-900">
              Privacy
            </Link>
            <Link href="/terms" className="text-zinc-600 transition-colors hover:text-zinc-900">
              Terms
            </Link>
            <div className="border-l border-zinc-300 pl-6 ml-2">
              <span className="text-zinc-400 text-xs font-medium">PREVIEW STYLES:</span>
              <div className="flex gap-4 mt-1">
                <Link href="/landing-v1" className="text-indigo-600 transition-colors hover:text-indigo-700">
                  Healthcare
                </Link>
                <Link href="/landing-v2" className="text-purple-600 transition-colors hover:text-purple-700">
                  AI Tech
                </Link>
                <Link href="/landing-v3" className="text-amber-600 transition-colors hover:text-amber-700">
                  Professional
                </Link>
              </div>
            </div>
          </nav>

          {/* Meta */}
          <div className="flex flex-col items-start gap-2 md:items-end">
            <p className="text-xs font-medium text-zinc-600">© {year} Hants Williams. All rights reserved.</p>
            <p className="text-[11px] text-zinc-500">Crafted for a modern, accessible learning experience.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

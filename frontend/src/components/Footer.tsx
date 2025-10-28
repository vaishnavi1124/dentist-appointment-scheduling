// frontend\src\components\Footer.tsx


export default function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white dark:bg-slate-900">
      {/* Top section */}
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-sm">
        {/* Column 1 */}
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">GenIntel</h4>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm md:text-base">
            AI-powered voice agents for delightful customer experiences.
          </p>
        </div>

        {/* Column 2 */}
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">Resources</h4>
          <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-400">
            <li>
              <a className="hover:text-slate-900 dark:hover:text-white" href="#">
                Docs
              </a>
            </li>
            <li>
              <a className="hover:text-slate-900 dark:hover:text-white" href="#">
                Status
              </a>
            </li>
            <li>
              <a className="hover:text-slate-900 dark:hover:text-white" href="#">
                Support
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">Company</h4>
          <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-400">
            <li>
              <a className="hover:text-slate-900 dark:hover:text-white" href="#">
                About
              </a>
            </li>
            <li>
              <a className="hover:text-slate-900 dark:hover:text-white" href="#">
                Careers
              </a>
            </li>
            <li>
              <a className="hover:text-slate-900 dark:hover:text-white" href="#">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-200 dark:border-slate-700">
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <span>© {new Date().getFullYear()} GenIntel Technologies</span>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-slate-700 dark:hover:text-white">
              Terms
            </a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-white">
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

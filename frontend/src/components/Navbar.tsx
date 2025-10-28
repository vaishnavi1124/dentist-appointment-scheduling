

// frontend/src/components/Navbar.tsx
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom"; // --- 1. Import useLocation ---
import logo from "../assets/Logo2.png"; // Assuming this is your logo path

/**
 * Custom hook to manage mobile menu state and side effects.
 * (This hook is unchanged)
 */
const useMobileMenu = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        // Lock body scroll when menu is open
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        // Close menu on ESC key
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        // Close menu if window is resized to desktop width
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("resize", handleResize);

        // Cleanup function
        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("resize", handleResize);
        };
    }, [isOpen]);

    return { isOpen, setIsOpen };
};

export default function Navbar() {
    const { isOpen, setIsOpen } = useMobileMenu();
    const closeMobileMenu = () => setIsOpen(false);

    // --- 2. Add useLocation logic ---
    const location = useLocation();
    const isAdminPage = location.pathname === '/admin' || location.pathname === '/login'; // Also treat /login as an "admin" page

    return (
        <header className="sticky top-0 z-50 bg-[#1A1E2E]/80 backdrop-blur-sm border-b border-slate-700/50 shadow-lg">
            <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                
                {/* --- 3. Keep the Brand Logo (and add gradient text) --- */}
                <Link 
                    to="/" 
                    className="inline-flex items-center gap-2" 
                    aria-label="GenIntel Home"
                    onClick={closeMobileMenu} // Close menu on logo click
                >
                    {isAdminPage ? (
                         <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                             ← Back to Home
                         </span>
                    ) : (
                         // Show logo + text on home page
                         <>
                             <img
                                 src={logo}
                                 alt="GenIntel Logo"
                                 className="h-10 w-auto object-contain sm:h-12"
                             />
                             <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                                 Dental Clinic
                             </span>
                         </>
                    )}
                </Link>

                {/* --- 4. Remove desktop nav and CTA --- */}
                {/* <nav className="hidden md:flex ..."> ... </nav> */}
                {/* <Link to="/#voice" ...> ... </Link> */}

                {/* --- 5. Add new Admin Panel Link (Desktop) --- */}
                <div className="hidden md:block">
                    {isAdminPage ? (
                         <span className="text-xl font-bold text-slate-300">
                             Admin Panel
                         </span>
                    ) : (
                         <Link
                             to="/admin"
                             className="inline-block text-slate-300 font-semibold px-5 py-2.5 hover:text-white transition-colors"
                         >
                             Admin Panel &rarr;
                         </Link>
                    )}
                </div>

                {/* Mobile Menu Toggle (Unchanged) */}
                <button
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="md:hidden rounded-lg p-2 text-slate-300 hover:bg-slate-800 transition-colors"
                    aria-label="Toggle menu"
                    aria-expanded={isOpen}
                    aria-controls="mobile-menu"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* --- 6. Mobile Menu Panel (Updated Admin Link) --- */}
            <div
                id="mobile-menu"
                className={`md:hidden absolute top-full left-0 right-0 transition-transform duration-300 ease-in-out ${
                    isOpen ? "translate-y-0" : "-translate-y-[120%]"
                }`}
            >
                {/* Backdrop (Unchanged) */}
                <div
                    className={`fixed inset-0 bg-black/30 backdrop-blur-sm ${
                        isOpen ? "block" : "hidden"
                    }`}
                    onClick={closeMobileMenu}
                    aria-hidden="true"
                />

                {/* Menu Content (Updated) */}
                <div className="relative z-10 w-full bg-[#1A1E2E] border-t border-slate-700/50 p-6 space-y-6">
                    {/* Mobile Nav Links */}
                    <nav className="flex flex-col space-y-5 text-lg">
                        <Link
                            to="/"
                            className="text-slate-200 hover:text-white"
                            onClick={closeMobileMenu} // Close menu on click
                        >
                            Home
                        </Link>
                        <Link
                            to="/admin"
                            className="text-slate-200 hover:text-white"
                            onClick={closeMobileMenu} // Close menu on click
                        >
                            Admin Panel {/* <-- Updated text */}
                        </Link>
                    </nav>

                    {/* Mobile CTA Button (Unchanged) */}
                    <Link
                        to="/#voice"
                        onClick={closeMobileMenu} // Close menu on click
                        className="block w-full text-center rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-5 py-3 shadow-md hover:opacity-90 transition-opacity"
                    >
                        Try Voice Chat
                    </Link>
                </div>
            </div>
        </header>
    );
}




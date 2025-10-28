
// frontend\src\components\Home.tsx
import VoiceAgent from "./VoiceAgent";
// Removed Navbar import, as it's rendered in App.tsx

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1A1E2E] via-[#2A3048] to-[#1A1E2E] text-slate-100 font-sans">
            {/* Safe-area for iOS notches */}
            <div className="pt-[env(safe-area-inset-top)]" />

            {/* Main Content Area */}
            <main id="voice" className="flex-1 flex items-center justify-center px-4 py-8 lg:py-12">
                {/* Centered container with proper max-width */}
                <div className="w-full max-w-6xl mx-auto">
                    {/* Flex container for desktop layout */}
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">

                        {/* Headline Section (Left Side on Desktop) */}
                        <section className="flex-1 text-center lg:text-left space-y-6 max-w-xl">
                            {/* Main Title */}
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-tight">
                                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                                    Dental Clinic
                                </span>
                                <br />
                                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                                    Appointment Booking
                                </span>
                            </h1>

                            {/* Subtitle */}
                            <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 font-light">
                                Powered by{" "}
                                <span className="bg-gradient-to-r from-teal-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent font-semibold">
                                    GenIntel Technologies
                                </span>
                            </p>

                            {/* Trust badges */}
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                                <div className="inline-flex items-center gap-2 rounded-lg bg-slate-800/60 backdrop-blur-sm px-5 py-3 border border-slate-700/50 shadow-lg">
                                    <span className="text-xl">🕑</span>
                                    <span className="text-sm font-medium text-slate-200">24/7 Assistance</span>
                                     {/* Removed second badge items for brevity/focus */}
                                </div>
                                 <div className="inline-flex items-center gap-2 rounded-lg bg-slate-800/60 backdrop-blur-sm px-5 py-3 border border-slate-700/50 shadow-lg">
                                    <span className="text-xl">🌐</span>
                                    <span className="text-sm font-medium text-slate-200">Multi-language Support</span>
                                </div>

                            </div>
                        </section>

                        {/* VoiceAgent Component Section (Right Side on Desktop) */}
                        <section className="flex-1 w-full max-w-md lg:max-w-lg">
                            <VoiceAgent />
                        </section>
                    </div>
                </div>
            </main>

            {/* NO FOOTER ELEMENT HERE ANYMORE */}

        </div>
    );
}
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";

import agentSpeakingGif from "../assets/VoiceOver.gif";
import userSpeakingGif from "../assets/original-VoiceEffect.gif";
import agentImage from "../assets/indian-female-customer-support-agent.jpg";

const CLIENT_KEY = import.meta.env.VITE_VAPI_CLIENT_KEY as string;
const AGENT_ID = import.meta.env.VITE_VAPI_AGENT_ID as string;
const vapi = new Vapi(CLIENT_KEY);

type Speaker = "user" | "agent" | null;
type Message = {
    role: "user" | "assistant";
    transcript: string;
};

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
);

export default function VoiceAgent() {
    const [isCallActive, setIsCallActive] = useState(false);
    const [whoIsSpeaking, setWhoIsSpeaking] = useState<Speaker>(null);
    const [status, setStatus] = useState<"idle" | "connecting" | "in-call" | "stopping">("idle");
    const [error, setError] = useState<string | null>(null);
    const [conversation, setConversation] = useState<Message[]>([]);
    const conversationRef = useRef<HTMLDivElement>(null);
    const startingRef = useRef(false);
    const stoppingRef = useRef(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        const v: any = vapi;
        const onSpeechStart = (p?: any) => {
            const s = typeof p === "string" ? p : p?.speaker;
            if (s === "user") setWhoIsSpeaking("user");
            if (s === "agent") setWhoIsSpeaking("agent");
        };
        const onSpeechStop = () => setWhoIsSpeaking(null);
        const onCallStart = () => {
            setIsCallActive(true);
            setStatus("in-call");
            setError(null);
            setConversation([]);
        };
        const onCallEnd = () => {
            setIsCallActive(false);
            setStatus("idle");
            setWhoIsSpeaking(null);
            startingRef.current = false;
            stoppingRef.current = false;
        };
        const onError = (e: any) => {
            const msg =
                e?.message?.includes("Permission denied") ||
                e?.name === "NotAllowedError"
                    ? "Microphone access denied. Please allow mic permissions."
                    : e?.message || String(e);
            setError(msg);
            setStatus("idle");
            setIsCallActive(false);
            startingRef.current = false;
            stoppingRef.current = false;
        };
        const onMessage = (message: any) => {
            if (message.type === "transcript" && message.transcript) {
                setConversation((prev) => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage && lastMessage.role === message.role) {
                        const updatedConversation = [...prev];
                        updatedConversation[prev.length - 1] = { ...lastMessage, transcript: message.transcript, };
                        return updatedConversation;
                    }
                    return [...prev, { role: message.role, transcript: message.transcript }];
                });
            }
        };
        v.on?.("speech-start", onSpeechStart);
        v.on?.("speech-stop", onSpeechStop);
        v.on?.("call-start", onCallStart);
        v.on?.("call-end", onCallEnd);
        v.on?.("error", onError);
        v.on?.("message", onMessage);
        return () => {
            mountedRef.current = false;
            v.off?.("speech-start", onSpeechStart);
            v.off?.("speech-stop", onSpeechStop);
            v.off?.("call-start", onCallStart);
            v.off?.("call-end", onCallEnd);
            v.off?.("error", onError);
            v.off?.("message", onMessage);
        };
    }, []);
    useEffect(() => {
        if (conversationRef.current) {
            conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
        }
    }, [conversation]);
    const secureContext = typeof window !== "undefined" && (window.isSecureContext || location.hostname === "localhost");
    const startCall = useCallback(async () => {
        if (startingRef.current || isCallActive || status === "connecting") return;
        setError(null);
        if (!CLIENT_KEY || !AGENT_ID) {
            setError("Missing env: VITE_VAPI_CLIENT_KEY or VITE_VAPI_AGENT_ID");
            return;
        }
        if (!secureContext) {
            setError("Use HTTPS (or localhost) for microphone access.");
            return;
        }
        try {
            startingRef.current = true;
            setStatus("connecting");
            await navigator.mediaDevices.getUserMedia({ audio: true });
            await vapi.start(AGENT_ID);
        } catch (e: any) {
            setError(e?.message || String(e));
            setStatus("idle");
            startingRef.current = false;
        }
    }, [isCallActive, status, secureContext]);
    const stopCall = useCallback(async () => {
        if (stoppingRef.current || !isCallActive) return;
        stoppingRef.current = true;
        setStatus("stopping");
        setIsCallActive(false);
        setWhoIsSpeaking(null);
        await (vapi as any).stop?.();
    }, [isCallActive]);
    const avatarSrc = useMemo(() => {
        if (whoIsSpeaking === "user") return userSpeakingGif;
        if (whoIsSpeaking === "agent") return agentSpeakingGif;
        return agentImage;
    }, [whoIsSpeaking]);
    const badge = {
        idle: { text: "Idle", color: "bg-slate-700 text-slate-300" },
        connecting: { text: "Connecting…", color: "bg-amber-600 text-white" },
        "in-call": { text: "Live", color: "bg-green-600 text-white" },
        stopping: { text: "Disconnecting…", color: "bg-rose-600 text-white" },
    }[status];

    return (
        <section className="w-full flex flex-col lg:flex-row items-center justify-center lg:items-start lg:justify-center gap-4 px-4 py-0 max-w-5xl mx-auto">
            {error && (
                <div className="mb-3 rounded-xl border border-rose-400 bg-rose-900/50 px-4 py-3 text-sm text-rose-200 w-full lg:absolute lg:top-24 lg:left-1/2 lg:-translate-x-1/2 lg:max-w-md">
                    {error}
                </div>
            )}

            {/* Left Column: Agent Avatar and Controls */}
            <div className="flex flex-col items-center flex-shrink-0">
                <div className="relative mt-2 flex justify-center">
                    {/* MODIFIED: Reduced image size for smaller screens */}
                    <div className="relative w-32 h-32 sm:w-36 sm:h-36">
                        {status === "in-call" && (
                            <div className="absolute inset-0 rounded-full animate-ping bg-blue-500/50" />
                        )}
                        <img
                            src={avatarSrc}
                            alt="Appointment Booking"
                            className="relative z-10 w-full h-full object-cover rounded-full shadow-2xl border-4 border-slate-700"
                        />
                    </div>
                </div>

                <p className="mt-2 text-xl font-semibold text-slate-200">Seema</p>

                <div className="mt-2 text-center h-6"> {/* Added fixed height to prevent layout shift */}
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badge.color}`}>
                        {badge.text}
                    </span>
                    {whoIsSpeaking === "user" && <span className="ml-2 text-fuchsia-400 text-sm">Listening…</span>}
                    {whoIsSpeaking === "agent" && <span className="ml-2 text-indigo-400 text-sm">Speaking…</span>}
                </div>

                {/* MODIFIED: Reduced top margin */}
                <div className="mt-4 flex justify-center">
                    {status === "idle" || status === "connecting" ? (
                        <button
                            onClick={startCall}
                            disabled={status === "connecting"}
                            className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-10 text-base shadow-lg transition-all duration-300 active:scale-[0.98] disabled:opacity-60"
                        >
                            {status === "connecting" ? "Connecting…" : "Let’s Get Started"}
                        </button>
                    ) : (
                        <button
                            onClick={stopCall}
                            disabled={status === "stopping"}
                            className={`rounded-xl py-3 px-10 text-white font-semibold text-base shadow-lg active:scale-[0.98] disabled:opacity-60 transition-all duration-300 ${status === "stopping" ? "bg-rose-700/80 cursor-not-allowed" : "bg-rose-600 hover:bg-rose-700"}`}
                        >
                            {status === "stopping" ? "Disconnecting…" : "End Chat"}
                        </button>
                    )}
                </div>
            </div>

            {/* Right Column: Conversation Display */}
            {/* KEY CHANGE: This container is now hidden on mobile ('hidden') and shown on large screens ('lg:flex').
              When the call is active ('isCallActive'), it becomes visible on mobile too ('isCallActive ? 'flex' : 'hidden'').
            */}
            <div
                ref={conversationRef}
                className={`${isCallActive ? 'flex' : 'hidden'} lg:flex mt-4 lg:mt-0 w-full lg:w-96 h-80 lg:h-[400px] overflow-y-auto p-6 space-y-6 rounded-2xl bg-slate-800/70 border border-slate-700 shadow-xl flex-col flex-shrink-0`}
            >
                {conversation.length === 0 && isCallActive ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        Connecting to agent...
                    </div>
                ) : conversation.length === 0 && !isCallActive ? (
                     <div className="hidden items-center justify-center h-full text-slate-400 text-lg">
                        Your conversation will appear here.
                    </div>
                ) : (
                    conversation.map((msg, index) => {
                        const isUser = msg.role === 'user';
                        return (
                            <div key={index} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                {!isUser && (
                                    <img src={agentImage} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-slate-600" alt="Agent" />
                                )}
                                <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
                                    <span className="text-xs font-medium text-slate-400">
                                        {isUser ? 'You' : 'Seema'}
                                    </span>
                                    <div
                                        className={`px-4 py-2.5 rounded-2xl max-w-xs text-sm leading-relaxed
                                        ${isUser
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-md'
                                            : 'bg-slate-700 text-slate-100 rounded-bl-none shadow-md'
                                        }`}
                                    >
                                        {msg.transcript}
                                    </div>
                                </div>
                                {isUser && (
                                    <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0 border border-slate-500">
                                        <UserIcon className="w-5 h-5 text-slate-300" />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
}
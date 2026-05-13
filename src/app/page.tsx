
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Mail, Zap } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

/**
 * Entry Point for MatchFlow.
 * Displays the welcome screen with branding and access options.
 * Uses a hydration check to ensure stable rendering.
 */
export default function WelcomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // To prevent hydration mismatch, the server and first client render MUST be identical.
  // We return null until mounted on the client to ensure a clean transition.
  if (!mounted) {
    return null
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-screen bg-black overflow-hidden">
      {/* Background Image with Premium Gradients */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://picsum.photos/seed/matchwelcome/800/1200" 
          alt="Welcome" 
          fill 
          className="object-cover opacity-60 grayscale-[0.2]"
          data-ai-hint="couple romance"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex-1 flex flex-col justify-end p-8 pb-16 space-y-8">
        <div className="space-y-3 text-center mb-10">
          <div className="relative inline-block">
            <Heart className="w-16 h-16 text-[#FF3B30] mx-auto fill-current drop-shadow-[0_0_15px_rgba(255,59,48,0.5)] animate-pulse" />
          </div>
          <h1 className="text-6xl font-logo text-white drop-shadow-lg tracking-tight">
            MatchFlow
          </h1>
          <p className="text-white/60 font-black text-[10px] uppercase tracking-[0.4em] ml-1">
            Connect with Heart
          </p>
        </div>

        <div className="space-y-4 max-w-sm mx-auto w-full">
          <Button 
            asChild
            className="w-full h-15 rounded-full bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white font-black text-sm tracking-widest uppercase shadow-2xl active:scale-95 transition-all"
          >
            <Link href="/login" className="flex items-center justify-center gap-3">
              <Mail className="w-5 h-5" />
              Continue with Email
            </Link>
          </Button>

          <Button 
            asChild
            variant="outline"
            className="w-full h-15 rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/20 font-black text-sm tracking-widest uppercase active:scale-95 transition-all"
          >
            <Link href="/onboarding?fast=true" className="flex items-center justify-center gap-3">
              <Zap className="w-5 h-5 text-[#FFD600] fill-current" />
              Fast Login
            </Link>
          </Button>
        </div>

        <p className="text-[9px] text-center text-white/30 font-bold px-8 leading-relaxed max-w-xs mx-auto">
          By entering, you confirm you are 18+ and agree to our <span className="underline text-white/50">Terms</span> and <span className="underline text-white/50">Privacy Policy</span>.
        </p>
      </div>
    </div>
  )
}

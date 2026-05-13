
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Mail, Zap } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

/**
 * Entry Point for MatchFlow.
 * Displays a spacious, premium welcome screen with branding and access options.
 * Uses a hydration check to ensure stable rendering.
 */
export default function WelcomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-screen bg-black overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://picsum.photos/seed/matchwelcome/1000/1500" 
          alt="Welcome" 
          fill 
          className="object-cover opacity-60 grayscale-[0.2]"
          data-ai-hint="couple romance"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-8 pt-24 pb-20 justify-between">
        <div className="flex flex-col items-center justify-center space-y-8 mt-12">
          <div className="relative">
            <Heart className="w-16 h-16 text-[#FF3B30] fill-current drop-shadow-[0_0_40px_rgba(255,59,48,0.7)] animate-pulse" />
          </div>
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-logo text-white drop-shadow-2xl tracking-tight">
              MatchFlow
            </h1>
            <p className="text-white/80 font-black text-[9px] uppercase tracking-[0.6em] ml-2">
              Connect with Heart
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-5 mb-8">
          <Button 
            asChild
            className="w-full h-16 rounded-full bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white font-black text-sm tracking-widest uppercase shadow-2xl active:scale-95 transition-all"
          >
            <Link href="/login" className="flex items-center justify-center gap-3">
              <Mail className="w-5 h-5" />
              Continue with Email
            </Link>
          </Button>

          <Button 
            asChild
            variant="outline"
            className="w-full h-16 rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/20 font-black text-sm tracking-widest uppercase active:scale-95 transition-all"
          >
            <Link href="/onboarding?fast=true" className="flex items-center justify-center gap-3">
              <Zap className="w-5 h-5 text-[#FFD600] fill-current" />
              Fast matching
            </Link>
          </Button>

          <div className="pt-4">
            <p className="text-[10px] text-center text-white/40 font-bold px-6 leading-relaxed">
              By entering, you confirm you are 18+ and agree to our <span className="underline text-white/60">Terms</span> and <span className="underline text-white/60">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

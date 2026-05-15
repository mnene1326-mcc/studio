
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Smartphone, Globe, Sparkles, PlusSquare, Share } from "lucide-react"
import { cn } from "@/lib/utils"

export function InstallPrompt() {
  const [isStandalone, setIsStandalone] = useState(true) // Default to true to avoid flicker
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone || 
                       document.referrer.includes('android-app://')
      
      setIsStandalone(standalone)
    }

    checkStandalone()
    // Periodic check to see if user switched from browser to standalone
    const interval = setInterval(checkStandalone, 2000)
    return () => clearInterval(interval)
  }, [])

  if (!isMounted || isStandalone) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
      {/* Background Polish */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#00A2FF] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-12">
        <div className="space-y-6">
          <div className="relative mx-auto w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center transform -rotate-12">
            <Smartphone className="w-12 h-12 text-[#00A2FF]" />
            <div className="absolute -top-2 -right-2 bg-yellow-400 p-1.5 rounded-full shadow-lg">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter">MatchFlow</h1>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em]">App Version Required</p>
          </div>
        </div>

        <div className="space-y-8 bg-white/5 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 shadow-2xl">
          <p className="text-sm font-medium text-white/80 leading-relaxed">
            To ensure a secure and smooth experience, MatchFlow can only be accessed as an app.
          </p>

          <div className="space-y-4">
            {/* iOS Instructions */}
            <div className="text-left space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <p className="text-[10px] font-black text-white uppercase tracking-widest">For iOS (iPhone)</p>
              </div>
              <p className="text-[11px] text-white/60 flex items-center gap-2">
                Tap <Share className="w-3 h-3" /> "Share" then <PlusSquare className="w-3 h-3" /> "Add to Home Screen"
              </p>
            </div>

            {/* Android Instructions */}
            <div className="text-left space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <p className="text-[10px] font-black text-white uppercase tracking-widest">For Android</p>
              </div>
              <p className="text-[11px] text-white/60 flex items-center gap-2">
                Tap <div className="w-1 h-1 bg-white/40 rounded-full" /> <div className="w-1 h-1 bg-white/40 rounded-full" /> <div className="w-1 h-1 bg-white/40 rounded-full" /> "Menu" then tap "Install App"
              </p>
            </div>
          </div>
        </div>

        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest animate-pulse">
          Open the app from your home screen to login
        </p>
      </div>
    </div>
  )
}

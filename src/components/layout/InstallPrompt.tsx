
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X, Smartphone, Globe, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function InstallPrompt() {
  const [isVisible, setIsVisible] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed/standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone || 
                     document.referrer.includes('android-app://')
    
    setIsStandalone(standalone)

    // Show prompt if not standalone and not dismissed recently
    const dismissed = localStorage.getItem('install_prompt_dismissed')
    if (!standalone && !dismissed) {
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('install_prompt_dismissed', 'true')
  }

  if (!isVisible || isStandalone) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleDismiss} />
      
      <div className="relative w-full max-w-sm bg-white rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        <button 
          onClick={handleDismiss}
          className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-400 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative h-48 bg-[#00A2FF] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl transform rotate-12 scale-110">
            <Smartphone className="w-12 h-12 text-[#00A2FF]" />
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
        </div>

        <div className="p-8 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-black tracking-tight">Better in the App</h2>
            <p className="text-sm font-medium text-gray-500 leading-relaxed px-4">
              Install MatchFlow on your home screen for faster access, offline mode, and a smoother experience.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-2xl flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <Globe className="w-5 h-5 text-[#00A2FF]" />
              </div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-tight">
                Works offline and uses less data than the website.
              </p>
            </div>

            <Button 
              className="w-full h-16 rounded-full bg-[#00A2FF] text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-100 active:scale-95 transition-all"
              onClick={() => {
                // Instruction for iOS since automatic PWA prompt is restricted
                alert("To install: Tap the 'Share' icon in your browser and select 'Add to Home Screen'.")
                handleDismiss()
              }}
            >
              <Download className="w-5 h-5 mr-2" />
              Install Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

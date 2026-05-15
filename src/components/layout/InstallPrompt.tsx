
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Smartphone, Sparkles, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function InstallPrompt() {
  const [isStandalone, setIsStandalone] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsMounted(true)
    
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone || 
                       document.referrer.includes('android-app://')
      setIsStandalone(standalone)
    }

    checkStandalone()

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    const interval = setInterval(checkStandalone, 2000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearInterval(interval)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setIsInstalling(true)
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
      setIsInstalling(false)
    } else {
      // Logic for browsers that don't support beforeinstallprompt (like iOS Safari)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
      if (isIOS) {
        toast({
          title: "iOS Installation",
          description: "Tap 'Share' and then 'Add to Home Screen' to install MatchFlow.",
        })
      } else {
        toast({
          title: "Manual Install",
          description: "Please check your browser menu and select 'Install App'.",
        })
      }
    }
  }

  if (!isMounted || isStandalone) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
      {/* Immersive Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[150%] bg-gradient-to-br from-[#00A2FF]/30 via-transparent to-purple-600/20 opacity-40" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00A2FF] rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[160px] animate-pulse delay-700" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center space-y-12">
        {/* Animated Brand Header */}
        <div className="space-y-6">
          <div className="relative mx-auto w-28 h-28 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,162,255,0.3)] flex items-center justify-center transform hover:scale-105 transition-transform">
            <Smartphone className="w-14 h-14 text-[#00A2FF]" />
            <div className="absolute -top-3 -right-3 bg-yellow-400 p-2 rounded-full shadow-lg animate-bounce">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">MatchFlow</h1>
            <div className="text-[11px] font-black text-white/40 uppercase tracking-[0.5em] ml-2">App Experience</div>
          </div>
        </div>

        {/* Action Card */}
        <div className="w-full bg-white/5 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] space-y-8">
          <div className="space-y-2">
            <p className="text-lg font-bold text-white tracking-tight">Better Connectivity</p>
            <p className="text-sm font-medium text-white/60 leading-relaxed">
              Install the app version to enjoy seamless chats, instant earnings, and the full MatchFlow experience.
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="w-full h-20 rounded-3xl bg-[#00A2FF] hover:bg-[#0081CC] text-white font-black uppercase tracking-[0.15em] text-sm gap-3 shadow-[0_10px_30px_rgba(0,162,255,0.4)] active:scale-95 transition-all"
            >
              {isInstalling ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
              Install MatchFlow Now
            </Button>
            
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] animate-pulse">
              Standard data charges may apply
            </p>
          </div>
        </div>

        {/* Footer Brand */}
        <div className="pt-4">
          <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.6em]">Connect with Heart</p>
        </div>
      </div>
    </div>
  )
}

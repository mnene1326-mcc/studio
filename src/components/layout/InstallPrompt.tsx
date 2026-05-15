
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
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
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
      if (isIOS) {
        toast({
          title: "Install App",
          description: "Tap 'Share' and then 'Add to Home Screen' to install.",
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
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
      <div className="relative z-10 w-full max-w-xs flex flex-col items-center space-y-16">
        <div className="space-y-4">
          <h1 className="text-lg font-logo text-white tracking-tight">MatchFlow</h1>
          <div className="h-0.5 w-6 bg-[#00A2FF] mx-auto rounded-full opacity-50" />
        </div>

        <Button 
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="w-full h-16 rounded-full bg-[#00A2FF] hover:bg-[#0081CC] text-white font-black uppercase tracking-[0.2em] text-sm shadow-[0_10px_30px_rgba(0,162,255,0.3)] active:scale-95 transition-all"
        >
          {isInstalling ? <Loader2 className="w-6 h-6 animate-spin" /> : "Install App"}
        </Button>

        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">
          Connect with Heart
        </p>
      </div>
    </div>
  )
}

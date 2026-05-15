
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Smartphone, Sparkles, Share, PlusSquare, Loader2 } from "lucide-react"
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
          title: "Install Instructions",
          description: "Tap the 'Share' icon below then select 'Add to Home Screen' to install MatchFlow.",
        })
      } else {
        toast({
          title: "Check Browser Menu",
          description: "Open your browser menu (three dots) and select 'Install App' or 'Add to Home Screen'.",
        })
      }
    }
  }

  if (!isMounted || isStandalone) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#00A2FF] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-10">
        <div className="space-y-6">
          <div className="relative mx-auto w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center transform -rotate-12">
            <Smartphone className="w-12 h-12 text-[#00A2FF]" />
            <div className="absolute -top-2 -right-2 bg-yellow-400 p-1.5 rounded-full shadow-lg">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter">MatchFlow</h1>
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em]">Launch App Version</div>
          </div>
        </div>

        <div className="space-y-8 bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-2xl">
          <div className="text-sm font-medium text-white/80 leading-relaxed">
            MatchFlow is optimized for native use. Please install the app to access your profile and chats.
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="w-full h-20 rounded-3xl bg-[#00A2FF] hover:bg-[#0081CC] text-white font-black uppercase tracking-widest text-sm gap-3 shadow-2xl active:scale-95 transition-all"
            >
              {isInstalling ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
              Install MatchFlow Now
            </Button>
            
            <div className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">
              Tap to begin setup
            </div>
          </div>
        </div>

        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest animate-pulse">
          Open from home screen to continue
        </p>
      </div>
    </div>
  )
}

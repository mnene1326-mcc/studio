
"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  Headphones, 
  MessageSquare, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Gem,
  ArrowRight
} from "lucide-react"

export default function CustomerSupportPage() {
  const router = useRouter()
  const handleWhatsAppChat = () => window.open("https://wa.me/254713934404", "_blank")

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <header className="bg-black h-64 relative px-6 pt-16 overflow-hidden">
        {/* Abstract backgrounds */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00A2FF]/20 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] -ml-24 -mb-24" />
        
        <div className="relative z-10 flex flex-col gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="text-white rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 w-10 h-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white tracking-tighter">Support</h1>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">We're here to help 24/7</p>
          </div>
        </div>
      </header>

      <main className="px-6 -mt-12 relative z-20 space-y-6 pb-20">
        <section className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-8">
          <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center relative">
            <Headphones className="w-10 h-10 text-[#00A2FF]" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-black tracking-tight">Direct Assistance</h2>
            <p className="text-sm font-medium text-gray-400 leading-relaxed px-4">
              Connect with our live support agents on WhatsApp for instant resolutions.
            </p>
          </div>

          <Button 
            onClick={handleWhatsAppChat}
            className="w-full h-16 bg-[#25D366] hover:bg-[#128C7E] rounded-full text-white font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <MessageSquare className="w-6 h-6 fill-current" />
            Chat on WhatsApp
            <ExternalLink className="w-4 h-4 opacity-50" />
          </Button>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex flex-col gap-4">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-black uppercase">24/7 Service</h3>
              <p className="text-[9px] font-medium text-gray-400">Average response: 5 mins</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex flex-col gap-4">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-black uppercase">Secure</h3>
              <p className="text-[9px] font-medium text-gray-400">End-to-end encrypted</p>
            </div>
          </div>
        </div>

        <section className="bg-black text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-[#00A2FF]/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                <Gem className="w-4 h-4 text-[#00A2FF]" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest">Premium Support</h3>
            </div>
            <p className="text-xs font-medium text-white/60 leading-relaxed">
              Facing issues with Diamond withdrawals or Coin recharges? Priority tickets are processed faster.
            </p>
            <button 
              onClick={handleWhatsAppChat}
              className="flex items-center gap-2 text-[#00A2FF] text-[10px] font-black uppercase tracking-widest"
            >
              Raise Priority Ticket
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      <footer className="p-10 text-center">
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">Direct Line: +254 713 934 404</p>
      </footer>
    </div>
  )
}

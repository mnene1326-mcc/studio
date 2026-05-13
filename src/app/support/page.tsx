"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Headphones, MessageSquare, ExternalLink, HelpCircle, ShieldCheck } from "lucide-react"

export default function CustomerSupportPage() {
  const router = useRouter()
  const handleWhatsAppChat = () => window.open("https://wa.me/254713934404", "_blank")

  return (
    <div className="flex-1 bg-[#F8F9FA] min-h-screen pb-10">
      <header className="bg-[#00A2FF] h-32 relative px-4 pt-12">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white rounded-full hover:bg-white/20">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="flex-1 text-xl font-black text-white tracking-tight uppercase text-center pr-10">Support Center</h1>
        </div>
      </header>

      <main className="px-6 -mt-6">
        <section className="bg-white rounded-3xl p-8 shadow-xl border border-black/5 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
              <Headphones className="w-10 h-10 text-[#00A2FF]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-black tracking-tight">How can we help?</h2>
              <p className="text-sm font-bold text-gray-400 leading-relaxed px-4">Our team is available 24/7 to assist you with any questions.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleWhatsAppChat}
              className="w-full h-16 bg-[#25D366] hover:bg-[#128C7E] rounded-full text-white font-black uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <MessageSquare className="w-6 h-6 fill-current" />
              Chat on WhatsApp
              <ExternalLink className="w-4 h-4 opacity-50" />
            </Button>
            <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">Direct Support: 0713 934 404</p>
          </div>
        </section>
      </main>
    </div>
  )
}

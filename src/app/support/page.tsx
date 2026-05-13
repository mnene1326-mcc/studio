
"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Headphones, MessageSquare, ExternalLink, HelpCircle, ShieldCheck } from "lucide-react"

export default function CustomerSupportPage() {
  const router = useRouter()

  const handleWhatsAppChat = () => {
    // Standard WA.me link for Kenyan number 0713934404
    window.open("https://wa.me/254713934404", "_blank")
  }

  return (
    <div className="flex-1 bg-[#F8F9FA] min-h-screen pb-10">
      {/* Architectural Header - Perfectly Straight */}
      <header className="bg-[#FF3B30] h-32 relative px-4 pt-12">
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
              <Headphones className="w-10 h-10 text-[#4285F4]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-black tracking-tight">How can we help?</h2>
              <p className="text-sm font-bold text-gray-400 leading-relaxed px-4">
                Our support team is available 24/7 to assist you with any questions or technical issues.
              </p>
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

            <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
              Direct Support: 0713 934 404
            </p>
          </div>

          <div className="pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center gap-2">
              <HelpCircle className="w-5 h-5 text-orange-500" />
              <span className="text-[10px] font-black uppercase text-gray-500">FAQ Help</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span className="text-[10px] font-black uppercase text-gray-500">Safety tips</span>
            </div>
          </div>
        </section>

        <section className="mt-8 px-2">
          <div className="bg-white/50 backdrop-blur-md rounded-2xl p-6 border border-white">
            <h3 className="text-xs font-black text-black uppercase tracking-widest mb-2">Notice</h3>
            <p className="text-[11px] font-bold text-gray-500 leading-relaxed">
              For your safety, MatchFlow support will never ask for your password or verification codes via WhatsApp. Always verify the profile badge.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

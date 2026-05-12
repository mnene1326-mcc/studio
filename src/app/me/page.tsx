
"use client"

import { useMemo, useEffect, useState } from "react"
import { doc } from "firebase/firestore"
import { useFirestore, useUser, useDoc } from "@/firebase"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
import { 
  Settings, 
  ChevronRight, 
  Copy, 
  Check, 
  ClipboardList, 
  CircleDollarSign, 
  Store, 
  Hexagon, 
  ShoppingBag, 
  Shield, 
  Award, 
  BadgeCheck, 
  Headphones, 
  MessageSquareQuote, 
  Gamepad2,
  Crown,
  FileText,
  Target,
  Wallet
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface UserProfile {
  name: string
  email: string
  photoURL: string
  matchFlowId?: string
}

export default function MePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [user, authLoading, router])

  const profileRef = useMemo(() => {
    return user ? doc(db, "users", user.uid) : null
  }, [db, user])

  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(profileRef)

  const handleCopyId = () => {
    if (profile?.matchFlowId) {
      navigator.clipboard.writeText(profile.matchFlowId)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "ID copied to clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (authLoading || profileLoading) {
    return (
      <div className="flex-1 pb-20 bg-background flex flex-col items-center justify-center">
        <div className="text-center animate-pulse font-headline text-primary text-lg">Loading...</div>
      </div>
    )
  }

  if (!user || !profile) return null

  return (
    <div className="flex-1 pb-20 bg-[#F8F9FA] min-h-screen">
      <header className="relative pt-12 pb-8 px-6 bg-gradient-to-b from-[#FF3B30]/10 via-[#FF3B30]/5 to-[#F8F9FA]">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-1 group">
              <h2 className="text-2xl font-black text-black tracking-tight">{profile.name} 🫡</h2>
              <BadgeCheck className="w-5 h-5 text-[#FF3B30]" />
            </div>
            
            <div className="flex gap-1.5 py-1">
              <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-md px-2 py-0.5 flex items-center shadow-sm">
                <span className="text-[8px] text-white font-black italic tracking-widest">SVIP1</span>
              </div>
            </div>

            <div 
              className="flex items-center gap-1.5 cursor-pointer active:opacity-60 transition-all hover:bg-black/5 rounded-full px-2 py-1 -ml-2"
              onClick={handleCopyId}
            >
              <p className="text-[#8B8B8B] font-bold text-xs tracking-tight">ID:{profile.matchFlowId || "null"}</p>
              {copied ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3 text-[#8B8B8B]" />
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-br from-[#FF3B30] to-orange-500 rounded-full blur-sm opacity-50"></div>
            <div className="relative w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-muted">
              <Image 
                src={profile.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`} 
                alt={profile.name} 
                fill 
                className="object-cover" 
                data-ai-hint="person profile"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8 px-2 glass-card rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col items-center">
            <div className="flex items-start">
              <span className="text-lg font-black text-black leading-none tracking-tight">12k</span>
              <div className="w-1.5 h-1.5 bg-[#FF3B30] rounded-full -mt-0.5 ml-0.5 shadow-sm" />
            </div>
            <span className="text-[10px] text-[#8B8B8B] font-bold mt-1 uppercase tracking-tighter">Visitors</span>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FF3B30] rounded-2xl p-4 flex flex-col justify-center gap-1 shadow-lg shadow-red-500/10 h-24 overflow-hidden group active:scale-95 transition-all">
            <div className="flex items-center gap-2">
              <div className="bg-white rounded-full p-1.5 shadow-md">
                <CircleDollarSign className="w-4 h-4 text-[#FF3B30]" />
              </div>
              <span className="text-3xl font-black text-white leading-none">10</span>
            </div>
            <span className="text-[10px] text-white/90 font-black uppercase tracking-widest ml-1">My Coins</span>
          </div>
          
          {/* Replaced VIP4 with Income Button Card */}
          <div className="bg-gradient-to-br from-[#4285F4] to-[#2B65C5] rounded-2xl p-4 flex items-center justify-between shadow-lg h-24 relative overflow-hidden group active:scale-95 transition-all">
             <div className="z-10 flex flex-col">
               <div className="flex items-center gap-2">
                  <div className="bg-white rounded-full p-1.5 shadow-md">
                    <Wallet className="w-4 h-4 text-[#4285F4]" />
                  </div>
                  <span className="text-3xl font-black text-white leading-none">0.00</span>
               </div>
               <span className="text-[10px] text-white/80 font-black uppercase tracking-widest mt-1 ml-1">Income</span>
             </div>
             <div className="absolute right-[-8px] bottom-[-8px] opacity-10 transition-transform group-hover:scale-110">
                <CircleDollarSign className="w-16 h-16 text-white rotate-12" />
             </div>
          </div>
        </div>

        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-black/5">
          <h3 className="text-xs font-black text-black uppercase tracking-[0.2em] mb-6 px-1 opacity-40">Main Actions</h3>
          <div className="grid grid-cols-3 gap-y-8">
             {[
               { label: "Task Center", icon: Target, color: "text-red-500", bg: "bg-red-50" },
               { label: "Secret Note", icon: FileText, color: "text-orange-500", bg: "bg-orange-50" },
               { label: "Income", icon: CircleDollarSign, color: "text-red-400", bg: "bg-red-50" },
               { label: "Premium Store", icon: Store, color: "text-red-600", bg: "bg-red-50" },
               { label: "Aristocracy", icon: Hexagon, color: "text-red-700", bg: "bg-red-50" },
               { label: "Active Tasks", icon: ClipboardList, color: "text-pink-500", bg: "bg-pink-50" }
             ].map((item, i) => (
               <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                 <div className={cn("p-4 rounded-[1.2rem] shadow-sm transition-all group-hover:shadow-md active:scale-90", item.bg)}>
                   <item.icon className={cn("w-6 h-6", item.color)} />
                 </div>
                 <span className="text-[10px] font-black text-gray-600 text-center leading-tight tracking-tighter">{item.label}</span>
               </div>
             ))}
          </div>
        </section>

        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-black/5">
          <h3 className="text-xs font-black text-black uppercase tracking-[0.2em] mb-6 px-1 opacity-40">More Services</h3>
          <div className="grid grid-cols-4 gap-y-8">
            {[
              { label: "Inventory", icon: ShoppingBag },
              { label: "Experience", icon: Shield },
              { label: "Badges", icon: Award },
              { label: "Verification", icon: BadgeCheck },
              { label: "Help Center", icon: Headphones },
              { label: "Feedback", icon: MessageSquareQuote },
              { label: "Settings", icon: Settings, href: "/settings" },
              { label: "Game Hub", icon: Gamepad2 }
            ].map((item, i) => (
              <Link 
                key={i} 
                href={item.href || "#"} 
                className="flex flex-col items-center gap-2 active:scale-90 transition-all group"
              >
                <div className="p-2 group-hover:bg-gray-50 rounded-xl transition-colors">
                  <item.icon className="w-7 h-7 text-black/80 stroke-[1.5]" />
                </div>
                <span className="text-[9px] font-black text-gray-500 text-center leading-tight px-0.5 uppercase tracking-tighter">{item.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}

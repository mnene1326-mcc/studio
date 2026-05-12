"use client"

import { useMemo, useEffect, useState } from "react"
import { doc } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { useFirestore, useUser, useDoc, useAuth } from "@/firebase"
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
  Crown
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
  const auth = useAuth()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const profileRef = useMemo(() => {
    return user ? doc(db, "users", user.uid) : null
  }, [db, user])

  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(profileRef)

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

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
      <header className="relative pt-10 pb-6 px-6 bg-gradient-to-b from-[#FF3B30] via-[#FF3B30]/30 to-[#F8F9FA]">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 group">
              <h2 className="text-xl font-black text-black tracking-tight">{profile.name} 🫡</h2>
              <ChevronRight className="w-4 h-4" />
            </div>
            
            <div className="flex gap-1 py-0.5">
              <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-sm px-1.5 py-0.5 flex items-center gap-0.5">
                <span className="text-[7px] text-white font-black italic">SVIP1</span>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-sm px-1.5 py-0.5 flex items-center gap-0.5">
                <span className="text-[7px] text-white font-black italic">VIP4</span>
              </div>
            </div>

            <div 
              className="flex items-center gap-1.5 cursor-pointer active:opacity-60 transition-opacity"
              onClick={handleCopyId}
            >
              <p className="text-[#8B8B8B] font-bold text-xs tracking-tight">ID:{profile.matchFlowId}</p>
              {copied ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3 text-[#8B8B8B]" />
              )}
            </div>
          </div>

          <div className="relative w-16 h-16 rounded-full border-4 border-white/50 shadow-md overflow-hidden bg-muted">
            <Image 
              src={profile.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`} 
              alt={profile.name} 
              fill 
              className="object-cover" 
              data-ai-hint="person profile"
            />
          </div>
        </div>

        <div className="flex justify-between mt-4 px-1">
          {[
            { label: "Friends", val: "0" },
            { label: "Following", val: "0" },
            { label: "Followers", val: "20" },
            { label: "Visitors", val: "12k", dot: true }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="flex items-start">
                <span className="text-base font-black text-black leading-none">{stat.val}</span>
                {stat.dot && <div className="w-1 h-1 bg-[#FF3B30] rounded-full -mt-0.5 ml-0.5" />}
              </div>
              <span className="text-[9px] text-[#8B8B8B] font-bold mt-0.5">{stat.label}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="px-4 -mt-2 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#FF3B30] rounded-xl p-3 flex flex-col justify-center gap-1 shadow-sm h-20">
            <div className="flex items-center gap-1.5">
              <div className="bg-white rounded-full p-1 shadow-sm">
                <CircleDollarSign className="w-3 h-3 text-[#FF3B30]" />
              </div>
              <span className="text-lg font-black text-white">10</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-3 flex items-center justify-between shadow-sm h-20 relative overflow-hidden">
             <div className="z-10">
               <span className="text-xl font-black italic text-gray-200 tracking-tighter">VIP4</span>
             </div>
             <div className="absolute right-[-5px] bottom-[-5px] opacity-40">
                <Crown className="w-14 h-14 text-gray-200 rotate-12" />
             </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-black">Recommended Games</h3>
          <ChevronRight className="w-3 h-3 text-gray-400" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          {[
            { name: "Original 777", img: "777" },
            { name: "MegaJackpot", img: "slots" },
            { name: "DeepSea Treasure", img: "ocean" }
          ].map((game, i) => (
            <div key={i} className="flex flex-col items-center min-w-[80px] gap-1">
              <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-muted shadow-sm">
                <Image 
                  src={`https://picsum.photos/seed/${game.img}/200/120`} 
                  alt={game.name}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-[9px] font-bold text-gray-600 text-center leading-tight">{game.name}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-3 py-2">
           {[
             { label: "Tasks", icon: ClipboardList, color: "bg-red-500" },
             { label: "Income", icon: CircleDollarSign, color: "bg-red-400" },
             { label: "Store", icon: Store, color: "bg-red-600" },
             { label: "Aristocracy", icon: Hexagon, color: "bg-red-700" }
           ].map((item, i) => (
             <div key={i} className="flex flex-col items-center gap-1.5">
               <div className={cn("p-1.5 rounded-lg shadow-sm", item.color)}>
                 <item.icon className="w-5 h-5 text-white" />
               </div>
               <span className="text-[9px] font-bold text-gray-600">{item.label}</span>
             </div>
           ))}
        </div>

        <div className="space-y-3 pt-1">
          <h3 className="text-sm font-bold text-black px-1">Other</h3>
          <div className="grid grid-cols-4 gap-y-4">
            {[
              { label: "Bag", icon: ShoppingBag },
              { label: "Level", icon: Shield },
              { label: "Badge", icon: Award },
              { label: "Certified", icon: BadgeCheck },
              { label: "Customer service", icon: Headphones },
              { label: "User Feedback", icon: MessageSquareQuote },
              { label: "Settings", icon: Settings, href: "/settings" },
              { label: "Game", icon: Gamepad2 }
            ].map((item, i) => (
              <Link 
                key={i} 
                href={item.href || "#"} 
                className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
              >
                <div className="relative">
                  <item.icon className="w-6 h-6 text-black stroke-[1.5]" />
                </div>
                <span className="text-[9px] font-bold text-gray-500 text-center leading-tight px-0.5">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}


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
        <div className="text-center animate-pulse font-headline text-primary text-xl">Loading...</div>
      </div>
    )
  }

  if (!user || !profile) return null

  return (
    <div className="flex-1 pb-24 bg-[#F8F9FA] min-h-screen">
      {/* Header Section with Lime Gradient */}
      <header className="relative pt-12 pb-8 px-6 bg-gradient-to-b from-[#C6FF00] via-[#DFFF00]/40 to-[#F8F9FA]">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-1 group">
              <h2 className="text-2xl font-black text-black tracking-tight">{profile.name} 🫡</h2>
              <ChevronRight className="w-5 h-5" />
            </div>
            
            {/* VIP Badges Row */}
            <div className="flex gap-1.5 py-1">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-sm px-1.5 py-0.5 flex items-center gap-0.5">
                <span className="text-[8px] text-white font-black italic">SVIP1</span>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-sm px-1.5 py-0.5 flex items-center gap-0.5">
                <span className="text-[8px] text-white font-black italic">VIP4</span>
              </div>
              <div className="bg-[#1D4ED8] rounded-full p-0.5">
                <div className="bg-white rounded-full px-1 flex items-center gap-0.5">
                   <span className="text-[8px] text-[#1D4ED8] font-bold">16.</span>
                </div>
              </div>
            </div>

            {/* MatchFlow ID */}
            <div 
              className="flex items-center gap-1.5 cursor-pointer active:opacity-60 transition-opacity"
              onClick={handleCopyId}
            >
              <p className="text-[#8B8B8B] font-bold text-sm tracking-tight">ID:{profile.matchFlowId}</p>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#8B8B8B]" />
              )}
            </div>
          </div>

          {/* Profile Picture */}
          <div className="relative w-20 h-20 rounded-full border-4 border-white/50 shadow-lg overflow-hidden bg-muted">
            <Image 
              src={profile.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`} 
              alt={profile.name} 
              fill 
              className="object-cover" 
              data-ai-hint="person profile"
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex justify-between mt-6 px-2">
          {[
            { label: "Friends", val: "0" },
            { label: "Following", val: "0" },
            { label: "Followers", val: "20" },
            { label: "Visitors", val: "12342", dot: true }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="flex items-start">
                <span className="text-lg font-black text-black leading-none">{stat.val}</span>
                {stat.dot && <div className="w-1.5 h-1.5 bg-red-500 rounded-full -mt-0.5 ml-0.5" />}
              </div>
              <span className="text-[11px] text-[#8B8B8B] font-bold mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-4 -mt-4 space-y-4">
        {/* Wallet & VIP Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#B4F000] rounded-2xl p-4 flex flex-col justify-center gap-1 shadow-sm h-24">
            <div className="flex items-center gap-2">
              <div className="bg-white rounded-full p-1 shadow-sm">
                <CircleDollarSign className="w-4 h-4 text-orange-400 fill-orange-400" />
              </div>
              <span className="text-xl font-black text-white">10</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#948471] via-[#6B5A49] to-[#4A3D31] rounded-2xl p-4 flex items-center justify-between shadow-sm h-24 relative overflow-hidden">
             <div className="z-10">
               <span className="text-2xl font-black italic text-[#E8D5C4] tracking-tighter">VIP4</span>
             </div>
             <div className="absolute right-[-10px] bottom-[-10px] opacity-40">
                <Crown className="w-20 h-20 text-[#E8D5C4] rotate-12" />
             </div>
          </div>
        </div>

        {/* Recommended Games Header */}
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-black">Recommended Games</h3>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Horizontal Game Scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
          {[
            { name: "Original 777", img: "777" },
            { name: "MegaJackpot", img: "slots" },
            { name: "DeepSea Treasure", img: "ocean" }
          ].map((game, i) => (
            <div key={i} className="flex flex-col items-center min-w-[100px] gap-1.5">
              <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-muted shadow-sm">
                <Image 
                  src={`https://picsum.photos/seed/${game.img}/200/120`} 
                  alt={game.name}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{game.name}</span>
            </div>
          ))}
        </div>

        {/* Primary Service Icons */}
        <div className="grid grid-cols-4 gap-4 py-4">
           {[
             { label: "Tasks", icon: ClipboardList, color: "bg-green-500" },
             { label: "Income", icon: CircleDollarSign, color: "bg-lime-400" },
             { label: "Store", icon: Store, color: "bg-green-600" },
             { label: "Aristocracy", icon: Hexagon, color: "bg-lime-500" }
           ].map((item, i) => (
             <div key={i} className="flex flex-col items-center gap-2">
               <div className={cn("p-2 rounded-xl shadow-sm", item.color)}>
                 <item.icon className="w-6 h-6 text-white" />
               </div>
               <span className="text-[11px] font-bold text-gray-600">{item.label}</span>
             </div>
           ))}
        </div>

        {/* Other Section */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-black px-1">Other</h3>
          <div className="grid grid-cols-4 gap-y-6">
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
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="relative">
                  <item.icon className="w-7 h-7 text-black stroke-[1.5]" />
                  <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-lime-400 rounded-full border border-white" />
                </div>
                <span className="text-[10px] font-bold text-gray-500 text-center leading-tight px-1">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

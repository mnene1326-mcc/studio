
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
  BadgeCheck, 
  Headphones, 
  Camera,
  CircleDollarSign,
  Wallet,
  ShieldCheck,
  ChevronRight as ChevronRightIcon
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
      {/* Centered Header Section */}
      <header className="relative pt-16 pb-8 px-6 flex flex-col items-center">
        {/* Visitors Top Right */}
        <div className="absolute top-8 right-6">
          <div className="bg-white/80 backdrop-blur-md rounded-full px-4 py-1.5 border border-black/5 shadow-sm flex items-center gap-2 active:scale-95 transition-transform cursor-pointer">
            <span className="text-sm font-black text-black">12k</span>
            <span className="text-[9px] uppercase font-black text-[#8B8B8B] tracking-widest">Visitors</span>
          </div>
        </div>

        {/* Avatar Middle Top */}
        <div className="relative mb-4">
          <div className="relative w-28 h-28 rounded-full border-[6px] border-white shadow-2xl overflow-hidden bg-muted">
            <Image 
              src={profile.photoURL || `https://picsum.photos/seed/${user.uid}/300/300`} 
              alt={profile.name} 
              fill 
              className="object-cover" 
              data-ai-hint="person profile"
            />
          </div>
          {/* Edit Profile Icon */}
          <button className="absolute bottom-1 right-1 bg-[#FF3B30] p-2.5 rounded-full border-4 border-white shadow-lg active:scale-90 transition-transform">
            <Camera className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Name Below Avatar */}
        <div className="flex items-center gap-1.5 mb-1">
          <h2 className="text-2xl font-black text-black tracking-tight">{profile.name}</h2>
          <BadgeCheck className="w-6 h-6 text-[#FF3B30] fill-[#FF3B30]/10" />
        </div>

        {/* ID Below Name */}
        <div 
          className="flex items-center gap-1.5 cursor-pointer active:opacity-60 transition-all hover:bg-black/5 rounded-full px-3 py-1"
          onClick={handleCopyId}
        >
          <p className="text-[#8B8B8B] font-bold text-sm tracking-tight">ID:{profile.matchFlowId || "null"}</p>
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-[#8B8B8B]" />
          )}
        </div>
      </header>

      <main className="px-6 space-y-6">
        {/* Recharge & Income Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            className="h-20 bg-[#FF3B30] hover:bg-red-600 rounded-3xl shadow-xl shadow-red-500/20 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
          >
            <CircleDollarSign className="w-5 h-5" />
            <span className="text-[11px] font-black uppercase tracking-widest">Recharge</span>
          </Button>
          
          <Button 
            className="h-20 bg-white hover:bg-gray-50 border border-black/5 rounded-3xl shadow-lg flex flex-col items-center justify-center gap-1 text-black active:scale-95 transition-all"
          >
            <Wallet className="w-5 h-5 text-[#4285F4]" />
            <span className="text-[11px] font-black uppercase tracking-widest">Income</span>
          </Button>
        </div>

        {/* Primary Action List */}
        <div className="bg-white rounded-[2.5rem] p-2 shadow-sm border border-black/5 overflow-hidden">
          <div className="flex flex-col">
            <Button 
              variant="ghost" 
              className="h-16 justify-between rounded-[2rem] px-6 hover:bg-gray-50 active:bg-gray-100"
              asChild
            >
              <Link href="#">
                <div className="flex items-center gap-4">
                  <div className="bg-green-50 p-2.5 rounded-2xl">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="font-black text-sm text-black">Verify Now</span>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-300" />
              </Link>
            </Button>

            <Button 
              variant="ghost" 
              className="h-16 justify-between rounded-[2rem] px-6 hover:bg-gray-50 active:bg-gray-100"
              asChild
            >
              <Link href="#">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-2.5 rounded-2xl">
                    <Headphones className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="font-black text-sm text-black">Customer Support</span>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-300" />
              </Link>
            </Button>

            <Button 
              variant="ghost" 
              className="h-16 justify-between rounded-[2rem] px-6 hover:bg-gray-50 active:bg-gray-100"
              asChild
            >
              <Link href="/settings">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-50 p-2.5 rounded-2xl">
                    <Settings className="w-6 h-6 text-gray-600" />
                  </div>
                  <span className="font-black text-sm text-black">Settings</span>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-300" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Secondary Info */}
        <div className="text-center pb-8">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">MatchFlow v1.0 Premium</p>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

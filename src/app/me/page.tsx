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
  Pencil,
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
    <div className="flex-1 pb-20 bg-[#F8F9FA] min-h-screen relative overflow-x-hidden">
      {/* Red Background Header Section */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-[#FF3B30]" />

      <div className="relative z-10">
        <header className="relative pt-16 pb-8 px-6 flex flex-col items-center">
          {/* Visitors Top Right */}
          <div className="absolute top-8 right-6">
            <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/20 shadow-sm flex items-center gap-2 active:scale-95 transition-transform cursor-pointer">
              <span className="text-sm font-black text-white">12k</span>
              <span className="text-[9px] uppercase font-black text-white/70 tracking-widest">Visitors</span>
            </div>
          </div>

          {/* Avatar Middle Top */}
          <div className="relative mb-4">
            <div className="relative w-28 h-28 rounded-full shadow-2xl overflow-hidden bg-muted">
              <Image 
                src={profile.photoURL || `https://picsum.photos/seed/${user.uid}/300/300`} 
                alt={profile.name} 
                fill 
                className="object-cover" 
                data-ai-hint="person profile"
              />
            </div>
            {/* Edit Profile Icon - Changed to Pencil */}
            <button className="absolute bottom-1 right-1 bg-white p-2.5 rounded-full border border-gray-100 shadow-lg active:scale-90 transition-transform">
              <Pencil className="w-5 h-5 text-[#FF3B30]" />
            </button>
          </div>

          {/* Name Below Avatar */}
          <div className="flex items-center gap-1.5 mb-1">
            <h2 className="text-2xl font-black text-white tracking-tight">{profile.name}</h2>
            <BadgeCheck className="w-6 h-6 text-white fill-white/10" />
          </div>

          {/* ID Below Name */}
          <div 
            className="flex items-center gap-1.5 cursor-pointer active:opacity-60 transition-all hover:bg-white/10 rounded-full px-3 py-1"
            onClick={handleCopyId}
          >
            <p className="text-white/80 font-bold text-sm tracking-tight">ID:{profile.matchFlowId || "null"}</p>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-300" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-white/80" />
            )}
          </div>
        </header>

        <main className="px-6 space-y-6">
          {/* Recharge & Income Grid - Positioned to bridge red/white bg */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              className="h-20 bg-white hover:bg-gray-50 border border-white/20 rounded-3xl shadow-xl flex flex-col items-center justify-center gap-1 text-[#FF3B30] active:scale-95 transition-all"
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
      </div>

      <BottomNav />
    </div>
  )
}

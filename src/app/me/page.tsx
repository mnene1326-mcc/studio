
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
  BadgeInfo,
  ShieldCheck,
  Gem
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  name: string
  email: string
  photoURL: string
  matchFlowId?: string
  coins?: number
  diamonds?: number
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

  if (authLoading || profileLoading) return null
  if (!user || !profile) return null

  return (
    <div className="flex-1 pb-24 bg-[#F8F9FA] min-h-screen relative overflow-x-hidden">
      {/* Premium Red Header Background - Perfectly Straight End */}
      <div className="absolute top-0 left-0 w-full h-[280px] bg-[#FF3B30] z-0" />

      <div className="relative z-10">
        <header className="relative pt-12 pb-10 px-6 flex flex-col items-center text-center">
          {/* Top Right Visitor Count Badge */}
          <div className="absolute top-6 right-6">
            <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer">
              <span className="text-[9px] font-black text-white">12.5k Visitors</span>
            </div>
          </div>

          <div className="relative mb-4">
            <div className="relative w-28 h-28 rounded-full shadow-2xl overflow-hidden bg-muted border-none">
              <Image 
                src={profile.photoURL || `https://picsum.photos/seed/${user.uid}/300/300`} 
                alt={profile.name} 
                fill 
                className="object-cover" 
                data-ai-hint="person profile"
              />
            </div>
            <button className="absolute bottom-1 right-1 bg-white p-3 rounded-full shadow-xl active:scale-90 transition-transform border border-black/5">
              <Pencil className="w-4 h-4 text-[#FF3B30]" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-1">
            <h2 className="text-xl font-black text-white tracking-tight">{profile.name}</h2>
            <BadgeCheck className="w-4 h-4 text-white" />
          </div>

          <div 
            className="inline-flex items-center gap-1.5 cursor-pointer active:opacity-60 transition-all"
            onClick={handleCopyId}
          >
            <p className="text-white/70 font-bold text-[9px] tracking-tight uppercase">ID: {profile.matchFlowId || "---"}</p>
            {copied ? (
              <Check className="w-2.5 h-2.5 text-green-300" />
            ) : (
              <Copy className="w-2.5 h-2.5 text-white/50" />
            )}
          </div>
        </header>

        <main className="px-6 space-y-6">
          {/* Layered action cards sitting halfway on the red background transition */}
          <div className="grid grid-cols-2 gap-4 relative z-20 -mt-10">
            <Button 
              className="h-20 bg-white hover:bg-gray-50 rounded-2xl border-none shadow-xl flex flex-col items-center justify-center gap-1 text-[#FF3B30] active:scale-95 transition-all"
            >
              <div className="flex items-center gap-1.5">
                <CircleDollarSign className="w-5 h-5" />
                <span className="text-sm font-black">{profile.coins || 0}</span>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Recharge Coins</span>
            </Button>
            
            <Button 
              className="h-20 bg-white hover:bg-gray-50 rounded-2xl border-none shadow-xl flex flex-col items-center justify-center gap-1 text-black active:scale-95 transition-all"
            >
              <div className="flex items-center gap-1.5">
                <Gem className="w-5 h-5 text-[#4285F4]" />
                <span className="text-sm font-black">{profile.diamonds || 0}</span>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Diamond Income</span>
            </Button>
          </div>

          <div className="bg-white rounded-3xl p-2 shadow-sm border border-black/5 overflow-hidden">
            <div className="flex flex-col">
              <Button variant="ghost" className="h-16 justify-between px-5 rounded-none" asChild>
                <Link href="#">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-50 p-2.5 rounded-xl">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-black text-xs text-black">Identity Verification</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </Button>

              <Button variant="ghost" className="h-16 justify-between px-5 rounded-none" asChild>
                <Link href="/support">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 p-2.5 rounded-xl">
                      <Headphones className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-black text-xs text-black">Customer Support</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </Button>

              <Button variant="ghost" className="h-16 justify-between px-5 rounded-none" asChild>
                <Link href="/settings">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-50 p-2.5 rounded-xl">
                      <Settings className="w-5 h-5 text-gray-600" />
                    </div>
                    <span className="font-black text-xs text-black">App Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}


"use client"

import { useMemo, use, useState } from "react"
import { doc } from "firebase/firestore"
import { useFirestore, useDoc } from "@/firebase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  MessageSquare, 
  MoreHorizontal, 
  Copy, 
  User
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  country: string
  lookingFor: string
  gender: string
  dob: string
  interests?: string
  matchFlowId?: string
}

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const router = useRouter()
  const db = useFirestore()
  const [copied, setCopied] = useState(false)

  const userRef = useMemo(() => doc(db, "users", userId), [db, userId])
  const { data: profile, loading } = useDoc<UserProfile>(userRef)

  const calculateAge = (dob: string) => {
    if (!dob) return "20"
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  const handleCopyId = () => {
    if (profile?.matchFlowId) {
      navigator.clipboard.writeText(profile.matchFlowId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white">
        <div className="animate-pulse font-logo text-primary text-2xl italic">MatchFlow...</div>
      </div>
    )
  }

  if (!profile) return null

  const age = calculateAge(profile.dob)

  return (
    <div className="flex-1 bg-white flex flex-col min-h-screen pb-24">
      {/* Hero Section */}
      <div className="relative h-[65vh] w-full">
        <Image
          src={profile.photoURL || `https://picsum.photos/seed/${profile.uid}/800/1000`}
          alt={profile.name}
          fill
          className="object-cover"
          data-ai-hint="person portrait"
          priority
        />
        
        {/* Top Controls */}
        <div className="absolute top-12 inset-x-0 px-4 flex justify-between items-center z-20">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40"
          >
            <MoreHorizontal className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress Dots - Raised further to avoid being hidden by content */}
        <div className="absolute bottom-32 inset-x-0 flex justify-center gap-1 z-10">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={cn("h-1 rounded-full transition-all", i === 1 ? "w-6 bg-white" : "w-2 bg-white/40")} />
          ))}
        </div>
      </div>

      {/* Content Section - Straight edges (no curves) raised further */}
      <div className="relative -mt-28 bg-white px-6 pt-8 space-y-8 min-h-[50vh] z-20">
        {/* Name & ID Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-black tracking-tight">{profile.name}💜💜</h1>
              <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <User className="w-3 h-3 text-black fill-current" />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Dark Green Background for Age */}
              <span className="bg-[#006400] text-white px-3.5 py-2 rounded-md text-base font-black uppercase tracking-wide shadow-sm">
                ♀ {age}
              </span>
              {/* Blur Background for Country */}
              <span className="bg-black/10 backdrop-blur-md text-gray-800 px-3.5 py-2 rounded-md text-base font-black tracking-wide border border-black/5 shadow-sm">
                {profile.country ? profile.country.charAt(0).toUpperCase() + profile.country.slice(1) : "Kenya"}
              </span>
              <span className="bg-black text-[#D4FF00] px-3.5 py-2 rounded-md text-base font-black tracking-wide shadow-sm">13.66km</span>
            </div>

            <div 
              className="flex items-center gap-1 text-[#8B8B8B] text-xs font-bold cursor-pointer active:opacity-60"
              onClick={handleCopyId}
            >
              <span>ID:{profile.matchFlowId || "null"}</span>
              <Copy className={cn("w-3 h-3 transition-colors", copied ? "text-green-500" : "text-[#8B8B8B]")} />
            </div>
          </div>

          <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center gap-1.5 border border-white shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-black text-gray-600">Online</span>
          </div>
        </div>

        {/* About Me Section */}
        <section className="space-y-4">
          <div className="flex items-baseline gap-2">
            <div className="relative">
              <h2 className="text-2xl font-black text-black">About Me</h2>
              <div className="absolute -bottom-1 left-0 w-full h-2 bg-[#D4FF00]/40 rounded-full -rotate-1" />
            </div>
          </div>
          <p className="text-sm font-bold text-gray-500 leading-relaxed italic">
            "{profile.interests || "I'm looking for someone special to share my time with and see where things go..."}"
          </p>
        </section>

        {/* Bio Text Footer */}
        <div className="pb-12">
          <p className="text-[10px] font-bold text-gray-400 leading-relaxed">
            Little things say everything... dm for fun and serious talks 💦🍑🍆🥰
          </p>
        </div>
      </div>

      {/* Fixed Bottom Action - Large Red Chat Button */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-50 z-50">
        <Button 
          className="w-full h-16 rounded-[2rem] bg-[#FF3B30] text-white hover:bg-red-600 text-xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 uppercase tracking-widest"
          onClick={() => router.push(`/chats?startWith=${profile.uid}`)}
        >
          <MessageSquare className="w-7 h-7 fill-current" />
          CHAT
        </Button>
      </div>
    </div>
  )
}

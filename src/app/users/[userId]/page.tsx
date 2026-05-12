
"use client"

import { useMemo, use, useState } from "react"
import { doc } from "firebase/firestore"
import { useFirestore, useDoc } from "@/firebase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  MapPin, 
  MessageSquare, 
  MoreHorizontal, 
  Copy, 
  ChevronRight,
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
        <div className="animate-pulse font-headline text-primary text-2xl italic">MatchFlow...</div>
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

        {/* Progress Dots */}
        <div className="absolute bottom-10 inset-x-0 flex justify-center gap-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={cn("h-1 rounded-full transition-all", i === 1 ? "w-6 bg-white" : "w-2 bg-white/40")} />
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div className="relative -mt-8 bg-white rounded-t-[2.5rem] px-6 pt-8 space-y-8 min-h-[50vh]">
        {/* Name & ID Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-black tracking-tight">{profile.name}💜💜</h1>
              <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <User className="w-3 h-3 text-black fill-current" />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              <div className="bg-[#FF4D94] rounded-md px-2 py-0.5 flex items-center gap-1 shadow-sm">
                <span className="text-[10px] text-white font-black leading-none">♀ {age}</span>
              </div>
              <div className="bg-[#D4FF00] rounded-md px-2 py-0.5 flex items-center gap-1 shadow-sm">
                <span className="text-[10px] text-black font-black leading-none">13.66km</span>
              </div>
              <div className="bg-black rounded-md px-2 py-0.5 flex items-center gap-1 shadow-sm border border-yellow-400/30">
                <span className="text-[10px] text-yellow-400 font-black leading-none uppercase">{profile.country || "Kenya"}</span>
              </div>
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
            <span className="text-gray-400 text-sm font-bold">Honor</span>
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

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-50 z-50">
        <Button 
          className="w-full h-16 rounded-[2rem] bg-black text-[#D4FF00] hover:bg-black/90 text-xl font-black flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
          onClick={() => router.push(`/chats?startWith=${profile.uid}`)}
        >
          <MessageSquare className="w-7 h-7 fill-current" />
          Chat
        </Button>
      </div>
    </div>
  )
}

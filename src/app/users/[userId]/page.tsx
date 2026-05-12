
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
        <div className="animate-pulse font-logo text-primary text-xl italic">MatchFlow...</div>
      </div>
    )
  }

  if (!profile) return null

  const age = calculateAge(profile.dob)

  return (
    <div className="flex-1 bg-white flex flex-col min-h-screen pb-24">
      <div className="relative h-[65vh] w-full">
        <Image
          src={profile.photoURL || `https://picsum.photos/seed/${profile.uid}/800/1000`}
          alt={profile.name}
          fill
          className="object-cover"
          data-ai-hint="person portrait"
          priority
        />
        
        <div className="absolute top-12 inset-x-0 px-4 flex justify-between items-center z-20">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>

        <div className="absolute bottom-44 inset-x-0 flex justify-center gap-1 z-10">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={cn("h-0.5 rounded-full transition-all", i === 1 ? "w-4 bg-white" : "w-1.5 bg-white/40")} />
          ))}
        </div>
      </div>

      <div className="relative -mt-44 bg-white px-6 pt-8 space-y-4 min-h-[50vh] z-20 rounded-t-[3rem]">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <h1 className="text-sm font-black text-black tracking-tight">{profile.name}💜💜</h1>
              <div className="w-2 h-2 bg-yellow-400 rounded-full flex items-center justify-center border border-white shadow-sm">
                <User className="w-1 h-1 text-black fill-current" />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-1">
              <span className="bg-[#006400] text-white px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wide">
                ♀ {age}
              </span>
              <span className="bg-black/5 text-gray-700 px-1 py-0.5 rounded text-[7px] font-black tracking-wide border border-black/5">
                {profile.country || "Kenya"}
              </span>
              <span className="bg-black text-[#D4FF00] px-1 py-0.5 rounded text-[7px] font-black tracking-wide">13.6km</span>
            </div>

            <div 
              className="flex items-center gap-1 text-[#8B8B8B] text-[6px] font-bold cursor-pointer active:opacity-60"
              onClick={handleCopyId}
            >
              <span>ID:{profile.matchFlowId || "null"}</span>
              <Copy className={cn("w-1 h-1 transition-colors", copied ? "text-green-500" : "text-[#8B8B8B]")} />
            </div>
          </div>

          <div className="bg-gray-50 rounded-full px-1 py-0.5 flex items-center gap-1 border border-black/5">
            <div className="w-0.5 h-0.5 bg-green-500 rounded-full" />
            <span className="text-[6px] font-black text-gray-500 uppercase tracking-tighter">Online</span>
          </div>
        </div>

        <section className="space-y-0.5">
          <h2 className="text-[10px] font-black text-black uppercase tracking-tighter">About Me</h2>
          <p className="text-[8px] font-bold text-gray-500 leading-relaxed italic">
            "{profile.interests || "I'm looking for someone special to share my time with..."}"
          </p>
        </section>

        <div className="pb-8">
          <p className="text-[6px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">
            Little things say everything... dm for fun and serious talks 🥰
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-50 z-50">
        <Button 
          className="w-full h-11 rounded-full bg-[#FF3B30] text-white hover:bg-red-600 text-[10px] font-bold flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 uppercase tracking-widest"
          onClick={() => router.push(`/chats?startWith=${profile.uid}`)}
        >
          <MessageSquare className="w-3.5 h-3.5 fill-current" />
          CHAT
        </Button>
      </div>
    </div>
  )
}

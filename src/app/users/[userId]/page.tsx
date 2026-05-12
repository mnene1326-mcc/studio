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
      <div className="relative h-[60vh] w-full">
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
      </div>

      <div className="relative -mt-36 bg-white px-6 pt-8 space-y-4 min-h-[50vh] z-20 rounded-t-[3rem]">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <h1 className="text-sm font-black text-black tracking-tight">{profile.name}</h1>
              <div className="w-2 h-2 bg-yellow-400 rounded-full flex items-center justify-center border border-white">
                <User className="w-1 h-1 text-black fill-current" />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-1">
              <span className="bg-[#006400] text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                ♀ {age}
              </span>
              <span className="bg-black/5 text-gray-700 px-1.5 py-0.5 rounded text-[8px] font-black border border-black/5">
                {profile.country || "Kenya"}
              </span>
              <span className="bg-black text-[#D4FF00] px-1.5 py-0.5 rounded text-[8px] font-black">13.6km</span>
            </div>

            <div 
              className="flex items-center gap-1 text-[#8B8B8B] text-[7px] font-bold cursor-pointer"
              onClick={handleCopyId}
            >
              <span>ID:{profile.matchFlowId || "null"}</span>
              <Copy className={cn("w-2 h-2", copied ? "text-green-500" : "text-[#8B8B8B]")} />
            </div>
          </div>

          <div className="bg-gray-50 rounded-full px-2 py-1 flex items-center gap-1 border border-black/5">
            <div className="w-1 h-1 bg-green-500 rounded-full" />
            <span className="text-[7px] font-black text-gray-500 uppercase">Online</span>
          </div>
        </div>

        <section className="space-y-1">
          <h2 className="text-[10px] font-black text-black uppercase">About Me</h2>
          <p className="text-[9px] font-bold text-gray-500 leading-relaxed italic">
            "{profile.interests || "I'm looking for someone special to share my time with..."}"
          </p>
        </section>

        <div className="pb-8">
          <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">
            dm for fun and serious talks 🥰
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-white/80 backdrop-blur-xl border-t z-50">
        <Button 
          className="w-full h-11 rounded-full bg-[#FF3B30] text-white hover:bg-red-600 text-[11px] font-bold flex items-center justify-center gap-2 shadow-xl active:scale-95 uppercase"
          onClick={() => router.push(`/chats?startWith=${profile.uid}`)}
        >
          <MessageSquare className="w-4 h-4 fill-current" />
          CHAT
        </Button>
      </div>
    </div>
  )
}

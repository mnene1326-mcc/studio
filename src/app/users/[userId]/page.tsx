
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
import { cn } from "@/utils"

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  country: string
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

  if (loading) return null
  if (!profile) return null

  const age = calculateAge(profile.dob)

  return (
    <div className="flex-1 bg-white flex flex-col min-h-screen pb-24">
      <div className="relative h-[55vh] w-full">
        <Image
          src={profile.photoURL || `https://picsum.photos/seed/${profile.uid}/800/1000`}
          alt={profile.name}
          fill
          className="object-cover"
          data-ai-hint="person portrait"
          priority
        />
        
        <div className="absolute top-10 inset-x-0 px-4 flex justify-between items-center z-20">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-black/20 backdrop-blur-md text-white w-8 h-8">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-black/20 backdrop-blur-md text-white w-8 h-8">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Profile Details with Refined Typography */}
      <div className="relative -mt-24 bg-white px-6 pt-6 space-y-3 min-h-[50vh] z-20 rounded-t-[2.5rem] shadow-2xl">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black text-black tracking-tight">{profile.name}</h1>
              <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full flex items-center justify-center border border-white">
                <User className="w-1.5 h-1.5 text-black" />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-1">
              <span className="bg-[#006400] text-white px-2 py-0.5 rounded-md text-[8px] font-black">
                {profile.gender === 'female' ? '♀' : '♂'} {age}
              </span>
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-[8px] font-black border border-black/5">
                {profile.country || "Kenya"}
              </span>
            </div>

            <div className="flex items-center gap-1 text-gray-400 text-[8px] font-bold cursor-pointer" onClick={handleCopyId}>
              <span>ID:{profile.matchFlowId || "---"}</span>
              <Copy className={cn("w-2.5 h-2.5", copied ? "text-green-500" : "text-gray-300")} />
            </div>
          </div>
        </div>

        <section className="space-y-1 pt-1">
          <h2 className="text-[9px] font-black text-black uppercase tracking-widest opacity-40">About Me</h2>
          <p className="text-[10px] font-bold text-gray-600 leading-relaxed italic">
            "{profile.interests || `I'm interested in meeting new people and finding meaningful connections...`}"
          </p>
        </section>

        <div className="pt-3 border-t border-black/5">
          <p className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">
            DM for fun and serious talks 🥰
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-white/80 backdrop-blur-xl border-t z-50">
        <Button 
          className="w-full h-11 rounded-full bg-[#FF3B30] text-white text-[10px] font-black flex items-center justify-center gap-2 shadow-xl uppercase tracking-widest"
          onClick={() => router.push(`/chats?startWith=${profile.uid}`)}
        >
          <MessageSquare className="w-3.5 h-3.5 fill-current" />
          CHAT NOW
        </Button>
      </div>
    </div>
  )
}

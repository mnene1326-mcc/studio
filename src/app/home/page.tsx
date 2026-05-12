
"use client"

import { useMemo, useState, useEffect } from "react"
import { collection, query, where, limit } from "firebase/firestore"
import { useFirestore, useUser, useCollection } from "@/firebase"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
import { Bell, FileText, Target, User as UserIcon } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface UserProfile {
  id: string
  uid: string
  name: string
  photoURL: string
  country: string
  lookingFor: string
  gender: string
  dob: string
  onboardingComplete: boolean
  interests?: string
}

function calculateAge(dob: string) {
  if (!dob) return 20
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

export default function HomePage() {
  const router = useRouter()
  const { user: currentUser } = useUser()
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState<'recommend' | 'nearby'>('recommend')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const usersQuery = useMemo(() => {
    return query(
      collection(db, "users"), 
      where("onboardingComplete", "==", true),
      limit(20)
    )
  }, [db])

  const { data: users, loading } = useCollection<UserProfile>(usersQuery)

  const filteredUsers = useMemo(() => {
    return users.filter(u => u.uid !== currentUser?.uid)
  }, [users, currentUser])

  const handleChatClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    router.push(`/chats?startWith=${userId}`)
  }

  // Deterministic distance to avoid hydration mismatch
  const getDistance = (uid: string) => {
    if (!uid) return "13.6km"
    const seed = uid.charCodeAt(0) + (uid.charCodeAt(uid.length - 1) || 0)
    return seed % 2 === 0 ? ">500km" : "13.6km"
  }

  if (!isMounted) return null

  return (
    <div className="flex-1 pb-20 bg-[#F8F9FA] min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl px-4 pt-4 pb-2 border-b border-black/5">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div 
            onClick={() => router.push("/mystery-note")}
            className="bg-[#FF3B30] rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-red-500/10 cursor-pointer active:scale-95 transition-all border border-white/10 h-28"
          >
            <div className="bg-white/20 p-2 rounded-xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-black text-xs uppercase tracking-tighter leading-tight">Mystery<br/>Note</span>
          </div>
          
          <div 
            onClick={() => router.push("/tasks")}
            className="bg-black rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-black/10 cursor-pointer active:scale-95 transition-all border border-white/5 h-28"
          >
            <div className="bg-white/10 p-2 rounded-xl">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-black text-xs uppercase tracking-tighter leading-tight">Task<br/>Center</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('recommend')}
              className={cn(
                "relative text-sm font-black uppercase tracking-widest transition-all",
                activeTab === 'recommend' ? "text-black" : "text-gray-400"
              )}
            >
              Recommend
              {activeTab === 'recommend' && (
                <div className="absolute -bottom-2 left-0 w-6 h-0.5 bg-[#FF3B30] rounded-full shadow-sm" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('nearby')}
              className={cn(
                "relative text-sm font-black uppercase tracking-widest transition-all",
                activeTab === 'nearby' ? "text-black" : "text-gray-400"
              )}
            >
              Nearby
              {activeTab === 'nearby' && (
                <div className="absolute -bottom-2 left-0 w-6 h-0.5 bg-[#FF3B30] rounded-full shadow-sm" />
              )}
            </button>
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-gray-50 relative group">
            <Bell className="w-4 h-4 text-black group-hover:rotate-12 transition-transform" />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#FF3B30] rounded-full border-2 border-white shadow-sm" />
          </Button>
        </div>
      </header>

      <main className="px-4 py-2 lg:max-w-4xl lg:mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3.5/4.5] rounded-[2rem] bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 opacity-40">
            <div className="text-lg font-bold italic text-black">No one matches...</div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black">Try updating your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {filteredUsers.map((user) => (
              <Card 
                key={user.id} 
                className="relative overflow-hidden border-none rounded-[2rem] aspect-[3.5/4.5] group cursor-pointer shadow-xl transition-all duration-500"
                onClick={() => router.push(`/users/${user.uid}`)}
              >
                <Image 
                  src={user.photoURL || `https://picsum.photos/seed/${user.uid}/400/550`} 
                  alt={user.name}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  data-ai-hint="person portrait"
                />
                
                <div 
                  className="absolute top-3 right-3 bg-[#D4FF00] rounded-2xl px-3 py-1.5 shadow-md flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all z-20 border border-white/20"
                  onClick={(e) => handleChatClick(e, user.uid)}
                >
                  <span className="text-black font-black text-sm italic tracking-tighter">Hi</span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

                <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-white font-black text-sm truncate drop-shadow-md">{user.name} 🥰</span>
                    <div className="w-3.5 h-3.5 bg-yellow-400 rounded-full flex items-center justify-center shrink-0 border border-white/40">
                      <UserIcon className="w-2 h-2 text-black fill-current" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <div className="bg-[#FF4D94] rounded-md px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm">
                      <span className="text-[8px] text-white font-black leading-none">
                        {user.gender === 'female' ? '♀' : user.gender === 'male' ? '♂' : '⚧'} {calculateAge(user.dob)}
                      </span>
                    </div>
                    
                    <div className="bg-[#D4FF00] rounded-md px-1.5 py-0.5 shadow-sm">
                      <span className="text-[8px] text-black font-black leading-none truncate max-w-[50px]">
                        {getDistance(user.uid)}
                      </span>
                    </div>

                    <div className="bg-black/80 backdrop-blur-sm rounded-md px-1.5 py-0.5 shadow-sm border border-white/10">
                      <span className="text-[8px] text-[#D4FF00] font-black leading-none uppercase tracking-tighter">
                        Sometimes
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}


"use client"

import { useMemo, useState, useEffect } from "react"
import { collection, query, where, limit } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/layout/BottomNav"
import { Target, Search, ShoppingBag, User as UserIcon, FileText } from "lucide-react"
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
  const [activeTab, setActiveTab] = useState<'Recommend' | 'Nearby'>('Recommend')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const usersQuery = useMemoFirebase(() => {
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

  const getTag = (uid?: string) => {
    if (!uid) return "No"
    const tags = ["No", "A lot", "Never", "Sometimes"]
    const index = uid ? uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % tags.length : 0
    return tags[index]
  }

  if (!isMounted) return null

  return (
    <div className="flex-1 pb-24 bg-white min-h-screen">
      {/* Unified Red Header Section */}
      <div className="bg-[#FF3B30]">
        <div className="h-6" />
        
        <div className="px-4 pb-3">
          {/* Top Feature Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-[#FFB800] to-[#FF8A00] rounded-3xl p-4 flex flex-col justify-between h-32 shadow-lg shadow-orange-900/20 relative overflow-hidden group active:scale-95 transition-all">
              <div className="flex items-start justify-between">
                <div className="bg-white/30 p-1.5 rounded-2xl backdrop-blur-sm">
                   <div className="relative">
                      <FileText className="w-5 h-5 text-black" />
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#4285F4] rounded-full border-2 border-white" />
                   </div>
                </div>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-white font-black text-sm leading-none">Mystery Note</h3>
                <p className="text-white/80 text-[8px] font-bold">Send a note</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#A88CFF] to-[#7B61FF] rounded-3xl p-4 flex flex-col justify-between h-32 shadow-lg shadow-purple-900/20 relative overflow-hidden group active:scale-95 transition-all">
              <div className="flex items-start justify-between">
                <div className="bg-white/30 p-1.5 rounded-2xl backdrop-blur-sm">
                  <Target className="w-5 h-5 text-black" />
                </div>
                <div className="w-1.5 h-1.5 bg-[#FFD600] rounded-full" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-white font-black text-sm leading-none">Task Center</h3>
                <p className="text-white/80 text-[8px] font-bold">Earn rewards</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Sticky and seamless with the red block */}
        <div className="sticky top-0 z-40 bg-[#FF3B30] px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('Recommend')}
              className={cn(
                "relative text-base font-black transition-all",
                activeTab === 'Recommend' ? "text-white scale-105" : "text-white/60"
              )}
            >
              Recommend
            </button>
            <button 
              onClick={() => setActiveTab('Nearby')}
              className={cn(
                "relative text-base font-black transition-all",
                activeTab === 'Nearby' ? "text-white scale-105" : "text-white/60"
              )}
            >
              Nearby
            </button>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
                <ShoppingBag className="w-6 h-6 text-white" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#D4FF00] rounded-full border-2 border-[#FF3B30]" />
             </div>
             <Search className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* User Grid */}
      <main className="px-4 pt-4">
        {loading && filteredUsers.length === 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={`skeleton-${i}`} className="aspect-[3/3.8] rounded-[2rem] bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <p className="font-bold">No one matches yet...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredUsers.map((user) => (
              <Card 
                key={user.id || user.uid} 
                className="relative overflow-hidden border-none rounded-[2rem] aspect-[3/3.8] group cursor-pointer shadow-md"
                onClick={() => router.push(`/users/${user.uid}`)}
              >
                <Image 
                  src={user.photoURL || `https://picsum.photos/seed/${user.uid}/400/550`} 
                  alt={user.name}
                  fill
                  className="object-cover"
                  data-ai-hint="person portrait"
                />
                
                {/* Chat Badge */}
                <div 
                  className="absolute top-3 right-3 bg-[#D4FF00] rounded-2xl px-3 py-1 shadow-md flex items-center justify-center z-20 border border-white/20 active:scale-95 transition-transform"
                  onClick={(e) => handleChatClick(e, user.uid)}
                >
                  <span className="text-black font-black text-xs italic tracking-tighter uppercase">Chat</span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-white font-black text-sm truncate drop-shadow-md">{user.name}</span>
                    <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shrink-0 border border-white/40 shadow-sm">
                      <UserIcon className="w-2.5 h-2.5 text-black fill-current" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-wrap">
                    <div className="bg-[#FF4D94] rounded-md px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm">
                      <span className="text-[8px] text-white font-black leading-none uppercase">
                        {user.gender === 'female' ? '♀' : '♂'} {calculateAge(user.dob)}
                      </span>
                    </div>
                    
                    <div className="bg-[#D4FF00] rounded-md px-1.5 py-0 shadow-sm">
                      <span className="text-[8px] text-black font-black leading-none truncate uppercase tracking-tighter">
                        {user.country || "Kenya"}
                      </span>
                    </div>

                    <div className="bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5 shadow-sm border border-white/10">
                      <span className="text-[8px] text-white font-black leading-none uppercase tracking-tighter">
                        {getTag(user.uid)}
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

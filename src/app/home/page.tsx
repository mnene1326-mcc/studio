
"use client"

import { useMemo, useState } from "react"
import { collection, query, where, limit } from "firebase/firestore"
import { useFirestore, useUser, useCollection } from "@/firebase"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
import { Bell, Search } from "lucide-react"
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
  const [activeTab, setActiveTab] = useState<'nearby' | 'recommend'>('recommend')

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

  return (
    <div className="flex-1 pb-20 bg-[#F8F9FA] min-h-screen">
      <header className="sticky top-0 z-40 bg-white px-4 pt-3 pb-2 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('nearby')}
              className={cn(
                "relative text-lg font-black transition-all",
                activeTab === 'nearby' ? "text-black" : "text-gray-400"
              )}
            >
              Nearby
              {activeTab === 'nearby' && (
                <div className="absolute -bottom-1.5 left-0 w-5 h-0.5 bg-[#FF3B30] rounded-full" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('recommend')}
              className={cn(
                "relative text-lg font-black transition-all",
                activeTab === 'recommend' ? "text-black" : "text-gray-400"
              )}
            >
              Recommend
              {activeTab === 'recommend' && (
                <div className="absolute -bottom-1.5 left-0 w-5 h-0.5 bg-[#FF3B30] rounded-full" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full relative">
              <Bell className="w-4 h-4 text-black" />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#FF3B30] rounded-full border border-white" />
            </Button>
          </div>
        </div>
      </header>

      <main className="p-2 lg:max-w-4xl lg:mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/5] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
            <div className="text-base font-bold italic">No one here yet...</div>
            <p className="text-[10px] font-black uppercase tracking-tight">Change filters to see more people</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredUsers.map((user) => (
              <Card 
                key={user.id} 
                className="relative overflow-hidden border-none rounded-2xl aspect-[4/5] group cursor-pointer shadow-sm"
                onClick={() => router.push(`/users/${user.uid}`)}
              >
                <Image 
                  src={user.photoURL || `https://picsum.photos/seed/${user.uid}/400/500`} 
                  alt={user.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  data-ai-hint="person portrait"
                />
                
                <div 
                  className="absolute top-2 right-2 bg-[#FF3B30] rounded-lg px-2 py-0.5 shadow-md flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all z-20"
                  onClick={(e) => handleChatClick(e, user.uid)}
                >
                  <span className="text-white font-black text-[9px] uppercase tracking-wider">Chat</span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-2.5 pt-8 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-white font-black text-xs truncate drop-shadow-md">{user.name}</span>
                    <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-[5px] text-black font-black">✔</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <div className="bg-[#FF4D94] rounded px-1 py-0.25 flex items-center gap-0.5 shadow-sm">
                      <span className="text-[8px] text-white font-black">
                        {user.gender === 'female' ? '♀' : user.gender === 'male' ? '♂' : '⚧'} {calculateAge(user.dob)}
                      </span>
                    </div>
                    <div className="bg-[#FF3B30] rounded px-1 py-0.25 shadow-sm">
                      <span className="text-[8px] text-white font-black">1.2km</span>
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

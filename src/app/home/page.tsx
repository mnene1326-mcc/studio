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
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('nearby')}
              className={cn(
                "relative text-xl font-black transition-all",
                activeTab === 'nearby' ? "text-black scale-105" : "text-gray-400"
              )}
            >
              Nearby
              {activeTab === 'nearby' && (
                <div className="absolute -bottom-1.5 left-0 w-6 h-1 bg-[#FF3B30] rounded-full" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('recommend')}
              className={cn(
                "relative text-xl font-black transition-all",
                activeTab === 'recommend' ? "text-black scale-105" : "text-gray-400"
              )}
            >
              Recommend
              {activeTab === 'recommend' && (
                <div className="absolute -bottom-1.5 left-0 w-6 h-1 bg-[#FF3B30] rounded-full" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
              <Search className="w-5 h-5 text-black" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full relative">
              <Bell className="w-5 h-5 text-black" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-[#FF3B30] rounded-full border-2 border-white" />
            </Button>
          </div>
        </div>
      </header>

      <main className="p-2 lg:max-w-5xl lg:mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
            <div className="text-lg font-bold italic">No one here yet...</div>
            <p className="text-xs font-black">Change filters to see more people</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredUsers.map((user) => (
              <Card 
                key={user.uid} 
                className="relative overflow-hidden border-none rounded-[1.5rem] aspect-[3/4] group cursor-pointer shadow-md"
                onClick={() => router.push(`/users/${user.uid}`)}
              >
                <Image 
                  src={user.photoURL || `https://picsum.photos/seed/${user.uid}/400/600`} 
                  alt={user.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  data-ai-hint="person portrait"
                />
                
                <div 
                  className="absolute top-3 right-3 bg-[#FF3B30] rounded-xl px-2.5 py-1 shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all z-20"
                  onClick={(e) => handleChatClick(e, user.uid)}
                >
                  <span className="text-white font-black italic text-xs tracking-tighter">Hi</span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-3 pt-12 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-white font-black text-sm truncate drop-shadow-md">{user.name}</span>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-[6px] text-black font-black">✔</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    <div className="bg-[#FF4D94] rounded-lg px-2 py-0.5 flex items-center gap-1 shadow-sm">
                      <span className="text-[9px] text-white font-black">♀ {calculateAge(user.dob)}</span>
                    </div>
                    <div className="bg-[#FF3B30] rounded-lg px-2 py-0.5 shadow-sm">
                      <span className="text-[9px] text-white font-black">1.2km</span>
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

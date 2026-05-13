
"use client"

import { useMemo, useState, useEffect } from "react"
import { collection, query, where, limit } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/layout/BottomNav"
import { Target, Search, ShoppingBag, FileText } from "lucide-react"
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

  if (!isMounted) return null

  return (
    <div className="flex-1 pb-24 bg-white min-h-screen">
      <div className="bg-[#FF3B30] pt-2">
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-[#FFB800] to-[#FF8A00] rounded-3xl p-4 flex flex-col justify-between h-32 shadow-lg shadow-orange-900/20 relative overflow-hidden group active:scale-95 transition-all">
              <div className="flex items-start justify-between">
                <div className="bg-white/30 p-1.5 rounded-2xl backdrop-blur-sm">
                   <div className="relative">
                      <FileText className="w-5 h-5 text-black" />
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
              </div>
              <div className="space-y-0.5">
                <h3 className="text-white font-black text-sm leading-none">Task Center</h3>
                <p className="text-white/80 text-[8px] font-bold">Earn rewards</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-0 z-40 bg-[#FF3B30] px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('Recommend')}
              className={cn(
                "relative text-base font-black transition-all tracking-tight",
                activeTab === 'Recommend' ? "text-white scale-105" : "text-white/60"
              )}
            >
              Recommend
            </button>
            <button 
              onClick={() => setActiveTab('Nearby')}
              className={cn(
                "relative text-base font-black transition-all tracking-tight",
                activeTab === 'Nearby' ? "text-white scale-105" : "text-white/60"
              )}
            >
              Nearby
            </button>
          </div>
          <div className="flex items-center gap-3">
             <ShoppingBag className="w-6 h-6 text-white" />
             <Search className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

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
                
                <div 
                  className="absolute top-3 right-3 bg-[#FF3B30] rounded-2xl px-5 py-2 shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
                  onClick={(e) => handleChatClick(e, user.uid)}
                >
                  <span className="text-white font-bold text-[11px] tracking-widest uppercase">CHAT</span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />

                <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col items-start">
                  <h4 className="text-white font-black text-sm drop-shadow-md truncate leading-none mb-2">{user.name}</h4>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="bg-[#006400] px-2.5 py-1 rounded-md text-white font-black text-[11px] leading-none shadow-sm">
                      {calculateAge(user.dob)}
                    </span>
                    <span className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-md text-white font-bold text-[11px] border border-white/20 leading-none shadow-sm">
                      {user.country ? user.country.charAt(0).toUpperCase() + user.country.slice(1) : "Kenya"}
                    </span>
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

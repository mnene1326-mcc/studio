
"use client"

import { useMemo, useState, useEffect } from "react"
import { collection, query, where, limit, doc } from "firebase/firestore"
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/layout/BottomNav"
import { Target, RotateCw, FileText, ChevronDown, BadgeCheck } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface UserProfile {
  id: string
  uid: string
  name: string
  photoURL: string
  country: string
  gender: string
  dob: string
  onboardingComplete: boolean
  updatedAt?: any
  isVerified?: boolean
  blocking?: string[]
  blockedBy?: string[]
}

function calculateAge(dob: string) {
  if (!dob) return 22
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

export default function HomePage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useUser()
  const db = useFirestore()
  const [activeTab, setActiveTab] = useState<'Recommend' | 'Nearby'>('Recommend')
  const [isMounted, setIsMounted] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshSeed, setRefreshSeed] = useState(0)
  const [displayLimit, setDisplayLimit] = useState(10)

  useEffect(() => { setIsMounted(true) }, [])

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.replace("/welcome")
    }
  }, [currentUser, authLoading, router])

  const currentUserProfileRef = useMemoFirebase(() => currentUser?.uid ? doc(db, "users", currentUser.uid) : null, [db, currentUser?.uid])
  const { data: currentUserProfile } = useDoc<UserProfile>(currentUserProfileRef)

  const usersQuery = useMemoFirebase(() => query(
    collection(db, "users"), 
    where("onboardingComplete", "==", true),
    limit(displayLimit + 20)
  ), [db, displayLimit])
  
  const { data: users, loading } = useCollection<UserProfile>(usersQuery)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setRefreshSeed(prev => prev + 1)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 800)
  }

  const filteredUsers = useMemo(() => {
    if (!users || !currentUserProfile) return []
    
    const blockedList = [...(currentUserProfile.blocking || []), ...(currentUserProfile.blockedBy || [])]
    
    const baseList = users.filter(u => {
      if (u.uid === currentUser?.uid) return false
      if (blockedList.includes(u.uid)) return false
      
      const genderMatch = currentUserProfile.gender === 'male' 
        ? u.gender === 'female' 
        : (currentUserProfile.gender === 'female' ? u.gender === 'male' : true);
      
      if (!genderMatch) return false;

      if (activeTab === 'Nearby') {
        return u.country === currentUserProfile.country;
      }
      
      return true;
    }).slice(0, displayLimit)

    const now = Date.now()
    const tenMinutes = 10 * 60 * 1000

    return [...baseList].sort((a, b) => {
      const aAt = a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : 0
      const bAt = b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : 0
      const aOnline = (now - aAt) < tenMinutes
      const bOnline = (now - bAt) < tenMinutes
      
      if (aOnline && !bOnline) return -1
      if (!aOnline && bOnline) return 1
      
      const seed = refreshSeed || 0;
      return (Math.sin(a.uid.length + seed) - Math.sin(b.uid.length + seed))
    });
  }, [users, currentUser?.uid, currentUserProfile, activeTab, refreshSeed, displayLimit])

  if (!isMounted || authLoading || !currentUser) return null

  return (
    <div className="flex-1 pb-24 bg-white min-h-screen relative">
      <div className="absolute top-0 left-0 right-0 h-28 bg-[#00A2FF] z-0 overflow-hidden">
        <div className="absolute -right-2 -top-2 opacity-15 select-none pointer-events-none">
          <span className="text-6xl font-logo text-white whitespace-nowrap">MatchFlow</span>
        </div>
      </div>
      
      <div className="relative z-10">
        <div className="px-4 pt-4 pb-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-[#FFB800] to-[#FF8A00] p-4 flex flex-col justify-between h-32 rounded-2xl shadow-lg cursor-pointer active:scale-95 transition-transform">
              <div className="bg-white/30 p-2 rounded-2xl w-fit"><FileText className="w-5 h-5 text-black" /></div>
              <div className="space-y-0.5">
                <h3 className="text-white font-black text-sm">Mystery Note</h3>
                <p className="text-white/80 text-[8px] font-bold uppercase tracking-widest">Send a note</p>
              </div>
            </div>

            <div onClick={() => router.push('/tasks')} className="bg-gradient-to-br from-[#A88CFF] to-[#7B61FF] p-4 flex flex-col justify-between h-32 rounded-2xl shadow-lg cursor-pointer active:scale-95 transition-transform">
              <div className="bg-white/30 p-2 rounded-2xl w-fit"><Target className="w-5 h-5 text-black" /></div>
              <div className="space-y-0.5">
                <h3 className="text-white font-black text-sm">Task Center</h3>
                <p className="text-white/80 text-[8px] font-bold uppercase tracking-widest">Earn rewards</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => { setActiveTab('Recommend'); setDisplayLimit(10); }} 
              className={cn("text-sm font-black transition-all", activeTab === 'Recommend' ? "text-[#00A2FF] scale-105" : "text-gray-400")}
            >
              Recommend
            </button>
            <button 
              onClick={() => { setActiveTab('Nearby'); setDisplayLimit(10); }} 
              className={cn("text-sm font-black transition-all", activeTab === 'Nearby' ? "text-[#00A2FF] scale-105" : "text-gray-400")}
            >
              Nearby
            </button>
          </div>
          <button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className={cn("p-1.5 transition-all active:scale-90 text-[#00A2FF]", isRefreshing && "animate-spin opacity-50")}
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="px-4 pt-3">
        {(loading || isRefreshing) && filteredUsers.length === 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-[1/1.2] bg-muted animate-pulse rounded-3xl" />)}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
            <RotateCw className="w-12 h-12" />
            <p className="font-black text-sm uppercase tracking-widest">No users found</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-3">
              {filteredUsers.map((user, idx) => {
                const now = Date.now()
                const tenMinutes = 10 * 60 * 1000
                const userAt = user.updatedAt?.seconds ? user.updatedAt.seconds * 1000 : 0
                const isOnline = (now - userAt) < tenMinutes

                return (
                  <Card 
                    key={`${user.uid}-${refreshSeed}-${idx}`} 
                    className="relative overflow-hidden border-none aspect-[1/1.2] rounded-2xl group cursor-pointer shadow-xl" 
                    onClick={() => router.push(`/users/${user.uid}`)}
                  >
                    <Image 
                      src={user.photoURL} 
                      alt={user.name} 
                      fill 
                      className="object-cover transition-transform group-hover:scale-105" 
                      data-ai-hint="person profile"
                    />
                    
                    {isOnline && (
                      <div className="absolute top-2.5 left-2.5 z-20 w-2 h-2 rounded-full bg-green-500 border border-white/50 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                    )}

                    {user.isVerified && (
                      <div className="absolute top-2.5 left-6 z-20">
                         <BadgeCheck className="w-3 h-3 text-blue-400 fill-white" />
                      </div>
                    )}

                    <div 
                      className="absolute top-2.5 right-2.5 bg-[#00A2FF] px-2.5 py-1 rounded-full z-30 text-white font-black text-[7px] tracking-tight uppercase shadow-md active:scale-95 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/chats?startWith=${user.uid}`);
                      }}
                    >
                      CHAT
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <h4 className="text-white font-black text-[10px] truncate tracking-tight">{user.name}</h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-[#006400] text-white font-black text-[8px] px-1.5 py-0.5 rounded-full">{calculateAge(user.dob)}</span>
                        <span className="bg-white/10 backdrop-blur-md px-1.5 py-0.5 rounded-full text-white font-bold text-[8px] border border-white/20 truncate max-w-[50px]">{user.country || "Kenya"}</span>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
            
            {users.length >= displayLimit && (
              <div className="flex justify-center pb-8">
                <Button 
                  variant="ghost" 
                  className="text-gray-400 font-black text-[9px] uppercase tracking-widest gap-2"
                  onClick={() => setDisplayLimit(prev => prev + 10)}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  Show more
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}

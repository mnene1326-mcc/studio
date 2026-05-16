
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
  
  // Persistence Logic: Load display limit from sessionStorage
  const [displayLimit, setDisplayLimit] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('home_display_limit')
      return saved ? parseInt(saved) : 10
    }
    return 10
  })

  useEffect(() => { setIsMounted(true) }, [])

  // Sync display limit to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('home_display_limit', displayLimit.toString())
  }, [displayLimit])

  const currentUserProfileRef = useMemoFirebase(() => currentUser?.uid ? doc(db, "users", currentUser.uid) : null, [db, currentUser?.uid])
  const { data: currentUserProfile, loading: profileLoading } = useDoc<UserProfile>(currentUserProfileRef)

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.replace("/welcome")
      } else if (currentUserProfile && !profileLoading && !currentUserProfile.onboardingComplete) {
        router.replace("/onboarding")
      }
    }
  }, [currentUser, authLoading, currentUserProfile, profileLoading, router])

  // Scroll Restoration
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('home_scroll_pos', window.scrollY.toString())
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (isMounted && !authLoading) {
      const savedPos = sessionStorage.getItem('home_scroll_pos')
      if (savedPos) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedPos))
        }, 150)
      }
    }
  }, [isMounted, authLoading])

  const usersQuery = useMemoFirebase(() => query(
    collection(db, "users"), 
    where("onboardingComplete", "==", true),
    limit(100) // Fetch more for caching
  ), [db])
  
  const { data: users, loading } = useCollection<UserProfile>(usersQuery)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setRefreshSeed(prev => prev + 1)
    setDisplayLimit(10) // Reset to default on fresh refresh
    sessionStorage.removeItem('home_scroll_pos')
    sessionStorage.setItem('home_display_limit', '10')
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
      
      const genderMatch = currentUserProfile.gender === 'male' ? u.gender === 'female' : (currentUserProfile.gender === 'female' ? u.gender === 'male' : true);
      if (!genderMatch) return false;
      
      if (activeTab === 'Nearby') {
        if (u.country !== currentUserProfile.country) return false;
      }
      
      return true;
    })
    
    const sorted = [...baseList].sort((a, b) => {
      const aVal = Math.sin(a.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + refreshSeed)
      const bVal = Math.sin(b.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + refreshSeed)
      return aVal - bVal
    })
    
    return sorted
  }, [users, currentUser?.uid, currentUserProfile, activeTab, refreshSeed])

  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(0, displayLimit);
  }, [filteredUsers, displayLimit]);

  const hasMore = paginatedUsers.length < filteredUsers.length;

  if (!isMounted || authLoading || !currentUser) return null

  return (
    <div className="flex-1 pb-24 bg-[#F9FAFB] min-h-screen relative select-none">
      <div className="absolute top-0 left-0 right-0 z-0 flex flex-col">
        <div className="h-[72px] bg-[#00A2FF] relative overflow-hidden">
          <div className="absolute -right-4 -top-10 rotate-[-12deg] opacity-20 select-none pointer-events-none">
            <span className="text-7xl font-logo text-white whitespace-nowrap">MatchFlow</span>
          </div>
        </div>
        <div className="h-[120px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)]" />
      </div>
      
      <div className="relative z-10 pt-0">
        <div className="px-4 pt-4 pb-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-[#FFB800] to-[#FF8A00] p-4 flex flex-col justify-between h-28 rounded-2xl shadow-lg cursor-pointer active:scale-95 transition-transform">
              <div className="bg-white/30 p-2 rounded-2xl w-fit"><FileText className="w-5 h-5 text-black" /></div>
              <div className="space-y-0.5">
                <h3 className="text-white font-semibold text-sm">Mystery Note</h3>
                <p className="text-white/80 text-[8px] font-bold uppercase tracking-widest">Send a note</p>
              </div>
            </div>

            <div onClick={() => router.push('/tasks')} className="bg-gradient-to-br from-[#A88CFF] to-[#7B61FF] p-4 flex flex-col justify-between h-28 rounded-2xl shadow-lg cursor-pointer active:scale-95 transition-transform">
              <div className="bg-white/30 p-2 rounded-2xl w-fit"><Target className="w-5 h-5 text-black" /></div>
              <div className="space-y-0.5">
                <h3 className="text-white font-semibold text-sm">Task Center</h3>
                <p className="text-white/80 text-[8px] font-bold uppercase tracking-widest">Earn rewards</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-0 z-40 bg-[#F9FAFB]/90 backdrop-blur-md px-5 pt-3 pb-3 border-b border-black/5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button onClick={() => { setActiveTab('Recommend'); }} className={cn("text-sm font-semibold transition-all", activeTab === 'Recommend' ? "text-[#00A2FF]" : "text-gray-400")}>Recommend</button>
              <button onClick={() => { setActiveTab('Nearby'); }} className={cn("text-sm font-semibold transition-all", activeTab === 'Nearby' ? "text-[#00A2FF]" : "text-gray-400")}>Nearby</button>
            </div>
            <button onClick={handleRefresh} disabled={isRefreshing} className={cn("p-1.5 text-[#00A2FF] hover:bg-blue-50 rounded-full transition-colors", isRefreshing && "animate-spin opacity-50")}>
              <RotateCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <main className="px-4 pt-3">
          {loading && paginatedUsers.length === 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-[1/1.2] bg-muted animate-pulse rounded-3xl" />)}
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="bg-gray-100 p-6 rounded-full">
                <Target className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">No users found.</p>
              <Button variant="outline" onClick={handleRefresh} className="rounded-full">Refresh List</Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-3">
                {paginatedUsers.map((user) => (
                  <Card key={user.uid} className="relative overflow-hidden border-none aspect-[1/1.2] rounded-2xl group cursor-pointer shadow-xl bg-white" onClick={() => router.push(`/users/${user.uid}`)}>
                    <Image 
                      src={user.photoURL} 
                      alt={user.name} 
                      fill 
                      className="object-cover" 
                      data-ai-hint="person profile"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-[#00A2FF] px-4 py-1.5 rounded-full z-30 text-white font-bold text-[12px] uppercase shadow-md active:scale-95 transition-all" onClick={(e) => { e.stopPropagation(); router.push(`/chats?startWith=${user.uid}`); }}>CHAT</div>
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-white font-bold text-sm truncate tracking-tight">{user.name}</h4>
                        {user.isVerified && <BadgeCheck className="w-4 h-4 text-[#00A2FF] fill-white shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="bg-[#006400] text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full">{calculateAge(user.dob)}</span>
                        <span className="bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white font-medium text-[10px] border border-white/20 truncate">{user.country || "Kenya"}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              {hasMore && (
                <div className="flex justify-center pb-8 pt-4">
                  <Button 
                    variant="ghost" 
                    className="text-gray-400 font-bold text-[9px] uppercase tracking-widest gap-2 hover:bg-transparent"
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
      </div>
      <BottomNav />
    </div>
  )
}

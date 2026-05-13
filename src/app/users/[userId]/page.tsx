
"use client"

import { useMemo, use, useState } from "react"
import { doc, updateDoc, arrayUnion } from "firebase/firestore"
import { useFirestore, useDoc, useUser } from "@/firebase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  MessageSquare, 
  MoreHorizontal, 
  User,
  BadgeCheck,
  Ban,
  Flag
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  country: string
  gender: string
  dob: string
  interests?: string
  matchFlowId?: string
  isVerified?: boolean
  blocking?: string[]
}

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const router = useRouter()
  const db = useFirestore()
  const { user: currentUser } = useUser()
  const { toast } = useToast()

  const userRef = useMemo(() => doc(db, "users", userId), [db, userId])
  const { data: profile, loading } = useDoc<UserProfile>(userRef)

  const calculateAge = (dob: string) => {
    if (!dob) return "21"
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  const handleBlock = async () => {
    if (!currentUser || !profile) return
    try {
      const myRef = doc(db, "users", currentUser.uid)
      const targetRef = doc(db, "users", profile.uid)

      // 1. Add to my blocking list
      await updateDoc(myRef, {
        blocking: arrayUnion(profile.uid)
      })

      // 2. Add to their blockedBy list
      await updateDoc(targetRef, {
        blockedBy: arrayUnion(currentUser.uid)
      })

      toast({
        title: "User Blocked",
        description: `${profile.name} has been blocked and will no longer appear in your feed.`,
      })
      router.push("/home")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to block user. Please try again.",
      })
    }
  }

  const handleReport = () => {
    toast({
      title: "Report Submitted",
      description: "Thank you for helping keep MatchFlow safe. We will review this profile.",
    })
  }

  if (loading || !profile) return null
  const age = calculateAge(profile.dob)

  return (
    <div className="flex-1 bg-white flex flex-col min-h-screen pb-24">
      <div className="relative h-[60vh] w-full">
        <Image 
          src={profile.photoURL || `https://picsum.photos/seed/${profile.uid}/800/1000`} 
          alt={profile.name} 
          fill 
          className="object-cover" 
          priority 
          data-ai-hint="person portrait" 
        />
        <div className="absolute top-12 inset-x-0 px-6 flex justify-between items-center z-20">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-black/30 backdrop-blur-xl text-white w-10 h-10 shadow-xl border border-white/10">
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full bg-black/30 backdrop-blur-xl text-white w-10 h-10 shadow-xl border border-white/10">
                <MoreHorizontal className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl min-w-[140px] p-2">
              <DropdownMenuItem 
                onClick={handleBlock}
                className="rounded-xl h-11 text-red-500 font-bold focus:text-red-500 focus:bg-red-50 gap-2"
              >
                <Ban className="w-4 h-4" />
                Block User
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleReport}
                className="rounded-xl h-11 font-bold gap-2"
              >
                <Flag className="w-4 h-4" />
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative -mt-20 bg-white px-8 pt-8 space-y-6 min-h-[45vh] z-20 rounded-t-[3.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-black tracking-tight leading-none">{profile.name}</h1>
              {profile.isVerified && <BadgeCheck className="w-5 h-5 text-[#00A2FF] fill-white" />}
              <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <User className="w-2 h-2 text-black" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#006400] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">{profile.gender === 'female' ? '♀' : '♂'} {age}</span>
              <span className="bg-gray-50 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black border border-black/5 uppercase tracking-widest">{profile.country || "Kenya"}</span>
            </div>
          </div>
        </div>
        <section className="space-y-2 pt-2">
          <h2 className="text-[10px] font-black text-black uppercase tracking-[0.2em] opacity-30">About Me</h2>
          <p className="text-sm font-medium text-gray-600 leading-relaxed italic">"{profile.interests || `I'm passionate about meeting authentic people and finding deep connections.`}"</p>
        </section>
      </div>

      <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-white via-white to-transparent z-50">
        <Button 
          className="w-full h-16 rounded-full bg-[#00A2FF] text-white text-sm font-black flex items-center justify-center gap-3 shadow-2xl premium-shadow uppercase tracking-widest active:scale-95 transition-all"
          onClick={() => router.push(`/chats?startWith=${profile.uid}`)}
        >
          <MessageSquare className="w-5 h-5 fill-current" />
          Send Message
        </Button>
      </div>
    </div>
  )
}

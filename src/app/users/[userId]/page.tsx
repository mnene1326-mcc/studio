
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
  BadgeCheck,
  Ban,
  Flag,
  X,
  GraduationCap,
  Heart,
  Globe,
  Copy,
  Check,
  LayoutGrid
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
import { useUserPresence } from "@/hooks/use-presence"

interface UserProfile {
  uid: string
  name: string
  photoURL: string
  additionalPhotos?: string[]
  country: string
  gender: string
  dob: string
  interests?: string
  matchFlowId?: string
  isVerified?: boolean
  blocking?: string[]
  educationLevel?: string
  lookingFor?: string
}

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const router = useRouter()
  const db = useFirestore()
  const { user: currentUser } = useUser()
  const { toast } = useToast()
  const presence = useUserPresence(userId)

  const [isPhotoOpen, setIsPhotoOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (profile?.matchFlowId) {
      navigator.clipboard.writeText(profile.matchFlowId)
      setCopied(true)
      toast({ title: "ID Copied" })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleBlock = async () => {
    if (!currentUser || !profile) return
    try {
      const myRef = doc(db, "users", currentUser.uid)
      const targetRef = doc(db, "users", profile.uid)
      await updateDoc(myRef, { blocking: arrayUnion(profile.uid) })
      await updateDoc(targetRef, { blockedBy: arrayUnion(currentUser.uid) })
      toast({ title: "User Blocked" })
      router.push("/home")
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to block user." })
    }
  }

  const handleReport = () => {
    toast({ title: "Report Submitted", description: "We will review this profile." })
  }

  if (loading || !profile) return null
  const age = calculateAge(profile.dob)
  const allPhotos = [profile.photoURL, ...(profile.additionalPhotos || [])]

  return (
    <div className="flex-1 bg-white flex flex-col min-h-screen pb-40">
      <div className="relative h-[65vh] w-full cursor-pointer" onClick={() => { setSelectedPhoto(profile.photoURL); setIsPhotoOpen(true); }}>
        <Image 
          src={profile.photoURL} 
          alt={profile.name} 
          fill 
          className="object-cover" 
          priority 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        <div className="absolute top-12 inset-x-0 px-6 flex justify-between items-center z-20" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-black/30 backdrop-blur-xl text-white w-10 h-10 border border-white/10">
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full bg-black/30 backdrop-blur-xl text-white w-10 h-10 border border-white/10">
                <MoreHorizontal className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl min-w-[140px] p-2">
              <DropdownMenuItem onClick={handleBlock} className="rounded-xl h-11 text-red-500 font-bold gap-2">
                <Ban className="w-4 h-4" /> Block User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReport} className="rounded-xl h-11 font-bold gap-2">
                <Flag className="w-4 h-4" /> Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {presence?.state === 'online' && (
          <div className="absolute bottom-6 left-8 bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg flex items-center gap-1.5 animate-in slide-in-from-left-4 duration-500">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Online Now
          </div>
        )}
      </div>

      <div className="relative z-10 bg-white px-8 pt-8 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-black tracking-tight leading-none">{profile.name}</h1>
            {profile.isVerified && <BadgeCheck className="w-6 h-6 text-[#00A2FF] fill-white" />}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#006400] text-white px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-sm">
              {profile.gender === 'female' ? '♀' : '♂'} {age}
            </span>
            <button 
              onClick={handleCopyId}
              className="bg-blue-50 text-[#00A2FF] px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border border-blue-100 flex items-center gap-2 active:scale-95 transition-all"
            >
              ID: {profile.matchFlowId || "---"}
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {allPhotos.length > 1 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-gray-400">
              <LayoutGrid className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Gallery</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {allPhotos.map((url, i) => (
                <div 
                  key={i} 
                  className="relative aspect-square rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-all"
                  onClick={() => { setSelectedPhoto(url); setIsPhotoOpen(true); }}
                >
                  <Image src={url} alt={`Photo ${i}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {profile.interests && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">About Me</span>
            </div>
            <p className="text-sm font-medium text-gray-600 leading-relaxed italic border-l-4 border-blue-100 pl-4">
              "{profile.interests}"
            </p>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 pt-4">
          <DetailItem icon={Globe} label="From" value={profile.country || "Not specified"} />
          <DetailItem icon={GraduationCap} label="Education" value={profile.educationLevel || "Not specified"} />
          <DetailItem icon={Heart} label="Looking For" value={profile.lookingFor || "Not specified"} />
        </div>
      </div>

      {isPhotoOpen && selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-in fade-in duration-300"
          onClick={() => setIsPhotoOpen(false)}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); setIsPhotoOpen(false); }}
            className="absolute top-12 right-6 rounded-full bg-white/20 backdrop-blur-xl text-white w-14 h-14 z-[110] border border-white/20"
          >
            <X className="w-8 h-8 stroke-[3]" />
          </Button>
          <div className="relative w-full h-full p-4 flex items-center justify-center pointer-events-none">
            <Image src={selectedPhoto} alt="Full screen" fill className="object-contain pointer-events-auto" />
          </div>
        </div>
      )}

      <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent z-50">
        <Button 
          className="w-full h-16 rounded-full bg-[#00A2FF] text-white text-sm font-bold flex items-center justify-center gap-3 shadow-2xl uppercase tracking-widest active:scale-95 transition-all"
          onClick={() => router.push(`/chats?startWith=${profile.uid}`)}
        >
          <MessageSquare className="w-5 h-5 fill-current" />
          Send Message
        </Button>
      </div>
    </div>
  )
}

function DetailItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
        <Icon className="w-5 h-5 text-[#00A2FF]" />
      </div>
      <div>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-semibold text-black">{value}</p>
      </div>
    </div>
  )
}

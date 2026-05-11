"use client"

import { useMemo } from "react"
import { doc } from "firebase/firestore"
import { useFirestore, useUser, useDoc, useAuth } from "@/firebase"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
import { Settings, LogOut, ChevronRight, Heart, MapPin, Calendar, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface UserProfile {
  name: string
  email: string
  photoURL: string
  country: string
  lookingFor: string
  gender: string
  dob: string
}

export default function MePage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const auth = useAuth()

  const profileRef = useMemo(() => {
    return user ? doc(db, "users", user.uid) : null
  }, [db, user])

  const { data: profile, loading } = useDoc<UserProfile>(profileRef)

  if (loading) return <div className="p-10 text-center animate-pulse">Loading profile...</div>
  if (!profile) return null

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  return (
    <div className="flex-1 pb-20 bg-background">
      <header className="p-6 text-center space-y-4">
        <div className="relative w-32 h-32 mx-auto rounded-full border-4 border-white shadow-xl overflow-hidden">
          <Image 
            src={profile.photoURL} 
            alt={profile.name} 
            fill 
            className="object-cover" 
            data-ai-hint="person profile"
          />
        </div>
        <div>
          <h2 className="text-3xl font-headline text-primary">{profile.name}, {profile.dob ? calculateAge(profile.dob) : ""}</h2>
          <p className="text-muted-foreground">{profile.email}</p>
        </div>
      </header>

      <main className="px-6 space-y-6">
        <section className="bg-white rounded-2xl p-4 shadow-sm border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-lg text-primary">About Me</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="p-2 bg-secondary rounded-lg"><MapPin className="w-4 h-4 text-primary" /></div>
              <span>{profile.country}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="p-2 bg-secondary rounded-lg"><Heart className="w-4 h-4 text-primary" /></div>
              <span>{profile.lookingFor}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="p-2 bg-secondary rounded-lg"><Users className="w-4 h-4 text-primary" /></div>
              <span className="capitalize">{profile.gender}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="p-2 bg-secondary rounded-lg"><Calendar className="w-4 h-4 text-primary" /></div>
              <span>{profile.dob}</span>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <Button variant="ghost" className="w-full justify-between h-14 rounded-xl hover:bg-white" asChild>
            <Link href="/settings">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg"><Settings className="w-5 h-5" /></div>
                <span className="font-medium">Settings</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-between h-14 rounded-xl hover:bg-white text-destructive"
            onClick={() => auth.signOut()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg"><LogOut className="w-5 h-5" /></div>
              <span className="font-medium">Sign Out</span>
            </div>
            <ChevronRight className="w-5 h-5 opacity-50" />
          </Button>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}

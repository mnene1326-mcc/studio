
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { useFirestore, useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, Loader2, Save } from "lucide-react"

const AFRICAN_COUNTRIES = [
  "Kenya", "Tanzania", "Uganda", "Rwanda", "Burundi", "South Sudan", "Ethiopia", "Somalia", "Eritrea", "Djibouti", "South Africa", "Nigeria", "Ghana", "Egypt"
]

const LOOKING_FOR_OPTIONS = [
  "Serious partner", "Casual friendship", "Networking", "Dating", "Travel buddy"
]

const EDUCATION_OPTIONS = [
  "High School", "Associate Degree", "Bachelor's Degree", "Master's Degree", "PhD", "Prefer not to say"
]

export default function EditProfilePage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    interests: "",
    dob: "",
    country: "",
    lookingFor: "",
    educationLevel: ""
  })

  useEffect(() => {
    if (!user) return
    
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          const data = snap.data()
          setFormData({
            name: data.name || "",
            interests: data.interests || "",
            dob: data.dob || "",
            country: data.country || "",
            lookingFor: data.lookingFor || "",
            educationLevel: data.educationLevel || ""
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProfile()
  }, [user, db])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        ...formData,
        updatedAt: serverTimestamp()
      })
      
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      })
      router.back()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#00A2FF]" />
      </div>
    )
  }

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col pb-20">
      <header className="px-4 h-16 flex items-center justify-between border-b sticky top-0 bg-white z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h1 className="text-base font-black text-black">Edit Profile</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleSave} 
          disabled={saving}
          className="text-[#00A2FF] font-black"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        </Button>
      </header>

      <main className="flex-1 p-6 space-y-8 overflow-y-auto">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</Label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="rounded-2xl h-14 border-gray-100 bg-gray-50 font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">About Me (Bio)</Label>
            <Textarea 
              value={formData.interests}
              onChange={(e) => setFormData({...formData, interests: e.target.value})}
              placeholder="Tell others about yourself..."
              className="rounded-2xl min-h-[120px] border-gray-100 bg-gray-50 font-medium leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Date of Birth</Label>
              <Input 
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({...formData, dob: e.target.value})}
                className="rounded-2xl h-14 border-gray-100 bg-gray-50 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Country</Label>
              <Select 
                onValueChange={(val) => setFormData({...formData, country: val})}
                value={formData.country}
              >
                <SelectTrigger className="rounded-2xl h-14 border-gray-100 bg-gray-50 font-bold">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-60">
                  {AFRICAN_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Education Level</Label>
            <Select 
              onValueChange={(val) => setFormData({...formData, educationLevel: val})}
              value={formData.educationLevel}
            >
              <SelectTrigger className="rounded-2xl h-14 border-gray-100 bg-gray-50 font-bold">
                <SelectValue placeholder="Select Education" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {EDUCATION_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Looking For</Label>
            <Select 
              onValueChange={(val) => setFormData({...formData, lookingFor: val})}
              value={formData.lookingFor}
            >
              <SelectTrigger className="rounded-2xl h-14 border-gray-100 bg-gray-50 font-bold">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {LOOKING_FOR_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-6">
          <Button 
            className="w-full h-16 rounded-full bg-[#00A2FF] text-white font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving Changes..." : "Save Profile"}
          </Button>
        </div>
      </main>
    </div>
  )
}

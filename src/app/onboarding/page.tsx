"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { useAuth, useFirestore, useUser } from "@/firebase"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Heart } from "lucide-react"

const AFRICAN_COUNTRIES = [
  "Kenya", "Tanzania", "Uganda", "Rwanda", "Burundi", "South Sudan", "Ethiopia", "Somalia", "Eritrea", "Djibouti", "South Africa", "Nigeria", "Ghana", "Egypt"
]

const LOOKING_FOR_OPTIONS = [
  "Serious partner", "Casual friendship", "Networking", "Dating", "Travel buddy"
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [gender, setGender] = useState("")
  const [dob, setDob] = useState("")
  const [country, setCountry] = useState("")
  const [lookingFor, setLookingFor] = useState("")
  const [loading, setLoading] = useState(false)
  
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const generateMatchFlowId = () => {
    return Math.floor(1000000 + Math.random() * 998999999).toString()
  }

  const validateAge = (dateString: string) => {
    const today = new Date()
    const birthDate = new Date(dateString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 18
  }

  const handleComplete = async () => {
    if (!user) return
    if (!validateAge(dob)) {
      toast({
        variant: "destructive",
        title: "Age Validation",
        description: "You must be 18 years or older to use MatchFlow.",
      })
      return
    }

    setLoading(true)

    const userRef = doc(db, "users", user.uid)
    const userSnap = await getDoc(userRef)
    const existingData = userSnap.data()

    const updateData: any = {
      name,
      gender,
      dob,
      country,
      lookingFor,
      onboardingComplete: true,
      photoURL: `https://picsum.photos/seed/${user.uid}/400/400`,
      updatedAt: serverTimestamp(),
    }

    if (!existingData?.matchFlowId) {
      updateData.matchFlowId = generateMatchFlowId()
    }

    setDoc(userRef, updateData, { merge: true })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'write',
          requestResourceData: updateData,
        } satisfies SecurityRuleContext)
        errorEmitter.emit('permission-error', permissionError)
      })

    router.push("/home")
  }

  return (
    <div className="flex-1 flex flex-col p-6 max-w-md mx-auto space-y-8">
      <header className="text-center space-y-2">
        <Heart className="w-10 h-10 text-primary mx-auto" />
        <h1 className="text-3xl font-headline text-primary">Build Your Profile</h1>
        <p className="text-muted-foreground font-body">Step {step} of 3</p>
      </header>

      <div className="flex-1">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="space-y-2">
              <Label htmlFor="name">What's your name?</Label>
              <Input 
                id="name" 
                placeholder="Full Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select onValueChange={setGender} value={gender}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full rounded-full h-12 font-headline mt-4" 
              onClick={() => name && gender && setStep(2)}
              disabled={!name || !gender}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input 
                id="dob" 
                type="date" 
                value={dob} 
                onChange={(e) => setDob(e.target.value)} 
                className="rounded-xl h-12"
              />
              <p className="text-[10px] text-muted-foreground">You must be at least 18 years old.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select onValueChange={setCountry} value={country}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {AFRICAN_COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 rounded-full h-12" onClick={() => setStep(1)}>Back</Button>
              <Button 
                className="flex-1 rounded-full h-12 font-headline" 
                onClick={() => dob && country && setStep(3)}
                disabled={!dob || !country}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="space-y-2">
              <Label htmlFor="lookingFor">What are you looking for?</Label>
              <Select onValueChange={setLookingFor} value={lookingFor}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Preferences" />
                </SelectTrigger>
                <SelectContent>
                  {LOOKING_FOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 rounded-full h-12" onClick={() => setStep(2)}>Back</Button>
              <Button 
                className="flex-1 rounded-full h-12 font-headline" 
                onClick={handleComplete}
                disabled={!lookingFor || loading}
              >
                {loading ? "Saving..." : "Let's Go!"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

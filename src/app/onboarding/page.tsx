
"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { useFirestore, useUser } from "@/firebase"
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

const RANDOM_NAMES = ["Amani", "Zahara", "Kwame", "Jabari", "Malik", "Zendaya", "Tunde", "Folami", "Nala", "Simba", "Kofi", "Efua", "Mosi", "Zola", "Binti", "Sefu"];

function OnboardingContent() {
  const searchParams = useSearchParams()
  const isFast = searchParams.get("fast") === "true"
  
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

  const generateRandomDOB = () => {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear - 19; // Safe margin for >18
    const minYear = currentYear - 45;
    const year = Math.floor(Math.random() * (maxYear - minYear + 1) + minYear);
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1;
    return new Date(year, month, day).toISOString().split('T')[0];
  }

  const generateMatchFlowId = () => {
    const min = 1000000;
    const max = 999999999;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  const validateAge = (dateString: string) => {
    if (!dateString) return false;
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
    
    setLoading(true)

    // Generate random data for fast login path
    const finalName = isFast ? RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)] : name;
    const finalDob = isFast ? generateRandomDOB() : dob;
    const finalLookingFor = isFast ? LOOKING_FOR_OPTIONS[Math.floor(Math.random() * LOOKING_FOR_OPTIONS.length)] : lookingFor;

    if (!validateAge(finalDob)) {
      toast({
        variant: "destructive",
        title: "Age Validation",
        description: "You must be 18 years or older to use MatchFlow.",
      })
      setLoading(false)
      return
    }

    const userRef = doc(db, "users", user.uid)
    const userSnap = await getDoc(userRef)
    const existingData = userSnap.data()

    const updateData: any = {
      uid: user.uid,
      email: user.email || "anonymous@matchflow.app",
      name: finalName,
      gender,
      dob: finalDob,
      country,
      lookingFor: finalLookingFor,
      onboardingComplete: true,
      photoURL: `https://picsum.photos/seed/${user.uid}/400/400`,
      updatedAt: serverTimestamp(),
      createdAt: existingData?.createdAt || serverTimestamp(),
    }

    if (!existingData?.matchFlowId) {
      updateData.matchFlowId = generateMatchFlowId()
    }

    setDoc(userRef, updateData, { merge: true })
      .then(() => {
        router.push("/home")
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'write',
          requestResourceData: updateData,
        } satisfies SecurityRuleContext)
        errorEmitter.emit('permission-error', permissionError)
        setLoading(false)
      })
  }

  return (
    <div className="flex-1 flex flex-col p-6 max-w-md mx-auto space-y-8">
      <header className="text-center space-y-2">
        <Heart className="w-10 h-10 text-primary mx-auto" />
        <h1 className="text-3xl font-headline text-primary">
          {isFast ? "Quick Start" : "Build Your Profile"}
        </h1>
        <p className="text-muted-foreground font-body">
          {isFast ? `Step ${step} of 2` : `Step ${step} of 3`}
        </p>
      </header>

      <div className="flex-1">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            {!isFast && (
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
            )}
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
              onClick={() => (isFast ? gender : (name && gender)) && setStep(2)}
              disabled={isFast ? !gender : (!name || !gender)}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            {!isFast && (
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
            )}
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
              {isFast ? (
                <Button 
                  className="flex-1 rounded-full h-12 font-headline" 
                  onClick={handleComplete}
                  disabled={!country || loading}
                >
                  {loading ? "Fast matching..." : "Let's Go!"}
                </Button>
              ) : (
                <Button 
                  className="flex-1 rounded-full h-12 font-headline" 
                  onClick={() => dob && country && setStep(3)}
                  disabled={!dob || !country}
                >
                  Continue
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 3 && !isFast && (
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

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center font-black text-xl text-primary">Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}

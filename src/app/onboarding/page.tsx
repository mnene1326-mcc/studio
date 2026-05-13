
"use client"

import { useState, Suspense, useMemo } from "react"
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

  const maxDate = useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 18)
    return d.toISOString().split('T')[0]
  }, [])

  const generateRandomDOB = () => {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear - 18;
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

    // Monetization: Male 500 coins, Female 500 diamonds
    const initialCoins = gender === 'male' ? 500 : (existingData?.coins || 0)
    const initialDiamonds = gender === 'female' ? 500 : (existingData?.diamonds || 0)

    const updateData: any = {
      uid: user.uid,
      email: user.email || "guest@matchflow.app",
      name: finalName,
      gender,
      dob: finalDob,
      country,
      lookingFor: finalLookingFor,
      onboardingComplete: true,
      photoURL: `https://picsum.photos/seed/${user.uid}/400/400`,
      coins: initialCoins,
      diamonds: initialDiamonds,
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
    <div className="flex-1 flex flex-col p-6 max-w-md mx-auto space-y-8 min-h-screen bg-background">
      <header className="text-center space-y-2 mt-8">
        <Heart className="w-12 h-12 text-primary mx-auto fill-current" />
        <h1 className="text-3xl font-black text-black tracking-tight">
          {isFast ? "Fast Matching" : "Create Profile"}
        </h1>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
          {isFast ? `Step ${step} of 2` : `Step ${step} of 3`}
        </p>
      </header>

      <div className="flex-1">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            {!isFast && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[10px] font-black uppercase ml-1">What's your name?</Label>
                <Input 
                  id="name" 
                  placeholder="Full Name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="rounded-2xl h-14 border-muted shadow-sm focus-visible:ring-primary"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="gender" className="text-[10px] font-black uppercase ml-1">Gender</Label>
              <Select onValueChange={setGender} value={gender}>
                <SelectTrigger className="rounded-2xl h-14 border-muted shadow-sm focus-visible:ring-primary">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full rounded-full h-14 font-black text-lg mt-4 shadow-lg active:scale-95 transition-all" 
              onClick={() => setStep(2)}
              disabled={isFast ? !gender : (!name || !gender)}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            {!isFast && (
              <div className="space-y-1.5">
                <Label htmlFor="dob" className="text-[10px] font-black uppercase ml-1">Date of Birth</Label>
                <Input 
                  id="dob" 
                  type="date" 
                  max={maxDate}
                  value={dob} 
                  onChange={(e) => setDob(e.target.value)} 
                  className="rounded-2xl h-14 border-muted shadow-sm focus-visible:ring-primary"
                />
                <p className="text-[9px] text-muted-foreground font-bold ml-1">Minimum 18 years old.</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-[10px] font-black uppercase ml-1">Country</Label>
              <Select onValueChange={setCountry} value={country}>
                <SelectTrigger className="rounded-2xl h-14 border-muted shadow-sm focus-visible:ring-primary">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl h-64">
                  {AFRICAN_COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-4">
              <Button 
                className="w-full rounded-full h-14 font-black text-lg shadow-lg active:scale-95 transition-all" 
                onClick={isFast ? handleComplete : () => setStep(3)}
                disabled={isFast ? (!country || loading) : (!dob || !country)}
              >
                {isFast ? (loading ? "Matching..." : "Let's Go!") : "Continue"}
              </Button>
              <Button variant="ghost" className="text-muted-foreground font-black text-xs" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>
          </div>
        )}

        {step === 3 && !isFast && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="space-y-1.5">
              <Label htmlFor="lookingFor" className="text-[10px] font-black uppercase ml-1">What are you looking for?</Label>
              <Select onValueChange={setLookingFor} value={lookingFor}>
                <SelectTrigger className="rounded-2xl h-14 border-muted shadow-sm focus-visible:ring-primary">
                  <SelectValue placeholder="Preferences" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {LOOKING_FOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-4">
              <Button 
                className="w-full rounded-full h-14 font-black text-lg shadow-lg active:scale-95 transition-all" 
                onClick={handleComplete}
                disabled={!lookingFor || loading}
              >
                {loading ? "Saving Profile..." : "Complete Setup"}
              </Button>
              <Button variant="ghost" className="text-muted-foreground font-black text-xs" onClick={() => setStep(2)}>
                Back
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
    <Suspense fallback={<div className="p-16 text-center font-black text-xl text-primary animate-pulse">MatchFlow...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}

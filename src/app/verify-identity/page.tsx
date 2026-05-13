"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { doc, updateDoc } from "firebase/firestore"
import { useFirestore, useUser, useDoc } from "@/firebase"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Camera, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react"
import { verifyIdentity } from "@/ai/flows/verify-identity-flow"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function VerifyIdentityPage() {
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [step, setStep] = useState<'instructions' | 'capture' | 'analyzing' | 'result'>('instructions')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const userRef = user?.uid ? doc(db, "users", user.uid) : null
  const { data: profile } = useDoc(userRef)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCapturedImage(reader.result as string)
        setStep('capture')
      }
      reader.readAsDataURL(file)
    }
  }

  const runVerification = async () => {
    if (!capturedImage || !profile?.photoURL) return
    
    setLoading(true)
    setStep('analyzing')
    
    try {
      const result = await verifyIdentity({
        profilePhotoUrl: profile.photoURL,
        selfieDataUri: capturedImage
      })

      if (result.isMatch && result.confidence > 0.7) {
        if (userRef) {
          await updateDoc(userRef, { isVerified: true })
        }
        setIsSuccess(true)
      } else {
        setIsSuccess(false)
      }
      setStep('result')
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verification Error",
        description: "Something went wrong during the analysis. Please try again.",
      })
      setStep('instructions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col">
      <header className="px-4 h-16 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h1 className="text-base font-black text-black">Identity Verification</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 flex flex-col p-8">
        {step === 'instructions' && (
          <div className="flex-1 flex flex-col space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center text-center space-y-6 pt-10">
              <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center">
                <ShieldCheck className="w-12 h-12 text-[#00A2FF]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-black tracking-tight">Verify Your Account</h2>
                <p className="text-sm font-medium text-gray-500 px-4">Ensure your safety and the safety of our community by verifying your identity.</p>
              </div>
            </div>

            <div className="space-y-6">
              {[
                { title: "Good Lighting", desc: "Make sure your face is clearly visible.", icon: Sparkles },
                { title: "Face Centered", desc: "Hold your phone at eye level.", icon: Camera },
                { title: "Match Photo", desc: "The AI will compare this selfie to your profile.", icon: ShieldCheck }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-center bg-gray-50 p-5 rounded-3xl border border-black/5">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <item.icon className="w-5 h-5 text-[#00A2FF]" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-black leading-tight">{item.title}</p>
                    <p className="text-[11px] font-bold text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              className="w-full h-16 rounded-full bg-[#00A2FF] text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-100 mt-auto"
              onClick={() => fileInputRef.current?.click()}
            >
              Start Verification
            </Button>
            <input 
              type="file" 
              accept="image/*" 
              capture="user" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleCapture}
            />
          </div>
        )}

        {step === 'capture' && capturedImage && (
          <div className="flex-1 flex flex-col space-y-8 animate-in zoom-in-95 duration-300">
            <h2 className="text-xl font-black text-black text-center pt-4">Look Good?</h2>
            <div className="relative aspect-[3/4] w-full rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
              <Image src={capturedImage} alt="Selfie" fill className="object-cover" />
            </div>
            <div className="flex flex-col gap-4 mt-auto">
              <Button 
                className="w-full h-16 rounded-full bg-[#00A2FF] text-white font-black uppercase tracking-widest text-sm shadow-xl"
                onClick={runVerification}
              >
                Submit for Analysis
              </Button>
              <Button 
                variant="ghost" 
                className="font-black text-gray-400 uppercase text-[10px] tracking-widest"
                onClick={() => fileInputRef.current?.click()}
              >
                Retake Photo
              </Button>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
            <div className="relative">
              <div className="w-32 h-32 border-4 border-[#00A2FF]/20 rounded-full animate-spin border-t-[#00A2FF]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-[#00A2FF] animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-black">Analyzing...</h3>
              <p className="text-sm font-medium text-gray-400">Comparing with your profile photo</p>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-in zoom-in-95 duration-500">
            {isSuccess ? (
              <>
                <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center text-green-500">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-black text-black tracking-tight">Verified!</h2>
                  <p className="text-sm font-medium text-gray-500 px-8 leading-relaxed">Your identity has been confirmed. You now have the verified badge on your profile.</p>
                </div>
                <Button 
                  className="w-full h-16 rounded-full bg-[#00A2FF] text-white font-black uppercase tracking-widest text-sm shadow-xl mt-auto"
                  onClick={() => router.push('/me')}
                >
                  Back to Profile
                </Button>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-500">
                  <AlertCircle className="w-16 h-16" />
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-black text-black tracking-tight">Verification Failed</h2>
                  <p className="text-sm font-medium text-gray-500 px-8 leading-relaxed">The AI couldn't confirm it's you. Please ensure your profile photo is clear and try the selfie again.</p>
                </div>
                <Button 
                  className="w-full h-16 rounded-full bg-[#00A2FF] text-white font-black uppercase tracking-widest text-sm shadow-xl mt-auto"
                  onClick={() => setStep('instructions')}
                >
                  Try Again
                </Button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

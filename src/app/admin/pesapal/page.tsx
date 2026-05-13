"use client"

import { useState } from "react"
import { registerIPN } from "@/app/actions/pesapal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ShieldCheck, Copy, Check } from "lucide-react"

export default function PesaPalAdminPage() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleRegister = async () => {
    if (!url) {
      toast({ variant: "destructive", title: "URL Required", description: "Please enter your site URL." })
      return
    }

    setLoading(true)
    setResult(null)
    try {
      const data = await registerIPN(url)
      setResult(data)
      toast({ title: "Registration Successful", description: "IPN ID has been generated." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (result?.ipn_id) {
      navigator.clipboard.writeText(result.ipn_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-2xl rounded-3xl overflow-hidden border-none">
        <CardHeader className="bg-[#FF3B30] text-white p-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-8 h-8" />
            <CardTitle className="text-2xl font-black uppercase tracking-tight">PesaPal Setup</CardTitle>
          </div>
          <CardDescription className="text-white/70 font-bold">Register your IPN ID for live payments.</CardDescription>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Site URL</label>
            <Input 
              placeholder="https://matchflow.app" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)}
              className="h-14 rounded-2xl border-gray-100 bg-gray-50 focus:ring-[#FF3B30]"
            />
            <p className="text-[9px] text-gray-400 font-bold ml-1">Example: https://your-app.com</p>
          </div>

          <Button 
            onClick={handleRegister} 
            disabled={loading}
            className="w-full h-14 rounded-full bg-[#FF3B30] hover:bg-[#D32F2F] text-white font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Register IPN URL"}
          </Button>

          {result && (
            <div className="mt-8 p-6 bg-green-50 rounded-3xl border border-green-100 space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">Your IPN ID</p>
                <div 
                  className="flex items-center justify-between bg-white p-4 rounded-2xl border border-green-200 cursor-pointer active:scale-95 transition-all"
                  onClick={copyToClipboard}
                >
                  <code className="text-xs font-black text-black truncate pr-4">{result.ipn_id}</code>
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
              <p className="text-[10px] text-green-600 font-bold leading-relaxed">
                Copy this ID and add it to your environment variables as <span className="font-black">PESAPAL_IPN_ID</span>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
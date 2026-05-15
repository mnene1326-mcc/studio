"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Users, ShieldAlert, Loader2, BadgeCheck, UserPlus, UserMinus } from "lucide-react"
import { useUser } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { toggleUserRoleAction } from "@/app/actions/admin"

export default function ManageRolesPage() {
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()
  const [targetId, setTargetId] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRoleUpdate = async (role: 'isCoinSeller' | 'isAgent', value: boolean) => {
    if (!user || !targetId) return
    setLoading(true)
    try {
      const result = await toggleUserRoleAction(user.uid, targetId, role, value)
      if (result.success) {
        toast({ title: "Role Updated", description: result.message })
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error })
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
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
        <h1 className="text-base font-black text-black">User Roles</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 p-8 flex flex-col items-center justify-center space-y-10">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-purple-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
            <Users className="w-10 h-10 text-purple-600" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-black tracking-tight">Authority Management</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assign Sellers & Agents</p>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">User Numeric ID</label>
            <Input 
              placeholder="MatchFlow ID" 
              value={targetId} 
              onChange={(e) => setTargetId(e.target.value)} 
              className="rounded-2xl h-16 text-center text-xl font-bold border-gray-100 bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-[9px] font-black text-center text-gray-400 uppercase">Coin Seller</p>
              <Button 
                onClick={() => handleRoleUpdate('isCoinSeller', true)} 
                disabled={loading || !targetId}
                className="w-full h-14 rounded-2xl bg-blue-600 text-white font-bold text-[10px] uppercase gap-2"
              >
                <UserPlus className="w-4 h-4" /> Grant
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleRoleUpdate('isCoinSeller', false)} 
                disabled={loading || !targetId}
                className="w-full h-14 rounded-2xl border-blue-100 text-blue-600 font-bold text-[10px] uppercase gap-2"
              >
                <UserMinus className="w-4 h-4" /> Revoke
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-[9px] font-black text-center text-gray-400 uppercase">Agency Agent</p>
              <Button 
                onClick={() => handleRoleUpdate('isAgent', true)} 
                disabled={loading || !targetId}
                className="w-full h-14 rounded-2xl bg-purple-600 text-white font-bold text-[10px] uppercase gap-2"
              >
                <UserPlus className="w-4 h-4" /> Grant
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleRoleUpdate('isAgent', false)} 
                disabled={loading || !targetId}
                className="w-full h-14 rounded-2xl border-purple-100 text-purple-600 font-bold text-[10px] uppercase gap-2"
              >
                <UserMinus className="w-4 h-4" /> Revoke
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-xs text-center pt-10">
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex gap-3 text-left">
            <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0" />
            <p className="text-[9px] font-bold text-orange-800 uppercase leading-relaxed">
              Caution: Changing user roles impacts financial permissions and platform access instantly.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

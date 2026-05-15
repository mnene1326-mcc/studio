
"use client"

import { useAuth, useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors"
import { deleteUser, signOut } from "firebase/auth"
import { doc, deleteDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ShieldAlert, Link as LinkIcon, Info, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface UserProfile {
  isAdmin?: boolean
}

interface SettingItemProps {
  label: string
  onClick?: () => void
  href?: string
  icon?: React.ReactNode
}

function SettingItem({ label, onClick, href, icon }: SettingItemProps) {
  const content = (
    <div className="flex items-center justify-between py-5 px-6 border-b border-gray-100 active:bg-gray-50 transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-[15px] font-medium text-black">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300" />
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return <div onClick={onClick}>{content}</div>
}

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const { user } = useUser()

  const profileRef = useMemoFirebase(() => user?.uid ? doc(db, "users", user.uid) : null, [db, user?.uid])
  const { data: profile } = useDoc<UserProfile>(profileRef)

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      window.location.replace("/welcome")
    } catch (error) {
      // Errors handled centrally
    }
  }

  const handleClearCache = () => {
    try {
      // Clear Firestore local cache stored in hooks
      localStorage.clear()
      sessionStorage.clear()
      
      toast({ 
        title: "Cache Cleared", 
        description: "All temporary app data has been removed. Reloading..." 
      })

      // Reload to ensure all memory state is reset
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      toast({ variant: "destructive", title: "Error clearing cache" })
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    try {
      const uid = user.uid
      const userRef = doc(db, "users", uid)
      
      deleteDoc(userRef)
        .catch(async () => {
          const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'delete',
          } satisfies SecurityRuleContext)
          errorEmitter.emit('permission-error', permissionError)
        })

      await deleteUser(user)
      
      toast({
        title: "Account deleted",
        description: "Your account and data have been removed.",
      })
      window.location.replace("/welcome")
    } catch (error: any) {
      const description = error.code === 'auth/requires-recent-login' 
        ? "For security reasons, please sign out and sign back in before deleting your account." 
        : error.message || "Failed to delete account."
        
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: description,
      })
    }
  }

  const settingsList = [
    { label: "Charge settings", href: "/recharge" },
    { label: "Blocked List", href: "/blocked-list" },
    { label: "About MatchFlow", href: "/about", icon: <Info className="w-4 h-4 text-blue-500" /> },
    { label: "Clear Cache", onClick: handleClearCache, icon: <Trash2 className="w-4 h-4 text-orange-500" /> },
  ]

  return (
    <div className="flex-1 bg-white flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-4 h-16 bg-white sticky top-0 z-50 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h1 className="text-lg font-bold text-black flex-1 text-center pr-10">Settings</h1>
      </header>

      <main className="flex-1">
        <div className="flex flex-col">
          {user?.isAnonymous && (
            <SettingItem 
              label="Bind Account" 
              href="/settings/bind-account" 
              icon={<LinkIcon className="w-4 h-4 text-[#00A2FF]" />} 
            />
          )}
          
          {settingsList.map((item, idx) => (
            <SettingItem key={idx} {...item} />
          ))}
          
          <SettingItem label="Sign Out" onClick={handleSignOut} />
        </div>
      </main>

      <footer className="pb-10 pt-20">
        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 font-medium">
          <Link href="/privacy" className="hover:text-black">Privacy Policy</Link>
          <span className="opacity-30">|</span>
          <Link href="/terms" className="hover:text-black">Terms of Service</Link>
          {!profile?.isAdmin && (
            <>
              <span className="opacity-30">|</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="hover:text-red-500 transition-colors">Delete Account</button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-destructive" />
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive hover:bg-destructive/90 rounded-full"
                      onClick={handleDeleteAccount}
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </footer>
    </div>
  )
}

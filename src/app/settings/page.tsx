
"use client"

import { useAuth, useFirestore } from "@/firebase"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors"
import { deleteUser, signOut } from "firebase/auth"
import { doc, deleteDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react"
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

interface SettingItemProps {
  label: string
  onClick?: () => void
  href?: string
}

function SettingItem({ label, onClick, href }: SettingItemProps) {
  const content = (
    <div className="flex items-center justify-between py-5 px-6 border-b border-gray-100 active:bg-gray-50 transition-colors cursor-pointer">
      <span className="text-[15px] font-medium text-black">{label}</span>
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

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      // Errors handled centrally if needed
    }
  }

  const handleDeleteAccount = async () => {
    const user = auth.currentUser
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
      router.push("/")
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
    { label: "Bind account", href: "#" },
    { label: "Charge settings", href: "/recharge" },
    { label: "Rights Center", href: "#" },
    { label: "Chat settings", href: "#" },
    { label: "Blocked List", href: "#" },
    { label: "Language", href: "#" },
    { label: "Clear Cache", onClick: () => toast({ title: "Cache Cleared", description: "Temporary files have been removed." }) },
    { label: "About Bibo", href: "#" },
  ]

  return (
    <div className="flex-1 bg-white flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-4 h-16 bg-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h1 className="text-lg font-bold text-black flex-1 text-center pr-10">Settings</h1>
      </header>

      <main className="flex-1">
        <div className="flex flex-col">
          {settingsList.map((item, idx) => (
            <SettingItem key={idx} {...item} />
          ))}
          <SettingItem label="Sign Out" onClick={handleSignOut} />
        </div>
      </main>

      <footer className="pb-10 pt-20">
        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 font-medium">
          <Link href="#" className="hover:text-black">Privacy Policy</Link>
          <span className="opacity-30">|</span>
          <Link href="#" className="hover:text-black">Terms of Service</Link>
          <span className="opacity-30">|</span>
          <Link href="#" className="hover:text-black">Contact us</Link>
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
        </div>
      </footer>
    </div>
  )
}

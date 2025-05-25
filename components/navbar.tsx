"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Leaf, Menu, User, Search, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

export function Navbar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const routes = [
    {
      href: "/",
      label: "Explore",
      active: pathname === "/",
    },
    {
      href: "/add",
      label: "Add Location",
      active: pathname === "/add",
    },
    {
      href: "/community",
      label: "Community",
      active: pathname === "/community",
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-black" />
              <span className="font-bold text-black">GreenMap</span>
              <Badge className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-md">BETA</Badge>
            </div>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn("transition-colors hover:text-black", route.active ? "text-black" : "text-gray-600")}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5 text-black" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0 bg-white">
            <div className="px-7">
              <Link href="/" className="flex items-center" onClick={() => setIsOpen(false)}>
                <Leaf className="mr-2 h-4 w-4" />
                <span className="font-bold">GreenMap</span>
              </Link>
              <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
                <div className="flex flex-col space-y-3">
                  {routes.map((route) => (
                    <Link
                      key={route.href}
                      href={route.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "transition-colors hover:text-black",
                        route.active ? "text-black" : "text-gray-600",
                      )}
                    >
                      {route.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button
              variant="outline"
              className="inline-flex items-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
            >
              <Search className="mr-2 h-4 w-4" />
              <span className="hidden lg:inline-flex">Search locations...</span>
              <span className="inline-flex lg:hidden">Search...</span>
              <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">/</span>
              </kbd>
            </Button>
          </div>
          <nav className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">{user.email?.split("@")[0]}</span>
                <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-gray-600 hover:text-black">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button className="bg-black text-white hover:bg-gray-800">
                <User className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

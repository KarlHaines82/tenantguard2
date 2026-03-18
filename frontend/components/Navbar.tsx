import React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, User, LogOut, Settings } from 'lucide-react'
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from 'next/router'

const Navbar = ({
  onDashboard,
  onNavigate,
}: {
  onDashboard?: () => void
  onNavigate?: (sectionId: string) => void
}) => {
  const { data: session } = useSession()
  const currentUser = session?.user
  const router = useRouter()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isMobileUserOpen, setIsMobileUserOpen] = React.useState(false)

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'blog', label: 'Blog' },
    { id: 'contact', label: 'Contact' },
  ]

  const handleNavClick = (sectionId: string) => {
    if (sectionId === 'blog') {
      router.push('/blog')
    } else if (router.pathname !== '/') {
      // If not on home page, navigate home first then maybe scroll
      if (sectionId === 'home') {
        router.push('/')
      } else {
        router.push(`/#${sectionId}`)
      }
    } else if (onNavigate) {
      onNavigate(sectionId)
    } else {
      // Fallback if onNavigate not provided but on home page
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      } else if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    setIsMobileMenuOpen(false)
    setIsMobileUserOpen(false)
  }

  const getUserDisplayText = () => {
    if (!currentUser) return 'User'
    if ((currentUser as any).username) {
      return (currentUser as any).username
    }
    if (currentUser.email) {
      return currentUser.email.split('@')[0] || 'User'
    }
    return 'User'
  }

  return (
    <header 
      style={{ 
        backgroundColor: 'var(--color-navBg)', 
        borderColor: 'var(--color-navBorder)' 
      }} 
      className="shadow-sm border-b sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => handleNavClick('home')}
          >
            <img src="/assets/logo.png" alt="TenantGuard" className="h-8 w-8" />
            <span 
              className="text-xl font-bold" 
              style={{ color: 'var(--color-primary)' }}
            >
              TenantGuard
            </span>
          </div>

          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                style={{ color: 'var(--color-textSecondary)' }}
                className=""
                onClick={() => handleNavClick(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost" 
                    style={{ color: 'var(--color-textSecondary)' }} 
                    className="hover:opacity-80 flex items-center gap-1"
                  >
                    <User className="h-4 w-4" />
                    <span className="max-w-[150px] truncate">
                      {getUserDisplayText()}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent 
                  align="end" 
                  className="w-56" 
                  style={{ 
                    backgroundColor: 'var(--color-cardBg)', 
                    borderColor: 'var(--color-cardBorder)' 
                  }}
                >
                  <DropdownMenuLabel
                    className="text-right sm:text-left"
                    style={{ color: 'var(--color-text)' }}
                  >
                    <div className="flex flex-col items-end space-y-1 sm:items-start">
                      <p className="text-sm font-medium leading-none">
                        {(currentUser as any).username || 'User'}
                      </p>
                      <p 
                        className="text-xs leading-none" 
                        style={{ color: 'var(--color-textSecondary)' }}
                      >
                        {currentUser?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator 
                    style={{ backgroundColor: 'var(--color-cardBorder)' }} 
                  />

                  {(session as any).user?.role === 'admin' && (
                    <DropdownMenuItem 
                      onClick={() => onDashboard && onDashboard()}
                      className="cursor-pointer justify-end text-right sm:justify-start sm:text-left"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator 
                    style={{ backgroundColor: 'var(--color-cardBorder)' }} 
                  />

                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="cursor-pointer justify-end text-right text-red-600 focus:text-red-600 sm:justify-start sm:text-left"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                style={{ color: 'var(--color-textSecondary)' }} 
                className="" 
                onClick={() => signIn()}
              >
                Login
              </Button>
            )}

            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </Button>
          </div>

        </div>

        {isMobileMenuOpen && (
          <div id="mobile-nav" className="md:hidden border-t" style={{ borderColor: 'var(--color-navBorder)' }}>
            <nav className="flex flex-col items-end py-2 pr-[10px]">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  style={{ color: 'var(--color-textSecondary)' }}
                  className="w-full justify-end text-right hover:opacity-80"
                  onClick={() => handleNavClick(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </nav>
            <div className="flex flex-col items-end gap-2 pb-4 pl-4 pr-[10px]">
              {session ? (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-end gap-2"
                    onClick={() => setIsMobileUserOpen((open) => !open)}
                  >
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {getUserDisplayText()}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isMobileUserOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  {isMobileUserOpen && (
                    <div className="flex flex-col gap-1 pr-6">
                      {(session as any).user?.role === 'admin' && (
                        <Button
                          variant="ghost"
                          className="w-full justify-end text-right"
                          onClick={() => {
                            setIsMobileMenuOpen(false)
                            setIsMobileUserOpen(false)
                            if (onDashboard) onDashboard()
                          }}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Dashboard
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className="w-full justify-end text-right text-red-600 hover:text-red-600"
                        onClick={() => signOut()}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-end text-right"
                  onClick={() => signIn()}
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar

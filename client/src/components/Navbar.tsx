import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import { UserButton } from '@daveyplate/better-auth-ui'
import api from '@/configs/axios';
import { toast } from 'sonner';
import logo from '@/assets/logo.svg';

const Navbar = () => {
      const [menuOpen, setMenuOpen] = React.useState(false);
      const navigate = useNavigate();
      const location = useLocation();
      const [credits, setCredits] = useState(0);

      const {data: session} = authClient.useSession()

      const getCredits=async()=>{
        try {
          const{data} = await api.get('/api/user/credits')
          setCredits(data.credits)
        }
        catch(error: any){
          toast.error(error?.response?.data?.message || error.message);
          console.log(error);
        }
      }

      useEffect(()=>{
        const refreshCredits = () => getCredits();
        if(session?.user){
          getCredits()
        }

        window.addEventListener('credits-updated', refreshCredits)
        return () => {
          window.removeEventListener('credits-updated', refreshCredits)
        }
      }, [session?.user])

      const navLinks = [
        { to: '/',           label: 'Home' },
        { to: '/projects',   label: 'My Projects' },
        { to: '/community',  label: 'Community' },
        { to: '/pricing',    label: 'Pricing' },
      ]

      const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/'
        return location.pathname.startsWith(path)
      }

  return (
    <>
      <nav className="z-50 flex items-center justify-between w-full py-4 px-4 md:px-16 lg:px-24 xl:px-32 backdrop-blur border-b text-white border-slate-800">
        <img
          src={logo}
          alt="SiteForge"
          style={{ height: '60px', width: 'auto', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        />

          <div className="hidden md:flex items-center gap-8 transition duration-500">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`transition-all duration-200 ${
                  isActive(to)
                    ? 'text-white font-bold'
                    : 'text-gray-400 hover:text-white font-normal'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {!session?.user ? (<button onClick={() => navigate('/auth/signin')} className="px-6 py-1.5 max-sm:text-sm bg-indigo-600 active:scale-95 hover:bg-indigo-700 transition rounded">
              Get started
            </button>) : (
              <>
              <button className='bg-white/10 px-5 py-1.5 text-xs sm:text-sm border text-gray-200 rounded-full'>
                Credits: <span className='text-indigo-300'>{credits}</span>
              </button>
              <UserButton size='icon'/>
              </>
            )}
            <button id="open-menu" className="md:hidden active:scale-90 transition" onClick={() => setMenuOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/></svg>
            </button>
          </div>
    
        </nav>
        {/* Mobile Menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-[100] bg-black/60 text-white backdrop-blur flex flex-col items-center justify-center text-lg gap-8 md:hidden transition-transform duration-300">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`transition-all duration-200 ${
                  isActive(to)
                    ? 'text-white font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}

            <button className="active:ring-3 active:ring-white aspect-square size-10 p-1 items-center justify-center bg-slate-100 hover:bg-slate-200 transition text-black rounded-md flex" onClick={() => setMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        )}
        <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/refs/heads/main/assets/hero/bg-gradient-2.png" className="absolute inset-0 -z-10 size-full opacity" alt="" />
    </>
  )
}

export default Navbar
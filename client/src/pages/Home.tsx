import api from '@/configs/axios';
import { authClient } from '@/lib/auth-client';
import { Loader2Icon } from 'lucide-react';
import React, { useState } from 'react'
import { useNavigate } from 'react-router';
import { toast } from 'sonner';


const Home = () => {
   const {data: session} = authClient.useSession();
   const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('');
  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    try{
      if(!session?.user){
        return toast.error('Please sign in to create a project');
      } else if(!input.trim()){
        return toast.error('Please enter a message');
      } 
      setLoading(true);
      console.log('Create with AI request URL:', api.defaults.baseURL + '/api/user/project');
      const finalPrompt = selectedStyle
        ? `[Style: ${stylePresets.find(s => s.id === selectedStyle)?.label}] ${input}`
        : input;
      const {data} = await api.post('/api/user/project', {initial_prompt: finalPrompt});
      setLoading(false);
      navigate(`/projects/${data.projectId}`)
    }
    catch(error: any){
      setLoading(false);
      console.error('Create with AI error:', {
        url: api.defaults.baseURL + '/api/user/project',
        error,
        response: error?.response?.data,
      });
      toast.error(error?.response?.data?.message || error.message);
    }
  }

  const stylePresets = [
    { id: 'dark-luxe',     label: 'Dark & Luxe',      description: 'Dark backgrounds, gold accents, premium feel', emoji: '🌟' },
    { id: 'bold-agency',   label: 'Bold Agency',      description: 'Big typography, vibrant colors, creative layouts', emoji: '🎨' },
    { id: 'clean-saas',    label: 'Clean SaaS',       description: 'White space, indigo gradients, professional', emoji: '💼' },
    { id: 'minimalist',    label: 'Minimalist',       description: 'Black and white, typography-driven, elegant', emoji: '✨' },
    { id: 'neon-futuristic', label: 'Neon Future',    description: 'Dark theme, neon glows, futuristic tech feel', emoji: '🚀' },
    { id: 'warm-earthy',   label: 'Warm & Earthy',    description: 'Warm tones, organic shapes, natural feel', emoji: '🌿' },
  ]

  return (
      <section className="flex flex-col items-center text-white text-sm pb-20 px-4 font-poppins">
          {/* BACKGROUND IMAGE */}
          <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/refs/heads/main/assets/hero/bg-gradient-2.png" className="absolute inset-0 -z-10 size-full opacity" alt="" />

        <a href="https://prebuiltui.com" className="flex items-center gap-2 border border-slate-700 rounded-full p-1 pr-3 text-sm mt-20">
          <span className="bg-indigo-600 text-xs px-3 py-1 rounded-full">NEW</span>
          <p className="flex items-center gap-2">
            <span>Try 30 days free trial option</span>
            <svg className="mt-px" width="6" height="9" viewBox="0 0 6 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m1 1 4 3.5L1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </p>
        </a>

        <h1 className="text-center text-[40px] leading-[48px] md:text-6xl md:leading-[70px] mt-4 font-semibold max-w-3xl">
          Turn thoughts into websites instantly, with AI.
        </h1>

        <p className="text-center text-base max-w-md mt-2">
          Create, customize and publish stunning websites in minutes using AI-powered tools.
        </p>

        <div className="w-full max-w-2xl mt-8">
          <p className="text-gray-400 text-xs text-center mb-3">Choose a style preset</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {stylePresets.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setSelectedStyle(prev => prev === style.id ? '' : style.id)}
                title={style.description}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all duration-200
                  ${selectedStyle === style.id
                    ? 'border-indigo-500 bg-indigo-500/20 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30 hover:text-white'
                  }`}
              >
                <span className="text-lg">{style.emoji}</span>
                <span className="text-center leading-tight">{style.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={onSubmitHandler} className="bg-white/10 max-w-2xl w-full rounded-xl p-4 mt-10 border border-indigo-600/70 focus-within:ring-2 ring-indigo-500 transition-all">
          <textarea onChange={e => setInput(e.target.value)} className="bg-transparent outline-none text-gray-300 resize-none w-full" rows={4} placeholder="Describe your presentation in details" required />
          <button className="ml-auto flex items-center gap-2 bg-gradient-to-r from-[#CB52D4] to-indigo-600 rounded-md px-4 py-2">
            {!loading ? 'Create with AI' : (
              <>
              Creating <Loader2Icon className="animate-spin sizee-4 text-white" />
              </>
            )}
          </button>
          <p className="text-gray-400 text-xs mt-2">Generating your website costs 10 credits</p>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-16 md:gap-20 mx-auto mt-16">
          <img className="max-w-28 md:max-w-32" src="https://saasly.prebuiltui.com/assets/companies-logo/framer.svg" alt="" />
          <img className="max-w-28 md:max-w-32" src="https://saasly.prebuiltui.com/assets/companies-logo/huawei.svg" alt="" />
          <img className="max-w-28 md:max-w-32" src="https://saasly.prebuiltui.com/assets/companies-logo/instagram.svg" alt="" />
          <img className="max-w-28 md:max-w-32" src="https://saasly.prebuiltui.com/assets/companies-logo/microsoft.svg" alt="" />
          <img className="max-w-28 md:max-w-32" src="https://saasly.prebuiltui.com/assets/companies-logo/walmart.svg" alt="" />
        </div>
      </section>
  )
}

export default Home

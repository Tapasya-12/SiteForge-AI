import { useEffect, useState } from 'react'
import { appPlans } from '../assets/assets';
import Footer from '../components/Footer';
import axiosInstance from '../configs/axios';
import { toast } from 'sonner';
import { useSession } from '../lib/auth-client';
import { useNavigate } from 'react-router-dom';

interface Plan{
  id: string;
  name: string;
  price: number;
  credits: number;
  description: string;
  buttonText?: string;
  features: string[];
}

const Pricing = () => {
  const [plans] = useState<Plan[]>(appPlans)
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)
  const { data: session } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('cancelled') === 'true') {
      toast.info('Checkout cancelled. You have not been charged.')
    }
  }, [])

  const handlePurchase = async (plan: typeof appPlans[0]) => {
    if (!session?.user) {
      toast.error('Please sign in to purchase credits')
      navigate('/auth/signin')
      return
    }

    setLoadingPlanId(plan.id)

    try {
      const response = await axiosInstance.post('/api/payment/checkout', {
        planId: plan.id,
        credits: plan.credits,
        amount: plan.price,
        planName: plan.name,
      })

      if (response.data.url) {
        window.location.href = response.data.url
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || 'Failed to start checkout. Please try again.'
      )
    } finally {
      setLoadingPlanId(null)
    }
  }

  return (
    <>
      <div className='w-full max-w-5xl mx-auto z-20 max-md:px-4 min-h-[80vh]'>
        <div className='text-center mt-16'>
          <h2 className='text-gray-100 text-3xl font-medium'>Choose Your Plan</h2>
          <p className='text-gray-400 text-sm max-w-md mx-auto mt-2'>
            Start for free and scale up as you grow. Find the perfect plan for your content creation needs.</p>
        </div>
        <div className='pt-14 py-4 px-4 '>
                    <div className='grid grid-cols-1 md:grid-cols-3 flex-wrap gap-4'>
                        {plans.map((plan, idx) => (
                            <div key={idx} className="p-6 bg-black/20 ring ring-indigo-950 mx-auto w-full max-w-sm rounded-lg text-white shadow-lg hover:ring-indigo-500 transition-all duration-400">
                                <h3 className="text-xl font-bold">{plan.name}</h3>
                                <div className="my-2">
                                  <span className="text-4xl font-bold">${plan.price}</span>
                                    <span className="text-gray-300"> / {plan.credits} credits</span>
                                </div>

                                <p className="text-gray-300 mb-6">{plan.description}</p>

                                <ul className="space-y-1.5 mb-6 text-sm">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center">
                                            <svg className="h-5 w-5 text-indigo-300 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-gray-400">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                  onClick={() => handlePurchase(plan as any)}
                                  disabled={loadingPlanId === plan.id}
                                  className="w-full py-2 px-4 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 text-sm rounded-md transition-all"
                                >
                                  {loadingPlanId === plan.id ? 'Redirecting...' : plan.buttonText || 'Get Started'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <p className='mx-auto text-center text-sm max-w-md mt-10 text-white/60 font-light'>
                Start with <span className='text-white'>50 free credits</span>. Website creation costs <span className='text-white'>10 credits per website</span>, revisions cost <span className='text-white'>5 credits per revision</span>, and adding a page costs <span className='text-white'>10 credits per page</span>.</p>
      </div>
      <Footer />
    </>
  )
}

export default Pricing

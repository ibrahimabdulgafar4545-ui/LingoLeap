import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/common/AppLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PaystackButton } from 'react-paystack';
import { 
  Gem, 
  CreditCard, 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  AlertCircle, 
  Calendar, 
  User as UserIcon, 
  Lock, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

const GEM_PACKS = [
  {
    id: 'gems_500',
    name: 'Starter Pack',
    gems: 500,
    price: 4.99,
    popular: false,
    badge: 'Starter',
    bgGradient: 'from-amber-400 to-amber-600',
    color: 'text-amber-500'
  },
  {
    id: 'gems_1000',
    name: 'Popular Pack',
    gems: 1000,
    price: 8.99,
    popular: true,
    badge: 'Best Value',
    bgGradient: 'from-brand-purple to-indigo-600',
    color: 'text-brand-purple'
  },
  {
    id: 'gems_2500',
    name: 'Pro Learner Pack',
    gems: 2500,
    price: 19.99,
    popular: false,
    badge: 'Highly Popular',
    bgGradient: 'from-pink-500 to-rose-600',
    color: 'text-pink-500'
  },
  {
    id: 'gems_5000',
    name: 'Super Scholar Pack',
    gems: 5000,
    price: 34.99,
    popular: false,
    badge: 'Super Pack',
    bgGradient: 'from-emerald-400 to-teal-600',
    color: 'text-emerald-500'
  }
];

const Payments = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [selectedPack, setSelectedPack] = useState(GEM_PACKS[1]); // default to 1000 gems
  const [loading, setLoading] = useState(false);
  
  const handlePaystackSuccess = async (response) => {
    if (!selectedPack) return;
    setLoading(true);
    try {
      const payload = {
        packageId: selectedPack.id,
        reference: response.reference
      };

      const res = await api.post('/payments/purchase-gems', payload);
      if (res.data.success) {
        toast.success(`Success! Added ${selectedPack.gems} gems.`);
        
        // Update user state globally
        if (res.data.user && setUser) {
          setUser(res.data.user);
          localStorage.setItem('lingoleap_user', JSON.stringify(res.data.user));
        }

        // Redirect back to shop with success popup after a slight delay
        setTimeout(() => {
          navigate('/shop');
        }, 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment processing failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6 font-sans">
        {/* Back Link */}
        <button 
          onClick={() => navigate('/shop')} 
          className="flex items-center gap-2 text-brand-dark/60 hover:text-text-main font-extrabold text-xs sm:text-sm mb-6 transition"
        >
          <ArrowLeft size={16} /> Back to Shop
        </button>

        {/* Hero title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-text-main flex items-center gap-2 sm:gap-3">
            <Gem size={28} className="text-brand-purple animate-pulse" /> Buy Gems Pack
          </h1>
          <p className="text-brand-dark/50 font-semibold text-xs sm:text-sm mt-1 sm:mt-2">
            Unlock premium content, refill hearts instantly, and protect your hard-earned streak.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Packages Grid */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <h2 className="text-sm font-extrabold text-brand-dark/70 uppercase tracking-wider mb-1">
              Select Package Tier
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GEM_PACKS.map((pack) => {
                const isSelected = selectedPack?.id === pack.id;
                return (
                  <button
                    key={pack.id}
                    onClick={() => setSelectedPack(pack)}
                    className={`relative text-left bg-bg-card rounded-3xl p-5 border-2 transition-all flex flex-col justify-between h-44 shadow-sm hover:shadow-md cursor-pointer ${
                      isSelected 
                        ? 'border-brand-purple ring-2 ring-brand-purple/20 bg-brand-purple/5' 
                        : 'border-border dark:border-border'
                    }`}
                  >
                    {pack.popular && (
                      <span className="absolute -top-3 right-4 bg-brand-purple text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md animate-bounce">
                        {pack.badge}
                      </span>
                    )}
                    {!pack.popular && pack.badge && (
                      <span className="absolute -top-2.5 right-4 bg-brand-dark text-white text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full">
                        {pack.badge}
                      </span>
                    )}

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-extrabold text-brand-dark/40 uppercase tracking-wider">
                        {pack.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Gem size={20} className={pack.color} />
                        <span className="text-2xl font-black text-text-main">{pack.gems}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border dark:border-border w-full">
                      <span className="text-xl font-black text-text-main">${pack.price}</span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                        isSelected 
                          ? 'border-brand-purple bg-brand-purple text-white' 
                          : 'border-border dark:border-border'
                      }`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-bg-main dark:bg-bg-card p-4 rounded-2xl border-2 border-border dark:border-border flex gap-3 items-center mt-2">
              <ShieldCheck className="text-brand-green flex-shrink-0" size={20} />
              <p className="text-xs font-semibold text-brand-dark/70 leading-normal">
                Payment transactions are safely simulated. Real credit card details are never stored or sent to live credit processors.
              </p>
            </div>
          </div>

          {/* RIGHT: Paystack Checkout */}
          <div className="lg:col-span-5 bg-bg-card border-2 border-border dark:border-border rounded-3xl p-5 sm:p-6 shadow-3d-card flex flex-col justify-center">
            <h2 className="text-sm font-extrabold text-brand-dark/70 uppercase tracking-wider mb-4">
              Secure Checkout via Paystack
            </h2>

            <div className={`w-full aspect-[1.586/1] bg-gradient-to-br ${selectedPack?.bgGradient || 'from-brand-purple to-indigo-600'} text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between mb-6 transition-all duration-300 relative overflow-hidden`}>
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-bg-card/10 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-bg-card/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex justify-between items-start">
                <span className="text-xs font-black tracking-widest uppercase opacity-75">GEM PACKAGE</span>
                <Sparkles size={20} />
              </div>
              <div className="my-3 sm:my-4 flex items-center gap-2">
                <Gem size={28} className="text-white" />
                <span className="text-2xl sm:text-3xl font-black tracking-widest block">
                  {selectedPack?.gems || 0}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] sm:text-xs font-bold tracking-wide uppercase truncate max-w-[150px] block">
                    {user?.username || 'Learner'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs font-bold block bg-bg-card/20 px-2 py-0.5 rounded-full">
                    ${selectedPack?.price}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-bg-main/50 border border-border dark:border-border rounded-xl p-4 flex flex-col gap-2 mb-6">
              <div className="flex justify-between items-center text-sm font-extrabold text-text-main">
                <span>Total Amount:</span>
                <span>${selectedPack?.price}</span>
              </div>
              <p className="text-[10px] text-brand-dark/60 font-semibold leading-normal">
                You will be redirected to Paystack to complete your purchase securely. You can pay via Card, Bank Transfer, USSD, OPay, or PalmPay.
              </p>
            </div>

            {selectedPack && user && (
              <PaystackButton 
                className="w-full bg-brand-purple hover:bg-brand-purple/95 text-white py-3.5 sm:py-4 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 btn-3d shadow-3d-purple transition border-0 cursor-pointer"
                email={user.email}
                amount={Math.round(selectedPack.price * 1500 * 100)} // Approximate conversion to NGN for Kobo
                publicKey={import.meta.env.VITE_PAYSTACK_PUBLIC_KEY}
                text={`Pay $${selectedPack.price} with Paystack`}
                onSuccess={handlePaystackSuccess}
                onClose={() => toast.error('Payment window closed.')}
                reference={(new Date()).getTime().toString()}
              />
            )}
            
            <div className="flex items-center justify-center gap-1.5 text-brand-dark/40 mt-4">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-extrabold uppercase tracking-wide">Secured by Paystack</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Payments;

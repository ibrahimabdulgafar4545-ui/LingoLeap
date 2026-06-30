import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/common/AppLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Gem, ShoppingCart, Shield, Zap, Heart, Lightbulb, Trophy, RefreshCw, CheckCircle, Lock, Sparkles } from 'lucide-react';
import Button from '../components/common/Button';

const ITEM_ICONS = {
  streak_freeze: <span className="text-3xl">🧊</span>,
  xp_boost_2x: <span className="text-3xl">⚡</span>,
  heart_refill: <span className="text-3xl">❤️</span>,
  hint_pack: <span className="text-3xl">💡</span>,
  weekend_warrior: <span className="text-3xl">🏆</span>,
  bonus_gems_pack: <span className="text-3xl">💎</span>,
};

const CATEGORY_LABELS = {
  protection: { label: 'Protection', color: 'text-brand-blue', bg: 'bg-brand-blue/10', border: 'border-brand-blue/20' },
  boosts: { label: 'Boosts', color: 'text-brand-orange', bg: 'bg-brand-orange/10', border: 'border-brand-orange/20' },
  tools: { label: 'Tools', color: 'text-brand-purple', bg: 'bg-brand-purple/10', border: 'border-brand-purple/20' },
  special: { label: 'Special', color: 'text-brand-green', bg: 'bg-brand-green/10', border: 'border-brand-green/20' },
};

const Shop = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchShop = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shop');
      if (res.data.success) setShopData(res.data);
    } catch (err) {
      toast.error('Failed to load shop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, []);

  const handleBuy = async (item) => {
    const gems = shopData?.gems ?? 0;
    if (gems < item.price && item.price > 0) {
      toast.error(`Need ${item.price - gems} more gems!`);
      return;
    }

    const itemKey = item.itemId || item._id;
    try {
      const res = await api.post('/shop/buy', { itemId: itemKey });
      if (res.data.success) {
        setShopData(prev => ({
          ...prev,
          gems: res.data.gems,
          streakFreezes: res.data.streakFreezes,
          ownedItems: res.data.ownedItems
        }));
        // Update global user state so gem count reflects everywhere
        if (res.data.user && setUser) {
          setUser(res.data.user);
          localStorage.setItem('lingoleap_user', JSON.stringify(res.data.user));
        }
        toast.success(`${item.icon} ${item.name} purchased!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed.');
    }
  };

  const items = shopData?.items ?? [];
  const gems = shopData?.gems ?? 0;
  const ownedItems = shopData?.ownedItems ?? [];
  const streakFreezes = shopData?.streakFreezes ?? 0;

  const categories = ['all', ...new Set(items.map(i => i.category))];
  const visibleItems = activeCategory === 'all' ? items : items.filter(i => i.category === activeCategory);

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-text-main flex items-center gap-2">
            <ShoppingCart size={24} className="text-brand-purple sm:w-[28px] sm:h-[28px]" /> Shop
          </h1>
          <p className="text-brand-dark/50 font-semibold text-xs sm:text-sm mt-0.5 sm:mt-1">Spend your hard-earned gems on boosts & power-ups</p>
        </div>

        {/* Gem Balance */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-brand-purple/10 border-2 border-brand-purple/20 rounded-xl sm:rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2.5">
            <Gem size={16} className="text-brand-purple sm:w-[20px] sm:h-[20px]" />
            <span className="font-extrabold text-brand-purple text-sm sm:text-lg">{loading ? '—' : gems}</span>
            <span className="text-[10px] sm:text-xs font-bold text-brand-purple/60">gems</span>
          </div>
          {streakFreezes > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-brand-blue/10 border-2 border-brand-blue/20 rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-3 sm:py-2.5">
              <span className="text-sm sm:text-lg">🧊</span>
              <span className="font-extrabold text-brand-blue text-xs sm:text-sm">×{streakFreezes}</span>
            </div>
          )}
        </div>
      </div>

      {/* How to earn gems banner */}
      <div className="mb-5 sm:mb-6 bg-gradient-to-r from-brand-purple/10 to-brand-blue/10 border-2 border-brand-purple/20 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 flex gap-3 sm:gap-4 items-center">
        <Gem size={18} className="text-brand-purple flex-shrink-0" />
        <p className="text-[11px] sm:text-sm font-bold text-brand-dark/70 leading-normal">
          Earn <span className="text-brand-purple font-extrabold">5 gems</span> per lesson completed · 
          <span className="text-brand-purple font-extrabold"> 15 gems</span> for scoring 80%+ · 
          Spend gems here on power-ups!
        </p>
      </div>

      {/* Gems Purchase Package Banner */}
      <div className="mb-6 bg-gradient-to-r from-indigo-500 via-brand-purple to-pink-500 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-3d-purple border-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-xl bg-bg-card/20 flex items-center justify-center border border-white/30 flex-shrink-0 animate-pulse">
            <Gem size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base">Need More Gems?</h3>
            <p className="text-[10px] sm:text-xs font-semibold text-white/80 mt-0.5">Get 500, 1000, 2500, or 5000 Gems instantly using your Card!</p>
          </div>
        </div>
        <Button
          variant="custom"
          onClick={() => navigate('/buy-gems')}
          className="w-full sm:w-auto bg-bg-card text-brand-purple px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm hover:bg-brand-light transition duration-150 flex items-center justify-center gap-1.5 shadow-md border-0 shrink-0 cursor-pointer font-sans"
        >
          <Sparkles size={14} /> Buy Gems Pack
        </Button>
      </div>

      {/* Category filter tabs - horizontal scroll on mobile, flex wrap on desktop */}
      <div className="flex flex-row overflow-x-auto whitespace-nowrap gap-2 pb-2 mb-6 scrollbar-none snap-x md:flex-wrap md:pb-0">
        {categories.map(cat => {
          const meta = CATEGORY_LABELS[cat];
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`snap-center shrink-0 px-3.5 py-1.5 rounded-full text-xs font-extrabold border-2 transition-all capitalize ${
                isActive
                  ? 'bg-brand-purple text-white border-brand-purple'
                  : 'bg-bg-card text-brand-dark/60 border-border dark:border-border hover:border-brand-purple/40'
              }`}
            >
              {cat === 'all' ? 'All Items' : meta?.label || cat}
            </button>
          );
        })}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className={isMobile ? "flex flex-col gap-3" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"}>
          {[...Array(isMobile ? 4 : 6)].map((_, i) => (
            <div key={i} className={`skeleton rounded-3xl ${isMobile ? 'h-24' : 'h-48'}`} />
          ))}
        </div>
      )}

      {/* Shop items */}
      {!loading && (
        isMobile ? (
          /* Mobile List View */
          <div className="flex flex-col gap-3">
            {visibleItems.map(item => {
              const itemKey = item.itemId || item._id;
              const ownedCount = ownedItems.filter(id => id === itemKey).length;
              const isMaxed = ownedCount >= item.maxOwnable;
              const canAfford = gems >= item.price || item.price === 0;
              const catMeta = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.tools;

              return (
                <div
                  key={itemKey}
                  className={`bg-bg-card dark:bg-bg-card rounded-2xl border-2 p-3 flex items-center gap-3 shadow-sm transition-all ${
                    isMaxed ? 'border-brand-green/20 opacity-80' : 'border-border dark:border-border'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-light dark:bg-bg-main/20 flex items-center justify-center border border-border dark:border-border flex-shrink-0">
                    {ITEM_ICONS[itemKey] || <span className="text-2xl">{item.icon}</span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-extrabold text-text-main text-xs truncate">{item.name}</h3>
                      <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${catMeta.bg} ${catMeta.color} ${catMeta.border}`}>
                        {catMeta.label}
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-brand-dark/50 mt-0.5 leading-tight line-clamp-2">{item.description}</p>
                    {ownedCount > 0 && (
                      <p className="text-[9px] font-extrabold text-brand-green mt-1 flex items-center gap-0.5">
                        <CheckCircle size={10} /> Owned: {ownedCount}/{item.maxOwnable}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {isMaxed ? (
                      <span className="inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-brand-green/10 border border-brand-green/20 text-brand-green text-[10px] font-black">
                        Maxed
                      </span>
                    ) : (
                      <Button
                        variant="custom"
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford}
                        className={`flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-[11px] font-black btn-3d transition-all shrink-0 ${
                          canAfford
                            ? 'bg-brand-purple text-white shadow-3d-purple hover:opacity-90'
                            : 'bg-brand-gray/30 text-brand-dark/40 cursor-not-allowed'
                        }`}
                      >
                        <Gem size={11} />
                        <span>{item.price === 0 ? 'Free' : item.price}</span>
                        {!canAfford && <Lock size={9} />}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleItems.map(item => {
              const itemKey = item.itemId || item._id;
              const ownedCount = ownedItems.filter(id => id === itemKey).length;
              const isMaxed = ownedCount >= item.maxOwnable;
              const canAfford = gems >= item.price || item.price === 0;
              const catMeta = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.tools;
              

              return (
                <div
                  key={itemKey}
                  className={`bg-bg-card rounded-3xl border-2 p-5 flex flex-col gap-4 shadow-3d-card transition-all duration-200 ${
                    isMaxed ? 'border-brand-green/30 opacity-80' : 'border-border dark:border-border hover:-translate-y-0.5'
                  }`}
                >
                  {/* Top row: icon + category badge */}
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-brand-light flex items-center justify-center border-2 border-border dark:border-border">
                      {ITEM_ICONS[itemKey] || <span className="text-3xl">{item.icon}</span>}
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border-2 ${catMeta.bg} ${catMeta.color} ${catMeta.border}`}>
                      {catMeta.label}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-extrabold text-text-main text-base">{item.name}</h3>
                    <p className="text-xs font-semibold text-brand-dark/50 mt-1 leading-relaxed">{item.description}</p>
                    {ownedCount > 0 && (
                      <p className="text-xs font-bold text-brand-green mt-2 flex items-center gap-1">
                        <CheckCircle size={12} /> Owned: {ownedCount}/{item.maxOwnable}
                      </p>
                    )}
                  </div>
                  {/* Buy button */}
                  {isMaxed ? (
                    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-2xl bg-brand-green/10 border-2 border-brand-green/20 text-brand-green text-sm font-extrabold">
                      <CheckCircle size={16} /> Maxed Out
                    </div>
                  ) : (
                    <Button
                      variant="custom"
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-extrabold btn-3d transition-all ${
                        canAfford
                          ? 'bg-brand-purple text-white shadow-3d-purple hover:opacity-90'
                          : 'bg-brand-gray/30 text-brand-dark/40 cursor-not-allowed'
                      }`}
                    >
                      <Gem size={15} />
                      {item.price === 0 ? 'Claim Free' : `${item.price} gems`}
                      {!canAfford && <Lock size={13} />}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </AppLayout>
  );
};

export default Shop;

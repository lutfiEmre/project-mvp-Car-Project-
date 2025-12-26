'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Calculator, Car, CreditCard, Wallet, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useTranslations } from 'next-intl';

// Dynamic import for 3D viewer to avoid SSR issues
const CarViewer = dynamic(
  () => import('@/components/3d/car-viewer').then((mod) => mod.CarViewer),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }
);

const creditScoreRates: Record<string, { rate: number; label: string }> = {
  excellent: { rate: 5.99, label: 'Excellent (750+)' },
  good: { rate: 7.54, label: 'Good (670-749)' },
  fair: { rate: 11.99, label: 'Fair (580-669)' },
  poor: { rate: 18.99, label: 'Poor (300-579)' },
};

export function BuyingPower() {
  const router = useRouter();
  const t = useTranslations('home');
  const [lookingFor, setLookingFor] = useState('used');
  const [downPayment, setDownPayment] = useState(2500);
  const [creditScore, setCreditScore] = useState('good');
  const [monthlyPayment, setMonthlyPayment] = useState(500);
  const [includeTradeIn, setIncludeTradeIn] = useState(false);
  const [tradeInValue, setTradeInValue] = useState(5000);

  // Calculate buying power
  const buyingPower = useMemo(() => {
    const rate = creditScoreRates[creditScore]?.rate || 7.54;
    const monthlyRate = rate / 100 / 12;
    const term = 60; // 5 years
    
    // Present value of annuity formula
    const loanAmount = monthlyPayment * ((1 - Math.pow(1 + monthlyRate, -term)) / monthlyRate);
    
    let total = loanAmount + downPayment;
    if (includeTradeIn) {
      total += tradeInValue;
    }
    
    return Math.round(total);
  }, [downPayment, creditScore, monthlyPayment, includeTradeIn, tradeInValue]);

  const selectedRate = creditScoreRates[creditScore]?.rate || 7.54;

  const handleSeeMatches = () => {
    const params = new URLSearchParams();
    params.set('priceMax', buyingPower.toString());
    if (lookingFor === 'new') {
      params.set('condition', 'NEW');
    } else {
      params.set('condition', 'USED');
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="py-12 sm:py-20 bg-gradient-to-b sm:pt-8 from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-primary mb-3 sm:mb-4">
            <Calculator className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{t('buyingPowerTitle')}</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold">
            {t('buyingPowerTitle')}
          </h2>
          <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base text-muted-foreground px-4">
            {t('buyingPowerSubtitle')}
          </p>
        </motion.div>

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-2 items-center max-w-6xl mx-auto">
          {/* Left side - 3D Car (hidden on mobile, shown on lg+) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block h-[400px] w-[700px] lg:h-[500px] order-2 lg:order-1"
          >
            <CarViewer buyingPower={buyingPower} apr={selectedRate} />
          </motion.div>

          {/* Right side - Calculator Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl sm:rounded-3xl z-20 lg:ml-40 max-w-[80%] bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-xl order-1 lg:order-2"
          >
            <div className="space-y-3 sm:space-y-4">
              {/* Buying Power Result - TOP */}
              <div className="rounded-lg sm:rounded-xl bg-gradient-to-r from-primary to-primary/80 p-3 sm:p-4 text-white text-center">
                <div className="text-[10px] sm:text-xs opacity-90">{t('estBuyingPower')}</div>
                <div className="text-2xl sm:text-3xl font-bold">
                  ${buyingPower.toLocaleString()}
                </div>
                <div className="text-[10px] sm:text-xs opacity-80">
                  {t('basedOnApr', { apr: selectedRate })}
                </div>
              </div>

              {/* Two column grid for Looking for and Credit Score */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* Looking for */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
                    <Car className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                    {t('lookingFor')}
                  </Label>
                  <Select value={lookingFor} onValueChange={setLookingFor}>
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="used">{t('usedCar')}</SelectItem>
                      <SelectItem value="new">{t('newCar')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Credit Score */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
                    <CreditCard className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                    {t('creditScore')}
                  </Label>
                  <Select value={creditScore} onValueChange={setCreditScore}>
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(creditScoreRates).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Down Payment */}
              <div className="space-y-1">
                <Label className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
                  <Wallet className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                  {t('downPayment')}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm">$</span>
                  <Input
                    type="number"
                    value={downPayment}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                    className="h-9 sm:h-10 pl-6 sm:pl-7 text-sm"
                    min={0}
                    step={500}
                  />
                </div>
              </div>

              {/* Monthly Payment Slider */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
                    <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                    {t('monthlyPayment')}
                  </Label>
                  <span className="text-xs sm:text-sm font-bold text-primary">${monthlyPayment}</span>
                </div>
                <Slider
                  value={[monthlyPayment]}
                  onValueChange={([value]) => setMonthlyPayment(value)}
                  min={200}
                  max={2000}
                  step={50}
                  className="py-1.5 sm:py-2"
                />
                <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                  <span>$200</span>
                  <span>$2,000</span>
                </div>
              </div>

              {/* Trade-in Switch */}
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900 p-2.5 sm:p-3">
                <Label htmlFor="trade-in" className="cursor-pointer text-xs sm:text-sm">
                  {t('includeTrade')}
                </Label>
                <Switch
                  id="trade-in"
                  checked={includeTradeIn}
                  onCheckedChange={setIncludeTradeIn}
                />
              </div>

              {/* Trade-in Value */}
              {includeTradeIn && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <Label className="text-[10px] sm:text-xs">{t('tradeInValue')}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm">$</span>
                    <Input
                      type="number"
                      value={tradeInValue}
                      onChange={(e) => setTradeInValue(Number(e.target.value))}
                      className="h-9 sm:h-10 pl-6 sm:pl-7 text-sm"
                      min={0}
                      step={500}
                    />
                  </div>
                </motion.div>
              )}

              {/* CTA Button */}
              <Button
                size="lg"
                className="w-full h-10 sm:h-12 text-sm sm:text-base"
                onClick={handleSeeMatches}
              >
                {t('seeYourMatches')}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}


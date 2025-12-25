'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Car, Gauge, MapPin, Sparkles, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { useTranslations } from 'next-intl';

const makes = [
  'Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes-Benz', 'Audi',
  'Tesla', 'Chevrolet', 'Hyundai', 'Kia', 'Lexus', 'Porsche',
  'Nissan', 'Mazda', 'Subaru', 'Volkswagen', 'Jeep', 'Ram',
];

const conditions = [
  { value: 'Excellent', label: 'Excellent - Like new condition' },
  { value: 'Good', label: 'Good - Minor wear and tear' },
  { value: 'Fair', label: 'Fair - Some visible damage' },
  { value: 'Poor', label: 'Poor - Significant issues' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

interface ValuationResult {
  estimatedValue: number;
  lowRange: number;
  highRange: number;
  confidence: string;
  explanation: string;
  factors: string[];
  source: string;
}

export default function VehicleValuePage() {
  const t = useTranslations('vehicleValue');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [condition, setCondition] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/vehicle-value', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          make,
          model,
          year: parseInt(year),
          mileage: mileage ? parseInt(mileage.replace(/,/g, '')) : undefined,
          condition,
          postalCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get valuation');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <AnimatedBackground>
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white mb-4 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            <span>{t('aiPowered')}</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-3xl bg-white/95 dark:bg-slate-800/95 p-8 shadow-xl backdrop-blur-sm"
            >
              <h2 className="text-xl font-bold mb-6">{t('vehicleDetails')}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-primary" />
                      {t('make')}
                    </Label>
                    <Select value={make} onValueChange={setMake} required>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder={t('selectMake')} />
                      </SelectTrigger>
                      <SelectContent>
                        {makes.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('model')}</Label>
                    <Input
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder={t('modelPlaceholder')}
                      className="h-12"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('year')}</Label>
                    <Select value={year} onValueChange={setYear} required>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder={t('selectYear')} />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-primary" />
                      {t('mileage')}
                    </Label>
                    <Input
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                      placeholder={t('mileagePlaceholder')}
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('condition')}</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={t('selectCondition')} />
                    </SelectTrigger>
                    <SelectContent>
                    {conditions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.value === 'Excellent' ? t('excellent') :
                         c.value === 'Good' ? t('good') :
                         c.value === 'Fair' ? t('fair') :
                         c.value === 'Poor' ? t('poor') : c.label}
                      </SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {t('postalCode')}
                  </Label>
                  <Input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                    placeholder={t('postalCodePlaceholder')}
                    className="h-12"
                    maxLength={7}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 text-lg"
                  disabled={isLoading || !make || !model || !year}
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {t('calculating')}
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-2 h-5 w-5" />
                      {t('getEstimate')}
                    </>
                  )}
                </Button>
              </form>
            </motion.div>

            {/* Result */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col"
            >
              {result ? (
                <div className="rounded-3xl bg-white/95 dark:bg-slate-800/95 p-8 py-4 shadow-xl backdrop-blur-sm h-full">
                  <div className="text-center mb-6">
                    <h3 className="text-lg text-muted-foreground">{t('estimatedValue')}</h3>
                    <div className="text-5xl font-bold text-primary mt-2">
                      ${result.estimatedValue.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-3 text-sm">
                      <span className="flex items-center gap-1">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        ${result.lowRange.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">—</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        ${result.highRange.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-5 w-5 ${getConfidenceColor(result.confidence)}`} />
                      <span className="font-medium capitalize">{result.confidence} {t('confidence')}</span>
                    </div>

                    <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-4">
                      <p className="text-sm text-muted-foreground">{result.explanation}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">{t('factors')}</h4>
                      <ul className="space-y-2">
                        {result.factors.map((factor, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {result.source === 'ai' && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                        <Sparkles className="h-3 w-3" />
                        {t('poweredByAi')}
                      </div>
                    )}
                  </div>
                </div>
              ) : error ? (
                <div className="rounded-3xl bg-white/95 dark:bg-slate-800/95 p-8 py-4 shadow-xl backdrop-blur-sm h-full flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="font-bold text-lg mb-2">{t('error')}</h3>
                    <p className="text-muted-foreground">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl bg-white/95 dark:bg-slate-800/95 p-8 py-4 shadow-xl backdrop-blur-sm h-full flex items-center justify-center">
                  <div className="text-center">
                    <Calculator className="h-16 w-16 text-primary/30 mx-auto mb-4" />
                    <h3 className="font-bold text-lg mb-2">{t('getValuation')}</h3>
                    <p className="text-muted-foreground max-w-xs">
                      {t('fillForm')}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}


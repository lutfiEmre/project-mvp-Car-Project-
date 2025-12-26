'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, Percent, Calendar, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export function LoanCalculator() {
  const t = useTranslations('loanCalculator');
  const [price, setPrice] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('9.99');
  const [period, setPeriod] = useState<string>('84');
  const [downPayment, setDownPayment] = useState<string>('');
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalPayments, setTotalPayments] = useState<number>(0);

  const calculateLoan = () => {
    const principal = parseFloat(price) || 0;
    const down = parseFloat(downPayment) || 0;
    const rate = parseFloat(interestRate) || 0;
    const months = parseFloat(period) || 0;

    if (principal <= 0 || months <= 0) {
      setMonthlyPayment(0);
      setTotalInterest(0);
      setTotalPayments(0);
      return;
    }

    const loanAmount = principal - down;
    if (loanAmount <= 0) {
      setMonthlyPayment(0);
      setTotalInterest(0);
      setTotalPayments(0);
      return;
    }

    const monthlyRate = rate / 100 / 12;
    const monthlyPaymentCalc =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

    const totalPaymentsCalc = monthlyPaymentCalc * months;
    const totalInterestCalc = totalPaymentsCalc - loanAmount;

    setMonthlyPayment(monthlyPaymentCalc);
    setTotalInterest(totalInterestCalc);
    setTotalPayments(totalPaymentsCalc);
  };

  useEffect(() => {
    calculateLoan();
  }, [price, interestRate, period, downPayment]);

  const formatCurrency = (value: number) => {
    if (value === 0) return '-';
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <section className="relative py-20 min-h-screen">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/bgnew.png)' }} />
      <div className="absolute inset-0 bg-black/50" />
      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-4">
            <Calculator className="h-8 w-8 text-white" />
          </div>
          <h2 className="font-display text-3xl font-bold sm:text-4xl mb-4 text-white">
            {t('title')}
          </h2>
          <p className="mx-auto max-w-2xl text-white/80">
            {t('description')}
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Input Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {t('loanDetails')}
                  </CardTitle>
                  <CardDescription>
                    {t('enterInfo')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-semibold">
                      {t('price')} <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        placeholder="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="pl-10 text-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interest-rate" className="text-sm font-semibold">
                      {t('interestRate')} <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="interest-rate"
                        type="number"
                        step="0.01"
                        placeholder="9.99"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        className="pl-10 text-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="period" className="text-sm font-semibold">
                      {t('period')} <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="period"
                        type="number"
                        placeholder="84"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="pl-10 text-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="down-payment" className="text-sm font-semibold">
                      {t('downPayment')}
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="down-payment"
                        type="number"
                        placeholder="0"
                        value={downPayment}
                        onChange={(e) => setDownPayment(e.target.value)}
                        className="pl-10 text-lg"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Results */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {t('paymentSummary')}
                  </CardTitle>
                  <CardDescription>
                    {t('estimatedPayments')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="rounded-xl bg-background/80 p-6 border-2 border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {t('monthlyPayment')}
                        </span>
                      </div>
                      <motion.div
                        key={monthlyPayment}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-3xl font-bold text-primary"
                      >
                        {formatCurrency(monthlyPayment)}
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-background/80 p-4 border">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          {t('totalInterest')}
                        </div>
                        <motion.div
                          key={totalInterest}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="text-xl font-bold"
                        >
                          {formatCurrency(totalInterest)}
                        </motion.div>
                      </div>

                      <div className="rounded-xl bg-background/80 p-4 border">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          {t('totalPayments')}
                        </div>
                        <motion.div
                          key={totalPayments}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="text-xl font-bold"
                        >
                          {formatCurrency(totalPayments)}
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {monthlyPayment > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl bg-primary/10 p-4 border border-primary/20"
                    >
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">{t('loanAmount')}:</strong>{' '}
                        {formatCurrency((parseFloat(price) || 0) - (parseFloat(downPayment) || 0))}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong className="text-foreground">{t('term')}:</strong> {period} {t('months')} ({Math.round(parseFloat(period) / 12)} {t('years')})
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}


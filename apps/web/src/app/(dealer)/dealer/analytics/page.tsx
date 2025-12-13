'use client';

import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MessageSquare, 
  DollarSign,
  Car,
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const stats = [
  { label: 'Total Views', value: '12,458', change: '+12.5%', trend: 'up', icon: Eye },
  { label: 'Inquiries', value: '234', change: '+8.2%', trend: 'up', icon: MessageSquare },
  { label: 'Vehicles Sold', value: '18', change: '+15%', trend: 'up', icon: Car },
  { label: 'Revenue', value: '$892,500', change: '-3.1%', trend: 'down', icon: DollarSign },
];

const topPerformers = [
  { title: '2024 BMW M4 Competition', views: 1234, inquiries: 45, price: 89900 },
  { title: '2023 Mercedes-Benz C300', views: 987, inquiries: 32, price: 62500 },
  { title: '2024 Audi Q7 Premium', views: 876, inquiries: 28, price: 72900 },
  { title: '2023 Porsche Cayenne', views: 654, inquiries: 21, price: 85000 },
];

export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track your dealership performance
          </p>
        </div>
        <Select defaultValue="30">
          <SelectTrigger className="w-[180px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl border bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {stat.change}
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border bg-card p-6"
        >
          <h3 className="font-semibold mb-4">Views Over Time</h3>
          <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">Chart visualization</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border bg-card p-6"
        >
          <h3 className="font-semibold mb-4">Inquiries by Source</h3>
          <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">Chart visualization</p>
          </div>
        </motion.div>
      </div>

      {/* Top Performers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl border bg-card"
      >
        <div className="p-6 border-b">
          <h3 className="font-semibold">Top Performing Listings</h3>
        </div>
        <div className="divide-y">
          {topPerformers.map((vehicle, index) => (
            <div key={index} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="h-12 w-16 rounded-lg overflow-hidden bg-slate-100">
                <img
                  src={'/placeholder-car.jpg'}
                  alt={vehicle.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/placeholder-car.jpg') {
                      target.src = '/placeholder-car.jpg';
                    }
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{vehicle.title}</p>
                <p className="text-sm text-muted-foreground">
                  ${vehicle.price.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">
                  <Eye className="inline h-4 w-4 mr-1 text-muted-foreground" />
                  {vehicle.views}
                </p>
                <p className="text-sm">
                  <MessageSquare className="inline h-4 w-4 mr-1 text-muted-foreground" />
                  {vehicle.inquiries}
                </p>
              </div>
              <Button variant="ghost" size="icon">
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}


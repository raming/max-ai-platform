'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import {
  getDashboardStats,
  getActivityFeed,
  formatNumber,
  formatCurrency,
  formatPercentage
} from '@/lib/services/mock-dashboard';
import { DashboardSkeleton } from '@/components/dashboard/loading-skeletons';
import { Users, DollarSign, TrendingUp, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => getActivityFeed(8),
  });

  if (statsLoading || activitiesLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your platform.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats ? formatNumber(stats.totalUsers) : '0'}
          description="Registered users"
          trend={stats ? { value: 12.5, isPositive: true } : undefined}
        />
        <StatsCard
          title="Active Users"
          value={stats ? formatNumber(stats.activeUsers) : '0'}
          description="Active this month"
          trend={stats ? { value: 8.2, isPositive: true } : undefined}
        />
        <StatsCard
          title="Total Revenue"
          value={stats ? formatCurrency(stats.totalRevenue) : '$0'}
          description="Monthly recurring"
          trend={stats ? { value: 15.3, isPositive: true } : undefined}
        />
        <StatsCard
          title="Conversion Rate"
          value={stats ? formatPercentage(stats.conversionRate) : '0%'}
          description="From free to paid"
          trend={stats ? { value: 2.1, isPositive: true } : undefined}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Activity Feed - Takes up 2 columns on large screens */}
        <div className="lg:col-span-2">
          <ActivityFeed
            activities={activities || []}
            className="h-fit"
          />
        </div>

        {/* Additional Stats or Quick Actions */}
        <div className="space-y-4">
          <StatsCard
            title="Avg. Session Duration"
            value={stats ? `${Math.floor(stats.avgSessionDuration / 60)}m ${stats.avgSessionDuration % 60}s` : '0s'}
            description="Time spent per session"
          />

          <StatsCard
            title="Monthly Growth"
            value={stats ? formatPercentage(stats.monthlyGrowth) : '0%'}
            description="Month over month"
            trend={stats ? { value: stats.monthlyGrowth, isPositive: stats.monthlyGrowth > 0 } : undefined}
          />
        </div>
      </div>
    </div>
  );
}
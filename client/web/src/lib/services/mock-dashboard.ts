// Mock dashboard data service
// Provides realistic mock data for dashboard components and analytics

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyGrowth: number;
  conversionRate: number;
  avgSessionDuration: number;
}

export interface ActivityItem {
  id: string;
  type: 'user_signup' | 'purchase' | 'feature_usage' | 'system_event';
  title: string;
  description: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsData {
  userGrowth: ChartDataPoint[];
  revenue: ChartDataPoint[];
  engagement: ChartDataPoint[];
  conversion: ChartDataPoint[];
}

// Mock data generators
const generateRandomGrowth = (base: number, variance: number = 0.1): number => {
  return base + (Math.random() - 0.5) * variance * base;
};

const generateDateRange = (days: number): string[] => {
  const dates: string[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
};

const generateChartData = (days: number, baseValue: number, trend: 'up' | 'down' | 'stable' = 'up'): ChartDataPoint[] => {
  const dates = generateDateRange(days);
  let currentValue = baseValue;

  return dates.map((date, index) => {
    if (trend === 'up') {
      currentValue = generateRandomGrowth(currentValue, 0.05);
    } else if (trend === 'down') {
      currentValue = generateRandomGrowth(currentValue, -0.05);
    } else {
      currentValue = generateRandomGrowth(currentValue, 0.02);
    }

    return {
      date,
      value: Math.round(currentValue),
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });
};

// Mock dashboard stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    totalUsers: 12453,
    activeUsers: 8921,
    totalRevenue: 456789,
    monthlyGrowth: 12.5,
    conversionRate: 3.2,
    avgSessionDuration: 245 // seconds
  };
};

// Mock activity feed
export const getActivityFeed = async (limit: number = 10): Promise<ActivityItem[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'user_signup',
      title: 'New user registered',
      description: 'Sarah Johnson joined the platform',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      userId: 'user_123',
      metadata: { source: 'organic', plan: 'free' }
    },
    {
      id: '2',
      type: 'purchase',
      title: 'Premium subscription purchased',
      description: 'Mike Chen upgraded to Pro plan',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      userId: 'user_456',
      metadata: { amount: 29.99, plan: 'pro' }
    },
    {
      id: '3',
      type: 'feature_usage',
      title: 'Advanced analytics accessed',
      description: 'Emma Davis viewed detailed analytics dashboard',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      userId: 'user_789',
      metadata: { feature: 'analytics', duration: 120 }
    },
    {
      id: '4',
      type: 'system_event',
      title: 'System maintenance completed',
      description: 'Scheduled maintenance window closed successfully',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      metadata: { duration: 15, status: 'success' }
    },
    {
      id: '5',
      type: 'user_signup',
      title: 'New user registered',
      description: 'Alex Rodriguez joined the platform',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      userId: 'user_101',
      metadata: { source: 'referral', plan: 'free' }
    },
    {
      id: '6',
      type: 'purchase',
      title: 'Team plan purchased',
      description: 'TechCorp Inc upgraded to Team plan',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      userId: 'user_202',
      metadata: { amount: 99.99, plan: 'team', seats: 5 }
    },
    {
      id: '7',
      type: 'feature_usage',
      title: 'API integration configured',
      description: 'DevTeam configured webhook integrations',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      userId: 'user_303',
      metadata: { feature: 'integrations', type: 'webhook' }
    },
    {
      id: '8',
      type: 'user_signup',
      title: 'New user registered',
      description: 'Lisa Wang joined the platform',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      userId: 'user_404',
      metadata: { source: 'social', plan: 'free' }
    },
    {
      id: '9',
      type: 'system_event',
      title: 'Backup completed',
      description: 'Daily automated backup finished successfully',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      metadata: { size: '2.3GB', status: 'success' }
    },
    {
      id: '10',
      type: 'purchase',
      title: 'Enterprise plan purchased',
      description: 'GlobalTech Ltd upgraded to Enterprise plan',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
      userId: 'user_505',
      metadata: { amount: 299.99, plan: 'enterprise', seats: 25 }
    }
  ];

  return activities.slice(0, limit);
};

// Mock analytics data
export const getAnalyticsData = async (timeframe: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;

  return {
    userGrowth: generateChartData(days, 12000, 'up'),
    revenue: generateChartData(days, 400000, 'up'),
    engagement: generateChartData(days, 200, 'stable'),
    conversion: generateChartData(days, 3.0, 'up')
  };
};

// Utility functions for formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};
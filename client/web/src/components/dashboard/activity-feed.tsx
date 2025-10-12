import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityItem, getRelativeTime } from '@/lib/services/mock-dashboard';
import { User, ShoppingCart, Activity, AlertCircle } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
}

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'user_signup':
      return User;
    case 'purchase':
      return ShoppingCart;
    case 'feature_usage':
      return Activity;
    case 'system_event':
      return AlertCircle;
    default:
      return Activity;
  }
};

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'user_signup':
      return 'text-blue-600';
    case 'purchase':
      return 'text-green-600';
    case 'feature_usage':
      return 'text-purple-600';
    case 'system_event':
      return 'text-orange-600';
    default:
      return 'text-gray-600';
  }
};

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No recent activity
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const iconColor = getActivityColor(activity.type);

            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full bg-gray-100 ${iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
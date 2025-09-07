import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Target, TrendingUp, Star, Clock } from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';

interface ClassAttendanceMetricCardsProps {
  data: SessionData[];
}

export const ClassAttendanceMetricCards: React.FC<ClassAttendanceMetricCardsProps> = ({ data }) => {
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return null;

    const totalSessions = data.length;
    const totalAttendance = data.reduce((sum, session) => sum + (session.checkedInCount || 0), 0);
    const totalCapacity = data.reduce((sum, session) => sum + (session.capacity || 0), 0);
    const totalRevenue = data.reduce((sum, session) => sum + (session.revenue || session.totalPaid || 0), 0);
    const uniqueClasses = [...new Set(data.map(session => session.cleanedClass || session.classType).filter(Boolean))].length;
    const uniqueTrainers = [...new Set(data.map(session => session.trainerName).filter(Boolean))].length;
    
    const avgAttendance = totalSessions > 0 ? (totalAttendance / totalSessions) : 0;
    const fillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
    const avgRevenue = totalSessions > 0 ? (totalRevenue / totalSessions) : 0;

    // Find best performing class by average attendance
    const classPerformance = data.reduce((acc, session) => {
      const className = session.cleanedClass || session.classType || 'Unknown';
      if (!acc[className]) {
        acc[className] = { totalAttendance: 0, sessionCount: 0 };
      }
      acc[className].totalAttendance += session.checkedInCount || 0;
      acc[className].sessionCount += 1;
      return acc;
    }, {} as Record<string, { totalAttendance: number; sessionCount: number }>);

    const bestClass = Object.entries(classPerformance)
      .map(([name, stats]) => ({
        name,
        avgAttendance: stats.totalAttendance / stats.sessionCount
      }))
      .sort((a, b) => b.avgAttendance - a.avgAttendance)[0];

    return {
      totalSessions,
      totalAttendance,
      avgAttendance,
      fillRate,
      avgRevenue,
      uniqueClasses,
      uniqueTrainers,
      bestClass
    };
  }, [data]);

  if (!metrics) return null;

  const cards = [
    {
      title: 'Total Sessions',
      value: metrics.totalSessions.toLocaleString(),
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Total class sessions'
    },
    {
      title: 'Total Attendance',
      value: metrics.totalAttendance.toLocaleString(),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Total participants'
    },
    {
      title: 'Average Attendance',
      value: metrics.avgAttendance.toFixed(1),
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Per session average'
    },
    {
      title: 'Fill Rate',
      value: `${metrics.fillRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Capacity utilization'
    },
    {
      title: 'Class Formats',
      value: metrics.uniqueClasses.toString(),
      icon: Star,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Unique class types'
    },
    {
      title: 'Top Performing Class',
      value: metrics.bestClass?.name || 'N/A',
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: `Avg: ${metrics.bestClass?.avgAttendance?.toFixed(1) || '0.0'} attendees`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <Badge variant="secondary" className="text-xs">
                Live Data
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-600">{card.title}</h3>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              <p className="text-xs text-slate-500">{card.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
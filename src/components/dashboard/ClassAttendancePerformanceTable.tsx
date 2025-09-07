import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, TrendingUp, Target, Users, Calendar, DollarSign, Activity, Zap } from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatters';

interface ClassAttendancePerformanceTableProps {
  data: SessionData[];
}

export const ClassAttendancePerformanceTable: React.FC<ClassAttendancePerformanceTableProps> = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState('fillRate');

  const performanceData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const formatStats = data.reduce((acc, session) => {
      const format = session.cleanedClass || session.classType || 'Unknown';
      if (!acc[format]) {
        acc[format] = {
          format,
          totalSessions: 0,
          totalCapacity: 0,
          totalCheckedIn: 0,
          totalRevenue: 0,
          totalBooked: 0,
          totalLateCancelled: 0,
          emptySessions: 0,
          revenueGeneratingSessions: 0
        };
      }
      
      acc[format].totalSessions += 1;
      acc[format].totalCapacity += session.capacity || 0;
      acc[format].totalCheckedIn += session.checkedInCount || 0;
      acc[format].totalRevenue += session.totalPaid || 0;
      acc[format].totalBooked += session.bookedCount || 0;
      acc[format].totalLateCancelled += session.lateCancelledCount || 0;
      
      if ((session.checkedInCount || 0) === 0) acc[format].emptySessions += 1;
      if ((session.totalPaid || 0) > 0) acc[format].revenueGeneratingSessions += 1;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(formatStats).map((stat: any) => ({
      ...stat,
      fillRate: stat.totalCapacity > 0 ? (stat.totalCheckedIn / stat.totalCapacity) * 100 : 0,
      showUpRate: stat.totalBooked > 0 ? (stat.totalCheckedIn / stat.totalBooked) * 100 : 0,
      utilizationRate: stat.totalSessions > 0 ? ((stat.totalSessions - stat.emptySessions) / stat.totalSessions) * 100 : 0,
      avgRevenue: stat.totalSessions > 0 ? stat.totalRevenue / stat.totalSessions : 0,
      revenuePerAttendee: stat.totalCheckedIn > 0 ? stat.totalRevenue / stat.totalCheckedIn : 0,
      efficiency: stat.totalCapacity > 0 ? (stat.totalRevenue / stat.totalCapacity) : 0,
      cancellationRate: stat.totalBooked > 0 ? (stat.totalLateCancelled / stat.totalBooked) * 100 : 0,
      revenueEfficiency: stat.totalSessions > 0 ? (stat.revenueGeneratingSessions / stat.totalSessions) * 100 : 0
    })).sort((a, b) => b.totalSessions - a.totalSessions);
  }, [data]);

  const metrics = [
    { id: 'fillRate', label: 'Fill Rate', icon: Target, color: 'blue' },
    { id: 'showUpRate', label: 'Show-up Rate', icon: Users, color: 'green' },
    { id: 'utilizationRate', label: 'Utilization', icon: Activity, color: 'purple' },
    { id: 'avgRevenue', label: 'Avg Revenue', icon: DollarSign, color: 'orange' },
    { id: 'efficiency', label: 'Revenue Efficiency', icon: TrendingUp, color: 'indigo' },
    { id: 'cancellationRate', label: 'Cancellation Rate', icon: Calendar, color: 'red' },
    { id: 'revenueEfficiency', label: 'Revenue Sessions %', icon: Zap, color: 'pink' },
    { id: 'revenuePerAttendee', label: 'Revenue per Attendee', icon: BarChart3, color: 'teal' }
  ];

  const getMetricValue = (row: any, metricId: string) => {
    const value = row[metricId];
    switch (metricId) {
      case 'avgRevenue':
      case 'revenuePerAttendee':
      case 'efficiency':
        return formatCurrency(value);
      case 'fillRate':
      case 'showUpRate':
      case 'utilizationRate':
      case 'cancellationRate':
      case 'revenueEfficiency':
        return formatPercentage(value);
      default:
        return formatNumber(value);
    }
  };

  const getMetricBadgeColor = (value: number, metricId: string) => {
    if (metricId === 'cancellationRate') {
      if (value <= 10) return 'bg-green-100 text-green-800';
      if (value <= 20) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    } else {
      if (value >= 80) return 'bg-green-100 text-green-800';
      if (value >= 60) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Class Format Performance Analysis
            <Badge variant="outline" className="text-blue-600">
              {performanceData.length} formats
            </Badge>
          </CardTitle>
        </div>
        
        {/* Metric Selector */}
        <div className="flex flex-wrap gap-2 mt-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Button
                key={metric.id}
                variant={selectedMetric === metric.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric(metric.id)}
                className="gap-1 text-xs"
              >
                <Icon className="w-3 h-3" />
                {metric.label}
              </Button>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">Class Format</TableHead>
                <TableHead className="text-center font-semibold text-gray-900">Sessions</TableHead>
                <TableHead className="text-center font-semibold text-gray-900">Capacity</TableHead>
                <TableHead className="text-center font-semibold text-gray-900">Attendance</TableHead>
                <TableHead className="text-center font-semibold text-gray-900">Revenue</TableHead>
                <TableHead className="text-center font-semibold text-gray-900">{metrics.find(m => m.id === selectedMetric)?.label}</TableHead>
                <TableHead className="text-center font-semibold text-gray-900">Empty Sessions</TableHead>
                <TableHead className="text-center font-semibold text-gray-900">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceData.map((row, index) => (
                <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium sticky left-0 bg-white z-10 border-r">
                    <div className="flex flex-col">
                      <span className="text-gray-900">{row.format}</span>
                      <span className="text-xs text-gray-500">
                        {formatPercentage(row.utilizationRate)} utilized
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col">
                      <span className="font-medium">{formatNumber(row.totalSessions)}</span>
                      <span className="text-xs text-gray-500">total</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col">
                      <span className="font-medium">{formatNumber(row.totalCapacity)}</span>
                      <span className="text-xs text-gray-500">capacity</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col">
                      <span className="font-medium">{formatNumber(row.totalCheckedIn)}</span>
                      <span className="text-xs text-gray-500">checked in</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col">
                      <span className="font-medium">{formatCurrency(row.totalRevenue)}</span>
                      <span className="text-xs text-gray-500">{formatCurrency(row.avgRevenue)} avg</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getMetricBadgeColor(row[selectedMetric], selectedMetric)}>
                      {getMetricValue(row, selectedMetric)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col">
                      <span className="font-medium text-red-600">{formatNumber(row.emptySessions)}</span>
                      <span className="text-xs text-gray-500">empty</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="text-xs">
                        {formatPercentage(row.fillRate)} fill
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {formatPercentage(row.showUpRate)} show-up
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, Clock, Users, Target, Zap, AlertTriangle, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';
import { formatNumber, formatPercentage } from '@/utils/formatters';

interface ClassAttendanceUtilizationTableProps {
  data: SessionData[];
}

export const ClassAttendanceUtilizationTable: React.FC<ClassAttendanceUtilizationTableProps> = ({ data }) => {
  const [selectedView, setSelectedView] = useState('timeSlot');

  const utilizationData = useMemo(() => {
    if (!data || data.length === 0) return { timeSlot: [], dayOfWeek: [], trainer: [] };

    // Time slot utilization
    const timeSlotStats = data.reduce((acc, session) => {
      const timeSlot = session.time || 'Unknown';
      if (!acc[timeSlot]) {
        acc[timeSlot] = {
          timeSlot,
          totalSessions: 0,
          totalCapacity: 0,
          totalAttendance: 0,
          emptySessions: 0,
          lowAttendanceSessions: 0,
          fullSessions: 0,
          formats: new Set()
        };
      }
      
      acc[timeSlot].totalSessions += 1;
      acc[timeSlot].totalCapacity += session.capacity || 0;
      acc[timeSlot].totalAttendance += session.checkedInCount || 0;
      acc[timeSlot].formats.add(session.cleanedClass || session.classType);
      
      const attendance = session.checkedInCount || 0;
      const capacity = session.capacity || 0;
      
      if (attendance === 0) acc[timeSlot].emptySessions += 1;
      else if (capacity > 0 && (attendance / capacity) < 0.5) acc[timeSlot].lowAttendanceSessions += 1;
      else if (capacity > 0 && (attendance / capacity) >= 0.9) acc[timeSlot].fullSessions += 1;
      
      return acc;
    }, {} as Record<string, any>);

    const timeSlotData = Object.values(timeSlotStats).map((stat: any) => ({
      ...stat,
      formatCount: stat.formats.size,
      fillRate: stat.totalCapacity > 0 ? (stat.totalAttendance / stat.totalCapacity) * 100 : 0,
      utilizationRate: stat.totalSessions > 0 ? ((stat.totalSessions - stat.emptySessions) / stat.totalSessions) * 100 : 0,
      avgAttendance: stat.totalSessions > 0 ? stat.totalAttendance / stat.totalSessions : 0,
      efficiency: stat.totalSessions > 0 ? stat.fullSessions / stat.totalSessions * 100 : 0
    })).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    // Day of week utilization
    const dayStats = data.reduce((acc, session) => {
      const day = session.dayOfWeek || 'Unknown';
      if (!acc[day]) {
        acc[day] = {
          day,
          totalSessions: 0,
          totalCapacity: 0,
          totalAttendance: 0,
          emptySessions: 0,
          lowAttendanceSessions: 0,
          fullSessions: 0,
          formats: new Set()
        };
      }
      
      acc[day].totalSessions += 1;
      acc[day].totalCapacity += session.capacity || 0;
      acc[day].totalAttendance += session.checkedInCount || 0;
      acc[day].formats.add(session.cleanedClass || session.classType);
      
      const attendance = session.checkedInCount || 0;
      const capacity = session.capacity || 0;
      
      if (attendance === 0) acc[day].emptySessions += 1;
      else if (capacity > 0 && (attendance / capacity) < 0.5) acc[day].lowAttendanceSessions += 1;
      else if (capacity > 0 && (attendance / capacity) >= 0.9) acc[day].fullSessions += 1;
      
      return acc;
    }, {} as Record<string, any>);

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayOfWeekData = Object.values(dayStats).map((stat: any) => ({
      ...stat,
      formatCount: stat.formats.size,
      fillRate: stat.totalCapacity > 0 ? (stat.totalAttendance / stat.totalCapacity) * 100 : 0,
      utilizationRate: stat.totalSessions > 0 ? ((stat.totalSessions - stat.emptySessions) / stat.totalSessions) * 100 : 0,
      avgAttendance: stat.totalSessions > 0 ? stat.totalAttendance / stat.totalSessions : 0,
      efficiency: stat.totalSessions > 0 ? stat.fullSessions / stat.totalSessions * 100 : 0
    })).sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

    // Trainer utilization
    const trainerStats = data.reduce((acc, session) => {
      const trainer = session.trainerName || 'Unknown';
      if (!acc[trainer]) {
        acc[trainer] = {
          trainer,
          totalSessions: 0,
          totalCapacity: 0,
          totalAttendance: 0,
          emptySessions: 0,
          lowAttendanceSessions: 0,
          fullSessions: 0,
          formats: new Set()
        };
      }
      
      acc[trainer].totalSessions += 1;
      acc[trainer].totalCapacity += session.capacity || 0;
      acc[trainer].totalAttendance += session.checkedInCount || 0;
      acc[trainer].formats.add(session.cleanedClass || session.classType);
      
      const attendance = session.checkedInCount || 0;
      const capacity = session.capacity || 0;
      
      if (attendance === 0) acc[trainer].emptySessions += 1;
      else if (capacity > 0 && (attendance / capacity) < 0.5) acc[trainer].lowAttendanceSessions += 1;
      else if (capacity > 0 && (attendance / capacity) >= 0.9) acc[trainer].fullSessions += 1;
      
      return acc;
    }, {} as Record<string, any>);

    const trainerData = Object.values(trainerStats).map((stat: any) => ({
      ...stat,
      formatCount: stat.formats.size,
      fillRate: stat.totalCapacity > 0 ? (stat.totalAttendance / stat.totalCapacity) * 100 : 0,
      utilizationRate: stat.totalSessions > 0 ? ((stat.totalSessions - stat.emptySessions) / stat.totalSessions) * 100 : 0,
      avgAttendance: stat.totalSessions > 0 ? stat.totalAttendance / stat.totalSessions : 0,
      efficiency: stat.totalSessions > 0 ? stat.fullSessions / stat.totalSessions * 100 : 0
    })).sort((a, b) => b.totalSessions - a.totalSessions);

    return {
      timeSlot: timeSlotData,
      dayOfWeek: dayOfWeekData,
      trainer: trainerData
    };
  }, [data]);

  const views = [
    { id: 'timeSlot', label: 'By Time Slot', icon: Clock, key: 'timeSlot' },
    { id: 'dayOfWeek', label: 'By Day', icon: Calendar, key: 'day' },
    { id: 'trainer', label: 'By Trainer', icon: Users, key: 'trainer' }
  ];

  const getUtilizationBadge = (rate: number) => {
    if (rate >= 90) return { color: 'bg-green-100 text-green-800', icon: CheckCircle };
    if (rate >= 70) return { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    return { color: 'bg-red-100 text-red-800', icon: XCircle };
  };

  const currentData = utilizationData[selectedView as keyof typeof utilizationData] || [];
  const currentKey = views.find(v => v.id === selectedView)?.key || 'timeSlot';

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            Utilization Analysis
            <Badge variant="outline" className="text-indigo-600">
              {currentData.length} items
            </Badge>
          </CardTitle>
        </div>
        
        {/* View Selector */}
        <div className="flex flex-wrap gap-2 mt-4">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <Button
                key={view.id}
                variant={selectedView === view.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView(view.id)}
                className="gap-1 text-xs"
              >
                <Icon className="w-3 h-3" />
                {view.label}
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
                <TableHead className="font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                  {views.find(v => v.id === selectedView)?.label.replace('By ', '')}
                </TableHead>
                <TableHead className="text-center font-semibold text-gray-900">Sessions</TableHead>
                <TableHead className="text-center font-semibold text-gray-900">Avg Attendance</TableHead>
                <TableHead className="text-center font-semibold text-gray-900">Fill Rate</TableHead>
                <TableHead className="text-center font-semibold text-gray-900">Utilization</TableHead>
                <TableHead className="text-center font-semibold text-gray-900">Performance</TableHead>
                <TableHead className="text-center font-semibold text-gray-900">Session Types</TableHead>
                <TableHead className="text-center font-semibold text-gray-900">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((row: any, index) => {
                const utilizationBadge = getUtilizationBadge(row.utilizationRate);
                const StatusIcon = utilizationBadge.icon;
                
                return (
                  <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium sticky left-0 bg-white z-10 border-r">
                      <div className="flex flex-col">
                        <span className="text-gray-900">{row[currentKey]}</span>
                        <span className="text-xs text-gray-500">
                          {row.formatCount} formats
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col">
                        <span className="font-medium">{formatNumber(row.totalSessions)}</span>
                        <span className="text-xs text-gray-500">
                          {formatNumber(row.totalCapacity)} capacity
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col">
                        <span className="font-medium">{formatNumber(row.avgAttendance)}</span>
                        <span className="text-xs text-gray-500">
                          per session
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        className={
                          row.fillRate >= 80 ? 'bg-green-100 text-green-800' :
                          row.fillRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {formatPercentage(row.fillRate)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={utilizationBadge.color}>
                        {formatPercentage(row.utilizationRate)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span className="text-xs">{row.fullSessions} full</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-yellow-600" />
                          <span className="text-xs">{row.lowAttendanceSessions} low</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <XCircle className="w-3 h-3 text-red-600" />
                          <span className="text-xs">{row.emptySessions} empty</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col">
                        <span className="font-medium">{row.formatCount}</span>
                        <span className="text-xs text-gray-500">active</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <StatusIcon className="w-5 h-5" />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
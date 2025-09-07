import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ModernDataTable } from '@/components/ui/ModernDataTable';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp, 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Edit3, 
  Save, 
  X,
  BarChart3,
  Users,
  Calendar,
  Percent
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';

interface ClassPerformanceData {
  uniqueId: string;
  className: string;
  sessionCount: number;
  totalCheckIns: number;
  totalCapacity: number;
  avgCheckIns: number;
  avgCheckInsWithEmpty: number;
  avgCheckInsWithoutEmpty: number;
  fillPercentage: number;
  fillPercentageWithEmpty: number;
  fillPercentageWithoutEmpty: number;
  totalRevenue: number;
  avgRevenue: number;
  sessionsWithCheckIns: number;
  emptySessions: number;
  rank: number;
  rankWithoutEmpty: number;
  individualSessions: SessionData[];
}

interface ClassPerformanceRankingTableProps {
  data: SessionData[];
}

const useLocalStorage = (key: string, initialValue: string) => {
  const [storedValue, setStoredValue] = useState<string>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value: string) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
};

export const ClassPerformanceRankingTable: React.FC<ClassPerformanceRankingTableProps> = ({
  data
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingSummary, setEditingSummary] = useState<{ withEmpty: boolean; withoutEmpty: boolean }>({
    withEmpty: false,
    withoutEmpty: false
  });
  
  const [summaryWithEmpty, setSummaryWithEmpty] = useLocalStorage(
    'class-performance-summary-with-empty',
    '• Classes are ranked by average check-ins including empty sessions\n• Higher fill percentages indicate better class popularity\n• Revenue metrics show financial performance per class'
  );
  
  const [summaryWithoutEmpty, setSummaryWithoutEmpty] = useLocalStorage(
    'class-performance-summary-without-empty',
    '• Classes are ranked by average check-ins excluding empty sessions\n• This view shows true performance when classes actually run\n• Better indicator of class engagement when sessions occur'
  );

  // Process and group data by unique ID
  const classPerformanceData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const groupedData = data.reduce((acc, session) => {
      const key = session.uniqueId || `${session.cleanedClass || session.classType}-fallback`;
      
      if (!acc[key]) {
        acc[key] = {
          uniqueId: key,
          className: session.cleanedClass || session.classType || session.sessionName || 'Unknown Class',
          sessions: []
        };
      }
      
      acc[key].sessions.push(session);
      return acc;
    }, {} as Record<string, { uniqueId: string; className: string; sessions: SessionData[] }>);

    const performanceData = Object.values(groupedData).map(group => {
      const sessions = group.sessions;
      const sessionsWithCheckIns = sessions.filter(s => s.checkedInCount > 0);
      const emptySessions = sessions.filter(s => s.checkedInCount === 0);
      
      const totalCheckIns = sessions.reduce((sum, s) => sum + s.checkedInCount, 0);
      const totalCapacity = sessions.reduce((sum, s) => sum + s.capacity, 0);
      const totalRevenue = sessions.reduce((sum, s) => sum + (s.revenue || s.totalPaid || 0), 0);
      
      const avgCheckIns = totalCheckIns / sessions.length;
      const avgCheckInsWithEmpty = avgCheckIns;
      const avgCheckInsWithoutEmpty = sessionsWithCheckIns.length > 0 
        ? totalCheckIns / sessionsWithCheckIns.length 
        : 0;
      
      const fillPercentage = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;
      const fillPercentageWithEmpty = fillPercentage;
      const fillPercentageWithoutEmpty = sessionsWithCheckIns.length > 0 && totalCapacity > 0
        ? (totalCheckIns / (sessionsWithCheckIns.reduce((sum, s) => sum + s.capacity, 0))) * 100
        : 0;

      return {
        uniqueId: group.uniqueId,
        className: group.className,
        sessionCount: sessions.length,
        totalCheckIns,
        totalCapacity,
        avgCheckIns,
        avgCheckInsWithEmpty,
        avgCheckInsWithoutEmpty,
        fillPercentage,
        fillPercentageWithEmpty,
        fillPercentageWithoutEmpty,
        totalRevenue,
        avgRevenue: totalRevenue / sessions.length,
        sessionsWithCheckIns: sessionsWithCheckIns.length,
        emptySessions: emptySessions.length,
        rank: 0,
        rankWithoutEmpty: 0,
        individualSessions: sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      };
    });

    // Rank by average check-ins (with empty)
    const sortedWithEmpty = [...performanceData].sort((a, b) => b.avgCheckInsWithEmpty - a.avgCheckInsWithEmpty);
    sortedWithEmpty.forEach((item, index) => {
      item.rank = index + 1;
    });

    // Rank by average check-ins (without empty)
    const sortedWithoutEmpty = [...performanceData].sort((a, b) => b.avgCheckInsWithoutEmpty - a.avgCheckInsWithoutEmpty);
    sortedWithoutEmpty.forEach((item, index) => {
      const originalItem = performanceData.find(p => p.uniqueId === item.uniqueId);
      if (originalItem) {
        originalItem.rankWithoutEmpty = index + 1;
      }
    });

    return performanceData;
  }, [data]);

  const toggleRowExpansion = useCallback((uniqueId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(uniqueId)) {
        newSet.delete(uniqueId);
      } else {
        newSet.add(uniqueId);
      }
      return newSet;
    });
  }, []);

  const handleSaveSummary = (type: 'withEmpty' | 'withoutEmpty') => {
    setEditingSummary(prev => ({ ...prev, [type]: false }));
  };

  const columns = [
    {
      key: 'rank',
      header: 'Rank',
      align: 'center' as const,
      render: (value: number, row: ClassPerformanceData) => (
        <div className="flex items-center justify-center">
          {value <= 3 ? (
            <Trophy className={`w-4 h-4 ${value === 1 ? 'text-yellow-500' : value === 2 ? 'text-gray-400' : 'text-amber-600'}`} />
          ) : null}
          <span className="ml-1 font-bold">{value}</span>
        </div>
      )
    },
    {
      key: 'className',
      header: 'Class Name',
      render: (value: string, row: ClassPerformanceData) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleRowExpansion(row.uniqueId)}
            className="p-1 h-6 w-6"
          >
            {expandedRows.has(row.uniqueId) ? 
              <ChevronUp className="w-3 h-3" /> : 
              <ChevronDown className="w-3 h-3" />
            }
          </Button>
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'sessionCount',
      header: 'Total Sessions',
      align: 'center' as const,
      render: (value: number) => <Badge variant="outline">{value}</Badge>
    },
    {
      key: 'avgCheckIns',
      header: 'Avg Check-ins',
      align: 'center' as const,
      render: (value: number) => <span className="font-semibold">{value.toFixed(1)}</span>
    },
    {
      key: 'fillPercentage',
      header: 'Fill %',
      align: 'center' as const,
      render: (value: number) => (
        <Badge variant={value >= 80 ? 'default' : value >= 60 ? 'secondary' : 'destructive'}>
          {value.toFixed(1)}%
        </Badge>
      )
    },
    {
      key: 'sessionsWithCheckIns',
      header: 'Active Sessions',
      align: 'center' as const,
      render: (value: number, row: ClassPerformanceData) => (
        <div className="text-center">
          <div className="font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">
            {row.emptySessions} empty
          </div>
        </div>
      )
    },
    {
      key: 'totalRevenue',
      header: 'Total Revenue',
      align: 'right' as const,
      render: (value: number) => <span className="font-semibold">₹{value.toLocaleString()}</span>
    },
    {
      key: 'avgRevenue',
      header: 'Avg Revenue',
      align: 'right' as const,
      render: (value: number) => <span>₹{value.toFixed(0)}</span>
    }
  ];

  const columnsWithoutEmpty = [
    {
      key: 'rankWithoutEmpty',
      header: 'Rank',
      align: 'center' as const,
      render: (value: number, row: ClassPerformanceData) => (
        <div className="flex items-center justify-center">
          {value <= 3 ? (
            <Trophy className={`w-4 h-4 ${value === 1 ? 'text-yellow-500' : value === 2 ? 'text-gray-400' : 'text-amber-600'}`} />
          ) : null}
          <span className="ml-1 font-bold">{value}</span>
        </div>
      )
    },
    {
      key: 'className',
      header: 'Class Name',
      render: (value: string, row: ClassPerformanceData) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleRowExpansion(row.uniqueId)}
            className="p-1 h-6 w-6"
          >
            {expandedRows.has(row.uniqueId) ? 
              <ChevronUp className="w-3 h-3" /> : 
              <ChevronDown className="w-3 h-3" />
            }
          </Button>
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'sessionsWithCheckIns',
      header: 'Active Sessions',
      align: 'center' as const,
      render: (value: number) => <Badge variant="outline">{value}</Badge>
    },
    {
      key: 'avgCheckInsWithoutEmpty',
      header: 'Avg Check-ins (No Empty)',
      align: 'center' as const,
      render: (value: number) => <span className="font-semibold">{value.toFixed(1)}</span>
    },
    {
      key: 'fillPercentageWithoutEmpty',
      header: 'Fill % (No Empty)',
      align: 'center' as const,
      render: (value: number) => (
        <Badge variant={value >= 80 ? 'default' : value >= 60 ? 'secondary' : 'destructive'}>
          {value.toFixed(1)}%
        </Badge>
      )
    },
    {
      key: 'totalRevenue',
      header: 'Total Revenue',
      align: 'right' as const,
      render: (value: number) => <span className="font-semibold">₹{value.toLocaleString()}</span>
    },
    {
      key: 'avgRevenue',
      header: 'Avg Revenue',
      align: 'right' as const,
      render: (value: number) => <span>₹{value.toFixed(0)}</span>
    }
  ];

  const drillDownColumns = [
    {
      key: 'date',
      header: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'dayOfWeek',
      header: 'Day',
      align: 'center' as const
    },
    {
      key: 'time',
      header: 'Time',
      align: 'center' as const
    },
    {
      key: 'trainerName',
      header: 'Trainer'
    },
    {
      key: 'checkedInCount',
      header: 'Check-ins',
      align: 'center' as const,
      render: (value: number) => <Badge variant="outline">{value}</Badge>
    },
    {
      key: 'capacity',
      header: 'Capacity',
      align: 'center' as const
    },
    {
      key: 'fillPercentage',
      header: 'Fill %',
      align: 'center' as const,
      render: (value: number) => (
        <Badge variant={value >= 80 ? 'default' : value >= 60 ? 'secondary' : 'destructive'}>
          {value?.toFixed(1) || '0.0'}%
        </Badge>
      )
    },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right' as const,
      render: (value: number, row: SessionData) => (
        <span>₹{(value || row.totalPaid || 0).toLocaleString()}</span>
      )
    }
  ];

  const SummarySection = ({ 
    title, 
    summary, 
    setSummary, 
    isEditing, 
    setIsEditing 
  }: {
    title: string;
    summary: string;
    setSummary: (value: string) => void;
    isEditing: boolean;
    setIsEditing: (value: boolean) => void;
  }) => (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isEditing) {
                handleSaveSummary(title.includes('Empty') ? 'withEmpty' : 'withoutEmpty');
              } else {
                setIsEditing(true);
              }
            }}
            className="gap-1"
          >
            {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditing ? 'Save' : 'Edit'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter summary points..."
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => handleSaveSummary(title.includes('Empty') ? 'withEmpty' : 'withoutEmpty')}
              >
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-line text-sm text-muted-foreground">
              {summary}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No class performance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Table with Empty Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Class Performance Rankings (Including Empty Sessions)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ModernDataTable
              data={classPerformanceData.sort((a, b) => a.rank - b.rank)}
              columns={columns}
              maxHeight="600px"
              stickyHeader
              headerGradient="from-blue-600 to-purple-600"
            />
            
            {/* Drill-down rows */}
            {classPerformanceData.map(classData => (
              expandedRows.has(classData.uniqueId) && (
                <Collapsible key={`drill-${classData.uniqueId}`} open>
                  <CollapsibleContent>
                    <Card className="ml-8 mt-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                          Individual Sessions - {classData.className}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ModernDataTable
                          data={classData.individualSessions}
                          columns={drillDownColumns}
                          maxHeight="300px"
                          headerGradient="from-slate-500 to-slate-600"
                        />
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              )
            ))}
          </div>
          
          <SummarySection
            title="Key Insights (Including Empty Sessions)"
            summary={summaryWithEmpty}
            setSummary={setSummaryWithEmpty}
            isEditing={editingSummary.withEmpty}
            setIsEditing={(value) => setEditingSummary(prev => ({ ...prev, withEmpty: value }))}
          />
        </CardContent>
      </Card>

      {/* Table without Empty Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Class Performance Rankings (Excluding Empty Sessions)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ModernDataTable
              data={classPerformanceData.sort((a, b) => a.rankWithoutEmpty - b.rankWithoutEmpty)}
              columns={columnsWithoutEmpty}
              maxHeight="600px"
              stickyHeader
              headerGradient="from-green-600 to-teal-600"
            />
            
            {/* Drill-down rows */}
            {classPerformanceData.map(classData => (
              expandedRows.has(classData.uniqueId) && (
                <Collapsible key={`drill-no-empty-${classData.uniqueId}`} open>
                  <CollapsibleContent>
                    <Card className="ml-8 mt-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                          Individual Sessions - {classData.className}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ModernDataTable
                          data={classData.individualSessions.filter(s => s.checkedInCount > 0)}
                          columns={drillDownColumns}
                          maxHeight="300px"
                          headerGradient="from-slate-500 to-slate-600"
                        />
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              )
            ))}
          </div>
          
          <SummarySection
            title="Key Insights (Excluding Empty Sessions)"
            summary={summaryWithoutEmpty}
            setSummary={setSummaryWithoutEmpty}
            isEditing={editingSummary.withoutEmpty}
            setIsEditing={(value) => setEditingSummary(prev => ({ ...prev, withoutEmpty: value }))}
          />
        </CardContent>
      </Card>
    </div>
  );
};
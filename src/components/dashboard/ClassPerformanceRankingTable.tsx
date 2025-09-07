import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp, 
  Trophy, 
  Edit3, 
  Save,
  BarChart3
} from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';

interface ClassPerformanceData {
  uniqueId: string;
  className: string;
  sessionCount: number;
  totalCheckIns: number;
  avgCheckIns: number;
  avgCheckInsWithoutEmpty: number;
  fillPercentage: number;
  fillPercentageWithoutEmpty: number;
  totalRevenue: number;
  rank: number;
  rankWithoutEmpty: number;
  individualSessions: SessionData[];
  emptySessions: number;
  sessionsWithCheckIns: number;
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

export const ClassPerformanceRankingTable: React.FC<ClassPerformanceRankingTableProps> = ({ data }) => {
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
      const avgCheckInsWithoutEmpty = sessionsWithCheckIns.length > 0 
        ? totalCheckIns / sessionsWithCheckIns.length 
        : 0;
      
      const fillPercentage = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;
      const fillPercentageWithoutEmpty = sessionsWithCheckIns.length > 0 && totalCapacity > 0
        ? (totalCheckIns / (sessionsWithCheckIns.reduce((sum, s) => sum + s.capacity, 0))) * 100
        : 0;

      return {
        uniqueId: group.uniqueId,
        className: group.className,
        sessionCount: sessions.length,
        totalCheckIns,
        avgCheckIns,
        avgCheckInsWithoutEmpty,
        fillPercentage,
        fillPercentageWithoutEmpty,
        totalRevenue,
        rank: 0,
        rankWithoutEmpty: 0,
        individualSessions: sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        emptySessions: emptySessions.length,
        sessionsWithCheckIns: sessionsWithCheckIns.length
      };
    });

    const sortedWithEmpty = [...performanceData].sort((a, b) => b.avgCheckIns - a.avgCheckIns);
    sortedWithEmpty.forEach((item, index) => {
      item.rank = index + 1;
    });

    const sortedWithoutEmpty = [...performanceData].sort((a, b) => b.avgCheckInsWithoutEmpty - a.avgCheckInsWithoutEmpty);
    sortedWithoutEmpty.forEach((item, index) => {
      const originalItem = performanceData.find(p => p.uniqueId === item.uniqueId);
      if (originalItem) {
        originalItem.rankWithoutEmpty = index + 1;
      }
    });

    return performanceData;
  }, [data]);

  const toggleRowExpansion = (uniqueId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(uniqueId)) {
        newSet.delete(uniqueId);
      } else {
        newSet.add(uniqueId);
      }
      return newSet;
    });
  };

  const handleSaveSummary = (type: 'withEmpty' | 'withoutEmpty') => {
    setEditingSummary(prev => ({ ...prev, [type]: false }));
  };

  const renderTableRows = (sortedData: ClassPerformanceData[], withEmpty: boolean) => {
    const rows: JSX.Element[] = [];
    
    sortedData.forEach((classData) => {
      rows.push(
        <TableRow key={classData.uniqueId} className="hover:bg-gray-50">
          <TableCell className="text-center">
            <div className="flex items-center justify-center gap-1">
              {(withEmpty ? classData.rank : classData.rankWithoutEmpty) <= 3 && (
                <Trophy className={`w-4 h-4 ${(withEmpty ? classData.rank : classData.rankWithoutEmpty) === 1 ? 'text-yellow-500' : (withEmpty ? classData.rank : classData.rankWithoutEmpty) === 2 ? 'text-gray-400' : 'text-amber-600'}`} />
              )}
              <span className="font-bold">{withEmpty ? classData.rank : classData.rankWithoutEmpty}</span>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleRowExpansion(classData.uniqueId)}
                className="p-1 h-6 w-6"
              >
                {expandedRows.has(classData.uniqueId) ? 
                  <ChevronUp className="w-3 h-3" /> : 
                  <ChevronDown className="w-3 h-3" />
                }
              </Button>
              <span className="font-medium">{classData.className}</span>
            </div>
          </TableCell>
          <TableCell className="text-center">
            <Badge variant="outline">{withEmpty ? classData.sessionCount : classData.sessionsWithCheckIns}</Badge>
          </TableCell>
          <TableCell className="text-center font-semibold">
            {(withEmpty ? classData.avgCheckIns : classData.avgCheckInsWithoutEmpty).toFixed(1)}
          </TableCell>
          <TableCell className="text-center">
            <Badge variant={(withEmpty ? classData.fillPercentage : classData.fillPercentageWithoutEmpty) >= 80 ? 'default' : (withEmpty ? classData.fillPercentage : classData.fillPercentageWithoutEmpty) >= 60 ? 'secondary' : 'destructive'}>
              {(withEmpty ? classData.fillPercentage : classData.fillPercentageWithoutEmpty).toFixed(1)}%
            </Badge>
          </TableCell>
          <TableCell className="text-right font-semibold">
            ₹{classData.totalRevenue.toLocaleString()}
          </TableCell>
        </TableRow>
      );
      
      if (expandedRows.has(classData.uniqueId)) {
        rows.push(
          <TableRow key={`drill-${classData.uniqueId}`}>
            <TableCell colSpan={6}>
              <Collapsible open>
                <CollapsibleContent>
                  <Card className="ml-4 mt-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        Individual Sessions - {classData.className}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-auto max-h-64">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-100">
                              <TableHead>Date</TableHead>
                              <TableHead>Day</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Trainer</TableHead>
                              <TableHead>Check-ins</TableHead>
                              <TableHead>Capacity</TableHead>
                              <TableHead>Revenue</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(withEmpty ? classData.individualSessions : classData.individualSessions.filter(s => s.checkedInCount > 0)).map((session, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{new Date(session.date).toLocaleDateString()}</TableCell>
                                <TableCell>{session.dayOfWeek}</TableCell>
                                <TableCell>{session.time}</TableCell>
                                <TableCell>{session.trainerName}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{session.checkedInCount}</Badge>
                                </TableCell>
                                <TableCell>{session.capacity}</TableCell>
                                <TableCell>₹{(session.revenue || session.totalPaid || 0).toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </TableCell>
          </TableRow>
        );
      }
    });
    
    return rows;
  };

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Class Performance Rankings (Including Empty Sessions)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto border rounded-lg max-h-96">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:bg-blue-700">
                  <TableHead className="text-white font-bold">Rank</TableHead>
                  <TableHead className="text-white font-bold">Class Name</TableHead>
                  <TableHead className="text-white font-bold">Sessions</TableHead>
                  <TableHead className="text-white font-bold">Avg Check-ins</TableHead>
                  <TableHead className="text-white font-bold">Fill %</TableHead>
                  <TableHead className="text-white font-bold">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderTableRows(classPerformanceData.sort((a, b) => a.rank - b.rank), true)}
              </TableBody>
            </Table>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Class Performance Rankings (Excluding Empty Sessions)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto border rounded-lg max-h-96">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-green-600 to-teal-600 text-white hover:bg-green-700">
                  <TableHead className="text-white font-bold">Rank</TableHead>
                  <TableHead className="text-white font-bold">Class Name</TableHead>
                  <TableHead className="text-white font-bold">Active Sessions</TableHead>
                  <TableHead className="text-white font-bold">Avg Check-ins</TableHead>
                  <TableHead className="text-white font-bold">Fill %</TableHead>
                  <TableHead className="text-white font-bold">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderTableRows(classPerformanceData.sort((a, b) => a.rankWithoutEmpty - b.rankWithoutEmpty), false)}
              </TableBody>
            </Table>
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
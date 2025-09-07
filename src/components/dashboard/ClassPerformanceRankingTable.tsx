import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, BarChart3 } from 'lucide-react';
import { SessionData } from '@/hooks/useSessionsData';

interface ClassPerformanceRankingTableProps {
  data: SessionData[];
}

export const ClassPerformanceRankingTable: React.FC<ClassPerformanceRankingTableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No class performance data available</p>
        </CardContent>
      </Card>
    );
  }

  // Group sessions by class
  const classGroups = data.reduce((acc, session) => {
    const className = session.cleanedClass || session.classType || 'Unknown Class';
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(session);
    return acc;
  }, {} as Record<string, SessionData[]>);

  // Calculate performance metrics
  const classPerformance = Object.entries(classGroups).map(([className, sessions]) => {
    const totalCheckIns = sessions.reduce((sum, s) => sum + s.checkedInCount, 0);
    const totalRevenue = sessions.reduce((sum, s) => sum + (s.revenue || s.totalPaid || 0), 0);
    const avgCheckIns = totalCheckIns / sessions.length;
    const totalCapacity = sessions.reduce((sum, s) => sum + s.capacity, 0);
    const fillPercentage = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;

    return {
      className,
      sessionCount: sessions.length,
      avgCheckIns,
      fillPercentage,
      totalRevenue,
      totalCheckIns
    };
  });

  // Sort by average check-ins
  const sortedPerformance = classPerformance.sort((a, b) => b.avgCheckIns - a.avgCheckIns);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Class Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <TableHead className="text-white font-bold">Rank</TableHead>
                  <TableHead className="text-white font-bold">Class Name</TableHead>
                  <TableHead className="text-white font-bold">Sessions</TableHead>
                  <TableHead className="text-white font-bold">Avg Check-ins</TableHead>
                  <TableHead className="text-white font-bold">Fill %</TableHead>
                  <TableHead className="text-white font-bold">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPerformance.map((classData, index) => (
                  <TableRow key={classData.className} className="hover:bg-gray-50">
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {index < 3 && (
                          <Trophy className={`w-4 h-4 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-600'}`} />
                        )}
                        <span className="font-bold">{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{classData.className}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{classData.sessionCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {classData.avgCheckIns.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={classData.fillPercentage >= 80 ? 'default' : classData.fillPercentage >= 60 ? 'secondary' : 'destructive'}>
                        {classData.fillPercentage.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{classData.totalRevenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-line text-sm text-muted-foreground">
                  • Classes ranked by average check-ins across all sessions{'\n'}
                  • Higher fill percentages indicate better class popularity{'\n'}
                  • Revenue metrics show total financial performance per class{'\n'}
                  • Top 3 performing classes highlighted with trophy icons
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
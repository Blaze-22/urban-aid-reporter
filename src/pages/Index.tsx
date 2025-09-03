import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IssueForm } from '@/components/IssueForm';
import { IssueList } from '@/components/IssueList';
import { MapView } from '@/components/MapView';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Issue } from '@/types/issue';
import { AlertTriangle, MapPin, FileText, BarChart3, Users, Clock } from 'lucide-react';

const Index = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchIssues = async () => {
    try {
      const { data } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setIssues(data);
        
        // Calculate stats
        const newStats = {
          total: data.length,
          pending: data.filter(i => i.status === 'Pending').length,
          inProgress: data.filter(i => i.status === 'In Progress').length,
          resolved: data.filter(i => i.status === 'Resolved').length,
          critical: data.filter(i => i.priority === 'Critical').length,
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [refreshTrigger]);

  const handleIssueSubmitted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <AlertTriangle className="h-10 w-10 text-primary" />
            Civic Issue Reporter
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Report and track civic issues in your community. Together, we can make our city better.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Issues</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{stats.resolved}</div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">{stats.critical}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="map" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Report Issue
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Browse Issues
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Issues Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MapView issues={issues} />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline">🔴 Critical</Badge>
                  <Badge variant="outline">🟠 High</Badge>
                  <Badge variant="outline">🟡 Medium</Badge>
                  <Badge variant="outline">🟢 Low</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report">
            <IssueForm onSubmit={handleIssueSubmitted} />
          </TabsContent>

          <TabsContent value="list">
            <IssueList refreshTrigger={refreshTrigger} />
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-2">How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>
                <strong>1. Report</strong><br />
                Submit issues with photos, videos, and precise location
              </div>
              <div>
                <strong>2. Track</strong><br />
                Follow progress with unique tracking IDs
              </div>
              <div>
                <strong>3. Engage</strong><br />
                Upvote important issues to prioritize them
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;

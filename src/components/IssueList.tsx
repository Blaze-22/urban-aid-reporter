import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Issue, CATEGORIES, PRIORITIES, STATUSES } from '@/types/issue';
import { supabase } from '@/integrations/supabase/client';
import { Search, ThumbsUp, MapPin, Calendar, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface IssueListProps {
  refreshTrigger?: number;
}

export function IssueList({ refreshTrigger }: IssueListProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [refreshTrigger]);

  useEffect(() => {
    let filtered = issues;

    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.tracking_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(issue => issue.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(issue => issue.priority === priorityFilter);
    }

    setFilteredIssues(filtered);
  }, [issues, searchTerm, categoryFilter, statusFilter, priorityFilter]);

  const handleUpvote = async (issueId: number, currentUpvotes: number) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ upvotes: currentUpvotes + 1 })
        .eq('id', issueId);

      if (error) throw error;
      
      setIssues(prev => prev.map(issue => 
        issue.id === issueId 
          ? { ...issue, upvotes: currentUpvotes + 1 }
          : issue
      ));
    } catch (error) {
      console.error('Error upvoting issue:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved': return 'bg-green-600 text-white';
      case 'in progress': return 'bg-blue-600 text-white';
      case 'rejected': return 'bg-red-600 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Filter className="h-5 w-5" />
            Search & Filter Issues
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, or tracking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {PRIORITIES.map(priority => (
                  <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {issues.length === 0 ? 'No issues reported yet.' : 'No issues match your filters.'}
            </CardContent>
          </Card>
        ) : (
          filteredIssues.map(issue => (
            <Card key={issue.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{issue.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        ID: {issue.tracking_id}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{issue.description}</p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUpvote(issue.id, issue.upvotes)}
                    className="flex items-center gap-1 ml-4"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {issue.upvotes}
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline">{issue.category}</Badge>
                  <Badge className={getPriorityColor(issue.priority)}>
                    {issue.priority}
                  </Badge>
                  <Badge className={getStatusColor(issue.status)}>
                    {issue.status}
                  </Badge>
                </div>
                
                {issue.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    {issue.address || issue.location}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                  </div>
                  
                  {(issue.image_urls?.length || issue.video_urls?.length) && (
                    <div className="flex gap-1">
                      {issue.image_urls?.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          📷 {issue.image_urls.length} photo{issue.image_urls.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      {issue.video_urls?.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          🎥 {issue.video_urls.length} video{issue.video_urls.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Media Preview */}
                {issue.image_urls?.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {issue.image_urls.slice(0, 4).map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Issue media ${index + 1}`}
                        className="aspect-square object-cover rounded border cursor-pointer hover:opacity-80"
                        onClick={() => window.open(url, '_blank')}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        Showing {filteredIssues.length} of {issues.length} issues
      </div>
    </div>
  );
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Users, Briefcase, TrendingUp, Clock, Award, Target, ArrowRight } from 'lucide-react';
import { Progress } from './ui/progress';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const stats = [
    { title: 'Active Jobs', value: '24', change: '+3 this week', icon: Briefcase, color: 'bg-blue-500' },
    { title: 'Total Candidates', value: '1,247', change: '+156 this month', icon: Users, color: 'bg-green-500' },
    { title: 'Interviews Scheduled', value: '38', change: '12 today', icon: Clock, color: 'bg-orange-500' },
    { title: 'Success Rate', value: '87%', change: '+5% vs last month', icon: TrendingUp, color: 'bg-purple-500' },
  ];

  const recentActivity = [
    { candidate: 'Sarah Johnson', position: 'Senior Developer', score: 94, status: 'Interview Scheduled' },
    { candidate: 'Michael Chen', position: 'Product Manager', score: 89, status: 'Resume Reviewed' },
    { candidate: 'Emily Rodriguez', position: 'UX Designer', score: 92, status: 'AI Screening Passed' },
    { candidate: 'David Kim', position: 'Data Scientist', score: 96, status: 'Offer Extended' },
  ];

  const urgentActions = [
    { action: '5 candidates awaiting review', link: 'candidates' },
    { action: '3 interview feedback pending', link: 'candidates' },
    { action: '2 job positions expiring soon', link: 'jobs' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-l-4" style={{ borderLeftColor: stat.color.replace('bg-', '') }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">{stat.title}</CardTitle>
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stat.value}</div>
              <p className="text-xs text-gray-600 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent AI Matches */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent AI Candidate Matches</CardTitle>
            <CardDescription>Top candidates matched to open positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p>{item.candidate}</p>
                      <span className="text-xs text-gray-500">→ {item.position}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{item.status}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-600" />
                        <span className="text-indigo-600">{item.score}%</span>
                      </div>
                      <p className="text-xs text-gray-500">Match Score</p>
                    </div>
                    <Button size="sm" variant="ghost">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Alerts */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" onClick={() => onNavigate('jobs')}>
                <Briefcase className="w-4 h-4 mr-2" />
                Post New Job
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => onNavigate('resume')}>
                <Target className="w-4 h-4 mr-2" />
                Analyze Resume
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => onNavigate('matching')}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Run AI Matching
              </Button>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-900">Urgent Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {urgentActions.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <p className="text-sm text-orange-900">{item.action}</p>
                  <Button size="sm" variant="ghost" onClick={() => onNavigate(item.link)}>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hiring Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Hiring Pipeline Overview</CardTitle>
          <CardDescription>Current status of all active recruitments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Application Screening</span>
                <span className="text-sm">234 candidates</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">AI Assessment</span>
                <span className="text-sm">156 candidates</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Interview Stage</span>
                <span className="text-sm">38 candidates</span>
              </div>
              <Progress value={40} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Offer Stage</span>
                <span className="text-sm">12 candidates</span>
              </div>
              <Progress value={15} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Brain, Users, Target, TrendingUp, Clock, Sparkles, ArrowUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback } from './ui/avatar';

export default function HRDashboard() {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No access token found');
      return;
    }
    fetch('http://127.0.0.1:8000/jobs/api/dashboard/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setDashboardData(data))
      .catch(err => console.error('Failed to fetch dashboard data', err));
  }, []);

  if (!dashboardData) {
    return <div className="p-6">Loading dashboard data...</div>;
  }

  const aiStats = [
    { 
      label: 'Total Jobs', 
      value: dashboardData.total_jobs.toString(), 
      icon: Target, 
      change: '', 
      changeLabel: '',
      trend: 'up',
      color: 'blue',
      description: 'Active job postings'
    },
    { 
      label: 'Total Applications', 
      value: dashboardData.total_applications.toString(), 
      icon: Users, 
      change: '', 
      changeLabel: '',
      trend: 'up',
      color: 'green',
      description: 'Received applications'
    },
    { 
      label: 'Pending Applications', 
      value: dashboardData.pending_applications.toString(), 
      icon: Clock, 
      change: '', 
      changeLabel: '',
      trend: 'neutral',
      color: 'amber',
      description: 'Awaiting review'
    },
    { 
      label: 'Approved Applications', 
      value: dashboardData.approved_applications.toString(), 
      icon: CheckCircle2, 
      change: '', 
      changeLabel: '',
      trend: 'up',
      color: 'purple',
      description: 'Shortlisted candidates'
    },
  ];

  const topCandidates = dashboardData.recent_applications.slice(0,3).map((app, index) => ({
    name: app.candidate__username,
    position: app.job__title,
    matchScore: 85 + index * 2,
    skills: ['Not specified'],
    experience: 'Not specified',
    avatar: app.candidate__username.slice(0,2).toUpperCase(),
    aiInsight: 'Recent application',
    status: app.status.charAt(0).toUpperCase() + app.status.slice(1),
  }));

  const aiInsights = [
    dashboardData.pending_applications > 0 ? {
      type: 'alert',
      icon: AlertTriangle,
      color: 'amber',
      title: 'Pending Applications',
      message: `You have ${dashboardData.pending_applications} applications awaiting review.`,
      action: 'Review Now'
    } : {
      type: 'recommendation',
      icon: Sparkles,
      color: 'purple',
      title: 'Job Postings Active',
      message: `You have ${dashboardData.total_jobs} active job postings attracting candidates.`,
      action: 'View Jobs'
    },
    {
      type: 'info',
      icon: CheckCircle2,
      color: 'green',
      title: 'Application Overview',
      message: `Total: ${dashboardData.total_applications}, Approved: ${dashboardData.approved_applications}, Rejected: ${dashboardData.rejected_applications}`,
      action: 'View Details'
    },
    {
      type: 'success',
      icon: TrendingUp,
      color: 'green',
      title: 'Trending Skill Match',
      message: '12 new candidates match your React Developer opening with 85%+ score',
      action: 'View Candidates'
    },
  ];

  const recentAIActivity = [
    { 
      type: 'match',
      candidate: 'Alex Turner',
      job: 'Full Stack Developer', 
      score: 93,
      time: '5 min ago',
      avatar: 'AT',
      action: 'AI matched candidate'
    },
    { 
      type: 'screen',
      candidate: 'Jessica Lee',
      job: 'Product Manager', 
      score: 88,
      time: '12 min ago',
      avatar: 'JL',
      action: 'Resume auto-screened'
    },
    { 
      type: 'predict',
      candidate: 'David Kim',
      job: 'DevOps Engineer', 
      score: 91,
      time: '25 min ago',
      avatar: 'DK',
      action: 'Success prediction generated'
    },
    { 
      type: 'match',
      candidate: 'Olivia Brown',
      job: 'UX Researcher', 
      score: 87,
      time: '1 hour ago',
      avatar: 'OB',
      action: 'AI matched candidate'
    },
  ];

  return (
    <div className="space-y-6">
      {/* AI-Driven Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {aiStats.map((stat, index) => (
          <Card key={index} className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                stat.color === 'purple' ? 'bg-purple-100' :
                stat.color === 'amber' ? 'bg-amber-100' :
                stat.color === 'blue' ? 'bg-blue-100' :
                'bg-green-100'
              }`}>
                <stat.icon className={`w-6 h-6 ${
                  stat.color === 'purple' ? 'text-purple-600' :
                  stat.color === 'amber' ? 'text-amber-600' :
                  stat.color === 'blue' ? 'text-blue-600' :
                  'text-green-600'
                }`} />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <ArrowUp className="w-3 h-3" />
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-3xl font-semibold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm font-medium text-gray-900 mb-1">{stat.label}</p>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* AI Insights & Top Candidates */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* AI-Powered Insights */}
        <Card className="p-6 border-0 shadow-sm bg-white">
          <div className="flex items-center gap-2 mb-6">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900"> Insights</h3>
            <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-700 border-0">Real-time</Badge>
          </div>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-xl border-l-4 ${
                insight.color === 'purple' ? 'bg-purple-50 border-purple-500' :
                insight.color === 'amber' ? 'bg-amber-50 border-amber-500' :
                'bg-green-50 border-green-500'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    insight.color === 'purple' ? 'bg-purple-100' :
                    insight.color === 'amber' ? 'bg-amber-100' :
                    'bg-green-100'
                  }`}>
                    <insight.icon className={`w-4 h-4 ${
                      insight.color === 'purple' ? 'text-purple-600' :
                      insight.color === 'amber' ? 'text-amber-600' :
                      'text-green-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">{insight.message}</p>
                    {/* <button className="text-xs font-medium text-purple-600 hover:text-purple-700">
                      {insight.action} →
                    </button> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top AI-Matched Candidates */}
        <Card className="p-6 border-0 shadow-sm bg-white">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top AI Matches</h3>
            <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-700 border-0">Today</Badge>
          </div>
          <div className="space-y-4">
            {topCandidates.map((candidate, index) => (
              <div key={index} className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600">
                    <AvatarFallback className="text-white font-semibold">
                      {candidate.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{candidate.name}</p>
                        <p className="text-xs text-gray-600">{candidate.position}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-purple-600">{candidate.matchScore}%</p>
                        <p className="text-xs text-gray-500">match</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <Progress value={candidate.matchScore} className="h-2 bg-gray-200" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <p className="text-xs text-gray-600 italic">{candidate.aiInsight}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {candidate.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-0">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                    {candidate.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent AI Activity */}
      {/* <Card className="p-6 border-0 shadow-sm bg-white">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Real-Time AI Activity</h3>
          <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 border-0">
            <span className="relative flex h-2 w-2 mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Live
          </Badge>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {recentAIActivity.map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-gray-100">
              <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600">
                <AvatarFallback className="text-white text-xs font-medium">
                  {activity.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.candidate}</p>
                <p className="text-xs text-gray-600">{activity.job}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.action} • {activity.time}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100">
                  <p className="text-xs font-medium text-green-700">{activity.score}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card> */}
    </div>
  );
}

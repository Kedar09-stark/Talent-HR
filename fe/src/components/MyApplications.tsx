import { Calendar, MapPin, Building2, Clock, Loader } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useEffect, useState } from 'react';

interface Application {
  id: number;
  jobTitle: string;
  company: string;
  location: string;
  appliedDate: string;
  status: string;
  coverLetter?: string;
  jobId?: number;
}

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('No access token found');
        setLoading(false);
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/jobs/api/my-applications/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      applied: 'Application Sent',
      reviewing: 'Under Review',
      shortlisted: 'Shortlisted',
      rejected: 'Rejected',
    };
    return statusMap[status] || status;
  };

  const getStatusProgress = (status: string) => {
    const progressMap: { [key: string]: number } = {
      applied: 25,
      reviewing: 50,
      shortlisted: 75,
      rejected: 100,
    };
    return progressMap[status] || 25;
  };

  const getStatusNextStep = (status: string) => {
    const nextStepMap: { [key: string]: string } = {
      applied: 'Application in queue for review',
      reviewing: 'Waiting for recruiter review',
      shortlisted: 'Congratulations! You have been shortlisted',
      rejected: 'Unfortunately, your application was not selected',
    };
    return nextStepMap[status] || 'Waiting for update';
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return 'default';
      case 'reviewing':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getNextStepBoxColor = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return 'bg-green-50';
      case 'rejected':
        return 'bg-red-50';
      case 'reviewing':
        return 'bg-yellow-50';
      default:
        return 'bg-blue-50';
    }
  };

  const getNextStepIconColor = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'reviewing':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  const totalApplications = applications.length;
  const underReview = applications.filter(a => a.status === 'reviewing').length;
  const shortlisted = applications.filter(a => a.status === 'shortlisted').length;
  const responseRate = totalApplications > 0 ? Math.round((shortlisted + underReview) / totalApplications * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl mb-2">My Applications</h2>
        <p className="text-gray-600">Track the status of your job applications</p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Total Applications</p>
          <p className="text-3xl">{totalApplications}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Under Review</p>
          <p className="text-3xl">{underReview}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Shortlisted</p>
          <p className="text-3xl">{shortlisted}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Response Rate</p>
          <p className="text-3xl">{responseRate}%</p>
        </Card>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No applications yet. Start applying for jobs!</p>
          </Card>
        ) : (
          applications.map((app) => (
            <Card key={app.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl mb-2">{app.jobTitle}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {app.company}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {app.location || 'Not specified'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Applied: {new Date(app.appliedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(app.status)}>
                    {getStatusDisplay(app.status)}
                  </Badge>
                </div>

                {app.status !== 'rejected' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Application Progress</span>
                      <span className="text-gray-600">{getStatusProgress(app.status)}%</span>
                    </div>
                    <Progress value={getStatusProgress(app.status)} />
                  </div>
                )}

                <div className={`flex items-start gap-2 p-3 ${getNextStepBoxColor(app.status)} rounded-lg`}>
                  <Clock className={`w-5 h-5 ${getNextStepIconColor(app.status)} mt-0.5`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Next Step</p>
                    <p className="text-sm text-gray-700">{getStatusNextStep(app.status)}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

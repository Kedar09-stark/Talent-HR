import { useState, useEffect } from 'react';
import { Search, Star, Eye, CheckCircle2, X, Mail, Phone, Calendar, Send, Check, Download, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

export default function HRApplications() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false);
  const [interviewMessage, setInterviewMessage] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [isMassActionMode, setIsMassActionMode] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState<{
    isOpen: boolean;
    applicationId: number | null;
    oldStatus: string;
    newStatus: string;
    message: string;
  }>({
    isOpen: false,
    applicationId: null,
    oldStatus: '',
    newStatus: '',
    message: '',
  });

  const [jobs, setJobs] = useState<any[]>([]);
  // default to showing all applicants across jobs
  const [selectedJob, setSelectedJob] = useState<any>('all');
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingApps, setIsLoadingApps] = useState(false);

  const token = localStorage.getItem('accessToken');
  const userName = localStorage.getItem('userName');

  // Fetch HR's posted jobs
  useEffect(() => {
    const fetchJobs = async () => {
      if (!token || !userName) return;
      
      setIsLoadingJobs(true);
      try {
        const res = await fetch('http://127.0.0.1:8000/jobs/api/list/', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const hrJobs = Array.isArray(data)
            ? data.filter((j: any) => j.created_by_username === userName)
            : [];
          setJobs(hrJobs);
        }
      } catch (err) {
        console.error('Failed to fetch jobs', err);
        toast.error('Failed to load your posted jobs');
      } finally {
        setIsLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [token, userName]);

  // Fetch applicants for selected job
  useEffect(() => {
    const fetchApplicants = async () => {
      if (!token) {
        setApplications([]);
        return;
      }

      setIsLoadingApps(true);
      try {
        // If 'all' is selected, fetch all applicants across HR jobs
        if (selectedJob === 'all') {
          const res = await fetch(`http://127.0.0.1:8000/jobs/api/applications/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (res.ok) {
            const data = await res.json();
            setApplications(Array.isArray(data) ? data : []);
          }
        } else if (selectedJob) {
          const res = await fetch(`http://127.0.0.1:8000/jobs/api/applications/${selectedJob.id}/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (res.ok) {
            const data = await res.json();
            setApplications(Array.isArray(data) ? data : []);
          }
        } else {
          setApplications([]);
        }
      } catch (err) {
        console.error('Failed to fetch applicants', err);
        toast.error('Failed to load applicants');
      } finally {
        setIsLoadingApps(false);
      }
    };

    fetchApplicants();
  }, [selectedJob, token]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'applied':
        return 'outline';
      case 'reviewing':
        return 'secondary';
      case 'shortlisted':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-700';
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-700';
      case 'shortlisted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDefaultMessageTemplate = (newStatus: string, candidateName: string) => {
    switch (newStatus) {
      case 'reviewing':
        return `Dear ${candidateName},\n\nThank you for your application! We are pleased to inform you that your application is under review. We are impressed with your qualifications and will be in touch soon.\n\nBest regards,\nHR Team`;
      case 'shortlisted':
        return `Dear ${candidateName},\n\nCongratulations! We are delighted to inform you that you have been shortlisted for the next round of our recruitment process. Your skills and experience align well with our requirements.\n\nWe will be scheduling an interview with you soon. Please keep an eye on your inbox for further details.\n\nBest regards,\nHR Team`;
      case 'rejected':
        return `Dear ${candidateName},\n\nThank you for your interest in our organization and for applying to the position. After careful consideration, we regret to inform you that we have decided to move forward with other candidates whose qualifications closely match our current requirements.\n\nWe appreciate your time and effort, and we encourage you to apply for future opportunities.\n\nBest regards,\nHR Team`;
      default:
        return '';
    }
  };

  const handleViewProfile = (app: any) => {
    console.log('Selected Candidate Data:', app);
    console.log('Resume field:', app?.candidate_profile?.resume);
    setSelectedCandidate(app);
    setIsProfileDialogOpen(true);
  };

  const handleStatusChange = (appId: number, newStatus: string) => {
    const application = applications.find((app: any) => app.id === appId);
    if (!application) return;

    const candidateName = application.candidate_profile?.fullName || application.candidate_username;
    const messageTemplate = getDefaultMessageTemplate(newStatus, candidateName);

    setStatusUpdateDialog({
      isOpen: true,
      applicationId: appId,
      oldStatus: application.status,
      newStatus,
      message: messageTemplate,
    });
  };

  const handleConfirmStatusUpdate = async () => {
    if (!statusUpdateDialog.applicationId) return;

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/jobs/api/applications/${statusUpdateDialog.applicationId}/status/`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: statusUpdateDialog.newStatus }),
        }
      );

      if (!res.ok) throw new Error('Failed to update status');

      setApplications(
        applications.map((app: any) =>
          app.id === statusUpdateDialog.applicationId
            ? { ...app, status: statusUpdateDialog.newStatus }
            : app
        )
      );

      if (statusUpdateDialog.message.trim()) {
        try {
          await fetch('http://127.0.0.1:8000/chat/api/send-status-message/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              application_id: statusUpdateDialog.applicationId,
              message: statusUpdateDialog.message,
            }),
          });
        } catch (err) {
          console.warn('Failed to send message', err);
        }
      }

      toast.success(`Status updated and message sent!`);
      setStatusUpdateDialog({
        isOpen: false,
        applicationId: null,
        oldStatus: '',
        newStatus: '',
        message: '',
      });
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error('Failed to update application status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleScheduleInterview = (candidate: any) => {
    setSelectedCandidate(candidate);
    const candidateName = candidate.candidate_profile?.fullName || candidate.candidate_username;
    setInterviewMessage(`Dear ${candidateName},\n\nWe are pleased to invite you for an interview.\n\nInterview Details:\nDate: [To be filled]\nTime: [To be filled]\nLocation: Virtual/Office Address\n\nPlease confirm your availability.\n\nBest regards,\nHR Team`);
    setIsInterviewDialogOpen(true);
  };

  const handleSendInterviewInvite = () => {
    if (!interviewDate || !interviewTime) {
      toast.error('Please fill in interview date and time');
      return;
    }

    const candidateIds = isMassActionMode && selectedCandidates.length > 0 
      ? selectedCandidates 
      : [selectedCandidate.id];

      setApplications(applications.map((app: any) => 
        candidateIds.includes(app.id) ? { ...app, status: 'Interview Scheduled' } : app
      ));

    setIsInterviewDialogOpen(false);
    setInterviewMessage('');
    setInterviewDate('');
    setInterviewTime('');
    setSelectedCandidates([]);
    setIsMassActionMode(false);
    
    const count = candidateIds.length;
    toast.success(`Interview invitation sent to ${count} candidate${count > 1 ? 's' : ''}!`);
  };

  const handleMassScheduleInterview = () => {
    if (selectedCandidates.length === 0) {
      toast.error('Please select candidates first');
      return;
    }
    
    setIsMassActionMode(true);
    const candidateNames = applications
      .filter((app: any) => selectedCandidates.includes(app.id))
      .map((app: any) => app.candidate_profile?.fullName || app.candidate_username)
      .join(', ');
    
    setInterviewMessage(`Dear Candidates,\n\nWe are pleased to invite you for an interview.\n\nSelected Candidates: ${candidateNames}\n\nInterview Details:\nDate: [To be filled]\nTime: [To be filled]\nLocation: Virtual/Office Address\n\nPlease confirm your availability.\n\nBest regards,\nHR Team`);
    setIsInterviewDialogOpen(true);
  };

  const computeCompatibility = async (appId: number) => {
    try {
      setApplications((prev: any[]) => prev.map((a: any) => a.id === appId ? { ...a, _computing: true } : a));
      const res = await fetch(`http://127.0.0.1:8000/jobs/api/applications/${appId}/compatibility/`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        // attach compatibility result to application object
        setApplications((prev: any[]) => prev.map((a: any) => a.id === appId ? { ...a, compatibility: data, _computing: false } : a));
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to compute compatibility');
        setApplications((prev: any[]) => prev.map((a: any) => a.id === appId ? { ...a, _computing: false } : a));
      }
    } catch (err) {
      console.error('Compatibility compute failed', err);
      toast.error('Failed to compute compatibility');
      setApplications((prev: any[]) => prev.map((a: any) => a.id === appId ? { ...a, _computing: false } : a));
    }
  };

  const toggleCandidateSelection = (candidateId: number) => {
    setSelectedCandidates((prev: number[]) => 
      prev.includes(candidateId) 
        ? prev.filter((id: number) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const filteredApplications = applications.filter((app: any) => {
    const candidateName = app.candidate_profile?.fullName || app.candidate_username || '';
    const skills = app.candidate_profile?.skills || [];
    return (
      candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skills.some((skill: string) => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Job Selector */}
      {jobs.length > 0 && (
        <Card className="p-4 border-0 shadow-sm bg-white">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Select Job to Review Applications</label>
          <Select 
            value={selectedJob === 'all' ? 'all' : selectedJob?.id?.toString() || ''}
            onValueChange={(value: string) => {
              if (value === 'all') {
                setSelectedJob('all');
                return;
              }
              const job = jobs.find((j: any) => j.id === parseInt(value));
              setSelectedJob(job || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a job..." />
            </SelectTrigger>
            <SelectContent>
                  <SelectItem key="all" value="all">All Applicants</SelectItem>
                  {jobs.map((job: any) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.title} ({job.department})
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow-sm bg-white">
          <p className="text-sm text-gray-600 mb-1 font-medium">Total Applications</p>
          <p className="text-3xl font-semibold text-gray-900">{applications.length}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-white">
          <p className="text-sm text-gray-600 mb-1 font-medium">New Applications</p>
          <p className="text-3xl font-semibold text-gray-900">{applications.filter((a: any) => a.status === 'applied').length}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-white">
          <p className="text-sm text-gray-600 mb-1 font-medium">Shortlisted</p>
          <p className="text-3xl font-semibold text-gray-900">{applications.filter((a: any) => a.status === 'shortlisted').length}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm bg-white">
          <p className="text-sm text-gray-600 mb-1 font-medium">Reviewing</p>
          <p className="text-3xl font-semibold text-gray-900">{applications.filter((a: any) => a.status === 'reviewing').length}</p>
        </Card>
      </div>

      {/* Search and Mass Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search by candidate name, skills..."
            className="pl-10 h-11 bg-white border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {isLoadingApps ? (
          <Card className="p-8 border-0 shadow-sm text-center">
            <p className="text-gray-500">Loading applicants...</p>
          </Card>
        ) : applications.length === 0 ? (
          <Card className="p-8 border-0 shadow-sm text-center">
            <p className="text-gray-500">No applications for this job yet</p>
          </Card>
        ) : (
          applications.map((app: any) => (
            <Card key={app.id} className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
              <div className="flex items-start gap-4">
                {/* Profile Photo */}
                {app.candidate_profile?.profilePhoto ? (
                  <img
                    src={app.candidate_profile.profilePhoto.startsWith('http') ? app.candidate_profile.profilePhoto : `http://127.0.0.1:8000${app.candidate_profile.profilePhoto}`}
                    alt={app.candidate_profile.fullName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <Avatar className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600">
                    <AvatarFallback className="text-white text-lg font-semibold">
                      {app.candidate_profile?.fullName?.split(' ').map((n: string) => n[0]).join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Candidate Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {app.candidate_profile?.fullName || app.candidate_username}
                    </h3>
                    <Badge className={getStatusColor(app.status)}>
                      {app.status}
                    </Badge>
                  </div>

                  <p className="text-gray-600 mb-3 font-medium">
                    {app.candidate_profile?.title || 'Job Seeker'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-purple-600" />
                      <span>{app.candidate_profile?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-purple-600" />
                      <span>{app.candidate_profile?.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <span className="text-gray-600">
                      Experience: <span className="font-medium text-gray-900">{app.candidate_profile?.yearsOfExperience || 'N/A'} years</span>
                    </span>
                    <span className="text-gray-600">
                      Location: <span className="font-medium text-gray-900">{app.candidate_profile?.location || 'N/A'}</span>
                    </span>
                    <span className="text-gray-500">
                      Applied: {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                    <span className="text-gray-500 ml-4">
                      Applied For: <span className="font-medium text-gray-900">{app.job?.title || app.job_title || 'Unknown'}</span>
                    </span>
                  </div>

                  {app.candidate_profile?.skills && app.candidate_profile.skills.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {app.candidate_profile.skills.slice(0, 3).map((skill: string, index: number) => (
                        <Badge key={index} variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                          {skill}
                        </Badge>
                      ))}
                      {app.candidate_profile.skills.length > 3 && (
                        <Badge variant="outline" className="border-gray-200 text-gray-700">
                          +{app.candidate_profile.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Compatibility / Fit */}
                  <div className="mb-4">
                    {app.compatibility && typeof app.compatibility?.fit_score !== 'undefined' ? (
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-600">Compatibility:</div>
                        <div className="font-semibold text-gray-900">{app.compatibility.fit_score}%</div>
                        <div className="w-48">
                          <Progress value={parseInt(app.compatibility.fit_score || 0)} />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Button size="sm" onClick={() => computeCompatibility(app.id)} disabled={app._computing}>
                          {app._computing ? 'Computing...' : 'Compute Fit'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm"
                    onClick={() => handleViewProfile(app)}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>

                  <Select 
                    value={app.status} 
                    onValueChange={(value: any) => handleStatusChange(app.id, value)}
                    disabled={isUpdatingStatus}
                  >
                    <SelectTrigger size="sm" className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  {app.candidate_profile?.resume && (
                    <a
                      href={app.candidate_profile.resume}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center justify-center gap-1 p-2 hover:bg-emerald-50 rounded"
                    >
                      <Download className="w-3 h-3" />
                      Resume
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Status Update Message Dialog */}
      <Dialog open={statusUpdateDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setStatusUpdateDialog({
            isOpen: false,
            applicationId: null,
            oldStatus: '',
            newStatus: '',
            message: '',
          });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Application Status & Send Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Status Change:</strong> {statusUpdateDialog.oldStatus} → {statusUpdateDialog.newStatus}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-message">Edit message to send to candidate:</Label>
              <Textarea
                id="status-message"
                value={statusUpdateDialog.message}
                onChange={(e) =>
                  setStatusUpdateDialog({
                    ...statusUpdateDialog,
                    message: e.target.value,
                  })
                }
                placeholder="Edit the message or leave empty to skip"
                className="min-h-40"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  setStatusUpdateDialog({
                    isOpen: false,
                    applicationId: null,
                    oldStatus: '',
                    newStatus: '',
                    message: '',
                  })
                }
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmStatusUpdate}
                disabled={isUpdatingStatus}
                className="bg-gradient-to-r from-purple-600 to-purple-700"
              >
                {isUpdatingStatus ? 'Updating...' : 'Update & Send Message'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCandidate && (
            <>
              <DialogHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    {selectedCandidate?.candidate_profile?.profilePhoto && (
                      <img
                        src={selectedCandidate.candidate_profile.profilePhoto.startsWith('http') ? selectedCandidate.candidate_profile.profilePhoto : `http://127.0.0.1:8000${selectedCandidate.candidate_profile.profilePhoto}`}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    <div>
                      <DialogTitle className="text-2xl">
                        {selectedCandidate?.candidate_profile?.fullName || selectedCandidate?.candidate_username}
                      </DialogTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedCandidate.candidate_profile?.title || 'Job Seeker'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Resume Buttons */}
                  {selectedCandidate?.candidate_profile?.resume ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <a
                        href={selectedCandidate.candidate_profile.resume.startsWith('http') ? selectedCandidate.candidate_profile.resume : `http://127.0.0.1:8000${selectedCandidate.candidate_profile.resume}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium px-3 py-2 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition whitespace-nowrap"
                      >
                        <FileText className="w-4 h-4" />
                        View Resume
                      </a>
                      <a
                        href={selectedCandidate.candidate_profile.resume.startsWith('http') ? selectedCandidate.candidate_profile.resume : `http://127.0.0.1:8000${selectedCandidate.candidate_profile.resume}`}
                        download
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg flex-shrink-0">No resume</span>
                  )}
                </div>
              </DialogHeader>

              <hr className="my-2" />
              
              <div className="space-y-6">
              {/* Application Status */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <label className="text-sm font-semibold text-gray-800 mb-3 block">
                  Application Status
                </label>
                <Select
                  value={selectedCandidate.status}
                  onValueChange={(value: string) => {
                    setSelectedCandidate({ ...selectedCandidate, status: value });
                    handleStatusChange(selectedCandidate.id, value);
                  }}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Information Card */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-600" />
                    Contact Information
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4">
                  <div>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {selectedCandidate.candidate_profile?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Phone</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {selectedCandidate.candidate_profile?.phone || 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Location</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {selectedCandidate.candidate_profile?.location || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Professional Background */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">Professional Background</h4>
                </div>
                <div className="p-4 space-y-4">
                  {selectedCandidate.candidate_profile?.yearsOfExperience && (
                    <div>
                      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Experience</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {selectedCandidate.candidate_profile.yearsOfExperience} years
                      </p>
                    </div>
                  )}
                  
                  {selectedCandidate.candidate_profile?.bio && (
                    <div>
                      <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Bio</p>
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                        {selectedCandidate.candidate_profile.bio}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              {selectedCandidate.candidate_profile?.skills && selectedCandidate.candidate_profile.skills.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">Skills</h4>
                  </div>
                  <div className="p-4">
                    <div className="flex gap-2 flex-wrap">
                      {selectedCandidate.candidate_profile.skills.map((skill: string, idx: number) => (
                        <Badge key={idx} className="bg-purple-100 text-purple-700 border-0 text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Education */}
              {selectedCandidate.candidate_profile?.education && selectedCandidate.candidate_profile.education.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">Education</h4>
                  </div>
                  <div className="divide-y">
                    {selectedCandidate.candidate_profile.education.map((edu: any, idx: number) => (
                      <div key={idx} className="p-4">
                        <p className="font-medium text-gray-900">{edu.degree}</p>
                        <p className="text-sm text-gray-600 mt-1">{edu.institution}</p>
                        <p className="text-xs text-gray-500 mt-1">{edu.year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {selectedCandidate.candidate_profile?.experience && selectedCandidate.candidate_profile.experience.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">Work Experience</h4>
                  </div>
                  <div className="divide-y">
                    {selectedCandidate.candidate_profile.experience.map((exp: any, idx: number) => (
                      <div key={idx} className="p-4">
                        <p className="font-medium text-gray-900">{exp.position}</p>
                        <p className="text-sm text-gray-600 mt-1">{exp.company}</p>
                        <p className="text-xs text-gray-500 mt-1">{exp.duration}</p>
                        {exp.description && (
                          <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {selectedCandidate.cover_letter && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      Cover Letter
                    </h4>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedCandidate.cover_letter}
                    </p>
                  </div>
                </div>
              )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Search, MapPin, DollarSign, Clock, Building2, Bookmark, ChevronRight, Briefcase, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { toast } from 'sonner';

export default function JobListings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [savedJobs, setSavedJobs] = useState<number[]>([]);

  const [jobs, setJobs] = useState<any[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const res = await fetch('http://127.0.0.1:8000/jobs/api/list/', {
          method: 'GET',
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        });

        if (res.ok) {
          const data = await res.json();
          // Filter to jobs that have a creator (likely posted by HR accounts)
          const hrJobs = Array.isArray(data) ? data.filter((j: any) => j.created_by_username) : [];
          // Normalize fields expected by UI
          const normalized = hrJobs.map((j: any) => ({
            id: j.id,
            title: j.title,
            company: j.created_by_username || j.company || 'Company',
            department: j.department || '',
            location: j.location || 'Remote',
            type: j.type || 'Full-time',
            salary: j.salary || '',
            description: j.description || '',
            requirements: j.requirements || '',
            postedDate: j.created_at || new Date().toISOString(),
            skills: j.required_skills || j.skills || [],
            jd_file: j.jd_file || null,
          }));
          setJobs(normalized);
        } else {
          console.error('Failed to fetch jobs', await res.text());
        }
      } catch (err) {
        console.error('Jobs fetch error', err);
      }
    };

    fetchJobs();
  }, []);

  const handleApply = async () => {
    if (!selectedJob) return;
    
    setIsApplying(true);
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch('http://127.0.0.1:8000/jobs/api/apply/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: selectedJob.id,
          cover_letter: coverLetter,
        }),
      });

      const data = await res.json();

      if (res.ok || res.status === 201) {
        toast.success('Application submitted successfully! HR will review your profile.');
        setIsApplyDialogOpen(false);
        setSelectedJob(null);
        setCoverLetter('');
      } else if (res.status === 409) {
        toast.error('You have already applied for this job');
      } else {
        toast.error(data.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Apply error', err);
      toast.error('Error submitting application');
    } finally {
      setIsApplying(false);
    }
  };

  const handleViewDetails = (job: any) => {
    setSelectedJob(job);
    setIsApplyDialogOpen(true);
  };

  const handleSaveJob = (jobId: number) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(savedJobs.filter(id => id !== jobId));
      toast.success('Job removed from saved list');
    } else {
      setSavedJobs([...savedJobs, jobId]);
      toast.success('Job saved successfully!');
    }
  };

  const fetchCandidateProfileAndAnalyze = async (job: any) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('Please log in to use analysis feature');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Call compare endpoint - backend will fetch resume from candidate profile
      const compareRes = await fetch('http://127.0.0.1:8000/api/jd/compare/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jd_text: job.description,
        }),
      });

      if (!compareRes.ok) {
        const errorData = await compareRes.json();
        throw new Error(errorData.error || 'Failed to analyze');
      }

      const analysis = await compareRes.json();
      setAnalysisData(analysis);
      setIsAnalysisOpen(true);

      if (analysis.error) {
        toast.error(analysis.error);
      } else {
        toast.success('Analysis complete!');
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error analyzing fit');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search by job title, company, location, or skills..."
            className="pl-10 h-11 bg-white border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0 px-4 py-2">
          {filteredJobs.length} jobs found
        </Badge>
      </div>

      {/* Saved Jobs Count */}
      {savedJobs.length > 0 && (
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-sky-50">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-emerald-600 fill-emerald-600" />
            <span className="font-medium text-gray-900">
              You have {savedJobs.length} saved job{savedJobs.length !== 1 ? 's' : ''}
            </span>
          </div>
        </Card>
      )}

      {/* Job Listings */}
      <div className="grid gap-4">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="p-6 hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-white group">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">{job.type}</Badge>
                      {savedJobs.includes(job.id) && (
                        <Badge className="bg-sky-100 text-sky-700 border-0">
                          <Bookmark className="w-3 h-3 mr-1 fill-sky-700" />
                          Saved
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">{job.company}</span>
                      <span className="text-gray-400">•</span>
                      <span>{job.department}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 leading-relaxed">{job.description}</p>

                <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="text-gray-700 font-medium">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="text-gray-700 font-medium">{job.salary}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span className="text-gray-700 font-medium">Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {job.skills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => handleViewDetails(job)}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-md"
                >
                  Apply Now
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchCandidateProfileAndAnalyze(job)}
                  disabled={isAnalyzing}
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Fit'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleSaveJob(job.id)}
                  className={savedJobs.includes(job.id) 
                    ? "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100" 
                    : "border-gray-300 hover:border-emerald-300 hover:bg-emerald-50"
                  }
                >
                  <Bookmark className={`w-4 h-4 mr-2 ${savedJobs.includes(job.id) ? 'fill-sky-700' : ''}`} />
                  {savedJobs.includes(job.id) ? 'Saved' : 'Save'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Analysis Dialog */}
      <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Your Fit Analysis
            </DialogTitle>
          </DialogHeader>
          
          {analysisData && (
            <div className="space-y-6 pt-4">
              {analysisData.error ? (
                <Card className="p-4 bg-red-50 border-red-200">
                  <p className="text-red-700 text-sm">{analysisData.error}: {analysisData.details}</p>
                </Card>
              ) : (
                <>
                  {/* Fit Score */}
                  {analysisData.fit_score !== undefined && (
                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">Overall Fit Score</h3>
                        <span className="text-3xl font-bold text-purple-600">{analysisData.fit_score}%</span>
                      </div>
                      <Progress value={analysisData.fit_score} className="h-2" />
                      <p className="text-sm text-gray-600 mt-2">
                        {analysisData.fit_score >= 80 ? 'Excellent match!' : analysisData.fit_score >= 60 ? 'Good match' : 'Review required'}
                      </p>
                    </Card>
                  )}

                  {/* Skills Matched */}
                  {analysisData.skills_matched && analysisData.skills_matched.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        Skills You Have
                      </h4>
                      <div className="flex gap-2 flex-wrap">
                        {analysisData.skills_matched.map((skill: string, i: number) => (
                          <Badge key={i} className="bg-emerald-100 text-emerald-700 border-0">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills Missing */}
                  {analysisData.skills_missing && analysisData.skills_missing.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        Skills to Develop
                      </h4>
                      <div className="flex gap-2 flex-wrap">
                        {analysisData.skills_missing.map((skill: string, i: number) => (
                          <Badge key={i} variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {analysisData.candidate_strengths && analysisData.candidate_strengths.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Your Strengths</h4>
                      <ul className="space-y-2">
                        {analysisData.candidate_strengths.map((strength: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-emerald-600 font-bold mt-0.5">•</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {analysisData.candidate_weaknesses && analysisData.candidate_weaknesses.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Areas to Develop</h4>
                      <ul className="space-y-2">
                        {analysisData.candidate_weaknesses.map((weakness: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-amber-600 font-bold mt-0.5">•</span>
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Summary */}
                  {analysisData.candidate_summary && (
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <p className="text-sm text-blue-900 leading-relaxed">{analysisData.candidate_summary}</p>
                    </Card>
                  )}

                  {/* Recommendation */}
                  {analysisData.recommendation && (
                    <Card className="p-4 bg-slate-50 border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Recommendation</span>
                        <Badge className={analysisData.recommendation === 'RECOMMENDED' ? 'bg-emerald-100 text-emerald-700' : analysisData.recommendation === 'SUITABLE' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}>
                          {analysisData.recommendation}
                        </Badge>
                      </div>
                    </Card>
                  )}

                  <Button 
                    onClick={() => {
                      setIsAnalysisOpen(false);
                      handleViewDetails(selectedJob);
                    }}
                    className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-700"
                  >
                    Apply for This Role
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Apply for {selectedJob?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-6 pt-4">
              {selectedJob.jd_file && (
                <div className="p-3 bg-slate-50 rounded">
                  <a href={selectedJob.jd_file} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 underline">Download Job Description</a>
                </div>
              )}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-emerald-700 font-medium mb-1">Company</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedJob.company}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-700 font-medium mb-1">Location</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedJob.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-700 font-medium mb-1">Salary</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedJob.salary}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-700 font-medium mb-1">Type</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedJob.type}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Job Description</h4>
                <p className="text-gray-700 leading-relaxed">{selectedJob.description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                <p className="text-gray-700 leading-relaxed">{selectedJob.requirements}</p>
              </div>

              <div>
                <Label htmlFor="coverLetter" className="text-gray-900 mb-2">Cover Letter (Optional)</Label>
                <Textarea
                  id="coverLetter"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell us why you're a great fit for this role..."
                  rows={6}
                  className="mt-2 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleApply}
                  disabled={isApplying}
                  className="flex-1 h-11 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                >
                  {isApplying ? 'Submitting...' : 'Submit Application'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsApplyDialogOpen(false)}
                  className="flex-1 h-11 border-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

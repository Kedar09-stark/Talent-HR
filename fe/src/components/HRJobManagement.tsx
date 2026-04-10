import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, DollarSign, Clock, Users, Edit, Trash2, Upload, FileText, X, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { toast } from 'sonner';

type JobFormProps = {
  job: any;
  setJob: (v: any) => void;
  isEdit?: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadedFile: File | null;
  setUploadedFile: (f: File | null) => void;
  handlePostJob: () => Promise<void> | void;
  handleUpdateJob: () => void;
};

function JobForm({ job, setJob, isEdit = false, handleFileUpload, uploadedFile, setUploadedFile, handlePostJob, handleUpdateJob }: JobFormProps) {
  return (
    <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto">
      {/* File Upload Section */}
      <div className="p-4 rounded-xl bg-purple-50 border-2 border-dashed border-purple-300">
        <Label className="text-gray-900 mb-2 block">Upload Job Description File (Optional)</Label>
        <p className="text-xs text-gray-600 mb-3">Upload a PDF, DOC, or TXT file to auto-fill the job description</p>
        <div className="flex items-center gap-3">
          <label className="flex-1">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 p-3 bg-white border border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
              <Upload className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-900">Choose File</span>
            </div>
          </label>
          {uploadedFile && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-purple-200">
              <FileText className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-900">{uploadedFile.name}</span>
              <button
                onClick={() => setUploadedFile(null)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Job Title *</Label>
          <Input
            id="title"
            value={job.title}
            onChange={(e) => setJob({ ...job, title: e.target.value })}
            placeholder="e.g. Senior React Developer"
            autoFocus={!isEdit}
          />
        </div>
        <div>
          <Label htmlFor="department">Department *</Label>
          <Select
            value={job.department}
            onValueChange={(value) => setJob({ ...job, department: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
              <SelectItem value="Product">Product</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={job.location}
            onChange={(e) => setJob({ ...job, location: e.target.value })}
            placeholder="e.g. New York, NY or Remote"
          />
        </div>
        <div>
          <Label htmlFor="type">Employment Type *</Label>
          <Select
            value={job.type}
            onValueChange={(value) => setJob({ ...job, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="salary">Salary Range *</Label>
          <Input
            id="salary"
            value={job.salary}
            onChange={(e) => setJob({ ...job, salary: e.target.value })}
            placeholder="e.g. $120k - $160k"
          />
        </div>
        <div>
          <Label htmlFor="recruiter">Assign Recruiter *</Label>
          <Select
            value={job.assignedRecruiter}
            onValueChange={(value) => setJob({ ...job, assignedRecruiter: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select recruiter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
              <SelectItem value="Mike Chen">Mike Chen</SelectItem>
              <SelectItem value="Emily Davis">Emily Davis</SelectItem>
              <SelectItem value="David Wilson">David Wilson</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Job Description *</Label>
        <Textarea
          id="description"
          value={job.description}
          onChange={(e) => setJob({ ...job, description: e.target.value })}
          placeholder="Enter job description, requirements, and responsibilities..."
          rows={6}
        />
      </div>

      {/* Required Skills */}
      <div>
        <Label htmlFor="skills">Required Skills</Label>
        <div className="flex items-center gap-2">
          <Input
            id="skills"
            placeholder="Type a skill and press Enter or click Add"
            onKeyDown={(e: any) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const input = e.target as HTMLInputElement;
                const val = input.value.trim();
                if (val && !job.requiredSkills.includes(val.toLowerCase())) {
                  setJob({ ...job, requiredSkills: [...(job.requiredSkills || []), val.toLowerCase()] });
                  input.value = '';
                }
              }
            }}
          />
          <Button
            type="button"
            onClick={() => {
              const input = document.getElementById('skills') as HTMLInputElement | null;
              if (!input) return;
              const v = input.value.trim();
              if (v && !job.requiredSkills.includes(v.toLowerCase())) {
                setJob({ ...job, requiredSkills: [...(job.requiredSkills || []), v.toLowerCase()] });
                input.value = '';
                input.focus();
              }
            }}
            size="sm"
          >
            Add
          </Button>
        </div>
        <div className="mt-2 flex gap-2 flex-wrap">
          {job.requiredSkills && job.requiredSkills.length > 0 && job.requiredSkills.map((s: string) => (
            <Badge key={s} className="bg-purple-100 text-purple-700 border-0">
              <span className="capitalize">{s}</span>
              <button
                onClick={() => setJob({ ...job, requiredSkills: job.requiredSkills.filter((x: string) => x !== s) })}
                className="ml-2 text-purple-600 hover:text-purple-900"
                type="button"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <Button 
        onClick={isEdit ? handleUpdateJob : handlePostJob} 
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
      >
        {isEdit ? 'Update Job' : 'Post Job'}
      </Button>
    </div>
  );
}

export default function HRJobManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [selectedJobForAnalysis, setSelectedJobForAnalysis] = useState<any>(null);

  // Fetch jobs from API
  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch('http://127.0.0.1:8000/jobs/api/list/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      } else {
        console.error('Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch jobs from API on component mount
  useEffect(() => {
    fetchJobs();
  }, []);

  const [newJob, setNewJob] = useState({
    title: '',
    department: '',
    location: '',
    type: '',
    salary: '',
    description: '',
    assignedRecruiter: '',
    requiredSkills: [] as string[],
    jdFile: null,
  });

const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    setUploadedFile(file);

    // Add file to job object
    if (isEditDialogOpen && editingJob) {
      setEditingJob({ ...editingJob, jdFile: file });
    } else {
      setNewJob({ ...newJob, jdFile: file });
    }

    toast.success(`File "${file.name}" uploaded successfully!`);
  }
};


const handlePostJob = async () => {
  if (!newJob.title || !newJob.department || !newJob.assignedRecruiter) {
    toast.error("Please fill in all required fields");
    return;
  }

  const formData = new FormData();
  formData.append("title", newJob.title);
  formData.append("department", newJob.department);
  formData.append("location", newJob.location);
  formData.append("type", newJob.type);
  formData.append("salary", newJob.salary);
  formData.append("description", newJob.description);
  formData.append("assigned_recruiter", newJob.assignedRecruiter);

  if (newJob.jdFile) formData.append("jd_file", newJob.jdFile);
  if (newJob.requiredSkills && newJob.requiredSkills.length > 0) {
    formData.append('required_skills', JSON.stringify(newJob.requiredSkills));
  }

  try {
    // Use the access token (Simple JWT) stored at 'accessToken'.
    // Backend expects Authorization header with 'Bearer <token>' (see settings).
    const token = localStorage.getItem("accessToken");

    if (!token) {
      toast.error("You must be logged in to post a job");
      return;
    }

    const res = await fetch("http://127.0.0.1:8000/jobs/api/create/", {
      method: "POST",
      headers: {
        // Don't add Content-Type header; let the browser set the right boundary for FormData
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      // show DRF 'detail' messages (e.g. Authentication credentials were not provided.)
      toast.error(data.detail || data.error || "Failed to create job");
      return;
    }

    // Update jobs list
    setJobs([
      {
        ...newJob,
        id: data.id || data.job_id,
        applicants: 0,
        status: "Active",
        posted: "Just now",
        createdBy: data.created_by_username || 'Unknown',
      },
      ...jobs,
    ]);

    setNewJob({
      title: "",
      department: "",
      location: "",
      type: "",
      salary: "",
      description: "",
      assignedRecruiter: "",
      requiredSkills: [],
      jdFile: null,
    });

    setUploadedFile(null);
    setIsCreateDialogOpen(false);
    toast.success("Job posted successfully!");
  } catch (error) {
    console.error(error);
    toast.error("Error posting job");
  }
};


  const handleEditJob = (job: any) => {
    setEditingJob({ ...job });
    setIsEditDialogOpen(true);
  };

  const handleUpdateJob = () => {
    if (editingJob) {
      const token = localStorage.getItem('accessToken');
      
      const formData = new FormData();
      formData.append('title', editingJob.title);
      formData.append('department', editingJob.department);
      formData.append('location', editingJob.location);
      formData.append('type', editingJob.type);
      formData.append('salary', editingJob.salary.toString());
      formData.append('description', editingJob.description);
      formData.append('assigned_recruiter', editingJob.assigned_recruiter);
      
      if (uploadedFile) {
        formData.append('jd_file', uploadedFile);
      }

      fetch(`http://localhost:8000/jobs/api/update/${editingJob.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to update job');
          }
          return response.json();
        })
        .then(() => {
          setIsEditDialogOpen(false);
          setEditingJob(null);
          setUploadedFile(null);
          toast.success('Job updated successfully!');
          // Refetch jobs
          fetchJobs();
        })
        .catch((error) => {
          console.error('Error updating job:', error);
          toast.error('Failed to update job');
        });
    }
  };

  const handleDeleteJob = (jobId: number) => {
    if (confirm('Are you sure you want to delete this job posting?')) {
      const token = localStorage.getItem('accessToken');
      
      fetch(`http://localhost:8000/jobs/api/delete/${jobId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to delete job');
          }
          toast.success('Job deleted successfully!');
          // Refetch jobs
          fetchJobs();
        })
        .catch((error) => {
          console.error('Error deleting job:', error);
          toast.error('Failed to delete job');
        });
    }
  };

  const analyzeJobDescription = async (job: any) => {
    setSelectedJobForAnalysis(job);
    setIsAnalysisOpen(true);
    setIsAnalyzing(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('You must be logged in to analyze jobs');
        setIsAnalyzing(false);
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/jd/analyze-jd/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          jd_text: job.description,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalysisData(data);
    } catch (error) {
      console.error('Error analyzing job:', error);
      toast.error('Failed to analyze job description');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredJobs = jobs.filter((job: any) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase())
  );
  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Create New Job Posting</DialogTitle>
            </DialogHeader>
            <JobForm
              job={newJob}
              setJob={setNewJob}
              handleFileUpload={handleFileUpload}
              uploadedFile={uploadedFile}
              setUploadedFile={setUploadedFile}
              handlePostJob={handlePostJob}
              handleUpdateJob={handleUpdateJob}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search jobs by title, department, or location..."
          className="pl-10 h-11 bg-white border-gray-200"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-gray-500">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center text-gray-500">No jobs found</div>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                    <Badge variant="default" className="bg-green-100 text-green-700 border-0">
                      Active
                    </Badge>
                  </div>

                  {/* Required Skills Tags */}
                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {job.required_skills.map((skill: string) => (
                        <Badge key={skill} className="bg-purple-100 text-purple-700 text-xs font-medium border-0">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">{job.location || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">{job.salary || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">{job.type || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">{job.applicants || 0} applicants</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <span className="text-gray-600">Department: <span className="font-medium text-gray-900">{job.department}</span></span>
                    <span className="text-gray-600">Recruiter: <span className="font-medium text-gray-900">{job.assigned_recruiter || 'N/A'}</span></span>
                    {job.created_by_username && <span className="text-gray-600">Created By: <span className="font-medium text-gray-900">{job.created_by_username}</span></span>}
                    {job.created_at && <span className="text-gray-500">Posted {new Date(job.created_at).toLocaleDateString()}</span>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => analyzeJobDescription(job)}
                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze JD
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditJob(job)}
                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteJob(job.id)}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Job Posting</DialogTitle>
          </DialogHeader>
          {editingJob && (
            <JobForm
              job={editingJob}
              setJob={setEditingJob}
              isEdit={true}
              handleFileUpload={handleFileUpload}
              uploadedFile={uploadedFile}
              setUploadedFile={setUploadedFile}
              handlePostJob={handlePostJob}
              handleUpdateJob={handleUpdateJob}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Analysis Dialog */}
      <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Description Analysis</DialogTitle>
          </DialogHeader>
          
          {isAnalyzing ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing job description...</p>
              </div>
            </div>
          ) : analysisData ? (
            <div className="space-y-6">
              {/* Required Skills */}
              {analysisData.required_skills && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(analysisData.required_skills) ? (
                      analysisData.required_skills.map((skill: string, idx: number) => (
                        <Badge key={idx} className="bg-blue-100 text-blue-700 border-0">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-600">{analysisData.required_skills}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Ideal Candidate Profile */}
              {analysisData.ideal_candidate_profile && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Ideal Candidate Profile</h3>
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {analysisData.ideal_candidate_profile}
                    </p>
                  </Card>
                </div>
              )}

              {/* JD Gaps */}
              {analysisData.jd_gaps && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Areas for Improvement</h3>
                  <div className="space-y-2">
                    {Array.isArray(analysisData.jd_gaps) ? (
                      analysisData.jd_gaps.map((gap: string, idx: number) => (
                        <div key={idx} className="flex gap-2 text-sm">
                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{gap}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-600 text-sm">{analysisData.jd_gaps}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Job Strengths */}
              {analysisData.job_strengths && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Job Strengths</h3>
                  <div className="space-y-2">
                    {Array.isArray(analysisData.job_strengths) ? (
                      analysisData.job_strengths.map((strength: string, idx: number) => (
                        <div key={idx} className="flex gap-2 text-sm">
                          <AlertCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{strength}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-600 text-sm">{analysisData.job_strengths}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Summary */}
              {analysisData.summary && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Analysis Summary</h3>
                  <Card className="p-4 bg-purple-50 border-purple-200">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {analysisData.summary}
                    </p>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No analysis data available
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

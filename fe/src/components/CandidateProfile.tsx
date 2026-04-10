import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Upload, Mail, Phone, MapPin, Briefcase, GraduationCap, Award, Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface CandidateProfileProps {
  userName: string;
}

export default function CandidateProfile({ userName }: CandidateProfileProps) {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    title: '',
    bio: '',
    yearsOfExperience: '',
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [experience, setExperience] = useState<Array<any>>([]);
  const [education, setEducation] = useState<Array<any>>([]);

  // Modal state for adding experience / education
  const [showExpModal, setShowExpModal] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);

  const [expForm, setExpForm] = useState({ company: '', position: '', duration: '', description: '' });
  const [eduForm, setEduForm] = useState({ institution: '', degree: '', year: '' });
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const resumeInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveProfile = () => {
    saveProfile();
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  // Fetch profile on mount if access token available
  const fetchProfile = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch('http://127.0.0.1:8000/myprofile/candidate/profile/get/', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success') {
          const d = json.data || {};
          setProfile({
            fullName: d.fullName || '',
            email: d.email || '',
            phone: d.phone || '',
            location: d.location || '',
            title: d.title || '',
            bio: d.bio || '',
            yearsOfExperience: d.yearsOfExperience || '',
          });
          setSkills(Array.isArray(d.skills) ? d.skills : []);
          setExperience(Array.isArray(d.experience) ? d.experience : []);
          setEducation(Array.isArray(d.education) ? d.education : []);
          const makeAbsolute = (u: string | null) => {
            if (!u) return null;
            if (u.startsWith('http://') || u.startsWith('https://')) return u;
            return `http://127.0.0.1:8000${u}`;
          };
          setProfilePhotoUrl(makeAbsolute(d.profilePhoto || null));
          setResumeUrl(makeAbsolute(d.resume || null));
        }
      } else {
        // profile not found or unauthorized
      }
    } catch (err) {
      console.error('Profile fetch error', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Save profile to backend
  const saveProfile = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('fullName', profile.fullName || '');
      formData.append('email', profile.email || '');
      formData.append('phone', profile.phone || '');
      formData.append('location', profile.location || '');
      formData.append('title', profile.title || '');
      formData.append('bio', profile.bio || '');
      formData.append('yearsOfExperience', profile.yearsOfExperience || '');
      formData.append('skills', JSON.stringify(skills || []));
      formData.append('experience', JSON.stringify(experience || []));
      formData.append('education', JSON.stringify(education || []));
      if (profilePhotoFile) {
        formData.append('profilePhoto', profilePhotoFile);
      }
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      // Check if profile exists - if yes, use PUT to update; if no, use POST to create
      let method = 'POST';
      try {
        const checkRes = await fetch('http://127.0.0.1:8000/myprofile/candidate/profile/get/', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (checkRes.ok) {
          method = 'PUT'; // Profile exists, use PUT to update
        }
      } catch (err) {
        method = 'POST'; // Profile doesn't exist, use POST to create
      }

      const res = await fetch('http://127.0.0.1:8000/myprofile/candidate/profile/get/', {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.status === 'success') {
        toast.success('Profile saved successfully');
        // refresh profile to get uploaded file URLs
        await fetchProfile();
      } else {
        toast.error(json.message || 'Save failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error');
    }
  };

  // Add experience/education handlers
  const handleAddExperience = () => {
    if (!expForm.position && !expForm.company) return;
    setExperience([...(experience || []), { ...expForm }]);
    setExpForm({ company: '', position: '', duration: '', description: '' });
    setShowExpModal(false);
  };

  const handleAddEducation = () => {
    if (!eduForm.degree && !eduForm.institution) return;
    setEducation([...(education || []), { ...eduForm }]);
    setEduForm({ institution: '', degree: '', year: '' });
    setShowEduModal(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">My Profile</h2>
        <p className="text-gray-600">Manage your profile and resume information</p>
      </div>

      {/* Profile Picture & Resume */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <div className="text-center">
              <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center mb-3 overflow-hidden">
                {profilePhotoFile ? (
                  <img src={URL.createObjectURL(profilePhotoFile)} alt="profile" className="w-full h-full object-cover" />
                ) : profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">{(profile.fullName || 'U').charAt(0)}</span>
                )}
              </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files && e.target.files[0];
                if (f) setProfilePhotoFile(f);
              }}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
              {profilePhotoFile && (
                <Button variant="ghost" size="sm" onClick={() => setProfilePhotoFile(null)}>
                  Remove
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl mb-4">Resume</h3>
            <div className="p-4 border-2 border-dashed rounded-lg text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Upload your resume (PDF, DOCX)</p>
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files && e.target.files[0];
                  if (f) setResumeFile(f);
                }}
              />
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => resumeInputRef.current?.click()}>
                  Choose File
                </Button>
                {resumeFile ? (
                  <span className="text-xs text-gray-700">{resumeFile.name}</span>
                ) : resumeUrl ? (
                  <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-700 underline">View Resume</a>
                ) : (
                  <span className="text-xs text-gray-500">No file chosen</span>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{resumeFile ? `Selected: ${resumeFile.name}` : resumeUrl ? `Current: ${resumeUrl.split('/').pop()}` : 'Current resume: none'}</p>
          </div>
        </div>
      </Card>

      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-xl mb-4">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="title">Professional Title</Label>
            <Input
              id="title"
              value={profile.title}
              onChange={(e) => setProfile({ ...profile, title: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="experience">Years of Experience</Label>
            <Input
              id="experience"
              value={profile.yearsOfExperience}
              onChange={(e) => setProfile({ ...profile, yearsOfExperience: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="bio">Professional Summary</Label>
          <Textarea
            id="bio"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={4}
            className="mt-2"
          />
        </div>
      </Card>

      {/* Skills */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5" />
          <h3 className="text-xl">Skills</h3>
        </div>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Add a skill (e.g., React, Python)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
          />
          <Button onClick={handleAddSkill}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <Badge key={index} variant="secondary" className="px-3 py-1">
              {skill}
              <button
                onClick={() => handleRemoveSkill(skill)}
                className="ml-2 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </Card>

      {/* Experience */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            <h3 className="text-xl">Work Experience</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowExpModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </div>
        <div className="space-y-4">
          {experience.map((exp, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="mb-1">{exp.position}</h4>
                  <p className="text-gray-600">{exp.company}</p>
                </div>
                <Badge variant="outline">{exp.duration}</Badge>
              </div>
              <p className="text-sm text-gray-700">{exp.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Education */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            <h3 className="text-xl">Education</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowEduModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Education
          </Button>
        </div>
        <div className="space-y-4">
          {education.map((edu, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="mb-1">{edu.degree}</h4>
                  <p className="text-gray-600">{edu.institution}</p>
                </div>
                <Badge variant="outline">{edu.year}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Save Button */}
      {/* Modals */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl ring-1 ring-slate-900/5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold">Add Experience</h4>
                <p className="text-sm text-gray-500">Add a recent role to show on your profile</p>
              </div>
              <button
                onClick={() => setShowExpModal(false)}
                className="inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100 text-gray-600"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>Position</Label>
                <Input value={expForm.position} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpForm({ ...expForm, position: e.target.value })} />
              </div>
              <div>
                <Label>Company</Label>
                <Input value={expForm.company} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpForm({ ...expForm, company: e.target.value })} />
              </div>
              <div>
                <Label>Duration</Label>
                <Input value={expForm.duration} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpForm({ ...expForm, duration: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={expForm.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExpForm({ ...expForm, description: e.target.value })} rows={4} />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={() => setShowExpModal(false)}>Cancel</Button>
                <Button onClick={handleAddExperience}>Add Experience</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEduModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl ring-1 ring-slate-900/5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold">Add Education</h4>
                <p className="text-sm text-gray-500">Add your degree or certification</p>
              </div>
              <button
                onClick={() => setShowEduModal(false)}
                className="inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100 text-gray-600"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>Degree</Label>
                <Input value={eduForm.degree} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEduForm({ ...eduForm, degree: e.target.value })} />
              </div>
              <div>
                <Label>Institution</Label>
                <Input value={eduForm.institution} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEduForm({ ...eduForm, institution: e.target.value })} />
              </div>
              <div>
                <Label>Year</Label>
                <Input value={eduForm.year} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEduForm({ ...eduForm, year: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={() => setShowEduModal(false)}>Cancel</Button>
                <Button onClick={handleAddEducation}>Add Education</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSaveProfile}>Save Changes</Button>
      </div>
    </div>
  );
}

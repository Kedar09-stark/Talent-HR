import { Star, MapPin, DollarSign, Building2, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

export default function RecommendedJobs() {
  const recommendations = [
    {
      id: 1,
      title: 'Senior React Developer',
      company: 'TechCorp Inc.',
      location: 'New York, NY',
      salary: '$120k - $160k',
      matchScore: 95,
      reason: 'Your React and TypeScript skills are a perfect match',
      skills: ['React', 'TypeScript', 'Node.js'],
      type: 'Full-time',
    },
    {
      id: 2,
      title: 'Frontend Architect',
      company: 'Innovation Labs',
      location: 'San Francisco, CA',
      salary: '$150k - $190k',
      matchScore: 92,
      reason: 'Your architecture experience aligns with this role',
      skills: ['React', 'System Design', 'Leadership'],
      type: 'Full-time',
    },
    {
      id: 3,
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      location: 'Remote',
      salary: '$130k - $170k',
      matchScore: 88,
      reason: 'Your full-stack background matches 7 of 8 requirements',
      skills: ['React', 'Node.js', 'PostgreSQL'],
      type: 'Full-time',
    },
    {
      id: 4,
      title: 'Engineering Lead',
      company: 'ScaleUp Inc',
      location: 'Austin, TX',
      salary: '$160k - $200k',
      matchScore: 85,
      reason: 'Your experience level fits their leadership needs',
      skills: ['Leadership', 'React', 'Team Management'],
      type: 'Full-time',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Recommended for You</h2>
        <p className="text-gray-600">AI-powered job recommendations based on your profile</p>
      </div>

      {/* Recommendation Stats */}
      {/* <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg mb-1">Your Profile Strength: 87%</h3>
            <p className="text-sm text-gray-600">
              Complete your profile to get better recommendations and increase your match score
            </p>
          </div>
          <Button>Complete Profile</Button>
        </div>
      </Card> */}

      {/* Recommended Jobs */}
      <div className="space-y-4">
        {recommendations.map((job) => (
          <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow border-2 border-purple-100">
            <div className="flex items-start gap-4">
              {/* Match Score Badge */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <div className="text-white text-center">
                    <Star className="w-5 h-5 mx-auto mb-1 fill-white" />
                    <p className="text-xs">{job.matchScore}%</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">Match</p>
              </div>

              {/* Job Details */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl">{job.title}</h3>
                  <Badge variant="secondary">Recommended</Badge>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{job.company}</span>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg mb-4">
                  <p className="text-sm text-purple-900">
                    <span className="inline-block mr-1">💡</span>
                    {job.reason}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    {job.salary}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {job.skills.map((skill, index) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-col gap-2">
                <Button>Apply Now</Button>
                <Button variant="outline" size="sm">View Details</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Why These Recommendations */}
      <Card className="p-6">
        <h3 className="text-lg mb-4">Why these recommendations?</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-xs">1</span>
            </div>
            <p className="text-sm text-gray-700">
              <span>Skills Match:</span> We analyzed your profile and matched it with job requirements
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-xs">2</span>
            </div>
            <p className="text-sm text-gray-700">
              <span>Experience Level:</span> Jobs matched to your years of experience and seniority
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-xs">3</span>
            </div>
            <p className="text-sm text-gray-700">
              <span>Career Goals:</span> Aligned with your career progression and interests
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { Building2, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export default function PortalSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4 lg:p-6">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-md mb-6">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs sm:text-sm text-gray-600">Intelligent Recruitment Platform</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl mb-4 text-gray-900">Choose Your Portal</h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600">
            Access role-specific tools and features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* HR Panel Card */}
          <Card 
            onClick={() => navigate('/hr/login')}
            className="group relative overflow-hidden p-6 lg:p-8 hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 hover:border-purple-300 bg-gradient-to-br from-white to-purple-50/50"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-amber-200 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
            
            <div className="relative">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mb-5 lg:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <h2 className="text-2xl lg:text-3xl mb-3 text-gray-900">HR Portal</h2>
              <p className="text-sm lg:text-base text-gray-600 mb-6 lg:mb-8">
                Recruitment management & analytics platform
              </p>
              
              <div className="space-y-3 lg:space-y-4 mb-6 lg:mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center mt-0.5 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                  </div>
                  <span className="text-sm lg:text-base text-gray-700">Post & manage job openings</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center mt-0.5 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                  </div>
                  <span className="text-sm lg:text-base text-gray-700">AI-powered candidate screening</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center mt-0.5 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                  </div>
                  <span className="text-sm lg:text-base text-gray-700">Advanced analytics dashboard</span>
                </div>
              </div>

              <Button className="w-full h-11 lg:h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg">
                Access HR Portal
              </Button>
            </div>
          </Card>

          {/* Candidate Panel Card */}
          <Card 
            onClick={() => navigate('/candidate/login')}
            className="group relative overflow-hidden p-6 lg:p-8 hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 hover:border-emerald-300 bg-gradient-to-br from-white to-emerald-50/50"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-200 to-sky-200 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
            
            <div className="relative">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center mb-5 lg:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <h2 className="text-2xl lg:text-3xl mb-3 text-gray-900">Candidate Portal</h2>
              <p className="text-sm lg:text-base text-gray-600 mb-6 lg:mb-8">
                Your gateway to career opportunities
              </p>
              
              <div className="space-y-3 lg:space-y-4 mb-6 lg:mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center mt-0.5 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                  </div>
                  <span className="text-sm lg:text-base text-gray-700">Discover perfect job matches</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center mt-0.5 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                  </div>
                  <span className="text-sm lg:text-base text-gray-700">One-click applications</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center mt-0.5 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                  </div>
                  <span className="text-sm lg:text-base text-gray-700">AI-powered recommendations</span>
                </div>
              </div>

              <Button className="w-full h-11 lg:h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg">
                Access Candidate Portal
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

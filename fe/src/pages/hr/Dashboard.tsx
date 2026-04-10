import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { 
  LogOut,
  Building2,
  Bell,
  Menu,
  TrendingUp,
  UserCheck,
  FolderKanban,
  MessageSquareMore,
  Award
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '../../components/ui/sidebar';
import { Separator } from '../../components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Badge } from '../../components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '../../components/ui/sheet';
import HRDashboard from '../../components/HRDashboard';
import HRJobManagement from '../../components/HRJobManagement';
import HRApplications from '../../components/HRApplications';
import HRAnalytics from '../../components/HRAnalytics';
import HRMessages from '../../components/HRMessages';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    // Normalize role check to be case-insensitive and safe for null
    if ((role || '').toString().toLowerCase() !== 'hr') {
      navigate('/hr/login');
    } else {
      setUserName(name || 'User');
    }
  }, [navigate]);

  const handleLogout = () => {
    const refresh = localStorage.getItem('refreshToken');
    if (refresh) {
      // attempt to blacklist refresh token on server
      fetch('http://127.0.0.1:8000/accounts/api/logout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      }).catch((err) => {
        console.warn('Logout API call failed', err);
      }).finally(() => {
        // clear local storage regardless
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        navigate('/');
      });
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      navigate('/');
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: TrendingUp,
      path: '/hr/dashboard'
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: FolderKanban,
      path: '/hr/jobs'
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: UserCheck,
      path: '/hr/applications'
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquareMore,
      badge: 3,
      path: '/hr/messages'
    },
    // {
    //   id: 'analytics',
    //   label: 'Analytics',
    //   icon: Award,
    //   path: '/hr/analytics'
    // },
  ];

  const handleMenuClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent_Component = () => (
    <>
      <SidebarHeader className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-gray-900">TalentHub</h2>
            <p className="text-xs text-gray-600">HR Portal</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => handleMenuClick(item.path)}
                    isActive={location.pathname === item.path}
                    className={`relative group transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'bg-gradient-to-r from-purple-100 to-amber-50 text-gray-900 border-l-4 border-l-purple-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 transition-colors ${
                      location.pathname === item.path ? 'text-purple-600' : 'text-gray-600'
                    }`} />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge className="ml-auto bg-purple-600 text-white hover:bg-purple-700 border-0">
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto">
        <Separator className="mb-4 bg-gray-200" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 text-gray-900 hover:bg-gray-100 h-auto py-3">
              <Avatar className="w-9 h-9 border-2 border-purple-200">
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm truncate w-full font-medium">{userName}</span>
                <span className="text-xs text-gray-600">HR Manager</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </>
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-gray-50">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden lg:flex border-r border-gray-200 bg-white shadow-sm">
          <SidebarContent_Component />
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-4">
          {/* Top Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 bg-white border-b border-gray-200 px-4 lg:px-6 shadow-sm justify-between">
            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden text-gray-600 hover:text-gray-900">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px] bg-white border-0">
                <div className="flex flex-col h-full">
                  <SidebarContent_Component />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex-1 lg:flex-none">
              <h2 className="text-lg font-semibold text-gray-900">TalentHub HR</h2>
            </div>

            <Button variant="ghost" size="sm" className="relative text-gray-600 hover:text-gray-900">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-purple-600 rounded-full"></span>
            </Button>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="dashboard" element={<HRDashboard />} />
              <Route path="jobs" element={<HRJobManagement />} />
              <Route path="applications" element={<HRApplications />} />
              <Route path="messages" element={<HRMessages />} />
              {/* <Route path="analytics" element={<HRAnalytics />} /> */}
              <Route path="*" element={<HRDashboard />} />
            </Routes>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
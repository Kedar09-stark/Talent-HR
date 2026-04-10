import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function HRLogin() {
  const navigate = useNavigate();
    const [username, setUsername] = useState('');

  const [password, setPassword] = useState('');

const handleLogin = async () => {
  if (!username || !password) {
    alert('Please enter username and password');
    return;
  }

  try {
    const response = await fetch('http://127.0.0.1:8000/accounts/api/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username,           // directly use username input
        password, 
        role: 'HR'          // Role for HR login
      })
    });

    const data = await response.json();

    if (response.ok) {
      const user = data.user;
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      // Ensure role is stored in a consistent (lowercase) format
      localStorage.setItem('userRole', (user.role || '').toString().toLowerCase());
      localStorage.setItem('username', user.username);
      navigate('/hr/dashboard');
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (err) {
    console.error(err);
    alert('Server error');
  }
};



 return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 via-white to-amber-50">
      <Card className="w-full max-w-md p-8 shadow-2xl border-0">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg bg-gradient-to-br from-purple-600 to-purple-700">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl mb-2 text-gray-900">
            Welcome Back
          </h2>
          <p className="text-gray-600">
            Sign in to your dashboard
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <Label htmlFor="username" className="text-gray-700">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 h-11"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-gray-700">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-11"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <Button 
            className="w-full h-11 shadow-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            onClick={handleLogin}
          >
            Sign In
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-11 border-gray-300"
            onClick={() => navigate('/')}
          >
            Back to Portal Selection
          </Button>
        </div>
      </Card>
    </div>
  );
}
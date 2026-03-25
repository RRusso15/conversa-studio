import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { BotIcon } from 'lucide-react';
export function Signup() {
  const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/onboarding');
  };
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Link to="/" className="flex items-center gap-2 text-primary-600 mb-8">
        <BotIcon className="w-8 h-8" />
        <span className="text-2xl font-bold text-slate-900 tracking-tight">
          Conversa Studio
        </span>
      </Link>

      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Create an account
          </h1>
          <p className="text-slate-500">Start building AI chatbots for free.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Full Name" placeholder="Jane Doe" required />
          <Input
            label="Email"
            type="email"
            placeholder="name@company.com"
            required />
          
          <Input
            label="Password"
            type="password"
            placeholder="Create a strong password"
            required />
          

          <Button type="submit" fullWidth size="lg">
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-600 font-medium hover:text-primary-700">
            
            Log in
          </Link>
        </div>
      </Card>
    </div>);

}
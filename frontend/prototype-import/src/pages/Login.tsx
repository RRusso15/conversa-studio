import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { BotIcon } from 'lucide-react';
export function Login() {
  const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
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
            Welcome back
          </h1>
          <p className="text-slate-500">
            Enter your details to access your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            placeholder="name@company.com"
            required />
          
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            required />
          

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
              
              <span className="text-slate-600">Remember me</span>
            </label>
            <a
              href="#"
              className="text-primary-600 font-medium hover:text-primary-700">
              
              Forgot password?
            </a>
          </div>

          <Button type="submit" fullWidth size="lg">
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-primary-600 font-medium hover:text-primary-700">
            
            Sign up
          </Link>
        </div>
      </Card>
    </div>);

}
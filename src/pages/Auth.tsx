import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import lynxLogoAuth from '@/assets/lynx-logo-auth.png';

const emailSchema = z.string().email('Please enter a valid email address');

// Stronger password requirements
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').regex(/[a-z]/, 'Password must contain a lowercase letter').regex(/[A-Z]/, 'Password must contain an uppercase letter').regex(/[0-9]/, 'Password must contain a number').regex(/[^a-zA-Z0-9]/, 'Password must contain a special character');

// Password requirements for display
const passwordRequirements = [{
  regex: /.{8,}/,
  label: 'At least 8 characters'
}, {
  regex: /[a-z]/,
  label: 'One lowercase letter'
}, {
  regex: /[A-Z]/,
  label: 'One uppercase letter'
}, {
  regex: /[0-9]/,
  label: 'One number'
}, {
  regex: /[^a-zA-Z0-9]/,
  label: 'One special character'
}];
const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  useEffect(() => {
    // Set up auth state listener
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate('/dashboard', {
          replace: true
        });
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session?.user) {
        navigate('/dashboard', {
          replace: true
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const validateForm = (): boolean => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    // For signup, use strict validation; for login, just check minimum length
    if (isLogin) {
      if (password.length < 1) {
        newErrors.password = 'Password is required';
      }
    } else {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = 'Please meet all password requirements';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      if (isLogin) {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please try again.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Welcome back!');
      } else {
        const {
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });
        if (error) {
          if (error.message.includes('User already registered')) {
            toast.error('An account with this email already exists. Please log in instead.');
            setIsLogin(true);
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Account created successfully! You are now logged in.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-4 mb-8">
          
          <div className="flex flex-col items-start">
            <span className="text-3xl font-black tracking-tight text-foreground">LYNX</span>
            
          </div>
        </div>

        <div className="bg-card/50 border border-border rounded-2xl p-8 backdrop-blur-sm">
          {/* Logo at top of box */}
          <div className="flex justify-center mb-6">
            <img src={lynxLogoAuth} alt="Lynx Media" className="h-12 w-auto" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            {isLogin ? 'Sign in to access your dashboards' : 'Sign up to get started'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input id="email" type="email" value={email} onChange={e => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({
                  ...prev,
                  email: undefined
                }));
              }} placeholder="you@example.com" className={`w-full pl-10 pr-4 py-3 bg-input border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${errors.email ? 'border-destructive' : 'border-border'}`} />
              </div>
              {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({
                  ...prev,
                  password: undefined
                }));
              }} placeholder="••••••••" className={`w-full pl-10 pr-12 py-3 bg-input border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${errors.password ? 'border-destructive' : 'border-border'}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password}</p>}
              
              {/* Password Requirements - Only show during signup */}
              {!isLogin && password.length > 0 && <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Password requirements:</p>
                  <div className="grid grid-cols-1 gap-1">
                    {passwordRequirements.map((req, index) => {
                  const isMet = req.regex.test(password);
                  return <div key={index} className="flex items-center gap-2">
                          {isMet ? <Check className="w-3.5 h-3.5 text-primary" /> : <X className="w-3.5 h-3.5 text-muted-foreground" />}
                          <span className={`text-xs ${isMet ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {req.label}
                          </span>
                        </div>;
                })}
                  </div>
                </div>}
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(178,255,0,0.2)] hover:shadow-[0_0_30px_rgba(178,255,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </> : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <p className="mt-6 text-center text-muted-foreground">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={() => {
            setIsLogin(!isLogin);
            setErrors({});
          }} className="text-primary font-medium hover:text-primary/80 transition-colors">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Your data is secure and encrypted.
        </p>
      </div>
    </div>;
};
export default Auth;
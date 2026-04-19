'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await login(password);
    
    if (res.success) {
      router.push('/');
    } else {
      setError(res.error || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-neutral-800">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-medium text-neutral-200 mb-8 flex items-center gap-2">
          <Image src="/heart-red.webp" alt="Heart" width={20} height={20} className="w-6 h-6 opacity-100 block" unoptimized />
          Habits
        </h1>
        <form onSubmit={handleSubmit} className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passphrase"
            className="w-full bg-neutral-900 text-white placeholder-neutral-500 rounded-none border-b border-neutral-700 pb-2 bg-transparent outline-none focus:border-neutral-300 transition-colors pr-16"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-8 top-0 text-neutral-500 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button 
            type="submit" 
            disabled={loading || !password}
            className="absolute right-0 top-0 text-neutral-500 hover:text-white transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={20} className="animate-spin text-neutral-300" /> : <ArrowRight size={20} />}
          </button>
          {error && <p className="text-red-400 text-sm mt-4 tracking-wide">{error}</p>}
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Layers } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      const { token } = await api.login(email, password);
      localStorage.setItem('token', token);
      navigate('/');
    } catch (err) { setError('Invalid credentials'); }
  };

  const demoLogin = () => { setEmail(import.meta.env.VITE_DEMO_EMAIL || ''); setPassword(import.meta.env.VITE_DEMO_PASSWORD || ''); setTimeout(() => document.getElementById('login-form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })), 50); };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center"><Layers className="w-6 h-6 text-white" /></div>
            <h1 className="text-3xl font-black text-white">Momentum</h1>
          </div>
          <p className="text-gray-400">AI-native project management</p>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg font-medium transition-colors">Sign In</button>
          </form>
          <div className="mt-4">
            <button onClick={demoLogin} className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg text-sm transition-colors">Demo Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}

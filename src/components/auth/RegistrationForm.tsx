'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RegistrationFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function RegistrationForm({ onSuccess, onSwitchToLogin }: RegistrationFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: ''
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.email || !formData.email.includes('@')) {
      setMessage('Please enter a valid email address.');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        email: formData.email.trim(),
        password: formData.password.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim()
      });

      if (result.success) {
        setMessage(result.message);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error: any) {
      setMessage(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-10">
        <h1 className="text-2xl font-normal text-gray-800">Create Account</h1>
        <p className="text-sm text-gray-600 mt-2">
          Sign up to get started with QuickBooks integration and invoice management.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="John"
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-teal-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              placeholder="Doe"
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-teal-500"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-normal text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-teal-500"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-normal text-gray-700 mb-2">
            Password *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Create a password"
            className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-teal-500"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-normal text-gray-700 mb-2">
            Confirm Password *
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm your password"
            className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-teal-500"
            required
            disabled={isLoading}
          />
        </div>

        {message && (
          <div className={`border rounded-md px-4 py-3 ${
            message.includes('success') || message.includes('registered')
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !formData.email || !formData.password || !formData.confirmPassword}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Creating Account...</span>
            </div>
          ) : (
            "Create Account"
          )}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            disabled={isLoading}
          >
            Already have an account? Sign in
          </button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </div>
      </form>
    </div>
  );
}
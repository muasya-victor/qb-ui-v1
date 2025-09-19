'use client';

import { useState } from 'react';

export default function QuickBooksUserInfo() {
  const [token, setToken] = useState<string>('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = async () => {
    if (!token) {
      setError('Please provide an access token.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        'https://accounts.platform.intuit.com/v1/openid_connect/userinfo',
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`, // ✅ attach token
          },
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error_description || 'Failed to fetch user info');
      }

      const data = await response.json();
      setUserInfo(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-lg font-semibold mb-2">QuickBooks User Info</h2>

      <input
        type="text"
        placeholder="Paste access token here"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="w-full border px-2 py-1 mb-2"
      />

      <button
        onClick={fetchUserInfo}
        disabled={loading}
        className="px-3 py-1 bg-blue-600 text-white rounded"
      >
        {loading ? 'Fetching...' : 'Get User Info'}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {userInfo && (
        <pre className="mt-4 p-2 bg-gray-100 rounded text-sm overflow-x-auto">
          {JSON.stringify(userInfo, null, 2)}
        </pre>
      )}
    </div>
  );
}

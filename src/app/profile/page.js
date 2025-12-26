'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import ProfileMenu from '@/components/ProfileMenu';
import { fetchProfile, getToken } from '@/utils/auth';

export default function ProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await fetchProfile();
        if (p) setUser(p);
        else if (!getToken()) window.location.href = '/login?redirect=/profile';
      } catch (e) {}
    })();
  }, []);

  return (
    <div>
      <Header />
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Your profile</h1>
        <div className="max-w-md">
          <ProfileMenu user={user} setUser={setUser} />
        </div>
      </div>
    </div>
  );
}

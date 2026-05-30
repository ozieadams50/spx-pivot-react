import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

function Row({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      <p className="rounded-xl border border-white/10 bg-[#061018] px-3 py-2 text-sm text-slate-200">
        {value || <span className="text-slate-600">—</span>}
      </p>
    </div>
  );
}

export default function ContactInfo() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    apiFetch('/profile').then(setProfile).catch(() => {});
  }, []);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Contact Info</h1>
        <p className="mt-1 text-sm text-slate-400">
          Your name, email, and phone number on file. Contact your administrator to make changes.
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-white/10 bg-[#0d1f2d] p-6 shadow-lg">
        {!profile ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Row label="First Name" value={profile.firstName} />
              <Row label="Last Name"  value={profile.lastName}  />
              <Row label="Suffix"     value={profile.suffix}    />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Row label="Email Address" value={profile.email} />
              <Row label="Phone Number"  value={profile.phone} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

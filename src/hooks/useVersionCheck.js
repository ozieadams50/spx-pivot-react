import { useEffect, useRef } from 'react';

const POLL_MS = 2 * 60 * 1000; // check every 2 minutes

export function useVersionCheck() {
  const baseline = useRef(null);

  useEffect(() => {
    function fetchVersion() {
      return fetch('/version.json?_v=' + Date.now())
        .then(r => r.json())
        .then(d => d.version)
        .catch(() => null);
    }

    // Capture the version running right now
    fetchVersion().then(v => { baseline.current = v; });

    const id = setInterval(() => {
      fetchVersion().then(v => {
        if (v && baseline.current && v !== baseline.current) {
          window.location.reload();
        }
      });
    }, POLL_MS);

    return () => clearInterval(id);
  }, []);
}

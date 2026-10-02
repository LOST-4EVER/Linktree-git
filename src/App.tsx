import { useState, useEffect, useCallback } from 'react';
import { LinktreeData, GitHubConfig } from './types/linktree';
import { DEFAULT_LINKTREE_DATA } from './data/defaultProfile';
import { PublicProfile } from './components/public/PublicProfile';
import { AdminDrawer } from './components/admin/AdminDrawer';

export default function App() {
  const [data, setData] = useState<LinktreeData>(() => {
    // Check localStorage cache first for fast offline startup
    const localSaved = localStorage.getItem('gittree_data_cache');
    if (localSaved) {
      try {
        return JSON.parse(localSaved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_LINKTREE_DATA;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // GitHub credentials stored securely in browser localStorage
  const [githubConfig, setGithubConfig] = useState<GitHubConfig>(() => {
    return {
      token: localStorage.getItem('gittree_token') || '',
      owner: localStorage.getItem('gittree_owner') || '',
      repo: localStorage.getItem('gittree_repo') || '',
      branch: localStorage.getItem('gittree_branch') || 'main',
      filePath: localStorage.getItem('gittree_path') || 'data.json',
    };
  });

  // Step 1: Load data.json with graceful fallback
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/data.json');
        if (res.ok) {
          const json = await res.json();
          setData(json);
          localStorage.setItem('gittree_data_cache', JSON.stringify(json));
        } else {
          console.warn('data.json not found on server, using default profile.');
        }
      } catch (err) {
        console.warn('Network error fetching data.json, using default profile.', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Step 2: Handle URL query param ?admin=true
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('admin') === 'true') {
      setIsAdminOpen(true);
    }
  }, []);

  // Step 3: Handle key combination Ctrl + Shift + E or Cmd + Shift + E
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
      e.preventDefault();
      setIsAdminOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Persist edits in local cache so mobile users don't lose changes on tab reload
  const handleUpdateData = (newData: LinktreeData) => {
    setData(newData);
    localStorage.setItem('gittree_data_cache', JSON.stringify(newData));
  };

  // Save GitHub credentials to localStorage
  const handleUpdateGitHubConfig = (newConfig: GitHubConfig) => {
    setGithubConfig(newConfig);
    localStorage.setItem('gittree_token', newConfig.token);
    localStorage.setItem('gittree_owner', newConfig.owner);
    localStorage.setItem('gittree_repo', newConfig.repo);
    localStorage.setItem('gittree_branch', newConfig.branch);
    localStorage.setItem('gittree_path', newConfig.filePath);
  };

  return (
    <div className="relative min-h-screen">
      {/* Public Visitor View: Read-only, secret triple-tap on avatar or footer triggers admin */}
      <PublicProfile
        data={data}
        isLoading={isLoading}
        onSecretTrigger={() => setIsAdminOpen(true)}
      />

      {/* Secret Admin Drawer: Bottom sheet on mobile, slide-over on desktop */}
      <AdminDrawer
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        data={data}
        githubConfig={githubConfig}
        onUpdateData={handleUpdateData}
        onUpdateGitHubConfig={handleUpdateGitHubConfig}
      />
    </div>
  );
}

import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { History } from './screens/History';
import { Home } from './screens/Home';
import { Preview } from './screens/Preview';
import { Result } from './screens/Result';
import { Settings } from './screens/Settings';
import { DIRECT_MODE } from './lib/directSettings';

export function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/history" element={<History />} />
      <Route path="/preview" element={<Preview />} />
      <Route path="/result/:id" element={<Result />} />
      {DIRECT_MODE && <Route path="/settings" element={<Settings />} />}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { DIRECT_MODE } from './lib/directSettings';
import { Chat } from './screens/Chat';
import { History } from './screens/History';
import { Home } from './screens/Home';
import { Practice } from './screens/Practice';
import { Settings } from './screens/Settings';

export function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat/:id" element={<Chat />} />
      <Route path="/history" element={<History />} />
      <Route path="/practice" element={<Practice />} />
      {DIRECT_MODE && <Route path="/settings" element={<Settings />} />}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './styles/tokens.css';
import './styles/app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import { DIRECT_MODE } from './lib/directSettings';
import { loadThreads } from './lib/threads';
import { preloadAd } from './lib/toss';

void loadThreads();
if (DIRECT_MODE) void import('./lib/native').then((m) => m.setupNative());
preloadAd();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);

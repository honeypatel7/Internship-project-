import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { UserProvider } from './context/UserContext';
import { SidebarProvider } from './components/layout/SidebarContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <SidebarProvider>
        <App />
      </SidebarProvider>
    </UserProvider>
  </StrictMode>
);

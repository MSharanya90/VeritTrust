import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';

export const MainLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />
      <div style={{
        marginLeft: 'var(--sidebar-width)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: 'calc(100% - var(--sidebar-width))'
      }}>
        <TopNavbar />
        <main style={{
          marginTop: 'var(--topbar-height)',
          padding: '2rem',
          flex: 1,
          overflowY: 'auto'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};


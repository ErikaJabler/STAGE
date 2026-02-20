import { NavLink, useLocation } from 'react-router-dom';
import { ConsidLogo } from '../../assets/ConsidLogo';

const navItems = [
  { to: '/', label: 'Översikt', icon: OverviewIcon },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoArea}>
        <ConsidLogo variant="full" color="white" height={28} />
      </div>

      <nav style={styles.nav}>
        {navItems.map((item) => {
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={{
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              }}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <div style={styles.footerText}>Stage v0.1</div>
      </div>
    </aside>
  );
}

function OverviewIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100vh',
    backgroundColor: 'var(--color-bg-sidebar)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 'var(--z-sidebar)' as unknown as number,
  },
  logoArea: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  nav: {
    flex: 1,
    padding: '12px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    color: 'rgba(255, 255, 255, 0.7)',
    textDecoration: 'none',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'var(--font-weight-medium)' as unknown as number,
    transition: 'background-color var(--transition-fast), color var(--transition-fast)',
  },
  navLinkActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    color: '#FFFFFF',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 'var(--font-size-xs)',
    color: 'rgba(255, 255, 255, 0.4)',
  },
};

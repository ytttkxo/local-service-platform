import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoMark}>L</span>
            <span className={styles.logoText}>Locale</span>
          </Link>
          <nav className={styles.nav}>
            <Link to="/" className={styles.navLink}>Discover</Link>
          </nav>
          <div className={styles.userArea}>
            {user && (
              <>
                <div className={styles.avatar}>
                  {user.icon ? (
                    <img src={user.icon} alt="" />
                  ) : (
                    <span>{user.nickName?.charAt(0) || '?'}</span>
                  )}
                </div>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <p>Locale &mdash; Discover the best local dining</p>
      </footer>
    </div>
  );
}

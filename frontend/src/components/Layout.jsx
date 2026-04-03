import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout, isAdmin, isAnalyst } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const mainClass = ["/dashboard", "/records", "/users"].includes(pathname)
    ? "main main--compact"
    : "main";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/dashboard" className="brand">
          Ledger<span>Guard</span>
        </Link>
        <nav className="nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Dashboard
          </NavLink>
          {(isAdmin || isAnalyst) && (
            <NavLink
              to="/records"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Records
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Users
            </NavLink>
          )}
        </nav>
        <div className="user-strip">
          <span className="role-pill">{user?.role}</span>
          <span className="user-name">{user?.name}</span>
          <button type="button" className="btn ghost" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>
      <main className={mainClass}>
        <Outlet />
      </main>
    </div>
  );
}

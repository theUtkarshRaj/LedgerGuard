import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth() {
  const { token, sessionReady } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (!sessionReady) {
    return (
      <div className="page">
        <p className="muted">Restoring session…</p>
      </div>
    );
  }
  return <Outlet />;
}

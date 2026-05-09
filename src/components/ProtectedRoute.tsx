import { Navigate } from "react-router-dom";
import { Role, getRole } from "@/lib/mockData";

export const ProtectedRoute = ({ role, children }: { role: Role; children: JSX.Element }) => {
  const current = getRole();
  if (!current) return <Navigate to="/login" replace />;
  if (current !== role) {
    const target = current === "admin" ? "/admin" : current === "driver" ? "/driver" : "/user";
    return <Navigate to={target} replace />;
  }
  return children;
};

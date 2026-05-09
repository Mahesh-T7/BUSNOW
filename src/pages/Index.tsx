import { Navigate } from "react-router-dom";
import { getRole } from "@/lib/mockData";

const Index = () => {
  const role = getRole();
  if (!role) return <Navigate to="/login" replace />;
  return <Navigate to={role === "admin" ? "/admin" : role === "driver" ? "/driver" : "/user"} replace />;
};

export default Index;

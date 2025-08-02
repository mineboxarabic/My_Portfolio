import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";

const Admin = () => {
  return (
    <ProtectedRoute>
      <AdminLayout />
    </ProtectedRoute>
  );
};

export default Admin;
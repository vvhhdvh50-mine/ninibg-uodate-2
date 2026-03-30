import AdminUsersPage from '@/components/admin/AdminUsersPage';
import { isAdmin } from '@/constents';

export default function AdminUsersRoute() {
  return <>
    {isAdmin ? <AdminUsersPage /> : null}
  </>;
}

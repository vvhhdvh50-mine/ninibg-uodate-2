import AdminPage from '@/components/admin/AdminPage';
import { isAdmin } from '@/constents';

export default function Admin() {
  return <>
    {isAdmin ? <AdminPage /> : null}
  </>;
}

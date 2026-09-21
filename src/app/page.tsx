import { getLeads } from './actions';
import CrmDashboard from '@/components/CrmDashboard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const leads = await getLeads();

  return (
    <main>
      <CrmDashboard initialLeads={leads} />
    </main>
  );
}

import { useParams } from 'next/navigation';

export function useOrgSlug(): string | null {
  const params = useParams();
  return params?.orgSlug as string || null;
}
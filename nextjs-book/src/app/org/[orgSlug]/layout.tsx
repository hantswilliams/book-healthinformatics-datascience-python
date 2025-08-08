import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { orgSlug } = await params;
  
  // Verify organization exists
  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!organization) {
    notFound();
  }

  // Get current session
  const session = await getServerSession(authOptions);
  
  // For authenticated routes, verify user belongs to this organization
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    });

    if (!user || user.organization.slug !== orgSlug) {
      notFound();
    }
  }

  return <>{children}</>;
}
import { createEmailTemplate } from './email';

export interface InvitationEmailData {
  inviteeName: string;
  organizationName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
  expiresAt: Date;
}

export interface WelcomeEmailData {
  userName: string;
  organizationName: string;
  loginUrl: string;
}

export interface TrialWarningEmailData {
  organizationName: string;
  ownerName: string;
  daysRemaining: number;
  billingUrl: string;
}

export function createInvitationEmail({
  inviteeName,
  organizationName,
  inviterName,
  role,
  inviteUrl,
  expiresAt
}: InvitationEmailData) {
  const roleDisplayNames = {
    'OWNER': 'Organization Owner',
    'ADMIN': 'Administrator',
    'INSTRUCTOR': 'Instructor',
    'LEARNER': 'Learner'
  };

  const roleDescription = {
    'OWNER': 'full access to billing, team management, and all features',
    'ADMIN': 'ability to manage content, invite users, and oversee learning progress',
    'INSTRUCTOR': 'ability to assign content and track learner progress',
    'LEARNER': 'access to Python courses and progress tracking'
  };

  const content = `
    <p>Hello!</p>
    <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on Python Interactive, our collaborative Python learning platform.</p>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="margin: 0 0 8px 0; color: #1f2937;">Your Role: ${roleDisplayNames[role as keyof typeof roleDisplayNames]}</h3>
      <p style="margin: 0; color: #4b5563; font-size: 14px;">This gives you ${roleDescription[role as keyof typeof roleDescription]}.</p>
    </div>

    <p><strong>What's Python Interactive?</strong></p>
    <p>Python Interactive is a modern learning platform where teams master Python programming together. You'll get:</p>
    <ul>
      <li>🖥️ Interactive code editor with instant Python execution</li>
      <li>📚 Industry-specific Python courses (healthcare, finance, data science)</li>
      <li>📊 Progress tracking and team collaboration features</li>
      <li>🎯 Real-world projects and exercises</li>
    </ul>

    <p><strong>Next Steps:</strong></p>
    <p>Click the button below to accept your invitation and create your account. This invitation expires on <strong>${expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
  `;

  return createEmailTemplate({
    title: `You're invited to join ${organizationName}`,
    content,
    ctaText: 'Accept Invitation & Join Team',
    ctaUrl: inviteUrl,
    footerText: `Invited by ${inviterName} • Python Interactive Learning Platform`
  });
}

export function createWelcomeEmail({
  userName,
  organizationName,
  loginUrl
}: WelcomeEmailData) {
  const content = `
    <p>Welcome to <strong>${organizationName}</strong>, ${userName}! 🎉</p>
    
    <p>Your account has been successfully created and you're now part of the team. Here's what you can do next:</p>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="margin: 0 0 16px 0; color: #1f2937;">Quick Start Guide</h3>
      <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
        <li style="margin-bottom: 8px;"><strong>Sign in</strong> to your account using the button below</li>
        <li style="margin-bottom: 8px;"><strong>Explore courses</strong> available to your team</li>
        <li style="margin-bottom: 8px;"><strong>Start coding</strong> with our interactive Python editor</li>
        <li style="margin-bottom: 8px;"><strong>Track progress</strong> and collaborate with your teammates</li>
      </ol>
    </div>

    <p><strong>Need help?</strong></p>
    <p>If you have any questions, reach out to your team administrator or check out our help documentation once you're logged in.</p>
  `;

  return createEmailTemplate({
    title: `Welcome to ${organizationName}!`,
    content,
    ctaText: 'Sign In to Your Account',
    ctaUrl: loginUrl,
    footerText: `${organizationName} • Python Interactive Learning Platform`
  });
}

export function createTrialWarningEmail({
  organizationName,
  ownerName,
  daysRemaining,
  billingUrl
}: TrialWarningEmailData) {
  const urgencyLevel = daysRemaining <= 2 ? 'high' : daysRemaining <= 5 ? 'medium' : 'low';
  const urgencyColor = urgencyLevel === 'high' ? '#ef4444' : urgencyLevel === 'medium' ? '#f59e0b' : '#3b82f6';
  
  const content = `
    <p>Hi ${ownerName},</p>
    
    <div style="background-color: ${urgencyLevel === 'high' ? '#fef2f2' : '#fefbf0'}; border-left: 4px solid ${urgencyColor}; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: #1f2937;"><strong>Your ${organizationName} free trial expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.</strong></p>
    </div>

    <p>Don't let your team's Python learning journey get interrupted! Here's what you need to know:</p>
    
    <ul>
      <li><strong>Trial ends:</strong> In ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</li>
      <li><strong>What happens next:</strong> Set up billing to continue with uninterrupted access</li>
      <li><strong>Your team:</strong> Keep your teammates' learning progress and access intact</li>
    </ul>

    <p><strong>Choose your plan:</strong></p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0 0 12px 0; color: #1f2937;"><strong>Starter</strong> - $29/month (5 seats)</p>
      <p style="margin: 0 0 12px 0; color: #1f2937;"><strong>Pro</strong> - $99/month (25 seats)</p>
      <p style="margin: 0; color: #1f2937;"><strong>Enterprise</strong> - $299/month (unlimited seats)</p>
    </div>

    <p>Click below to set up your subscription and keep your team learning without interruption.</p>
  `;

  return createEmailTemplate({
    title: `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left in your free trial`,
    content,
    ctaText: 'Set Up Billing Now',
    ctaUrl: billingUrl,
    footerText: `${organizationName} • Python Interactive Learning Platform`
  });
}
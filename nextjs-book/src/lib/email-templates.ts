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

export interface VerificationCodeEmailData {
  userName: string;
  organizationName: string;
  verificationCode: string;
  expiresInMinutes: number;
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
    
    <p>Your account has been created and you're now part of the team. Here's how to get started:</p>
    
    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
      <h4 style="margin: 0 0 8px 0; color: #1e40af;">✨ Passwordless Login</h4>
      <p style="margin: 0; color: #1e40af; font-size: 14px;">No password needed! We'll send you a secure magic link to sign in.</p>
    </div>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="margin: 0 0 16px 0; color: #1f2937;">Getting Started</h3>
      <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
        <li style="margin-bottom: 8px;"><strong>Click the button below</strong> to go to the login page</li>
        <li style="margin-bottom: 8px;"><strong>Enter your email address</strong> and request a magic link</li>
        <li style="margin-bottom: 8px;"><strong>Check your email</strong> and click the secure login link</li>
        <li style="margin-bottom: 8px;"><strong>Start learning</strong> with interactive Python courses</li>
      </ol>
    </div>

    <p><strong>What's Python Interactive?</strong></p>
    <p>You'll have access to:</p>
    <ul>
      <li>🖥️ Interactive code editor with instant Python execution</li>
      <li>📚 Industry-specific Python courses</li>
      <li>📊 Progress tracking and team collaboration features</li>
    </ul>

    <p><strong>Need help?</strong></p>
    <p>If you have any questions, reach out to your team administrator.</p>
  `;

  return createEmailTemplate({
    title: `Welcome to ${organizationName}!`,
    content,
    ctaText: 'Access Your Account',
    ctaUrl: loginUrl,
    footerText: `${organizationName} • Python Interactive Learning Platform`
  });
}

export function createMagicLinkInvitationEmail({
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

    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
      <h4 style="margin: 0 0 8px 0; color: #1e40af;">✨ Passwordless Access</h4>
      <p style="margin: 0; color: #1e40af; font-size: 14px;">No password needed! Just click the link below to join instantly.</p>
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
    <p>Click the button below to join your team instantly. This invitation expires on <strong>${expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
  `;

  return createEmailTemplate({
    title: `Join ${organizationName} with Magic Link`,
    content,
    ctaText: 'Join Team Instantly',
    ctaUrl: inviteUrl,
    footerText: `Invited by ${inviterName} • Python Interactive Learning Platform`
  });
}

export function createVerificationCodeEmail({
  userName,
  organizationName,
  verificationCode,
  expiresInMinutes
}: VerificationCodeEmailData) {
  const content = `
    <p>Hello ${userName}!</p>
    
    <p>Here's your verification code to sign in to <strong>${organizationName}</strong>:</p>
    
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #e2e8f0; padding: 40px; border-radius: 16px; margin: 40px 0; text-align: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
      <div style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #1e293b; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; text-shadow: 0 1px 2px rgb(0 0 0 / 0.05);">
        ${verificationCode}
      </div>
      <p style="margin: 20px 0 0 0; color: #64748b; font-size: 15px; font-weight: 500;">
        This code expires in <strong style="color: #475569;">${expiresInMinutes} minutes</strong>
      </p>
    </div>

    <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left: 5px solid #3b82f6; padding: 20px; margin: 32px 0; border-radius: 8px;">
      <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 17px; font-weight: 600;">🔐 Security Note</h4>
      <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
        Never share this code with anyone. We'll never ask for your verification code via phone or email.
      </p>
    </div>

    <p><strong style="color: #374151;">Having trouble?</strong></p>
    <p>If you didn't request this code, you can safely ignore this email. The code will expire automatically.</p>
    
    <p>If you need help, contact your team administrator.</p>
  `;

  return createEmailTemplate({
    title: `Your verification code: ${verificationCode}`,
    content,
    footerText: `${organizationName} • Interactive Coding Platform`
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
const nodemailer = require('nodemailer');

// Create transporter (configure SMTP in .env)
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('⚠️  Email service not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: `"GoalSync Pro" <${process.env.SMTP_USER}>`,
      to, subject, html,
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Email send failed:', error.message);
  }
};

const sendGoalSubmissionEmail = async (to, employeeName, managerName) => {
  await sendEmail({
    to,
    subject: 'Goals Submitted for Your Approval – GoalSync Pro',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1e40af; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">GoalSync Pro</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <p>Hi ${managerName},</p>
          <p><strong>${employeeName}</strong> has submitted their goals for your review and approval.</p>
          <p>Please log in to GoalSync Pro to review and approve or return the goals.</p>
          <a href="${process.env.FRONTEND_URL}/team" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
            Review Goals
          </a>
          <p style="color: #64748b; font-size: 12px; margin-top: 24px;">GoalSync Pro – Enterprise Goal Management</p>
        </div>
      </div>
    `,
  });
};

const sendApprovalEmail = async (to, employeeName, status, comment) => {
  const isApproved = status === 'approved';
  await sendEmail({
    to,
    subject: `Your Goals Have Been ${isApproved ? 'Approved' : 'Returned'} – GoalSync Pro`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${isApproved ? '#16a34a' : '#dc2626'}; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">GoalSync Pro</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <p>Hi ${employeeName},</p>
          <p>Your goals have been <strong>${isApproved ? 'approved' : 'returned for revision'}</strong>.</p>
          ${comment ? `<p><strong>Manager's comment:</strong> ${comment}</p>` : ''}
          <a href="${process.env.FRONTEND_URL}/goals" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
            View My Goals
          </a>
        </div>
      </div>
    `,
  });
};

const sendCheckInReminderEmail = async (to, employeeName, quarter) => {
  await sendEmail({
    to,
    subject: `${quarter} Check-in Reminder – GoalSync Pro`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1e40af; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">GoalSync Pro</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <p>Hi ${employeeName},</p>
          <p>It's time for your <strong>${quarter} quarterly check-in</strong>. Please update your achievement progress in GoalSync Pro.</p>
          <a href="${process.env.FRONTEND_URL}/achievements" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
            Update Achievements
          </a>
        </div>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (to, firstName, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  await sendEmail({
    to,
    subject: 'Reset Your GoalSync Pro Password',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1e40af; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">GoalSync Pro</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <p>Hi ${firstName},</p>
          <p>You requested a password reset. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #64748b; font-size: 12px;">If you didn't request this, ignore this email. Your password won't change.</p>
          <p style="color: #64748b; font-size: 12px;">Or copy this link: ${resetUrl}</p>
        </div>
      </div>
    `,
  });
};

module.exports = { sendGoalSubmissionEmail, sendApprovalEmail, sendCheckInReminderEmail, sendPasswordResetEmail };

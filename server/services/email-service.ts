import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface VerificationEmailData {
  to: string;
  name: string;
  verificationToken: string;
  baseUrl: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor() {
    this.config = {
      host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: true, // Use SSL for port 465
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
      }
    };

    this.transporter = nodemailer.createTransport(this.config);
  }

  /**
   * Initialize and verify email service connection
   */
  async initialize(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
      return false;
    }
  }

  /**
   * Generate a secure verification token
   */
  generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Send verification email to new user
   */
  async sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
    try {
      const verificationUrl = `${data.baseUrl}/api/auth/verify-email?token=${data.verificationToken}`;
      console.log(`🔗 Generated verification URL: ${verificationUrl}`);
      
      const mailOptions = {
        from: {
          name: 'TrainPro',
          address: this.config.auth.user
        },
        to: data.to,
        subject: 'Verify Your TrainPro Account',
        html: this.getVerificationEmailTemplate(data.name, verificationUrl),
        text: this.getVerificationEmailText(data.name, verificationUrl)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${data.to}:`, result.messageId);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send verification email to ${data.to}:`, error);
      return false;
    }
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: {
          name: 'TrainPro',
          address: this.config.auth.user
        },
        to,
        subject: 'Welcome to TrainPro - Your AI Fitness Journey Begins!',
        html: this.getWelcomeEmailTemplate(name),
        text: this.getWelcomeEmailText(name)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${to}:`, result.messageId);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${to}:`, error);
      return false;
    }
  }

  /**
   * Get HTML template for verification email
   */
  private getVerificationEmailTemplate(name: string, verificationUrl: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your TrainPro Account</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background-color: #000000; color: #ffffff; padding: 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: bold; margin: 0; }
            .content { padding: 40px 30px; }
            .verify-button { display: inline-block; background-color: #000000; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 0; font-weight: bold; margin: 20px 0; text-align: center; }
            .verify-button:hover { background-color: #333333; }
            .footer { background-color: #f8f8f8; padding: 20px 30px; text-align: center; font-size: 14px; color: #666; }
            .security-note { background-color: #f0f8ff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
            .expiry-note { color: #d73502; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="logo">TrainPro</h1>
                <p>AI-Powered Fitness Coach</p>
            </div>
            
            <div class="content">
                <h2>Welcome to TrainPro, ${name}!</h2>
                
                <p>Thank you for joining TrainPro, your comprehensive AI-powered fitness and nutrition platform. To complete your registration and start your fitness journey, please verify your email address.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" class="verify-button">Verify My Account</a>
                </div>
                
                <div class="security-note">
                    <h4>Security Information:</h4>
                    <ul>
                        <li><span class="expiry-note">This verification link expires in 15 minutes</span></li>
                        <li>For your security, this link can only be used once</li>
                        <li>If you didn't create this account, please ignore this email</li>
                    </ul>
                </div>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="background-color: #f5f5f5; padding: 10px; border-left: 3px solid #000; font-family: monospace; word-break: break-all;">${verificationUrl}</p>
                
                <h3>What's Next?</h3>
                <p>Once verified, you'll have access to:</p>
                <ul>
                    <li><strong>Personalized Training Plans</strong> - Evidence-based workout routines</li>
                    <li><strong>Nutrition Tracking</strong> - AI-powered macro and calorie guidance</li>
                    <li><strong>Progress Analytics</strong> - Detailed insights into your fitness journey</li>
                    <li><strong>Mesocycle Planning</strong> - Professional periodization methodology</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>This email was sent by TrainPro. If you have any questions, please contact our support team.</p>
                <p>&copy; 2025 TrainPro. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Get plain text version of verification email
   */
  private getVerificationEmailText(name: string, verificationUrl: string): string {
    return `
Welcome to TrainPro, ${name}!

Thank you for joining TrainPro, your comprehensive AI-powered fitness and nutrition platform. To complete your registration and start your fitness journey, please verify your email address.

Verify your account: ${verificationUrl}

SECURITY INFORMATION:
- This verification link expires in 15 minutes
- For your security, this link can only be used once
- If you didn't create this account, please ignore this email

What's Next?
Once verified, you'll have access to:
- Personalized Training Plans - Evidence-based workout routines
- Nutrition Tracking - AI-powered macro and calorie guidance  
- Progress Analytics - Detailed insights into your fitness journey
- Mesocycle Planning - Professional periodization methodology

This email was sent by TrainPro. If you have any questions, please contact our support team.

© 2025 TrainPro. All rights reserved.
    `;
  }

  /**
   * Get HTML template for welcome email
   */
  private getWelcomeEmailTemplate(name: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TrainPro</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background-color: #000000; color: #ffffff; padding: 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: bold; margin: 0; }
            .content { padding: 40px 30px; }
            .cta-button { display: inline-block; background-color: #000000; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 0; font-weight: bold; margin: 20px 0; text-align: center; }
            .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .feature-item { padding: 20px; background-color: #f8f9fa; border-left: 4px solid #000; }
            .footer { background-color: #f8f8f8; padding: 20px 30px; text-align: center; font-size: 14px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="logo">TrainPro</h1>
                <p>Your AI-Powered Fitness Journey Starts Now</p>
            </div>
            
            <div class="content">
                <h2>🎉 Welcome aboard, ${name}!</h2>
                
                <p>Your TrainPro account has been successfully verified! You're now part of an exclusive community focused on evidence-based fitness and intelligent training.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.REPLIT_DOMAIN || 'https://trainpro.app'}" class="cta-button">Start Your Fitness Journey</a>
                </div>
                
                <h3>🚀 Get Started with These Features:</h3>
                
                <div class="feature-grid">
                    <div class="feature-item">
                        <h4>📊 Complete Your Profile</h4>
                        <p>Set your fitness goals, experience level, and preferences for personalized recommendations.</p>
                    </div>
                    <div class="feature-item">
                        <h4>💪 Create Your First Workout</h4>
                        <p>Build custom training templates or use our AI-generated workouts based on your goals.</p>
                    </div>
                    <div class="feature-item">
                        <h4>🍎 Track Your Nutrition</h4>
                        <p>Log meals and let our AI analyze your nutrition for optimal body composition.</p>
                    </div>
                    <div class="feature-item">
                        <h4>📈 Monitor Progress</h4>
                        <p>Track your body metrics, workout performance, and long-term trends.</p>
                    </div>
                </div>
                
                <h3>💡 Pro Tips for Success:</h3>
                <ul>
                    <li><strong>Consistency is key</strong> - Regular logging helps our AI provide better recommendations</li>
                    <li><strong>Trust the process</strong> - Our algorithms are based on Renaissance Periodization methodology</li>
                    <li><strong>Listen to your body</strong> - Use our auto-regulation features to adjust training load</li>
                </ul>
                
                <p>Need help getting started? Our comprehensive guides and tutorials are available in the app.</p>
            </div>
            
            <div class="footer">
                <p>Questions? Contact our support team anytime. We're here to help you succeed!</p>
                <p>&copy; 2025 TrainPro. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Get plain text version of welcome email
   */
  private getWelcomeEmailText(name: string): string {
    return `
Welcome aboard, ${name}!

Your TrainPro account has been successfully verified! You're now part of an exclusive community focused on evidence-based fitness and intelligent training.

Start Your Fitness Journey: ${process.env.REPLIT_DOMAIN || 'https://trainpro.app'}

GET STARTED WITH THESE FEATURES:

📊 Complete Your Profile
Set your fitness goals, experience level, and preferences for personalized recommendations.

💪 Create Your First Workout  
Build custom training templates or use our AI-generated workouts based on your goals.

🍎 Track Your Nutrition
Log meals and let our AI analyze your nutrition for optimal body composition.

📈 Monitor Progress
Track your body metrics, workout performance, and long-term trends.

PRO TIPS FOR SUCCESS:
- Consistency is key - Regular logging helps our AI provide better recommendations
- Trust the process - Our algorithms are based on Renaissance Periodization methodology  
- Listen to your body - Use our auto-regulation features to adjust training load

Need help getting started? Our comprehensive guides and tutorials are available in the app.

Questions? Contact our support team anytime. We're here to help you succeed!

© 2025 TrainPro. All rights reserved.
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService();
import Link from "next/link"
import { Store, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | RetailCore",
  description: "Privacy Policy for RetailCore Multi-Store Sales Management System",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="size-4" />
            Back to Login
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: August 28, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p className="text-muted-foreground">
              Welcome to RetailCore (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We operate the RetailCore Multi-Store Sales Management System 
              (the &quot;Service&quot;), a cloud-based point-of-sale and inventory management platform designed for retail businesses. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service, 
              including our website, web application, and any related services.
            </p>
            <p className="text-muted-foreground">
              By accessing or using the Service, you agree to the collection and use of information in accordance with this policy. 
              If you do not agree with the terms of this policy, please do not access the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium">2.1 Account Information</h3>
            <p className="text-muted-foreground">
              When you create an account, we collect information that identifies you as a user of the Service, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Full name (first name and last name)</li>
              <li>Email address</li>
              <li>Phone number (optional)</li>
              <li>Password (stored securely using bcrypt hashing — we never store plaintext passwords)</li>
              <li>Profile photograph (optional, uploaded by the user)</li>
              <li>Role within the organization (Admin or Employee)</li>
            </ul>

            <h3 className="text-lg font-medium">2.2 Business Data</h3>
            <p className="text-muted-foreground">
              As part of using the Service, you and your organization create and manage business data, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Shop/store names, addresses, and contact information</li>
              <li>Product information (names, descriptions, SKUs, prices, categories, images)</li>
              <li>Inventory levels, stock movements, and warehouse data</li>
              <li>Sales transactions (items sold, prices, discounts, payment methods, customer names)</li>
              <li>Employee records (names, positions, hire dates, salary information)</li>
              <li>System settings (currency, date format, timezone)</li>
              <li>Uploaded images (product photos, profile pictures)</li>
            </ul>

            <h3 className="text-lg font-medium">2.3 Authentication and Security Data</h3>
            <p className="text-muted-foreground">
              For security and audit purposes, we automatically collect:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Login timestamps and IP addresses</li>
              <li>Browser/device user agent strings</li>
              <li>Password reset request records</li>
              <li>Audit log entries (who performed what action and when)</li>
              <li>Session refresh tokens (for maintaining secure sessions)</li>
            </ul>

            <h3 className="text-lg font-medium">2.4 Automatically Collected Information</h3>
            <p className="text-muted-foreground">
              When you access the Service, we may automatically collect certain technical information, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Pages visited and time spent on pages</li>
              <li>Error logs and performance data</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
            <p className="text-muted-foreground">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Provide, operate, and maintain the Service</li>
              <li>Process your transactions and manage your inventory</li>
              <li>Authenticate users and maintain account security</li>
              <li>Send administrative notifications (e.g., password reset emails, deactivation notices)</li>
              <li>Generate analytics and reports for your business</li>
              <li>Prevent fraud, abuse, and security incidents</li>
              <li>Comply with legal obligations</li>
              <li>Improve and optimize the Service</li>
              <li>Communicate with you about updates, features, or support</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. How We Share Your Information</h2>
            <p className="text-muted-foreground">
              We do <strong>not</strong> sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Within your organization:</strong> Admin users can view and manage employee data, sales records, and business metrics for their assigned shops. Employees can only access data within their assigned shop.</li>
              <li><strong>Service providers:</strong> We use third-party services to operate the Service, including Vercel (hosting), Supabase (database and file storage), and Resend (transactional emails). These providers have access only to the information necessary to perform their services and are bound by confidentiality obligations.</li>
              <li><strong>Legal compliance:</strong> We may disclose information if required by law, regulation, or valid legal process.</li>
              <li><strong>Security:</strong> We may share information if we believe it is necessary to prevent harm, fraud, or violations of our Terms of Service.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Data Storage and Security</h2>
            <p className="text-muted-foreground">
              Your data is stored on secure cloud infrastructure provided by Supabase, hosted on Amazon Web Services (AWS). 
              We implement industry-standard security measures, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Encryption of data in transit (TLS/HTTPS)</li>
              <li>Passwords hashed with bcrypt (12 rounds) — we never store plaintext passwords</li>
              <li>JWT-based authentication with secure session tokens</li>
              <li>Role-based access control (Admin vs. Employee permissions)</li>
              <li>Row-level security on the database</li>
              <li>Regular security audits and dependency updates</li>
              <li>Input sanitization to prevent injection attacks</li>
              <li>Rate limiting on authentication endpoints</li>
            </ul>
            <p className="text-muted-foreground">
              While we take reasonable precautions, no method of electronic transmission or storage is 100% secure. 
              We cannot guarantee absolute security of your data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your information for as long as your account is active or as needed to provide the Service. Specifically:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Account data:</strong> Retained while your account is active. When an admin deletes an employee, all associated data (sales, inventory records, auth logs) is permanently deleted.</li>
              <li><strong>Sales records:</strong> Retained as long as your organization maintains the account. You may export your data at any time.</li>
              <li><strong>Audit logs:</strong> Retained for security and compliance purposes for up to 12 months.</li>
              <li><strong>Session tokens:</strong> Automatically expire after 8 hours. Refresh tokens are invalidated on logout or account deactivation.</li>
              <li><strong>Password reset tokens:</strong> Expire after 1 hour and are marked as used upon completion.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Your Rights</h2>
            <p className="text-muted-foreground">Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements).</li>
              <li><strong>Export:</strong> Admin users can export all business data (sales, inventory, audit logs) in CSV format from the application.</li>
              <li><strong>Restriction:</strong> Request restriction of processing of your personal data.</li>
              <li><strong>Objection:</strong> Object to processing of your personal data for certain purposes.</li>
            </ul>
            <p className="text-muted-foreground">
              To exercise any of these rights, please contact your organization administrator or reach out to our support team.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Cookies and Tracking</h2>
            <p className="text-muted-foreground">
              We use essential cookies and session tokens to maintain your authentication session. 
              These are strictly necessary for the Service to function. We do not use advertising cookies 
              or third-party tracking technologies. Session cookies are stored as HTTP-only secure cookies 
              and are automatically deleted when you sign out or your session expires.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground">
              The Service is not intended for use by individuals under the age of 16. We do not knowingly collect 
              personal information from children. If we become aware that we have collected personal information 
              from a child, we will take steps to delete that information promptly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. International Data Transfers</h2>
            <p className="text-muted-foreground">
              Your data may be transferred to and processed in countries other than your country of residence. 
              Our infrastructure providers (Vercel, Supabase, AWS) operate globally. We ensure that appropriate 
              safeguards are in place to protect your personal data in accordance with this Privacy Policy, 
              including the use of standard contractual clauses where required.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">11. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any material changes 
              by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date at the top. 
              Your continued use of the Service after any changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">12. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Email: support@retailcore.app</li>
              <li>Through the application: Admin Settings page</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Store className="size-4" />
              </div>
              <span className="font-semibold">RetailCore</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground underline-offset-4 hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground underline-offset-4 hover:underline">
                Terms of Service
              </Link>
              <Link href="/login" className="hover:text-foreground underline-offset-4 hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

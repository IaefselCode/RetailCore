import Link from "next/link"
import { Store, ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | RetailCore",
  description: "Terms of Service for RetailCore Multi-Store Sales Management System",
}

export default function TermsOfServicePage() {
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
            <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: August 28, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using RetailCore (the &quot;Service&quot;), a multi-store sales management and point-of-sale 
              platform operated by RetailCore (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), you agree to be bound by these Terms of 
              Service (&quot;Terms&quot;). If you are using the Service on behalf of an organization, you represent and 
              warrant that you have the authority to bind that organization to these Terms.
            </p>
            <p className="text-muted-foreground">
              If you do not agree to these Terms, you must not access or use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Description of Service</h2>
            <p className="text-muted-foreground">
              RetailCore is a cloud-based multi-store retail management system that provides:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Point-of-sale (POS) functionality for recording sales transactions</li>
              <li>Multi-store management with shop-level data isolation</li>
              <li>Product catalog and inventory management</li>
              <li>Employee management with role-based access control</li>
              <li>Sales analytics, reporting, and data export</li>
              <li>Audit logging and security features</li>
              <li>Stock health monitoring and reorder alerts</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Account Registration and Security</h2>
            
            <h3 className="text-lg font-medium">3.1 Account Creation</h3>
            <p className="text-muted-foreground">
              To use the Service, you must create an account. Admin accounts are created by the organization 
              administrator. Employee accounts are created by Admin users and assigned to specific shops. 
              You must provide accurate, current, and complete information during registration.
            </p>

            <h3 className="text-lg font-medium">3.2 Account Responsibilities</h3>
            <p className="text-muted-foreground">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Maintaining the confidentiality of your login credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
              <li>Ensuring your account information remains accurate and up to date</li>
            </ul>

            <h3 className="text-lg font-medium">3.3 Account Deactivation</h3>
            <p className="text-muted-foreground">
              Admin users may deactivate employee accounts at any time. Deactivated employees will be 
              immediately logged out and prevented from logging in. When an employee is deleted, all 
              associated data is permanently removed from the system. Admin accounts may be deactivated 
              by other Admin users. If all Admin accounts are deactivated, the organization may lose 
              access to its data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Acceptable Use</h2>
            <p className="text-muted-foreground">You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Use the Service for any illegal, fraudulent, or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service or its related systems</li>
              <li>Interfere with, disrupt, or overburden the Service or its infrastructure</li>
              <li>Use automated systems (bots, scrapers) to access the Service without our written consent</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Resell, sublicense, or distribute the Service to third parties</li>
              <li>Upload or transmit malicious code, viruses, or harmful content</li>
              <li>Use the Service to store or process data that violates applicable laws or regulations</li>
              <li>Manipulate or falsify sales records, inventory data, or audit logs</li>
              <li>Circumvent access controls, role restrictions, or security features</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Data and Intellectual Property</h2>
            
            <h3 className="text-lg font-medium">5.1 Your Data</h3>
            <p className="text-muted-foreground">
              You retain all rights to the data you create and upload through the Service (&quot;Your Data&quot;), 
              including sales records, product information, business documents, and images. We will not use 
              Your Data for any purpose other than providing the Service to you.
            </p>

            <h3 className="text-lg font-medium">5.2 Our Intellectual Property</h3>
            <p className="text-muted-foreground">
              The Service, including its software, design, branding, documentation, and all related 
              intellectual property, is owned by RetailCore and protected by copyright, trademark, and 
              other intellectual property laws. These Terms do not grant you any right to use our 
              trademarks, logos, or brand names.
            </p>

            <h3 className="text-lg font-medium">5.3 Data Portability</h3>
            <p className="text-muted-foreground">
              Admin users can export their data in CSV format from various sections of the application 
              (sales history, inventory, audit logs). We encourage you to regularly export your data 
              for your own records. Upon account termination, we will retain your data for up to 30 
              days to allow for data export, after which it will be permanently deleted.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Payments and Subscription</h2>
            <p className="text-muted-foreground">
              The Service may be offered under various subscription plans. If applicable:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Subscription fees are billed in advance on a recurring basis</li>
              <li>All fees are non-refundable unless otherwise stated in writing</li>
              <li>We reserve the right to modify pricing with at least 30 days&apos; prior notice</li>
              <li>Failure to pay fees may result in suspension or termination of your account</li>
              <li>You may cancel your subscription at any time; cancellation takes effect at the end of the current billing period</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Service Availability and Support</h2>
            <p className="text-muted-foreground">
              We strive to maintain high availability of the Service but do not guarantee uninterrupted access. 
              The Service may be temporarily unavailable due to scheduled maintenance, updates, or circumstances 
              beyond our reasonable control. We will make reasonable efforts to provide advance notice of 
              planned downtime.
            </p>
            <p className="text-muted-foreground">
              Support is provided on a best-effort basis. We do not guarantee response times for support 
              inquiries unless specified in a separate service level agreement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, 
                WHETHER EXPRESS, IMPLIED, OR STATUTORY.</li>
              <li>WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF 
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</li>
              <li>IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, 
                OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.</li>
              <li>OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM THESE TERMS SHALL NOT EXCEED THE AMOUNT 
                YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.</li>
              <li>WE ARE NOT LIABLE FOR LOSS OF PROFITS, DATA, BUSINESS OPPORTUNITIES, OR GOODWILL, 
                EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify, defend, and hold harmless RetailCore and its officers, directors, 
              employees, and agents from any claims, losses, damages, liabilities, costs, and expenses 
              (including reasonable attorneys&apos; fees) arising from:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any applicable law or third-party rights</li>
              <li>Your Data or any content you upload to the Service</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. Termination</h2>
            <p className="text-muted-foreground">
              We may suspend or terminate your access to the Service at any time, with or without cause, 
              with or without notice. Grounds for termination include but are not limited to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Violation of these Terms</li>
              <li>Fraudulent, abusive, or illegal activity</li>
              <li>Non-payment of applicable fees</li>
              <li>Requests by law enforcement</li>
              <li>Extended periods of inactivity</li>
            </ul>
            <p className="text-muted-foreground">
              Upon termination, your right to use the Service ceases immediately. We will provide a 
              30-day window for Admin users to export their data before permanent deletion.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">11. Dispute Resolution</h2>
            <p className="text-muted-foreground">
              Any disputes arising from these Terms shall be resolved through the following process:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Informal Resolution:</strong> Both parties will first attempt to resolve disputes informally through good-faith negotiation for at least 30 days.</li>
              <li><strong>Mediation:</strong> If informal resolution fails, the parties agree to submit to mediation before initiating any legal proceedings.</li>
              <li><strong>Governing Law:</strong> These Terms are governed by the laws of the jurisdiction in which the Service operator is incorporated, without regard to conflict of law provisions.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">12. Modifications to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms at any time. We will notify you of material 
              changes by posting the updated Terms on this page and updating the &quot;Last updated&quot; date. 
              For significant changes, we will provide additional notice (such as an in-app notification 
              or email). Your continued use of the Service after changes take effect constitutes 
              acceptance of the updated Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">13. Severability</h2>
            <p className="text-muted-foreground">
              If any provision of these Terms is found to be unenforceable or invalid, that provision 
              will be limited or eliminated to the minimum extent necessary, and the remaining provisions 
              will remain in full force and effect.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">14. Entire Agreement</h2>
            <p className="text-muted-foreground">
              These Terms, together with our Privacy Policy and any other legal notices or agreements 
              published by us on the Service, constitute the entire agreement between you and RetailCore 
              regarding the use of the Service, superseding any prior agreements or understandings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">15. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us:
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

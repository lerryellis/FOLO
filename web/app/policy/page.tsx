export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-[#F6F7F9] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#0B0F17]">Policies</h1>
          <p className="mt-4 text-lg text-[#64748b]">
            Understanding how FOLO protects your data and serves you
          </p>
        </div>

        {/* Privacy Policy */}
        <section className="mb-12 rounded-2xl border border-[#E8EAED] bg-white p-8">
          <h2 className="text-2xl font-semibold text-[#0B0F17]">Privacy Policy</h2>

          <div className="mt-6 space-y-4 text-[#475569]">
            <div>
              <h3 className="font-semibold text-[#0B0F17]">Data Collection</h3>
              <p className="mt-2">
                FOLO collects only the financial data you explicitly enter. We store transaction amounts, dates, categories, and goals to provide budget tracking and financial insights.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[#0B0F17]">Data Storage</h3>
              <p className="mt-2">
                Your data is encrypted and stored securely on Supabase. We never sell your financial information or share it with third parties without your explicit consent.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[#0B0F17]">Browser Data</h3>
              <p className="mt-2">
                FOLO uses your browser's locale settings to automatically detect your preferred currency. No location tracking or personal identification data is collected.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[#0B0F17]">Account Security</h3>
              <p className="mt-2">
                Authentication is handled by Supabase Auth using industry-standard security practices. Your password is never stored in plain text.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[#0B0F17]">Data Deletion</h3>
              <p className="mt-2">
                You can delete your account and all associated data at any time from your account settings. This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
        </section>

        {/* Terms of Service */}
        <section className="mb-12 rounded-2xl border border-[#E8EAED] bg-white p-8">
          <h2 className="text-2xl font-semibold text-[#0B0F17]">Terms of Service</h2>

          <div className="mt-6 space-y-4 text-[#475569]">
            <div>
              <h3 className="font-semibold text-[#0B0F17]">Use of Service</h3>
              <p className="mt-2">
                FOLO is provided as-is for personal financial planning and tracking. You agree to use the service responsibly and in compliance with all applicable laws.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[#0B0F17]">Liability</h3>
              <p className="mt-2">
                FOLO is a planning tool and not financial advice. We are not liable for financial decisions made based on data or insights provided by the application.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[#0B0F17]">Service Availability</h3>
              <p className="mt-2">
                While we strive for 99.9% uptime, FOLO may experience occasional downtime for maintenance or updates. We are not liable for data loss due to service interruptions.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[#0B0F17]">Updates to Terms</h3>
              <p className="mt-2">
                We may update these terms at any time. Continued use of FOLO constitutes acceptance of updated terms. Significant changes will be communicated to users.
              </p>
            </div>
          </div>
        </section>

        {/* Data Security */}
        <section className="mb-12 rounded-2xl border border-[#E8EAED] bg-white p-8">
          <h2 className="text-2xl font-semibold text-[#0B0F17]">Data Security</h2>

          <div className="mt-6 space-y-4 text-[#475569]">
            <div>
              <h3 className="font-semibold text-[#0B0F17]">Encryption</h3>
              <p className="mt-2">
                All data in transit is encrypted using TLS/SSL. Data at rest is encrypted on Supabase's secure infrastructure.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[#0B0F17]">Access Control</h3>
              <p className="mt-2">
                Only you can access your data. Authentication is required for every session, and you can revoke access from any device anytime.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[#0B0F17]">Compliance</h3>
              <p className="mt-2">
                FOLO complies with data protection regulations including GDPR and local privacy laws. See our privacy page for jurisdiction-specific information.
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border border-[#E8EAED] bg-white p-8">
          <h2 className="text-2xl font-semibold text-[#0B0F17]">Questions or Concerns?</h2>

          <p className="mt-4 text-[#475569]">
            If you have questions about these policies or concerns about your data, please contact us at{' '}
            <a href="mailto:privacy@folo.app" className="font-semibold text-[#10B981] hover:underline">
              privacy@folo.app
            </a>
          </p>

          <p className="mt-4 text-sm text-[#64748b]">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </section>
      </div>
    </div>
  );
}

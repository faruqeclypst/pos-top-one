import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - TokoKu',
  description: 'Privacy Policy for TokoKu POS Application',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose dark:prose-invert">
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us when using TokoKu POS Application, including:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>
              <strong>Account Information:</strong> Name, email address, phone number, and business information when you create an account.
            </li>
            <li>
              <strong>Transaction Data:</strong> Sales records, product information, payment details, and transaction history.
            </li>
            <li>
              <strong>Inventory Data:</strong> Product catalog, stock levels, supplier information, and pricing details.
            </li>
            <li>
              <strong>Payment Information:</strong> Payment method details processed through our integrated payment providers.
            </li>
            <li>
              <strong>Device Information:</strong> Device type, operating system, unique device identifiers, and usage data.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and manage your account</li>
            <li>Send you technical notices, updates, and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Monitor and analyze usage patterns and trends</li>
            <li>Communicate with you about products, services, and promotions</li>
            <li>Protect the rights, property, and safety of TokoKu and our users</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Data Storage and Security</h2>
          <p>
            We implement a variety of security measures to maintain the safety of your personal information when you place an 
            order or enter, submit, or access your personal information. Your personal information is contained behind secured 
            networks and is only accessible by a limited number of persons who have special access rights to such systems.
          </p>
          <p className="mt-2">
            All sensitive credit card information is processed through secure payment gateways and is not stored on our servers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to provide our services and for other purposes as required 
            or permitted by law, including to comply with our legal obligations, resolve disputes, and enforce our agreements.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Third-Party Services</h2>
          <p>
            We may use third-party service providers to help us operate our business and perform services related to our platform, 
            including:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>
              <strong>Payment Processors:</strong> To process payments and manage financial transactions.
            </li>
            <li>
              <strong>Cloud Storage:</strong> To store and backup your business data securely.
            </li>
            <li>
              <strong>Analytics Providers:</strong> To help us understand how users interact with our platform.
            </li>
            <li>
              <strong>Google Services:</strong> We may integrate with Google services for various functionalities including data 
              synchronization and reporting.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Your Rights</h2>
          <p>
            You have the right to:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Access your personal information</li>
            <li>Request correction of your personal information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to processing of your personal information</li>
            <li>Request restriction of processing your personal information</li>
            <li>Request transfer of your personal information to another party</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our service and hold certain information. 
            Cookies are files with a small amount of data which may include an anonymous unique identifier.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. You are advised to review this Privacy Policy periodically for 
            any changes. Changes to this Privacy Policy are effective when they are posted on this page.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="mt-2">
            Email: privacy@tokoku.com<br />
            Phone: +62 812-3456-7890
          </p>
        </section>
      </div>
    </div>
  );
}

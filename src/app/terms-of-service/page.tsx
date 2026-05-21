import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - TokoKu',
  description: 'Terms of Service for TokoKu POS Application',
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose dark:prose-invert">
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using TokoKu POS Application (the "Service"), you agree to be bound by these Terms of Service 
            and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from 
            using or accessing this service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Use License</h2>
          <p>
            Permission is granted to temporarily view the materials (information or software) on TokoKu POS Application's 
            website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer 
            of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any public or commercial purpose</li>
            <li>Attempt to decompile or reverse engineer any software on the site</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Disclaimer</h2>
          <p>
            The materials on TokoKu POS Application's website are provided on an "as is" basis. TokoKu makes no warranties, 
            expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, 
            implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of 
            intellectual property or other violation of rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Price Accuracy</h2>
          <p>
            We make every effort to ensure that the prices displayed on TokoKu POS Application are accurate and up-to-date. 
            However, prices can change frequently and we cannot guarantee the accuracy of prices at any given time. The final 
            price for any purchase or transaction shall be determined by TokoKu based on current pricing at the time of 
            transaction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Revisions and Errata</h2>
          <p>
            The materials appearing on TokoKu POS Application's website could include technical, typographical, or photographic 
            errors. TokoKu does not warrant that any of the materials on its website are accurate, complete, or current. 
            TokoKu may make changes to the materials contained on its website at any time without notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Modifications</h2>
          <p>
            TokoKu may revise these terms of service for its website at any time without notice. By using this website you are 
            agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of Indonesia and you irrevocably 
            submit to the exclusive jurisdiction of the courts in that State or location.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Contact Us</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <p className="mt-2">
            Email: support@tokoku.com<br />
            Phone: +62 812-3456-7890
          </p>
        </section>
      </div>
    </div>
  );
}

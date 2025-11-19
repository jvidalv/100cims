import Image from "next/image";

export default function PrivacyPolicy() {
  return (
    <main className="mx-auto w-full max-w-3xl px-8 py-12">
      <h1 className="mb-4 text-5xl font-black">Terms of service</h1>
      <article className="prose-invert prose">
        <h2>1. Introduction</h2>
        <p>
          By using <strong>Cims, sempre amunt</strong>, you confirm your
          acceptance of, and agree to be bound by, these terms and conditions.
        </p>

        <h2>2. Agreement to Terms and Conditions</h2>
        <p>
          This Agreement takes effect on the date on which you first use the{" "}
          <strong>Cims, sempre amunt</strong> application.
        </p>

        <h2>3. Unlimited Access Software License with Termination Rights</h2>
        <p>
          The <strong>Cims Software License</strong> facilitates the acquisition
          of <strong>Cims, sempre amunt</strong> through a single purchase,
          granting users unrestricted and perpetual access to its comprehensive
          functionalities. Tailored for independent creators, entrepreneurs, and
          small businesses, <strong>Cims, sempre amunt</strong> empowers users
          to create compelling web pages and online portfolios.
        </p>
        <p>
          This license offers a straightforward and flexible arrangement,
          exempting users from recurring fees or subscriptions. However, it is
          important to acknowledge that the licensor retains the right to
          terminate the license without conditions or prerequisites. This
          termination provision enables the licensor to exercise control over
          software distribution and utilization.
        </p>
        <p>
          Opting for the <strong>Cims Software License</strong> enables users to
          enjoy the benefits of the software while recognizing the licensor`s
          unrestricted termination rights, which provide adaptability and
          address potential unforeseen circumstances.
        </p>

        <h2>4. Refunds</h2>
        <p>
          Due to the nature of digital products, the{" "}
          <strong>Cims, sempre amunt</strong> boilerplate cannot be refunded or
          exchanged once access is granted.
        </p>

        <h2>5. Disclaimer</h2>
        <p>
          It is not warranted that <strong>Cims, sempre amunt</strong> will meet
          your requirements or that its operation will be uninterrupted or
          error-free. All express and implied warranties or conditions not
          stated in this Agreement (including, without limitation, loss of
          profits, loss or corruption of data, business interruption, or loss of
          contracts), insofar as such exclusion or disclaimer is permitted under
          applicable law, are excluded and expressly disclaimed. This Agreement
          does not affect your statutory rights.
        </p>

        <h2>6. Warranties and Limitation of Liability</h2>
        <p>
          <strong>Cims, sempre amunt</strong> does not provide any warranty,
          guarantee, or other assurance regarding the quality, fitness for
          purpose, or other aspects of the software.{" "}
          <strong>Cims, sempre amunt</strong> shall not be liable to you by
          reason of any representation (unless fraudulent), or any implied
          warranty, condition, or other term, or any duty at common law, for any
          loss of profit or any indirect, special, or consequential loss,
          damage, costs, expenses, or other claims (whether caused by{" "}
          <strong>Cims, sempre amunt</strong>`s negligence, its employees, or
          agents) that arise out of or in connection with the provision of any
          goods or services by <strong>Cims, sempre amunt</strong>.
        </p>
        <p>
          <strong>Cims, sempre amunt</strong> shall not be liable or deemed to
          be in breach of contract due to any delay in performing, or failure to
          perform, any of its obligations if the delay or failure was caused by
          circumstances beyond its reasonable control. Notwithstanding any
          contrary clauses in this Agreement, in the event that{" "}
          <strong>Cims, sempre amunt</strong> is deemed liable to you for a
          breach of this Agreement, you agree that{" "}
          <strong>Cims, sempre amunt</strong>`s liability is limited to the
          amount actually paid by you for its services or software. You hereby
          release <strong>Cims, sempre amunt</strong> from any and all
          obligations, liabilities, and claims exceeding this limitation.
        </p>

        <h2>7. Responsibilities</h2>
        <p>
          <strong>Cims, sempre amunt</strong> is not responsible for how users
          interact with or use user-generated content within the platform.
        </p>

        <h2>8. Price Adjustments</h2>
        <p>
          As we continue to improve <strong>Cims, sempre amunt</strong> and
          expand our offerings, the price may increase. Discounts are provided
          to help customers secure the current price without unexpected future
          increases.
        </p>

        <h2>9. General Terms and Governing Law</h2>
        <p>
          This Agreement is governed by the laws of <strong>Spain</strong>. You
          acknowledge that no joint venture, partnership, employment, or agency
          relationship exists between you and{" "}
          <strong>Cims, sempre amunt</strong> as a result of your use of these
          services. You agree not to present yourself as a representative,
          agent, or employee of <strong>Cims, sempre amunt</strong>. You also
          agree that <strong>Cims, sempre amunt</strong> will not be liable for
          any representation, act, or failure to act on your part.
        </p>

        <p>
          <em>
            Last updated: <strong>January 31, 2025</strong>.
          </em>
        </p>
      </article>
      <footer className="mt-16 pb-12 row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://expofast.app"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Powered by expofast →
        </a>
      </footer>
    </main>
  );
}

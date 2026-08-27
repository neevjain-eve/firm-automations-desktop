export const metadata = {
  title: 'Privacy Policy - Firm Automations'
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-slate-800">
      <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: 24 July 2026</p>

      <p className="mt-6">
        Firm Automations ("this app") is an internal tool built for staff at this firm
        to run accounting and finance automations. It is not distributed publicly and
        is not intended for use outside the firm. This page explains what data the
        app collects and how it is used.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">What we collect</h2>
      <ul className="mt-2 list-disc space-y-2 pl-6">
        <li>
          <strong>Account information:</strong> when you sign in with Microsoft, we
          receive your name, email address, and profile identifier from Microsoft. We
          use this only to identify you within the app and to restrict access to
          authorized users.
        </li>
        <li>
          <strong>Automation inputs and outputs:</strong> text you paste into an
          automation (for example, trial balance figures or account data) is sent to
          Anthropic's Claude API to generate a drafted result, and both the input and
          the output are stored in our database as an audit log of that run.
        </li>
        <li>
          <strong>Basic usage metadata:</strong> which automation was run, when, and
          by whom, for internal audit purposes.
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">How we use it</h2>
      <p className="mt-2">
        Data is used solely to operate the app: authenticating you, running the
        automation you requested, and keeping an internal record of what was run and
        by whom, so the firm can review automation output before it's used in any
        client-facing work. We do not use your data for advertising, and we do not
        sell or share it with third parties other than the infrastructure providers
        needed to run the app (listed below).
      </p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">
        Where data is processed
      </h2>
      <ul className="mt-2 list-disc space-y-2 pl-6">
        <li>Microsoft (sign-in only)</li>
        <li>Anthropic (Claude API, to generate automation output from your input)</li>
        <li>Supabase (Postgres database hosting for the audit log)</li>
        <li>Vercel (application hosting)</li>
      </ul>
      <p className="mt-2">
        Each of these providers processes data only as needed to provide their
        respective service to this app.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Data retention</h2>
      <p className="mt-2">
        Automation run records are retained for as long as the app is in use, for
        audit purposes. Contact the app administrator (below) to request deletion of
        your account or run history.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Your rights</h2>
      <p className="mt-2">
        As this is an internal employee tool, access is limited to authorized firm
        staff. You can request a copy of your data, or request that it be deleted, by
        contacting the app administrator.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Contact</h2>
      <p className="mt-2">
        Questions about this policy or your data can be directed to the app
        administrator at{' '}
        <a className="underline" href="mailto:neevjain152008@gmail.com">
          neevjain152008@gmail.com
        </a>
        .
      </p>
    </main>
  );
}

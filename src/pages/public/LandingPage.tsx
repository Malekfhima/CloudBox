import { ArrowRight, Check, FolderSync, Lock, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/src/components/ui/button';

const CAPABILITIES = [
  {
    index: '01',
    title: 'Incremental Block Sync',
    description:
      'Upload multi-gigabyte design bundles, CAD assemblies, and video rushes with 4 MB delta chunking that resumes automatically over unstable networks.',
    icon: FolderSync,
    span: 'lg:col-span-2',
  },
  {
    index: '02',
    title: 'Zero-Trust Access Governance',
    description:
      'Assign Viewer, Editor, or Owner permissions per file or folder, enforce link expirations, and require hardware-backed 2FA across your organization.',
    icon: Lock,
    span: 'lg:col-span-1',
  },
  {
    index: '03',
    title: 'Instant Browser Previews',
    description:
      'Inspect high-resolution photography, markdown specs, CSV forecasts, and JSON schemas directly in the browser without downloading local copies.',
    icon: Users,
    span: 'lg:col-span-1',
  },
  {
    index: '04',
    title: 'Full Audit & Trash Recovery',
    description:
      'Every upload, rename, share, and download is recorded in an immutable workspace audit timeline with instant Trash restoration.',
    icon: ShieldCheck,
    span: 'lg:col-span-2',
  },
];

export function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="mb-3 text-sm font-semibold text-blue-600">
              Enterprise Cloud Storage &amp; File Governance
            </p>
            <h1 className="text-balance font-display text-[clamp(2.25rem,4vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-slate-950">
              One organized vault for every file your team ships.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              CloudBox combines fast drag-and-drop file management, granular link permissions, and
              organization-wide storage visibility inside one clean, predictable workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Button asChild size="lg">
                <Link to="/register">
                  Create free workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">Try live demo workspace</Link>
              </Button>
            </div>
            <ul className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-blue-600" />
                15 GB free Starter tier
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-blue-600" />
                AES-256 encryption at rest
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-blue-600" />
                SOC 2 Type II compliant
              </li>
            </ul>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <img
                src="/src/assets/images/hero_cloudbox_workspace_1795034768472.jpg"
                alt="Minimalist architectural workspace running CloudBox"
                referrerPolicy="no-referrer"
                className="h-full min-h-[300px] w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* 4-column Quantitative Strip */}
        <div className="mt-14 grid grid-cols-2 gap-4 border-y border-slate-200 py-8 lg:grid-cols-4 lg:gap-8">
          <div>
            <p className="font-mono text-2xl font-bold text-slate-950 tabular-nums sm:text-3xl">
              99.99%
            </p>
            <p className="mt-1 text-sm text-slate-500">Multi-region uptime SLA</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-slate-950 tabular-nums sm:text-3xl">
              180 ms
            </p>
            <p className="mt-1 text-sm text-slate-500">Global metadata sync p95</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-slate-950 tabular-nums sm:text-3xl">
              256-bit
            </p>
            <p className="mt-1 text-sm text-slate-500">AES-GCM object encryption</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-slate-950 tabular-nums sm:text-3xl">
              30 days
            </p>
            <p className="mt-1 text-sm text-slate-500">One-click Trash recovery</p>
          </div>
        </div>
      </section>

      {/* Capabilities Asymmetric Bento */}
      <section className="bg-slate-50/70 py-20 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-950">
              Built for teams that treat files as critical infrastructure.
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Replace scattered shared drives with deterministic permissions, fast browser previews,
              and centralized admin telemetry.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.index}
                className={`rounded-2xl border border-slate-200 bg-white p-7 ${cap.span}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-blue-600">
                    {cap.index}.
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <cap.icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-900">{cap.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Proof Adjacent to Capabilities */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <p className="text-base leading-relaxed text-slate-800">
              &ldquo;Before CloudBox, our Paris and Tokyo studios spent hours emailing expired asset
              links. Moving 4.2 TB of photography and CAD specs into CloudBox cut external asset
              handoff time by 64% in the first quarter.&rdquo;
            </p>
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-900">Claire Moreau</p>
              <p className="text-xs text-slate-500">Creative Director, Atelier Lyon</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <p className="text-base leading-relaxed text-slate-800">
              &ldquo;Our compliance team needed immutable download logs and per-seat quota enforcement
              without forcing engineers into clunky legacy VPN drives. CloudBox gave us full audit
              visibility in under a week.&rdquo;
            </p>
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-900">Devon Brooks</p>
              <p className="text-xs text-slate-500">Lead Data Engineer, Metric Labs</p>
            </div>
          </div>
        </div>

        {/* Final Conversion Block */}
        <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-8 sm:flex-row sm:items-center lg:p-10">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Ready to centralize your workspace files?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Start on the 15 GB Starter tier in 30 seconds or sign in directly to inspect the live
              CloudBox dashboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button asChild size="lg">
              <Link to="/register">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

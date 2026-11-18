import { useState } from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

const PLANS = [
  {
    name: 'Starter',
    audience: 'For individuals & freelancers',
    monthly: 0,
    annual: 0,
    quota: '15 GB Storage',
    cta: 'Start free',
    to: '/register',
    highlighted: false,
    limits: [
      '15 GB encrypted object storage',
      'Up to 100 MB per file upload',
      '30-day Trash recovery window',
      'Public share links (view-only)',
    ],
  },
  {
    name: 'Pro',
    audience: 'For consultants & creators',
    monthly: 15,
    annual: 12,
    quota: '100 GB Storage',
    cta: 'Choose Pro',
    to: '/register',
    highlighted: true,
    limits: [
      '100 GB encrypted object storage',
      'Up to 2 GB per file upload',
      'Editor & Viewer collaborator roles',
      '90-day version history & recovery',
    ],
  },
  {
    name: 'Business',
    audience: 'For scaling product teams',
    monthly: 23,
    annual: 19,
    quota: '500 GB / seat',
    cta: 'Choose Business',
    to: '/register',
    highlighted: false,
    limits: [
      '500 GB storage per workspace seat',
      'Centralized Admin Console & audit logs',
      'Expiring links & 2FA enforcement',
      'Priority support within 4 hours',
    ],
  },
  {
    name: 'Enterprise',
    audience: 'For regulated organizations',
    monthly: 40,
    annual: 34,
    quota: '1 TB+ / seat',
    cta: 'Contact sales',
    to: '/contact',
    highlighted: false,
    limits: [
      '1 TB+ custom regional vaults',
      'Dedicated EU / US / APAC data residency',
      'SOC 2 Type II & custom DPA terms',
      'Dedicated solutions architect',
    ],
  },
];

const MATRIX = [
  { feature: 'Storage allocation', starter: '15 GB', pro: '100 GB', business: '500 GB / seat', enterprise: '1 TB+ / seat' },
  { feature: 'Max single file upload', starter: '100 MB', pro: '2 GB', business: '10 GB', enterprise: '50 GB' },
  { feature: 'Trash retention', starter: '30 days', pro: '90 days', business: '180 days', enterprise: 'Unlimited' },
  { feature: 'Collaborator roles', starter: 'Viewer', pro: 'Viewer & Editor', business: 'Granular RBAC', enterprise: 'Custom Policies' },
  { feature: 'Admin audit logs', starter: '—', pro: '30 days', business: '1 year', enterprise: '7 years exportable' },
];

export function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-600">Transparent Pricing</p>
          <h1 className="mt-2 text-balance text-4xl font-bold tracking-tight text-slate-950">
            Predictable storage pricing that scales with your team.
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Start with 15 GB free. Upgrade or adjust workspace seats anytime from the Billing console.
          </p>
        </div>

        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setBilling('monthly')}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
              billing === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBilling('annual')}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
              billing === 'annual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            Annual (Save 18%)
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const price = billing === 'annual' ? plan.annual : plan.monthly;
          return (
            <div
              key={plan.name}
              className={cn(
                'flex flex-col rounded-2xl border bg-white p-6',
                plan.highlighted
                  ? 'border-blue-600 ring-1 ring-blue-600'
                  : 'border-slate-200',
              )}
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
                <p className="mt-1 text-xs text-slate-500">{plan.audience}</p>
              </div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-mono text-3xl font-bold text-slate-950 tabular-nums">
                  ${price}
                </span>
                <span className="text-xs text-slate-500">
                  {price === 0 ? 'forever' : '/ user / mo'}
                </span>
              </div>
              <p className="mt-1.5 font-mono text-xs font-medium text-blue-600">{plan.quota}</p>

              <ul className="mt-6 flex-1 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
                {plan.limits.map((lim) => (
                  <li key={lim} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={plan.highlighted ? 'default' : 'outline'}
                className="mt-6 w-full"
              >
                <Link to={plan.to}>{plan.cta}</Link>
              </Button>
            </div>
          );
        })}
      </div>

      {/* Concrete Comparison Matrix */}
      <div className="mt-16 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Plan Limits &amp; Specifications</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-white text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Specification</th>
                <th className="px-6 py-3.5">Starter</th>
                <th className="px-6 py-3.5">Pro</th>
                <th className="px-6 py-3.5">Business</th>
                <th className="px-6 py-3.5">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {MATRIX.map((row) => (
                <tr key={row.feature} className="hover:bg-slate-50/60">
                  <td className="px-6 py-3.5 font-medium text-slate-900">{row.feature}</td>
                  <td className="px-6 py-3.5 tabular-nums">{row.starter}</td>
                  <td className="px-6 py-3.5 font-medium text-blue-700 tabular-nums">{row.pro}</td>
                  <td className="px-6 py-3.5 tabular-nums">{row.business}</td>
                  <td className="px-6 py-3.5 tabular-nums">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

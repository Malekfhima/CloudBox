import { Globe, Lock, Server } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/src/components/ui/button';

export function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="text-sm font-semibold text-blue-600">About CloudBox</p>
          <h1 className="mt-2 text-balance text-4xl font-bold tracking-tight text-slate-950">
            Designed to keep distributed teams aligned around one source of truth.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Founded by distributed systems engineers and product designers, CloudBox bridges the gap
            between consumer-friendly cloud drives and strict enterprise object storage governance.
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            We operate sovereign storage clusters across North America, Europe, and Asia-Pacific,
            giving organizations deterministic latency and verifiable compliance without sacrificing
            interface craft.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/contact">Talk to our team</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/features">Explore platform</Link>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            <img
              src="/src/assets/images/preview_product_shot_1795034769554.jpg"
              alt="CloudBox precision storage hardware aesthetic"
              referrerPolicy="no-referrer"
              className="h-full max-h-[420px] w-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Privacy by architecture</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            We never scan, index, or monetize your stored assets. Files remain encrypted at rest and
            in transit under keys governed by your workspace.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Server className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Predictable performance</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Block-level delta uploads and global edge caching ensure multi-gigabyte media libraries
            open smoothly across offices and home networks.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Globe className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Regional data residency</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Pin team vaults to US-West, EU-Central, or AP-Northeast clusters to satisfy strict
            regional regulatory mandates.
          </p>
        </div>
      </div>
    </div>
  );
}

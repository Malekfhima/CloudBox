import {
  Activity,
  ArrowRight,
  Eye,
  FolderTree,
  HardDrive,
  Lock,
  Share2,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/src/components/ui/button';

const FEATURE_GROUPS = [
  {
    num: '01',
    title: 'Drag-and-Drop Multi-File Uploads',
    description:
      'Drop entire batches of documents, raw images, and archives into any folder with live progress indicators and quota validation.',
    icon: UploadCloud,
  },
  {
    num: '02',
    title: 'Dual Grid & List Explorers',
    description:
      'Switch effortlessly between visual thumbnail cards and dense sortable data tables with keyboard-accessible multi-select.',
    icon: FolderTree,
  },
  {
    num: '03',
    title: 'In-Browser File Previews',
    description:
      'Preview photography, markdown documentation, CSV datasets, and JSON configs without polluting your local downloads folder.',
    icon: Eye,
  },
  {
    num: '04',
    title: 'Granular Sharing & Public Links',
    description:
      'Invite external partners with Can View or Can Edit roles, toggle public links on demand, and revoke access in one click.',
    icon: Share2,
  },
  {
    num: '05',
    title: 'Safe Trash & Instant Recovery',
    description:
      'Deleted files and folders move safely to Trash first—allowing instant restoration or permanent storage reclamation.',
    icon: Trash2,
  },
  {
    num: '06',
    title: 'Storage Telemetry & Breakdowns',
    description:
      'Visualize monthly storage growth and category distribution across documents, media, code, and archives.',
    icon: HardDrive,
  },
  {
    num: '07',
    title: 'Two-Factor & Session Controls',
    description:
      'Enforce 2FA, configure idle session timeouts, and revoke active browser sessions remotely from Security Settings.',
    icon: Lock,
  },
  {
    num: '08',
    title: 'Enterprise Admin Console',
    description:
      'Manage tenant users, adjust plan quotas, inspect storage nodes, and audit organization-wide activity logs.',
    icon: Activity,
  },
];

export function FeaturesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-blue-600">Platform Capabilities</p>
        <h1 className="mt-2 text-balance text-4xl font-bold tracking-tight text-slate-950">
          Every workflow required to store, preview, and govern team files.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          CloudBox is engineered for speed and clarity—eliminating modal bloat while giving admins
          and contributors precise control over every object.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {FEATURE_GROUPS.map((item) => (
          <div
            key={item.num}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-blue-600">{item.num}.</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <item.icon className="h-4.5 w-4.5" />
              </div>
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <div className="grid grid-cols-1 items-stretch lg:grid-cols-2">
          <div className="flex flex-col justify-center p-8 lg:p-12">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Built for creative studios and engineering teams alike.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Whether you are coordinating a 40-person retail launch or archiving SOC 2 compliance
              packets, CloudBox keeps folder hierarchies clean and searchable.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link to="/register">
                  Start your workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="min-h-[260px]">
            <img
              src="/src/assets/images/preview_design_deck_1795034769867.jpg"
              alt="Design studio collaborating with CloudBox"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

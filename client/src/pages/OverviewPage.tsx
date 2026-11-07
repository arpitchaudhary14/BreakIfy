import React, { useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  QrCode,
  BarChart2,
  MoreVertical,
  ArrowUpRight,
  MousePointerClick,
  Globe,
  Trash2,
  TrendingUp,
  Download,
  Filter,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../components/ui/Table';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { Dialog } from '../components/ui/Dialog';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';

interface LinkItem {
  id: string;
  title: string;
  originalUrl: string;
  shortCode: string;
  clicks: number;
  createdAt: string;
  status: 'active' | 'archived';
}

const PLACEHOLDER_LINKS: LinkItem[] = [
  {
    id: 'link-1',
    title: 'BreakIfy Product Launch Documentation',
    originalUrl: 'https://github.com/breakify/product/docs/v1-announcement',
    shortCode: 'v1-launch',
    clicks: 14230,
    createdAt: '2 hours ago',
    status: 'active',
  },
  {
    id: 'link-2',
    title: 'Q4 Developer Community Survey 2026',
    originalUrl: 'https://surveys.breakify.site/forms/d/e/developer-community-feedback-2026',
    shortCode: 'dev-survey',
    clicks: 8490,
    createdAt: '1 day ago',
    status: 'active',
  },
  {
    id: 'link-3',
    title: 'Enterprise Architecture Whitepaper & Benchmarks',
    originalUrl: 'https://storage.googleapis.com/breakify-assets/whitepapers/arch-v1.pdf',
    shortCode: 'whitepaper',
    clicks: 5120,
    createdAt: '3 days ago',
    status: 'active',
  },
  {
    id: 'link-4',
    title: 'Design System & Figma UI Kit',
    originalUrl: 'https://figma.com/@breakify/enterprise-tokens-and-components',
    shortCode: 'figma-kit',
    clicks: 3410,
    createdAt: '5 days ago',
    status: 'active',
  },
  {
    id: 'link-5',
    title: 'Global API Endpoint Status & Uptime',
    originalUrl: 'https://status.breakify.site/incidents/historical-metrics',
    shortCode: 'api-status',
    clicks: 1980,
    createdAt: '1 week ago',
    status: 'active',
  },
];

interface OverviewPageProps {
  onQuickCreate: () => void;
}

export function OverviewPage({ onQuickCreate }: OverviewPageProps) {
  const [links, setLinks] = useState<LinkItem[]>(PLACEHOLDER_LINKS);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [quickUrl, setQuickUrl] = useState('');

  // QR Modal state
  const [selectedQrLink, setSelectedQrLink] = useState<LinkItem | null>(null);

  // Delete modal state
  const [linkToDelete, setLinkToDelete] = useState<LinkItem | null>(null);

  const handleCopy = (code: string) => {
    const fullUrl = `https://breakify.site/${code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl) return;

    const newCode = Math.random().toString(36).substring(2, 8);
    const newLink: LinkItem = {
      id: `link-${Date.now()}`,
      title: quickUrl.replace(/^https?:\/\//, '').split('/')[0] || 'Shortened Link',
      originalUrl: quickUrl,
      shortCode: newCode,
      clicks: 0,
      createdAt: 'Just now',
      status: 'active',
    };

    setLinks([newLink, ...links]);
    setQuickUrl('');
    handleCopy(newCode);
  };

  const handleDeleteConfirm = () => {
    if (linkToDelete) {
      setLinks(links.filter((l) => l.id !== linkToDelete.id));
      setLinkToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Overview
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time redirect metrics, active links, and engagement tracking.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => alert('Exporting metrics report (CSV)...')}
          >
            Export
          </Button>
          <Button variant="primary" size="sm" onClick={onQuickCreate}>
            Create Link
          </Button>
        </div>
      </div>

      {/* Quick Shorten Bar */}
      <form onSubmit={handleQuickSubmit}>
        <div className="p-2 sm:p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214] shadow-sm flex flex-col sm:flex-row items-center gap-2">
          <div className="w-full relative flex items-center">
            <Link2 className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="url"
              required
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              placeholder="Paste long URL to shorten instantly..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
          <Button type="submit" variant="primary" size="sm" className="w-full sm:w-auto px-5">
            Shorten
          </Button>
        </div>
      </form>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Total Clicks</span>
              <MousePointerClick className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                33,230
              </span>
              <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                +24.8%
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">vs. previous 30 days</div>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Active Links</span>
              <Link2 className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                {links.length}
              </span>
              <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                +12%
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">All redirects healthy</div>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Avg. Click Rate</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                4.62%
              </span>
              <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                +0.8%
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Global campaigns</div>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Custom Domains</span>
              <Globe className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                1
              </span>
              <Badge variant="success" size="sm">
                Verified
              </Badge>
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">breakify.site (Primary)</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Links Table + Analytics Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Links Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Short Links</CardTitle>
                <CardDescription>Live routing telemetry and performance</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Filter className="w-3.5 h-3.5" />}
                onClick={() => alert('Filter applied')}
              >
                Filter
              </Button>
            </CardHeader>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Short Link & Title</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => {
                  const isCopied = copiedCode === link.shortCode;

                  const actionItems: DropdownItem[] = [
                    {
                      id: 'copy',
                      label: 'Copy Short Link',
                      icon: <Copy className="w-3.5 h-3.5" />,
                      onClick: () => handleCopy(link.shortCode),
                    },
                    {
                      id: 'qr',
                      label: 'View QR Code',
                      icon: <QrCode className="w-3.5 h-3.5" />,
                      onClick: () => setSelectedQrLink(link),
                    },
                    {
                      id: 'stats',
                      label: 'View Analytics',
                      icon: <BarChart2 className="w-3.5 h-3.5" />,
                      onClick: () => alert(`Analytics for ${link.shortCode}`),
                    },
                    {
                      id: 'delete',
                      label: 'Delete Link',
                      icon: <Trash2 className="w-3.5 h-3.5" />,
                      destructive: true,
                      onClick: () => setLinkToDelete(link),
                    },
                  ];

                  return (
                    <TableRow key={link.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              breakify.site/{link.shortCode}
                            </span>
                            <button
                              onClick={() => handleCopy(link.shortCode)}
                              title="Copy short link"
                              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-[280px] sm:max-w-[360px]">
                            {link.title}
                          </div>
                          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate max-w-[280px] sm:max-w-[360px] font-mono">
                            {link.originalUrl}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {link.clicks.toLocaleString()}
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <Dropdown
                          align="right"
                          trigger={
                            <button
                              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              aria-label="Link actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          }
                          items={actionItems}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Right 1 Col: Device & Referrer Analytics Snapshot */}
        <div className="space-y-6">
          {/* Traffic Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Top Channels</CardTitle>
              <CardDescription>Referral sources across all links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { source: 'Direct / Email', percentage: 48, clicks: '15,950' },
                { source: 'X / Twitter', percentage: 26, clicks: '8,639' },
                { source: 'LinkedIn', percentage: 14, clicks: '4,652' },
                { source: 'GitHub / Docs', percentage: 12, clicks: '3,989' },
              ].map((item) => (
                <div key={item.source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{item.source}</span>
                    <span className="text-zinc-500 font-mono text-[11px]">{item.clicks} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-zinc-800 dark:bg-zinc-200 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Device Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Device Distribution</CardTitle>
              <CardDescription>Audience hardware breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Desktop</span>
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">62.4%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Mobile</span>
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">34.1%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Tablet</span>
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">3.5%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Code Dialog Modal */}
      <Dialog
        isOpen={!!selectedQrLink}
        onClose={() => setSelectedQrLink(null)}
        title="QR Code Studio Preview"
        description={selectedQrLink ? `https://breakify.site/${selectedQrLink.shortCode}` : ''}
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setSelectedQrLink(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => {
                alert('QR Code downloaded as SVG / PNG');
                setSelectedQrLink(null);
              }}
            >
              Download QR
            </Button>
          </>
        }
      >
        {selectedQrLink && (
          <div className="py-4 flex flex-col items-center justify-center space-y-4">
            <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center">
              {/* Minimal SVG QR code matrix */}
              <svg
                className="w-48 h-48 text-zinc-900"
                viewBox="0 0 100 100"
                fill="currentColor"
              >
                <rect x="5" y="5" width="25" height="25" rx="3" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="12" y="12" width="11" height="11" rx="1" />
                <rect x="70" y="5" width="25" height="25" rx="3" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="77" y="12" width="11" height="11" rx="1" />
                <rect x="5" y="70" width="25" height="25" rx="3" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="12" y="77" width="11" height="11" rx="1" />

                <rect x="36" y="8" width="6" height="6" />
                <rect x="46" y="14" width="6" height="6" />
                <rect x="56" y="8" width="6" height="6" />
                <rect x="38" y="24" width="6" height="6" />
                <rect x="48" y="24" width="6" height="6" />
                <rect x="10" y="38" width="6" height="6" />
                <rect x="22" y="44" width="6" height="6" />
                <rect x="34" y="38" width="6" height="6" />
                <rect x="44" y="44" width="6" height="6" />
                <rect x="54" y="38" width="6" height="6" />
                <rect x="64" y="44" width="6" height="6" />
                <rect x="76" y="38" width="6" height="6" />
                <rect x="86" y="44" width="6" height="6" />
                <rect x="38" y="56" width="6" height="6" />
                <rect x="48" y="66" width="6" height="6" />
                <rect x="58" y="56" width="6" height="6" />
                <rect x="70" y="66" width="6" height="6" />
                <rect x="80" y="76" width="6" height="6" />
                <rect x="44" y="78" width="6" height="6" />
                <rect x="56" y="86" width="6" height="6" />
              </svg>
            </div>
            <p className="text-xs text-zinc-500 font-mono text-center">
              Scan to test redirect
            </p>
          </div>
        )}
      </Dialog>

      {/* Confirmation Dialog for Link Deletion */}
      <ConfirmationDialog
        isOpen={!!linkToDelete}
        onClose={() => setLinkToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Short Link"
        message={
          linkToDelete
            ? `Are you sure you want to delete breakify.site/${linkToDelete.shortCode}? This will immediately break existing QR codes and redirects.`
            : ''
        }
        confirmLabel="Delete Link"
        isDestructive={true}
      />
    </div>
  );
}

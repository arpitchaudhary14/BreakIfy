import React, { useState, useEffect } from 'react';
import {
  Link2,
  Copy,
  Check,
  QrCode,
  MoreVertical,
  ArrowUpRight,
  MousePointerClick,
  Trash2,
  TrendingUp,
  Download,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../components/ui/Table';
import { Dropdown } from '../components/ui/Dropdown';
import { Dialog } from '../components/ui/Dialog';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { linkApi, LinkItem } from '../services/linkApi';
import { getShortUrl, getShortDisplay } from '../utils/urlHelper';

interface OverviewPageProps {
  onQuickCreate: () => void;
}

export function OverviewPage({ onQuickCreate }: OverviewPageProps) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [quickUrl, setQuickUrl] = useState('');
  const [isShortening, setIsShortening] = useState(false);
  const [shortenError, setShortenError] = useState<string | null>(null);

  // QR Modal state
  const [selectedQrLink, setSelectedQrLink] = useState<LinkItem | null>(null);

  // Delete modal state
  const [linkToDelete, setLinkToDelete] = useState<LinkItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await linkApi.exportCsv();
    } catch (err: unknown) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const fetchOverviewLinks = async () => {
    try {
      setLoading(true);
      const res = await linkApi.listLinks({ limit: 10, sort: 'newest' });
      if (res && res.links) {
        setLinks(res.links);
      } else {
        setLinks([]);
      }
    } catch {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewLinks();
  }, []);

  useEffect(() => {
    const handleCreated = () => fetchOverviewLinks();
    window.addEventListener('link-created', handleCreated);
    return () => window.removeEventListener('link-created', handleCreated);
  }, []);

  const handleCopy = (code: string) => {
    const fullUrl = getShortUrl(code);
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;

    try {
      setIsShortening(true);
      setShortenError(null);
      const res = await linkApi.createLink({
        originalUrl: quickUrl.trim(),
        title: quickUrl.trim().replace(/^https?:\/\//, '').split('/')[0] || 'Shortened Link',
      });
      setQuickUrl('');
      handleCopy(res.link.shortCode);
      window.dispatchEvent(new CustomEvent('link-created', { detail: res.link }));
      await fetchOverviewLinks();
    } catch (err: unknown) {
      setShortenError(err instanceof Error ? err.message : 'Failed to shorten URL');
    } finally {
      setIsShortening(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (linkToDelete) {
      try {
        await linkApi.deleteLink(linkToDelete._id);
      } catch (e) {
        console.error(e);
      }
      setLinks((prev) => prev.filter((l) => l._id !== linkToDelete._id));
      setLinkToDelete(null);
    }
  };

  const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
  const activeLinks = links.filter((l) => l.status === 'active').length;

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
            onClick={handleExport}
            isLoading={isExporting}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export'}
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
          <Button type="submit" variant="primary" size="sm" className="w-full sm:w-auto px-5" disabled={isShortening}>
            {isShortening ? 'Shortening...' : 'Shorten'}
          </Button>
        </div>
        {shortenError && (
          <p className="text-xs text-red-500 mt-1 pl-1">{shortenError}</p>
        )}
      </form>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Total Clicks</span>
              <MousePointerClick className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                {totalClicks.toLocaleString()}
              </span>
              <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                Live
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Across all short links</div>
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
                {activeLinks.toLocaleString()}
              </span>
              <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                Active
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">All redirects healthy</div>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Avg. Clicks</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">
                {links.length > 0 ? (totalClicks / links.length).toFixed(1) : '0'}
              </span>
              <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                Avg
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Clicks per short link</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Links Table */}
      <div className="w-full">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Short Links</CardTitle>
              <CardDescription>Live routing telemetry and performance</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={fetchOverviewLinks}
            >
              Refresh
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-zinc-400 text-xs">
                      Loading recent links...
                    </TableCell>
                  </TableRow>
                ) : links.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-zinc-400 text-xs">
                      No links created yet. Shorten your first link above!
                    </TableCell>
                  </TableRow>
                ) : (
                  links.map((link) => {
                    const isCopied = copiedCode === link.shortCode;

                    const actionItems = [
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
                        id: 'delete',
                        label: 'Move to Recycle Bin',
                        icon: <Trash2 className="w-3.5 h-3.5" />,
                        destructive: true,
                        onClick: () => setLinkToDelete(link),
                      },
                    ];

                    return (
                      <TableRow key={link._id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <a
                                href={getShortUrl(link.shortCode)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline inline-flex items-center gap-1 group/link"
                                title="Open shortened redirect destination in new tab"
                              >
                                <span>{getShortDisplay(link.shortCode)}</span>
                                <ExternalLink className="w-3 h-3 text-zinc-400 group-hover/link:text-blue-500" />
                              </a>
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
                            <span>{link.status === 'active' ? 'Active' : 'Inactive'}</span>
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setLinkToDelete(link)}
                              className="p-1.5 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Delete link"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

      {/* QR Code Dialog Modal */}
      <Dialog
        isOpen={!!selectedQrLink}
        onClose={() => setSelectedQrLink(null)}
        title="QR Code Studio Preview"
        description={selectedQrLink ? getShortUrl(selectedQrLink.shortCode) : ''}
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="sm" onClick={() => setSelectedQrLink(null)}>
              Close
            </Button>
            {selectedQrLink && (
              <div className="flex gap-2">
                <a
                  href={`/api/v1/qr/${selectedQrLink._id}?format=png&download=true`}
                  download={`breakify-${selectedQrLink.shortCode}-qr.png`}
                >
                  <Button variant="outline" size="sm">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    PNG
                  </Button>
                </a>
                <a
                  href={`/api/v1/qr/${selectedQrLink._id}?format=svg&download=true`}
                  download={`breakify-${selectedQrLink.shortCode}-qr.svg`}
                >
                  <Button variant="primary" size="sm">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    SVG
                  </Button>
                </a>
              </div>
            )}
          </div>
        }
      >
        {selectedQrLink && (
          <div className="py-4 flex flex-col items-center justify-center space-y-4">
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center">
              <img
                src={`/api/v1/qr/${selectedQrLink._id}?format=png&width=300`}
                alt={`QR code for ${getShortDisplay(selectedQrLink.shortCode)}`}
                className="w-48 h-48 rounded object-contain bg-white"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
              <a
                href={getShortUrl(selectedQrLink.shortCode)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
              >
                {getShortUrl(selectedQrLink.shortCode)}
              </a>
            </div>
            <p className="text-xs text-zinc-500 font-mono text-center">
              Scan with your phone camera to test live redirect
            </p>
          </div>
        )}
      </Dialog>

      {/* Confirmation Dialog for Link Deletion */}
      <ConfirmationDialog
        isOpen={!!linkToDelete}
        onClose={() => setLinkToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Move Link to Recycle Bin"
        message={
          linkToDelete
            ? `Are you sure you want to delete ${getShortDisplay(linkToDelete.shortCode)}? It will be suspended and moved to your Recycle Bin for 30 days, where you can restore it anytime.`
            : ''
        }
        confirmLabel="Move to Recycle Bin"
        isDestructive={true}
      />
    </div>
  );
}

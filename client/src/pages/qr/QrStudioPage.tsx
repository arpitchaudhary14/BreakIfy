import { useState, useEffect, useRef, useMemo } from 'react';
import {
  QrCode,
  Link2,
  Plus,
  Palette,
  Sliders,
  Check,
  AlertTriangle,
  FileText,
  FileCode,
  Image as ImageIcon,
  Archive,
  BarChart2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../../components/ui/Table';
import { linkApi, LinkItem } from '../../services/linkApi';
import { getShortUrl, getShortDisplay } from '../../utils/urlHelper';
import {
  QrCustomization,
  DEFAULT_QR_CUSTOMIZATION,
  getContrastRatio,
  renderQrToCanvas,
  generateQrSvgString,
  downloadCanvasAsPng,
  downloadSvgString,
  downloadQrAsPdf,
  downloadBulkQrZip,
} from '../../services/qrApi';

const PRESET_FOREGROUNDS = [
  { label: 'Black', hex: '#000000' },
  { label: 'Zinc 900', hex: '#18181b' },
  { label: 'Zinc 800', hex: '#27272a' },
  { label: 'Charcoal', hex: '#111827' },
  { label: 'Slate', hex: '#0f172a' },
];

const PRESET_BACKGROUNDS = [
  { label: 'White', hex: '#ffffff' },
  { label: 'Zinc 50', hex: '#fafafa' },
  { label: 'Zinc 100', hex: '#f4f4f5' },
  { label: 'Warm White', hex: '#fdfbf7' },
  { label: 'Cool White', hex: '#f8fafc' },
];

export function QrStudioPage() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'analytics'>('single');
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);

  // Link Selection & Mode
  const [selectedLinkId, setSelectedLinkId] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDestination, setQuickDestination] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);

  // Customization Options
  const [options, setOptions] = useState<QrCustomization>({
    ...DEFAULT_QR_CUSTOMIZATION,
    logoUrl: '/assets/images/BreakIfy Logo.png',
  });

  // Canvas ref for live rendering
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);

  // Bulk state
  const [selectedBulkIds, setSelectedBulkIds] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  // Fetch available links
  const fetchLinks = async () => {
    try {
      setLoadingLinks(true);
      const res = await linkApi.listLinks({ limit: 100 });
      if (res && res.links) {
        setLinks(res.links);
        if (res.links.length > 0 && !selectedLinkId) {
          setSelectedLinkId(res.links[0]._id);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoadingLinks(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  // Determine active target URL
  const selectedLink = useMemo(() => {
    return links.find((l) => l._id === selectedLinkId);
  }, [links, selectedLinkId]);

  const activeTargetUrl = useMemo(() => {
    if (selectedLink) {
      return `${getShortUrl(selectedLink.shortCode)}?src=qr`;
    }
    return customText || getShortUrl('');
  }, [selectedLink, customText]);

  // Live Contrast Calculation
  const contrastRatio = useMemo(() => {
    return getContrastRatio(options.foreground, options.background);
  }, [options.foreground, options.background]);

  const isContrastSafe = contrastRatio >= 3.0;

  // Render QR to canvas whenever options or target URL changes
  useEffect(() => {
    if (!canvasRef.current) return;
    setIsRendering(true);
    renderQrToCanvas(canvasRef.current, activeTargetUrl, options)
      .catch(() => {})
      .finally(() => setIsRendering(false));
  }, [activeTargetUrl, options]);

  // Quick Create Short Link
  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDestination.trim()) return;

    try {
      setCreatingLink(true);
      const res = await linkApi.createLink({
        originalUrl: quickDestination.trim(),
        title: quickTitle.trim() || undefined,
        tags: ['qr-studio'],
      });

      if (res && res.link) {
        setLinks([res.link, ...links]);
        setSelectedLinkId(res.link._id);
        setIsQuickCreateOpen(false);
        setQuickTitle('');
        setQuickDestination('');
      }
    } catch {
      // Handle error
    } finally {
      setCreatingLink(false);
    }
  };

  // Download Handlers
  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const name = selectedLink ? `breakify-${selectedLink.shortCode}-qr.png` : 'breakify-qr.png';
    downloadCanvasAsPng(canvasRef.current, name);
  };

  const handleDownloadSvg = async () => {
    const svgStr = await generateQrSvgString(activeTargetUrl, options);
    const name = selectedLink ? `breakify-${selectedLink.shortCode}-qr.svg` : 'breakify-qr.svg';
    downloadSvgString(svgStr, name);
  };

  const handleDownloadPdf = () => {
    if (!canvasRef.current) return;
    const title = selectedLink ? selectedLink.title : 'Dynamic QR Code';
    const name = selectedLink ? `breakify-${selectedLink.shortCode}-qr.pdf` : 'breakify-qr.pdf';
    downloadQrAsPdf(canvasRef.current, title, activeTargetUrl, name);
  };

  // Bulk Handlers
  const toggleSelectAllBulk = () => {
    if (selectedBulkIds.size === links.length) {
      setSelectedBulkIds(new Set());
    } else {
      setSelectedBulkIds(new Set(links.map((l) => l._id)));
    }
  };

  const toggleSelectOneBulk = (id: string) => {
    const next = new Set(selectedBulkIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBulkIds(next);
  };

  const handleBulkDownload = async () => {
    if (selectedBulkIds.size === 0) return;

    const items = links
      .filter((l) => selectedBulkIds.has(l._id))
      .map((l) => ({
        title: l.title,
        shortCode: l.shortCode,
        targetUrl: `${getShortUrl(l.shortCode)}?src=qr`,
      }));

    try {
      setBulkGenerating(true);
      setBulkProgress({ current: 0, total: items.length });
      await downloadBulkQrZip(items, options, 'breakify-bulk-qrs.zip', (current, total) => {
        setBulkProgress({ current, total });
      });
    } finally {
      setBulkGenerating(false);
      setBulkProgress(null);
    }
  };

  // Total QR analytics metrics
  const totalClicksAll = useMemo(() => links.reduce((sum, l) => sum + (l.clicks || 0), 0), [links]);
  const totalQrScans = useMemo(() => links.reduce((sum, l) => sum + (l.qrScans || 0), 0), [links]);
  const qrAttributionRate = totalClicksAll > 0 ? ((totalQrScans / totalClicksAll) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            QR Studio
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Generate, customize, brand, and batch-export dynamic QR codes with scan attribution.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'single'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Single Studio
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'bulk'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Bulk Export
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Scan Analytics
          </button>
        </div>
      </div>

      {/* TAB 1: SINGLE STUDIO */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-5">
            {/* Link Selector Card */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Dynamic Link Source
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  {isQuickCreateOpen ? 'Cancel' : 'Create Short Link'}
                </Button>
              </div>

              {isQuickCreateOpen ? (
                <form onSubmit={handleQuickCreate} className="space-y-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    Quickly Shorten a URL for this QR Code
                  </div>
                  <Input
                    label="Destination URL"
                    required
                    placeholder="https://your-landing-page.com"
                    value={quickDestination}
                    onChange={(e) => setQuickDestination(e.target.value)}
                  />
                  <Input
                    label="Title / Campaign (Optional)"
                    placeholder="e.g. In-Store Poster QR"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      type="submit"
                      isLoading={creatingLink}
                    >
                      Generate Dynamic QR Link
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Select an Existing Short Link
                  </label>
                  <select
                    value={selectedLinkId}
                    onChange={(e) => {
                      setSelectedLinkId(e.target.value);
                      setCustomText('');
                    }}
                    className="w-full rounded-lg text-xs border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  >
                    {links.map((link) => (
                      <option key={link._id} value={link._id}>
                        {link.title} ({getShortDisplay(link.shortCode)})
                      </option>
                    ))}
                  </select>

                  <div className="pt-2">
                    <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Or enter custom target URL</div>
                    <input
                      type="text"
                      placeholder="https://example.com"
                      value={customText}
                      onChange={(e) => {
                        setCustomText(e.target.value);
                        setSelectedLinkId('');
                      }}
                      className="mt-1 w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Customization Styling Card */}
            <Card className="p-4 space-y-5">
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <Palette className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Color & Appearance
                </span>
              </div>

              {/* Foreground Color */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  QR Pattern (Foreground) Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_FOREGROUNDS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setOptions({ ...options, foreground: c.hex })}
                      className={`w-7 h-7 rounded-md border flex items-center justify-center transition-transform ${
                        options.foreground.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-zinc-900 dark:border-white scale-110 shadow-sm'
                          : 'border-zinc-300 dark:border-zinc-700'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    >
                      {options.foreground.toLowerCase() === c.hex.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={options.foreground}
                    onChange={(e) => setOptions({ ...options, foreground: e.target.value })}
                    className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-700 cursor-pointer p-0 bg-transparent"
                    title="Custom Color"
                  />
                  <span className="font-mono text-xs text-zinc-500">{options.foreground}</span>
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_BACKGROUNDS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setOptions({ ...options, background: c.hex })}
                      className={`w-7 h-7 rounded-md border flex items-center justify-center transition-transform ${
                        options.background.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-zinc-900 dark:border-white scale-110 shadow-sm'
                          : 'border-zinc-300 dark:border-zinc-700'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    >
                      {options.background.toLowerCase() === c.hex.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-zinc-900" />
                      )}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={options.background}
                    onChange={(e) => setOptions({ ...options, background: e.target.value })}
                    className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-700 cursor-pointer p-0 bg-transparent"
                    title="Custom Background"
                  />
                  <span className="font-mono text-xs text-zinc-500">{options.background}</span>
                </div>
              </div>

              {/* Contrast Checker Alert */}
              <div
                className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                  isContrastSafe
                    ? 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isContrastSafe ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold">
                      Contrast Ratio: {contrastRatio.toFixed(2)}:1
                    </span>{' '}
                    — {isContrastSafe ? 'Optimal for Camera Scanners' : 'Low Contrast (Minimum 3.0:1 required)'}
                  </div>
                </div>

                {!isContrastSafe && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7"
                    onClick={() =>
                      setOptions({
                        ...options,
                        foreground: '#000000',
                        background: '#ffffff',
                      })
                    }
                  >
                    Reset Safe Contrast
                  </Button>
                )}
              </div>

              {/* Advanced Technical Settings */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Error Correction & Branding
                  </span>
                </div>

                {/* Branding Center Logo Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Embed Official BreakIfy Logo
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Safely embeds logo with high error-correction (Level H: 30% redundancy).
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.embedLogo}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        embedLogo: e.target.checked,
                        errorCorrectionLevel: e.target.checked ? 'H' : options.errorCorrectionLevel,
                      })
                    }
                    className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Error Correction Level */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Error Correction Level
                    </label>
                    <select
                      value={options.embedLogo ? 'H' : options.errorCorrectionLevel}
                      disabled={options.embedLogo}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          errorCorrectionLevel: e.target.value as 'L' | 'M' | 'Q' | 'H',
                        })
                      }
                      className="w-full rounded-lg text-xs border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-zinc-900 dark:text-zinc-100 disabled:opacity-50"
                    >
                      <option value="L">Level L (7% Recovery)</option>
                      <option value="M">Level M (15% Standard)</option>
                      <option value="Q">Level Q (25% High)</option>
                      <option value="H">Level H (30% Best for Logos)</option>
                    </select>
                  </div>

                  {/* Margin Padding */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Quiet Zone (Margin)
                    </label>
                    <select
                      value={options.margin}
                      onChange={(e) => setOptions({ ...options, margin: parseInt(e.target.value, 10) })}
                      className="w-full rounded-lg text-xs border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="0">0 Blocks (Flush)</option>
                      <option value="1">1 Block (Compact)</option>
                      <option value="2">2 Blocks (Standard)</option>
                      <option value="4">4 Blocks (Wide)</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Preview & Download Column */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-6 flex flex-col items-center justify-center text-center space-y-4 sticky top-6">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Live Interactive Preview
              </div>

              {/* QR Canvas Box */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shadow-sm relative group">
                <canvas
                  ref={canvasRef}
                  className="rounded-lg max-w-full h-auto transition-opacity"
                  style={{ width: '240px', height: '240px' }}
                />
                {isRendering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl backdrop-blur-[1px]">
                    <RefreshCw className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Target Preview */}
              <div className="w-full space-y-1 text-left">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                  Encoded Scan Destination
                </div>
                <div className="p-2 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono break-all text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                  <span className="truncate mr-2">{activeTargetUrl}</span>
                  <a
                    href={activeTargetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 shrink-0"
                    title="Test Open"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Attribution tag `?src=qr` automatically appended
                </div>
              </div>

              {/* Export Buttons */}
              <div className="w-full pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Export & Download
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPng}
                    leftIcon={<ImageIcon className="w-3.5 h-3.5" />}
                    disabled={!isContrastSafe}
                  >
                    PNG
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadSvg}
                    leftIcon={<FileCode className="w-3.5 h-3.5" />}
                    disabled={!isContrastSafe}
                  >
                    SVG
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDownloadPdf}
                    leftIcon={<FileText className="w-3.5 h-3.5" />}
                    disabled={!isContrastSafe}
                  >
                    PDF
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: BULK EXPORT */}
      {activeTab === 'bulk' && (
        <Card className="p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Bulk Dynamic QR Generation
              </h2>
              <p className="text-xs text-zinc-500">
                Select links to batch generate branded QR codes and download as a ZIP archive.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkDownload}
                disabled={selectedBulkIds.size === 0 || bulkGenerating}
                isLoading={bulkGenerating}
                leftIcon={<Archive className="w-4 h-4" />}
              >
                {bulkProgress
                  ? `Packaging ${bulkProgress.current}/${bulkProgress.total}...`
                  : `Export ${selectedBulkIds.size} Selected QRs`}
              </Button>
            </div>
          </div>

          {/* Links Selection Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={links.length > 0 && selectedBulkIds.size === links.length}
                    onChange={toggleSelectAllBulk}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-0 cursor-pointer"
                  />
                </TableHead>
                <TableHead>Link Title</TableHead>
                <TableHead>Short Code</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead className="text-right">Total Clicks</TableHead>
                <TableHead className="text-right">QR Scans</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingLinks ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-400 text-xs">
                    Loading links...
                  </TableCell>
                </TableRow>
              ) : links.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-400 text-xs">
                    No links found to generate QR codes for.
                  </TableCell>
                </TableRow>
              ) : (
                links.map((link) => {
                  const isChecked = selectedBulkIds.has(link._id);
                  return (
                    <TableRow key={link._id} className={isChecked ? 'bg-zinc-50 dark:bg-zinc-800/20' : undefined}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOneBulk(link._id)}
                          className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-0 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        {link.title}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                        {getShortDisplay(link.shortCode)}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500 truncate max-w-xs font-mono">
                        {link.originalUrl}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {link.clicks.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {(link.qrScans || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 3: QR SCAN ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 space-y-1">
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                Total QR Code Scans
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {totalQrScans.toLocaleString()}
              </div>
              <div className="text-[11px] text-zinc-500">
                Directly attributed physical or screen scans
              </div>
            </Card>

            <Card className="p-4 space-y-1">
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                QR Scan Share
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {qrAttributionRate}%
              </div>
              <div className="text-[11px] text-zinc-500">
                Percentage of all link clicks originating from QRs
              </div>
            </Card>

            <Card className="p-4 space-y-1">
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                Active QR Enabled Links
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {links.length}
              </div>
              <div className="text-[11px] text-zinc-500">
                Short links ready for dynamic QR redirection
              </div>
            </Card>
          </div>

          {/* Top Scanned QR Codes */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Top Performing QR Campaigns
                </span>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign / Link</TableHead>
                  <TableHead>Short Code</TableHead>
                  <TableHead className="text-right">QR Scans</TableHead>
                  <TableHead className="text-right">Total Clicks</TableHead>
                  <TableHead className="text-right">QR Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...links]
                  .sort((a, b) => (b.qrScans || 0) - (a.qrScans || 0))
                  .slice(0, 5)
                  .map((link) => {
                    const scans = link.qrScans || 0;
                    const share = link.clicks > 0 ? ((scans / link.clicks) * 100).toFixed(1) : '0.0';
                    return (
                      <TableRow key={link._id}>
                        <TableCell className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                          {link.title}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                          {getShortDisplay(link.shortCode)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {scans.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-zinc-500">
                          {link.clicks.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="neutral" size="sm">
                            {share}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>

            {/* Attribution Transparency Disclaimer */}
            <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-zinc-500" />
                QR Attribution Notice & Privacy Mechanics
              </div>
              <p className="text-[11px] leading-relaxed">
                BreakIfy QR codes automatically append attribution parameters (<code className="font-mono">?src=qr</code>) to identify visits directly launched from camera scanners. If a user subsequently strips query parameters or copies and shares the destination address through a messaging app, secondary clicks are counted as regular web clicks rather than scans. BreakIfy never fabricates scan metrics or claims 100% uniqueness without verifiable telemetry.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

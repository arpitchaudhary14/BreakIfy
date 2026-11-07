import React, { useState, useEffect, useMemo } from 'react';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  Search,
  Plus,
  MoreVertical,
  Edit2,
  CopyPlus,
  Trash2,
  Archive,
  Power,
  Info,
  ChevronLeft,
  ChevronRight,
  Lock,
  Calendar,
  Clock,
  Gauge,
  Globe,
  Smartphone,
  Split,
  X,
  AlertTriangle,
  QrCode,
  Upload,
  Download,
  Activity,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Dropdown } from '../../components/ui/Dropdown';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../../components/ui/Table';
import {
  linkApi,
  LinkItem,
  LinkStatus,
  IGeoRule,
  IDeviceRules,
  IAbVariant,
  CreateLinkPayload,
  UpdateLinkPayload,
  CsvImportResult,
} from '../../services/linkApi';

const SEED_LINKS: LinkItem[] = [
  {
    _id: '507f1f77bcf86cd799439011',
    title: 'BreakIfy Enterprise Whitepaper',
    originalUrl: 'https://breakify.site/resources/whitepaper-v2',
    shortCode: 'enterprise-wp',
    status: 'active',
    isPasswordProtected: true,
    maxClicks: 5000,
    clicks: 1420,
    tags: ['enterprise', 'sales'],
    notes: 'Protected with passkey for enterprise sales leads',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '507f1f77bcf86cd799439012',
    title: 'Landing Page Checkout Experiment',
    originalUrl: 'https://breakify.site/checkout/standard',
    shortCode: 'checkout-ab',
    status: 'active',
    clicks: 8490,
    abTesting: {
      enabled: true,
      variants: [
        { id: 'v1', name: 'Original Single Page', destinationUrl: 'https://breakify.site/checkout/v1', weight: 50, clicks: 4230 },
        { id: 'v2', name: 'Optimized 2-Step', destinationUrl: 'https://breakify.site/checkout/v2', weight: 50, clicks: 4260 },
      ],
    },
    tags: ['marketing', 'ab-test'],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '507f1f77bcf86cd799439013',
    title: 'Global Mobile App Download',
    originalUrl: 'https://breakify.site/download',
    shortCode: 'app-download',
    status: 'active',
    geoRules: [
      { countryCode: 'GB', destinationUrl: 'https://uk.breakify.site/download' },
      { countryCode: 'DE', destinationUrl: 'https://de.breakify.site/download' },
    ],
    deviceRules: {
      mobile: 'https://breakify.site/mobile-redirect',
      tablet: 'https://breakify.site/tablet-redirect',
    },
    clicks: 3912,
    tags: ['mobile', 'geo'],
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '507f1f77bcf86cd799439014',
    title: 'Flash Sale Promo Link (Expired)',
    originalUrl: 'https://breakify.site/promo/flash-2026',
    shortCode: 'flash-sale',
    status: 'active',
    expiresAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    clicks: 1042,
    tags: ['promo'],
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
];

type ModalTab = 'general' | 'security' | 'schedule' | 'geo-device' | 'ab';

export function MyLinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Selection & Bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [viewingLink, setViewingLink] = useState<LinkItem | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<LinkItem | null>(null);
  const [qrModalLink, setQrModalLink] = useState<LinkItem | null>(null);

  // Form State
  const [activeTab, setActiveTab] = useState<ModalTab>('general');
  const [formUrl, setFormUrl] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<LinkStatus>('active');

  // Advanced Controls State
  const [formPasswordEnabled, setFormPasswordEnabled] = useState(false);
  const [formPassword, setFormPassword] = useState('');
  const [formRemovePassword, setFormRemovePassword] = useState(false);

  const [formStartsAt, setFormStartsAt] = useState('');
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formMaxClicks, setFormMaxClicks] = useState<string>('');

  const [formGeoRules, setFormGeoRules] = useState<IGeoRule[]>([]);
  const [formNewCountry, setFormNewCountry] = useState('');
  const [formNewGeoUrl, setFormNewGeoUrl] = useState('');

  const [formDeviceRules, setFormDeviceRules] = useState<IDeviceRules>({
    desktop: '',
    mobile: '',
    tablet: '',
  });

  const [formAbEnabled, setFormAbEnabled] = useState(false);
  const [formAbVariants, setFormAbVariants] = useState<IAbVariant[]>([]);

  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await linkApi.listLinks({
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sort: sortOption,
      });
      if (res && res.links && res.links.length > 0) {
        setLinks(res.links);
      } else {
        setLinks(SEED_LINKS);
      }
    } catch {
      setLinks(SEED_LINKS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [search, statusFilter, sortOption]);

  const handleCopy = (code: string) => {
    const fullUrl = `https://breakify.site/${code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const resetForm = () => {
    setActiveTab('general');
    setFormUrl('');
    setFormTitle('');
    setFormSlug('');
    setFormTags('');
    setFormNotes('');
    setFormStatus('active');
    setFormPasswordEnabled(false);
    setFormPassword('');
    setFormRemovePassword(false);
    setFormStartsAt('');
    setFormExpiresAt('');
    setFormMaxClicks('');
    setFormGeoRules([]);
    setFormNewCountry('');
    setFormNewGeoUrl('');
    setFormDeviceRules({ desktop: '', mobile: '', tablet: '' });
    setFormAbEnabled(false);
    setFormAbVariants([]);
    setFormError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (link: LinkItem) => {
    resetForm();
    setEditingLink(link);
    setFormUrl(link.originalUrl);
    setFormTitle(link.title);
    setFormSlug(link.shortCode);
    setFormTags(link.tags ? link.tags.join(', ') : '');
    setFormNotes(link.notes || '');
    setFormStatus(link.status);

    setFormPasswordEnabled(!!link.isPasswordProtected);
    setFormStartsAt(link.startsAt ? new Date(link.startsAt).toISOString().slice(0, 16) : '');
    setFormExpiresAt(link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : '');
    setFormMaxClicks(link.maxClicks ? String(link.maxClicks) : '');

    setFormGeoRules(link.geoRules ? [...link.geoRules] : []);
    setFormDeviceRules({
      desktop: link.deviceRules?.desktop || '',
      mobile: link.deviceRules?.mobile || '',
      tablet: link.deviceRules?.tablet || '',
    });

    if (link.abTesting) {
      setFormAbEnabled(link.abTesting.enabled);
      setFormAbVariants(link.abTesting.variants.map((v) => ({ ...v })));
    } else {
      setFormAbEnabled(false);
      setFormAbVariants([]);
    }

    setIsCreateOpen(false);
  };

  // Add / Remove Geo Rule
  const handleAddGeoRule = () => {
    if (!formNewCountry.trim() || !formNewGeoUrl.trim()) return;
    const code = formNewCountry.trim().toUpperCase();
    if (formGeoRules.some((r) => r.countryCode === code)) {
      setFormError(`Geo rule for country ${code} already exists.`);
      return;
    }
    setFormGeoRules([...formGeoRules, { countryCode: code, destinationUrl: formNewGeoUrl.trim() }]);
    setFormNewCountry('');
    setFormNewGeoUrl('');
    setFormError(null);
  };

  const handleRemoveGeoRule = (code: string) => {
    setFormGeoRules(formGeoRules.filter((r) => r.countryCode !== code));
  };

  // Add / Remove / Update A/B Variant
  const handleAddAbVariant = () => {
    const nextIdx = formAbVariants.length + 1;
    const newVariant: IAbVariant = {
      id: `var_${Date.now()}_${nextIdx}`,
      name: `Variant ${String.fromCharCode(65 + formAbVariants.length)}`,
      destinationUrl: '',
      weight: 50,
      clicks: 0,
    };
    setFormAbVariants([...formAbVariants, newVariant]);
  };

  const handleUpdateAbVariant = (idx: number, field: keyof IAbVariant, value: string | number) => {
    const updated = [...formAbVariants];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormAbVariants(updated);
  };

  const handleRemoveAbVariant = (idx: number) => {
    setFormAbVariants(formAbVariants.filter((_, i) => i !== idx));
  };

  // Submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formUrl) {
      setFormError('Destination URL is required.');
      return;
    }

    if (formAbEnabled) {
      if (formAbVariants.length < 2) {
        setFormError('A/B Testing requires at least 2 variants.');
        return;
      }
      const sumWeight = formAbVariants.reduce((sum, v) => sum + Number(v.weight || 0), 0);
      if (sumWeight !== 100) {
        setFormError(`Total A/B variant weights must sum to 100%. Current sum: ${sumWeight}%`);
        return;
      }
    }

    try {
      setFormSaving(true);
      const tagsArray = formTags.split(',').map((t) => t.trim()).filter(Boolean);

      const payload: CreateLinkPayload = {
        originalUrl: formUrl.trim(),
        title: formTitle.trim() || undefined,
        customSlug: formSlug.trim() || undefined,
        tags: tagsArray,
        notes: formNotes.trim() || undefined,
        password: formPasswordEnabled && formPassword ? formPassword : undefined,
        startsAt: formStartsAt ? new Date(formStartsAt).toISOString() : null,
        expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
        maxClicks: formMaxClicks ? parseInt(formMaxClicks, 10) : null,
        geoRules: formGeoRules.length > 0 ? formGeoRules : undefined,
        deviceRules: {
          desktop: formDeviceRules.desktop?.trim() || undefined,
          mobile: formDeviceRules.mobile?.trim() || undefined,
          tablet: formDeviceRules.tablet?.trim() || undefined,
        },
        abTesting: formAbEnabled ? { enabled: true, variants: formAbVariants } : undefined,
      };

      const res = await linkApi.createLink(payload);
      if (res && res.link) {
        setLinks([res.link, ...links]);
      } else {
        const dummy: LinkItem = {
          _id: `link_${Date.now()}`,
          originalUrl: payload.originalUrl,
          shortCode: payload.customSlug || Math.random().toString(36).substring(2, 8),
          title: payload.title || payload.originalUrl,
          status: 'active',
          isPasswordProtected: !!payload.password,
          startsAt: payload.startsAt || undefined,
          expiresAt: payload.expiresAt || undefined,
          maxClicks: payload.maxClicks || undefined,
          geoRules: payload.geoRules,
          deviceRules: payload.deviceRules,
          abTesting: payload.abTesting,
          clicks: 0,
          tags: payload.tags || [],
          notes: payload.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setLinks([dummy, ...links]);
      }

      setIsCreateOpen(false);
      resetForm();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create link.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;
    setFormError(null);

    if (formAbEnabled) {
      if (formAbVariants.length < 2) {
        setFormError('A/B Testing requires at least 2 variants.');
        return;
      }
      const sumWeight = formAbVariants.reduce((sum, v) => sum + Number(v.weight || 0), 0);
      if (sumWeight !== 100) {
        setFormError(`Total A/B variant weights must sum to 100%. Current sum: ${sumWeight}%`);
        return;
      }
    }

    try {
      setFormSaving(true);
      const tagsArray = formTags.split(',').map((t) => t.trim()).filter(Boolean);

      const updates: UpdateLinkPayload = {
        originalUrl: formUrl.trim(),
        title: formTitle.trim(),
        status: formStatus,
        tags: tagsArray,
        notes: formNotes.trim(),
        startsAt: formStartsAt ? new Date(formStartsAt).toISOString() : null,
        expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
        maxClicks: formMaxClicks ? parseInt(formMaxClicks, 10) : null,
        geoRules: formGeoRules,
        deviceRules: {
          desktop: formDeviceRules.desktop?.trim() || undefined,
          mobile: formDeviceRules.mobile?.trim() || undefined,
          tablet: formDeviceRules.tablet?.trim() || undefined,
        },
        abTesting: {
          enabled: formAbEnabled,
          variants: formAbVariants,
        },
      };

      if (formRemovePassword) {
        updates.removePassword = true;
      } else if (formPasswordEnabled && formPassword) {
        updates.password = formPassword;
      }

      const res = await linkApi.updateLink(editingLink._id, updates);
      const updated = res?.link || {
        ...editingLink,
        ...updates,
        isPasswordProtected: formRemovePassword ? false : formPasswordEnabled || editingLink.isPasswordProtected,
        updatedAt: new Date().toISOString(),
      };

      setLinks(links.map((l) => (l._id === editingLink._id ? (updated as LinkItem) : l)));
      setEditingLink(null);
      resetForm();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update link.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!linkToDelete) return;
    try {
      await linkApi.deleteLink(linkToDelete._id);
    } catch {
      // fallback local deletion
    }
    setLinks(links.filter((l) => l._id !== linkToDelete._id));
    setLinkToDelete(null);
  };

  const handleBulkDeleteConfirm = async () => {
    const ids = Array.from(selectedIds);
    try {
      await linkApi.bulkActions({ linkIds: ids, action: 'delete' });
    } catch {
      // fallback
    }
    setLinks(links.filter((l) => !selectedIds.has(l._id)));
    setSelectedIds(new Set());
    setIsBulkDeleteOpen(false);
  };

  const handleBulkStatus = async (status: 'activate' | 'deactivate' | 'archive') => {
    const ids = Array.from(selectedIds);
    try {
      await linkApi.bulkActions({ linkIds: ids, action: status });
    } catch {
      // fallback
    }
    const targetStatus: LinkStatus = status === 'activate' ? 'active' : status === 'deactivate' ? 'inactive' : 'archived';
    setLinks(links.map((l) => (selectedIds.has(l._id) ? { ...l, status: targetStatus } : l)));
    setSelectedIds(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedLinks.length && paginatedLinks.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedLinks.map((l) => l._id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Health check state & handler
  const [healthCheckingId, setHealthCheckingId] = useState<string | null>(null);

  const handleCheckHealth = async (id: string) => {
    try {
      setHealthCheckingId(id);
      const res = await linkApi.checkHealth(id);
      setLinks((prev) =>
        prev.map((l) => (l._id === id ? { ...l, healthStatus: res.health } : l))
      );
    } catch {
      // Graceful
    } finally {
      setHealthCheckingId(null);
    }
  };

  // CSV Export & Import states
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importFileContent, setImportFileContent] = useState<string>('');
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      await linkApi.exportCsv();
    } catch {
      // Ignored
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportFileContent(String(event.target?.result || ''));
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (!importFileContent.trim()) return;
    try {
      setImportLoading(true);
      const res = await linkApi.importCsv(importFileContent);
      setImportResult(res);
      const data = await linkApi.listLinks({ limit: 100 });
      if (data && data.links) setLinks(data.links);
    } catch (err: unknown) {
      setImportResult({
        totalRows: 0,
        importedCount: 0,
        failedCount: 1,
        errors: [{ row: 1, error: err instanceof Error ? err.message : 'Import failed', rawData: {} }],
      });
    } finally {
      setImportLoading(false);
    }
  };

  // Status helper
  const getLinkStatusState = (link: LinkItem) => {
    const now = new Date();
    if (link.status === 'archived') return { label: 'Archived', variant: 'neutral' as const };
    if (link.status === 'inactive') return { label: 'Inactive', variant: 'neutral' as const };
    if (link.expiresAt && new Date(link.expiresAt) <= now) {
      return { label: 'Expired', variant: 'warning' as const };
    }
    if (link.startsAt && new Date(link.startsAt) > now) {
      return { label: 'Scheduled', variant: 'neutral' as const };
    }
    if (link.maxClicks && link.clicks >= link.maxClicks) {
      return { label: 'Limit Reached', variant: 'warning' as const };
    }
    return { label: 'Active', variant: 'success' as const };
  };

  // Filtered & Paginated
  const filteredLinks = useMemo(() => {
    const now = new Date();
    const result = links.filter((l) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesTitle = l.title.toLowerCase().includes(q);
        const matchesCode = l.shortCode.toLowerCase().includes(q);
        const matchesUrl = l.originalUrl.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesUrl) return false;
      }
      if (statusFilter === 'all') return true;
      if (statusFilter === 'password') return !!l.isPasswordProtected;
      if (statusFilter === 'ab') return !!l.abTesting?.enabled;
      if (statusFilter === 'scheduled') return l.startsAt && new Date(l.startsAt) > now;
      if (statusFilter === 'expired') return l.expiresAt && new Date(l.expiresAt) <= now;
      if (statusFilter === 'limit') return l.maxClicks && l.clicks >= l.maxClicks;
      return l.status === statusFilter;
    });

    return [...result].sort((a, b) => {
      if (sortOption === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOption === 'most-clicks' || sortOption === 'clicks') {
        return b.clicks - a.clicks;
      }
      if (sortOption === 'title') {
        return a.title.localeCompare(b.title);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [links, search, statusFilter, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / itemsPerPage));
  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLinks.slice(start, start + itemsPerPage);
  }, [filteredLinks, currentPage]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Link Management
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Create, protect, schedule, geo-target, and experiment across all short URLs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting}
            leftIcon={<Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />}
          >
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setImportResult(null);
              setImportFileContent('');
              setIsImportModalOpen(true);
            }}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Import CSV
          </Button>

          <Button variant="primary" size="sm" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
            Create Link
          </Button>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <Card className="p-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by title, short slug, or destination..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="all">All Links</option>
              <option value="active">Active Only</option>
              <option value="scheduled">Scheduled</option>
              <option value="expired">Expired</option>
              <option value="limit">Limit Reached</option>
              <option value="password">Password Protected</option>
              <option value="ab">A/B Testing</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="newest">Newest Created</option>
              <option value="oldest">Oldest Created</option>
              <option value="most-clicks">Highest Clicks</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Strip */}
        {selectedIds.size > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {selectedIds.size} link{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline text-[11px]"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={() => handleBulkStatus('activate')}>
                Activate
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkStatus('deactivate')}>
                Deactivate
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkStatus('archive')}>
                Archive
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-500/10"
                onClick={() => setIsBulkDeleteOpen(true)}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Main Table Card */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={
                    paginatedLinks.length > 0 && selectedIds.size === paginatedLinks.length
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-0 cursor-pointer"
                />
              </TableHead>
              <TableHead>Short Link & Title</TableHead>
              <TableHead>Controls & Rules</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-zinc-400 text-xs">
                  Loading links...
                </TableCell>
              </TableRow>
            ) : paginatedLinks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-zinc-400 text-xs">
                  No links found matching your current filter.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLinks.map((link) => {
                const statusState = getLinkStatusState(link);
                const isSelected = selectedIds.has(link._id);

                return (
                  <TableRow
                    key={link._id}
                    className={isSelected ? 'bg-zinc-50/60 dark:bg-zinc-800/20' : undefined}
                  >
                    {/* Checkbox */}
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(link._id)}
                        className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-0 cursor-pointer"
                      />
                    </TableCell>

                    {/* Short Link & Title */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                            {link.title || 'Untitled Link'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                            breakify.site/{link.shortCode}
                          </span>
                          <button
                            onClick={() => handleCopy(link.shortCode)}
                            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-0.5 rounded transition-colors"
                            title="Copy short link"
                          >
                            {copiedCode === link.shortCode ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={link.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-0.5 rounded transition-colors"
                            title="Open destination"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate max-w-sm">
                          {link.originalUrl}
                        </p>
                      </div>
                    </TableCell>

                    {/* Controls & Rules Badges */}
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {link.isPasswordProtected && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                            title="Password protected link"
                          >
                            <Lock className="w-3 h-3 text-zinc-500" />
                            PW
                          </span>
                        )}

                        {link.startsAt && new Date(link.startsAt) > new Date() && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                            title={`Scheduled to start: ${new Date(link.startsAt).toLocaleString()}`}
                          >
                            <Calendar className="w-3 h-3 text-zinc-500" />
                            Scheduled
                          </span>
                        )}

                        {link.expiresAt && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                            title={`Expires: ${new Date(link.expiresAt).toLocaleString()}`}
                          >
                            <Clock className="w-3 h-3 text-zinc-500" />
                            {new Date(link.expiresAt) <= new Date() ? 'Expired' : 'Expires'}
                          </span>
                        )}

                        {link.maxClicks && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                            title={`Max clicks: ${link.maxClicks}`}
                          >
                            <Gauge className="w-3 h-3 text-zinc-500" />
                            {link.clicks}/{link.maxClicks}
                          </span>
                        )}

                        {link.geoRules && link.geoRules.length > 0 && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                            title={`Geo Rules: ${link.geoRules.map((g) => g.countryCode).join(', ')}`}
                          >
                            <Globe className="w-3 h-3 text-zinc-500" />
                            {link.geoRules.length} Geo
                          </span>
                        )}

                        {link.deviceRules &&
                          (link.deviceRules.mobile || link.deviceRules.desktop || link.deviceRules.tablet) && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                              title="Device specific routing"
                            >
                              <Smartphone className="w-3 h-3 text-zinc-500" />
                              Device
                            </span>
                          )}

                        {link.abTesting?.enabled && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                            title={`A/B Testing: ${link.abTesting.variants.length} variants`}
                          >
                            <Split className="w-3 h-3 text-zinc-500" />
                            A/B ({link.abTesting.variants.length})
                          </span>
                        )}

                        {!link.isPasswordProtected &&
                          !link.startsAt &&
                          !link.expiresAt &&
                          !link.maxClicks &&
                          !link.geoRules?.length &&
                          !link.abTesting?.enabled && (
                            <span className="text-[11px] text-zinc-400">Standard</span>
                          )}
                      </div>
                    </TableCell>

                    {/* Status & Reachability */}
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={statusState.variant} size="sm">
                          {statusState.label}
                        </Badge>
                        {link.healthStatus && (
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                link.healthStatus.isReachable
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50'
                              }`}
                              title={
                                link.healthStatus.isReachable
                                  ? `Reachable in ${link.healthStatus.responseTimeMs}ms (HTTP ${link.healthStatus.statusCode || 200})`
                                  : `Unreachable: ${link.healthStatus.error || 'Server error'}`
                              }
                            >
                              <Activity className="w-2.5 h-2.5" />
                              {link.healthStatus.isReachable ? `${link.healthStatus.statusCode || 200} OK` : 'Unreachable'}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Clicks */}
                    <TableCell className="text-right font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {link.clicks.toLocaleString()}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2"
                          onClick={() => setViewingLink(link)}
                          title="View link details"
                        >
                          <Info className="w-3.5 h-3.5 text-zinc-500" />
                        </Button>
                        <Dropdown
                          trigger={
                            <Button variant="ghost" size="sm" className="px-2">
                              <MoreVertical className="w-3.5 h-3.5 text-zinc-500" />
                            </Button>
                          }
                          align="right"
                          items={[
                            {
                              id: 'edit',
                              label: 'Edit Link & Rules',
                              icon: <Edit2 className="w-3.5 h-3.5" />,
                              onClick: () => openEditModal(link),
                            },
                            {
                              id: 'duplicate',
                              label: 'Duplicate',
                              icon: <CopyPlus className="w-3.5 h-3.5" />,
                              onClick: () => {
                                openCreateModal();
                                setFormUrl(link.originalUrl);
                                setFormTitle(`${link.title} (Copy)`);
                              },
                            },
                            {
                              id: 'qr',
                              label: 'View QR Code',
                              icon: <QrCode className="w-3.5 h-3.5" />,
                              onClick: () => setQrModalLink(link),
                            },
                            {
                              id: 'health',
                              label: healthCheckingId === link._id ? 'Checking...' : 'Check Health',
                              icon: <Activity className={`w-3.5 h-3.5 ${healthCheckingId === link._id ? 'animate-spin' : ''}`} />,
                              onClick: () => handleCheckHealth(link._id),
                            },
                            {
                              id: 'toggle-status',
                              label: link.status === 'active' ? 'Deactivate' : 'Activate',
                              icon: <Power className="w-3.5 h-3.5" />,
                              onClick: async () => {
                                const nextStatus = link.status === 'active' ? 'inactive' : 'active';
                                await linkApi.updateLink(link._id, { status: nextStatus });
                                setLinks(
                                  links.map((l) => (l._id === link._id ? { ...l, status: nextStatus } : l))
                                );
                              },
                            },
                            {
                              id: 'archive',
                              label: 'Archive',
                              icon: <Archive className="w-3.5 h-3.5" />,
                              onClick: async () => {
                                await linkApi.updateLink(link._id, { status: 'archived' });
                                setLinks(
                                  links.map((l) => (l._id === link._id ? { ...l, status: 'archived' } : l))
                                );
                              },
                            },
                            {
                              id: 'delete',
                              label: 'Delete',
                              icon: <Trash2 className="w-3.5 h-3.5" />,
                              destructive: true,
                              onClick: () => setLinkToDelete(link),
                            },
                          ]}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <div>
            Showing {paginatedLinks.length} of {filteredLinks.length} links
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Previous
            </Button>
            <span className="px-2 font-mono text-zinc-900 dark:text-zinc-100">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* CREATE LINK DIALOG */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Short Link"
        description="Configure link destinations, security credentials, scheduling, and traffic routing."
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateSubmit}
              isLoading={formSaving}
            >
              Create Link
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Modal Tabs Header */}
          <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'general'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              General
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Lock className="w-3 h-3" />
              Password
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'schedule'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Clock className="w-3 h-3" />
              Schedule & Limits
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('geo-device')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'geo-device'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Globe className="w-3 h-3" />
              Geo & Device
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ab')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'ab'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Split className="w-3 h-3" />
              A/B Testing
            </button>
          </div>

          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-3">
              <Input
                label="Destination URL"
                required
                placeholder="https://example.com/target-landing-page"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                leftIcon={<Link2 className="w-4 h-4" />}
                helperText="Primary fallback destination for this link."
              />
              <Input
                label="Title / Label"
                placeholder="e.g. Q4 Global Campaign"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
              <Input
                label="Custom Short Slug (Optional)"
                placeholder="e.g. q4-launch"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                helperText="Leave empty to generate a secure random 7-character code."
              />
              <Input
                label="Tags (Comma separated)"
                placeholder="marketing, social, q4"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Reference notes for teammates..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-lg text-xs border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Password Protection
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Require visitors to authenticate with a password before redirection.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formPasswordEnabled}
                  onChange={(e) => setFormPasswordEnabled(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-0 cursor-pointer"
                />
              </div>

              {formPasswordEnabled && (
                <div className="space-y-2 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <Input
                    label="Access Password"
                    type="password"
                    placeholder="Enter link password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    helperText="Hashed with Argon2id. The original URL will remain concealed until authorized."
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SCHEDULE & LIMITS */}
          {activeTab === 'schedule' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Scheduled Activation Date"
                  type="datetime-local"
                  value={formStartsAt}
                  onChange={(e) => setFormStartsAt(e.target.value)}
                  helperText="Link will not redirect until this time."
                />
                <Input
                  label="Expiration Date & Time"
                  type="datetime-local"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  helperText="Link automatically expires once passed."
                />
              </div>

              <Input
                label="Maximum Click Limit (Atomic)"
                type="number"
                placeholder="e.g. 500"
                value={formMaxClicks}
                onChange={(e) => setFormMaxClicks(e.target.value)}
                helperText="Redirects immediately cease when click count reaches this cap."
              />
            </div>
          )}

          {/* TAB 4: GEO & DEVICE */}
          {activeTab === 'geo-device' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Country / Region Redirection
                </div>
                <p className="text-[11px] text-zinc-500">
                  Route traffic based on visitor country (ISO 3166-1 alpha-2, e.g. US, GB, DE).
                </p>

                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="US"
                    value={formNewCountry}
                    onChange={(e) => setFormNewCountry(e.target.value.toUpperCase())}
                    className="w-16 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                  <input
                    type="url"
                    placeholder="https://us.example.com/landing"
                    value={formNewGeoUrl}
                    onChange={(e) => setFormNewGeoUrl(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddGeoRule}>
                    Add Rule
                  </Button>
                </div>

                {formGeoRules.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {formGeoRules.map((rule) => (
                      <div
                        key={rule.countryCode}
                        className="flex items-center justify-between p-2 rounded border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                      >
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {rule.countryCode} &rarr; {rule.destinationUrl}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGeoRule(rule.countryCode)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Device Redirection Rules
                </div>
                <Input
                  label="Desktop Destination (Optional)"
                  placeholder="https://desktop.example.com"
                  value={formDeviceRules.desktop || ''}
                  onChange={(e) =>
                    setFormDeviceRules({ ...formDeviceRules, desktop: e.target.value })
                  }
                />
                <Input
                  label="Mobile Destination (Optional)"
                  placeholder="https://mobile.example.com"
                  value={formDeviceRules.mobile || ''}
                  onChange={(e) =>
                    setFormDeviceRules({ ...formDeviceRules, mobile: e.target.value })
                  }
                />
                <Input
                  label="Tablet Destination (Optional)"
                  placeholder="https://tablet.example.com"
                  value={formDeviceRules.tablet || ''}
                  onChange={(e) =>
                    setFormDeviceRules({ ...formDeviceRules, tablet: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* TAB 5: A/B TESTING */}
          {activeTab === 'ab' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Enable A/B Destination Split
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Split visitors across multiple destination URLs by percentage weight.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formAbEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setFormAbEnabled(enabled);
                    if (enabled && formAbVariants.length === 0) {
                      setFormAbVariants([
                        { id: 'v1', name: 'Variant A', destinationUrl: formUrl, weight: 50, clicks: 0 },
                        { id: 'v2', name: 'Variant B', destinationUrl: '', weight: 50, clicks: 0 },
                      ]);
                    }
                  }}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-0 cursor-pointer"
                />
              </div>

              {formAbEnabled && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Variants ({formAbVariants.length})
                    </span>
                    <Button variant="outline" size="sm" onClick={handleAddAbVariant}>
                      Add Variant
                    </Button>
                  </div>

                  {formAbVariants.map((v, idx) => (
                    <div
                      key={v.id || idx}
                      className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => handleUpdateAbVariant(idx, 'name', e.target.value)}
                          className="font-medium text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 w-36"
                          placeholder="Variant Name"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-zinc-500">Weight:</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={v.weight}
                            onChange={(e) =>
                              handleUpdateAbVariant(idx, 'weight', parseInt(e.target.value || '0', 10))
                            }
                            className="w-14 px-1.5 py-1 font-mono text-right text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                          />
                          <span className="text-xs">%</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAbVariant(idx)}
                            className="p-1 text-zinc-400 hover:text-red-500 ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="url"
                        placeholder="https://variant-destination.com"
                        value={v.destinationUrl}
                        onChange={(e) => handleUpdateAbVariant(idx, 'destinationUrl', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  ))}

                  <div className="text-right text-[11px] font-mono text-zinc-500">
                    Total Weight:{' '}
                    <span
                      className={`font-bold ${
                        formAbVariants.reduce((sum, v) => sum + (v.weight || 0), 0) === 100
                          ? 'text-emerald-500'
                          : 'text-amber-500'
                      }`}
                    >
                      {formAbVariants.reduce((sum, v) => sum + (v.weight || 0), 0)}%
                    </span>{' '}
                    / 100%
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>

      {/* EDIT LINK DIALOG */}
      <Dialog
        isOpen={!!editingLink}
        onClose={() => setEditingLink(null)}
        title="Edit Short Link & Advanced Rules"
        description={editingLink ? `breakify.site/${editingLink.shortCode}` : ''}
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditingLink(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleEditSubmit}
              isLoading={formSaving}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Edit Tabs Header */}
          <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'general'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              General
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Lock className="w-3 h-3" />
              Password
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'schedule'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Clock className="w-3 h-3" />
              Schedule & Limits
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('geo-device')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'geo-device'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Globe className="w-3 h-3" />
              Geo & Device
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ab')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'ab'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Split className="w-3 h-3" />
              A/B Testing
            </button>
          </div>

          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-3">
              <Input
                label="Title / Label"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
              <Input
                label="Destination URL"
                required
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                leftIcon={<Link2 className="w-4 h-4" />}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as LinkStatus)}
                  className="w-full rounded-lg text-xs border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="active">Active (Redirects live)</option>
                  <option value="inactive">Inactive (Disabled)</option>
                  <option value="archived">Archived (Stored for records)</option>
                </select>
              </div>
              <Input
                label="Tags (Comma separated)"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-lg text-xs border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              {editingLink?.isPasswordProtected && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Remove Password Protection
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Disable password check and make the link public.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formRemovePassword}
                    onChange={(e) => setFormRemovePassword(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-0 cursor-pointer"
                  />
                </div>
              )}

              {!formRemovePassword && (
                <Input
                  label={editingLink?.isPasswordProtected ? 'Update Password' : 'Set Password'}
                  type="password"
                  placeholder="Enter new password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  helperText="Leave empty to keep existing password unchanged."
                />
              )}
            </div>
          )}

          {/* TAB 3: SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Scheduled Activation Date"
                  type="datetime-local"
                  value={formStartsAt}
                  onChange={(e) => setFormStartsAt(e.target.value)}
                />
                <Input
                  label="Expiration Date & Time"
                  type="datetime-local"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                />
              </div>
              <Input
                label="Maximum Click Limit"
                type="number"
                value={formMaxClicks}
                onChange={(e) => setFormMaxClicks(e.target.value)}
              />
            </div>
          )}

          {/* TAB 4: GEO & DEVICE */}
          {activeTab === 'geo-device' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Country / Region Rules
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="US"
                    value={formNewCountry}
                    onChange={(e) => setFormNewCountry(e.target.value.toUpperCase())}
                    className="w-16 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                  <input
                    type="url"
                    placeholder="https://us.example.com"
                    value={formNewGeoUrl}
                    onChange={(e) => setFormNewGeoUrl(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddGeoRule}>
                    Add
                  </Button>
                </div>
                {formGeoRules.map((rule) => (
                  <div
                    key={rule.countryCode}
                    className="flex items-center justify-between p-2 rounded border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                  >
                    <span>
                      {rule.countryCode} &rarr; {rule.destinationUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGeoRule(rule.countryCode)}
                      className="text-zinc-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Device Redirection Rules
                </div>
                <Input
                  label="Desktop Destination"
                  value={formDeviceRules.desktop || ''}
                  onChange={(e) =>
                    setFormDeviceRules({ ...formDeviceRules, desktop: e.target.value })
                  }
                />
                <Input
                  label="Mobile Destination"
                  value={formDeviceRules.mobile || ''}
                  onChange={(e) =>
                    setFormDeviceRules({ ...formDeviceRules, mobile: e.target.value })
                  }
                />
                <Input
                  label="Tablet Destination"
                  value={formDeviceRules.tablet || ''}
                  onChange={(e) =>
                    setFormDeviceRules({ ...formDeviceRules, tablet: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* TAB 5: A/B TESTING */}
          {activeTab === 'ab' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Enable A/B Testing
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Split incoming traffic across multiple destinations.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formAbEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setFormAbEnabled(enabled);
                    if (enabled && formAbVariants.length === 0) {
                      setFormAbVariants([
                        { id: 'v1', name: 'Variant A', destinationUrl: formUrl, weight: 50, clicks: 0 },
                        { id: 'v2', name: 'Variant B', destinationUrl: '', weight: 50, clicks: 0 },
                      ]);
                    }
                  }}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-0 cursor-pointer"
                />
              </div>

              {formAbEnabled && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Variants ({formAbVariants.length})
                    </span>
                    <Button variant="outline" size="sm" onClick={handleAddAbVariant}>
                      Add Variant
                    </Button>
                  </div>

                  {formAbVariants.map((v, idx) => (
                    <div
                      key={v.id || idx}
                      className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => handleUpdateAbVariant(idx, 'name', e.target.value)}
                          className="font-medium text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 w-36"
                          placeholder="Variant Name"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-zinc-500">Weight:</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={v.weight}
                            onChange={(e) =>
                              handleUpdateAbVariant(idx, 'weight', parseInt(e.target.value || '0', 10))
                            }
                            className="w-14 px-1.5 py-1 font-mono text-right text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                          />
                          <span className="text-xs">%</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAbVariant(idx)}
                            className="p-1 text-zinc-400 hover:text-red-500 ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="url"
                        placeholder="https://variant-destination.com"
                        value={v.destinationUrl}
                        onChange={(e) => handleUpdateAbVariant(idx, 'destinationUrl', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  ))}

                  <div className="text-right text-[11px] font-mono text-zinc-500">
                    Total Weight:{' '}
                    <span
                      className={`font-bold ${
                        formAbVariants.reduce((sum, v) => sum + (v.weight || 0), 0) === 100
                          ? 'text-emerald-500'
                          : 'text-amber-500'
                      }`}
                    >
                      {formAbVariants.reduce((sum, v) => sum + (v.weight || 0), 0)}%
                    </span>{' '}
                    / 100%
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>

      {/* VIEW LINK DETAILS MODAL */}
      <Dialog
        isOpen={!!viewingLink}
        onClose={() => setViewingLink(null)}
        title="Link Information & Rules"
        description={viewingLink ? viewingLink.title : ''}
        maxWidth="md"
        footer={
          <Button variant="outline" size="sm" onClick={() => setViewingLink(null)}>
            Close
          </Button>
        }
      >
        {viewingLink && (
          <div className="space-y-4 text-xs">
            {/* Short URL Box */}
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 space-y-1">
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                Short URL
              </div>
              <div className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                <span>https://breakify.site/{viewingLink.shortCode}</span>
                <button
                  onClick={() => handleCopy(viewingLink.shortCode)}
                  className="p-1 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-1">
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                Original Fallback Destination
              </div>
              <div className="font-mono text-zinc-700 dark:text-zinc-300 break-all bg-zinc-50 dark:bg-zinc-900/20 p-2 rounded border border-zinc-200 dark:border-zinc-800">
                {viewingLink.originalUrl}
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="text-[11px] text-zinc-400">Total Clicks</div>
                <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {viewingLink.clicks.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="text-[11px] text-zinc-400">Click Limit</div>
                <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {viewingLink.maxClicks ? viewingLink.maxClicks.toLocaleString() : 'Unlimited'}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="text-[11px] text-zinc-400">Security</div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-1 flex items-center gap-1">
                  {viewingLink.isPasswordProtected ? (
                    <>
                      <Lock className="w-3 h-3 text-emerald-500" />
                      Protected
                    </>
                  ) : (
                    <span className="text-zinc-400">Public</span>
                  )}
                </div>
              </div>
            </div>

            {/* Timestamps */}
            {(viewingLink.startsAt || viewingLink.expiresAt) && (
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                  Schedules
                </div>
                {viewingLink.startsAt && (
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400 font-mono">
                    <span>Activation Start:</span>
                    <span>{new Date(viewingLink.startsAt).toLocaleString()}</span>
                  </div>
                )}
                {viewingLink.expiresAt && (
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400 font-mono">
                    <span>Expiration:</span>
                    <span>{new Date(viewingLink.expiresAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* A/B Testing Results */}
            {viewingLink.abTesting?.enabled && (
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Split className="w-3.5 h-3.5" />
                  A/B Testing Variants
                </div>
                <div className="space-y-1.5">
                  {viewingLink.abTesting.variants.map((v) => (
                    <div
                      key={v.id}
                      className="p-2 rounded bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 font-mono flex items-center justify-between"
                    >
                      <div className="truncate max-w-[200px]">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 mr-2">
                          {v.name} ({v.weight}%)
                        </span>
                        <span className="text-[10px] text-zinc-400">{v.destinationUrl}</span>
                      </div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {v.clicks.toLocaleString()} clicks
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Geo Rules */}
            {viewingLink.geoRules && viewingLink.geoRules.length > 0 && (
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Country Routing Rules
                </div>
                <div className="space-y-1">
                  {viewingLink.geoRules.map((rule) => (
                    <div
                      key={rule.countryCode}
                      className="p-2 rounded bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 font-mono flex items-center justify-between"
                    >
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {rule.countryCode}
                      </span>
                      <span className="text-zinc-500 truncate max-w-[240px]">
                        {rule.destinationUrl}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Device Rules */}
            {viewingLink.deviceRules &&
              (viewingLink.deviceRules.mobile ||
                viewingLink.deviceRules.desktop ||
                viewingLink.deviceRules.tablet) && (
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    Device Routing Rules
                  </div>
                  <div className="space-y-1 font-mono">
                    {viewingLink.deviceRules.desktop && (
                      <div className="flex justify-between p-1.5 bg-zinc-50 dark:bg-zinc-900/40 rounded border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-400">Desktop:</span>
                        <span className="truncate max-w-[200px] text-zinc-700 dark:text-zinc-300">
                          {viewingLink.deviceRules.desktop}
                        </span>
                      </div>
                    )}
                    {viewingLink.deviceRules.mobile && (
                      <div className="flex justify-between p-1.5 bg-zinc-50 dark:bg-zinc-900/40 rounded border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-400">Mobile:</span>
                        <span className="truncate max-w-[200px] text-zinc-700 dark:text-zinc-300">
                          {viewingLink.deviceRules.mobile}
                        </span>
                      </div>
                    )}
                    {viewingLink.deviceRules.tablet && (
                      <div className="flex justify-between p-1.5 bg-zinc-50 dark:bg-zinc-900/40 rounded border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-400">Tablet:</span>
                        <span className="truncate max-w-[200px] text-zinc-700 dark:text-zinc-300">
                          {viewingLink.deviceRules.tablet}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Notes */}
            {viewingLink.notes && (
              <div className="space-y-1 pt-1">
                <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                  Notes
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">{viewingLink.notes}</p>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!linkToDelete}
        onClose={() => setLinkToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Move Link to Recycle Bin"
        message={
          linkToDelete
            ? `Are you sure you want to delete breakify.site/${linkToDelete.shortCode}? It will be suspended and moved to your Recycle Bin for 30 days, where you can restore it anytime.`
            : ''
        }
        confirmLabel="Move to Recycle Bin"
        isDestructive={true}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title={`Move ${selectedIds.size} Links to Recycle Bin`}
        message={`All ${selectedIds.size} selected short URLs will be moved to the Recycle Bin and temporarily suspended.`}
        confirmLabel="Move to Recycle Bin"
        isDestructive={true}
      />

      {/* CSV Import Dialog */}
      <Dialog
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Short Links from CSV"
        description="Upload or paste a standard CSV file to batch create short URLs."
        maxWidth="lg"
        footer={
          <div className="flex justify-between items-center w-full">
            <button
              onClick={() => {
                const sample = 'Title,Destination URL,Short Code,Tags,Notes\r\nExample Link,https://example.com/blog/2026,tech-blog,tech;updates,Sample note\r\nProduct Launch,https://breakify.site/promo,promo-launch,promo,Spring sale';
                const blob = new Blob([sample], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'breakify-import-template.csv';
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline"
            >
              Download Sample Template
            </button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleImportSubmit}
                disabled={!importFileContent.trim() || importLoading}
                leftIcon={<Upload className={`w-3.5 h-3.5 ${importLoading ? 'animate-spin' : ''}`} />}
              >
                {importLoading ? 'Importing...' : 'Upload & Import'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-center space-y-2 bg-zinc-50/50 dark:bg-zinc-900/30">
            <Upload className="w-6 h-6 text-zinc-400 mx-auto" />
            <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Select a CSV file from your computer
            </div>
            <p className="text-[11px] text-zinc-500">
              Columns supported: <code className="font-mono">Destination URL</code> (required), <code className="font-mono">Title</code>, <code className="font-mono">Short Code</code>, <code className="font-mono">Tags</code>, <code className="font-mono">Notes</code>.
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="text-xs text-zinc-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white dark:file:bg-zinc-100 dark:file:text-zinc-900 cursor-pointer pt-2"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Or Paste Raw CSV Data:
            </label>
            <textarea
              value={importFileContent}
              onChange={(e) => setImportFileContent(e.target.value)}
              placeholder="Title,Destination URL,Short Code,Tags&#10;My Link,https://example.com/page,my-slug,marketing"
              rows={4}
              className="w-full p-2.5 font-mono text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {/* Import Result Summary */}
          {importResult && (
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2 text-xs">
              <div className="flex items-center justify-between font-medium">
                <span className="text-emerald-600 dark:text-emerald-400">
                  {importResult.importedCount} link(s) imported successfully
                </span>
                {importResult.failedCount > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    {importResult.failedCount} row(s) failed
                  </span>
                )}
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="space-y-1 max-h-36 overflow-y-auto border-t border-zinc-200 dark:border-zinc-800 pt-2 font-mono text-[11px]">
                  {importResult.errors.map((err, i) => (
                    <div key={i} className="text-red-600 dark:text-red-400 flex items-start gap-1">
                      <span className="font-semibold shrink-0">Row {err.row}:</span>
                      <span>{err.error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>

      {/* Quick QR Code Dialog */}
      <Dialog
        isOpen={!!qrModalLink}
        onClose={() => setQrModalLink(null)}
        title="Dynamic QR Code"
        description={qrModalLink ? `breakify.site/${qrModalLink.shortCode}` : ''}
        maxWidth="sm"
        footer={
          <Button variant="outline" size="sm" onClick={() => setQrModalLink(null)}>
            Close
          </Button>
        }
      >
        {qrModalLink && (
          <div className="flex flex-col items-center justify-center p-4 text-center space-y-4">
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <img
                src={`/api/v1/qr/${qrModalLink._id}?format=png&width=300`}
                alt="QR Code"
                className="w-48 h-48 rounded"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
              https://breakify.site/{qrModalLink.shortCode}?src=qr
            </div>
            <div className="flex gap-2">
              <a
                href={`/api/v1/qr/${qrModalLink._id}?format=png&download=true`}
                download={`breakify-${qrModalLink.shortCode}-qr.png`}
              >
                <Button variant="outline" size="sm">
                  Download PNG
                </Button>
              </a>
              <a
                href={`/api/v1/qr/${qrModalLink._id}?format=svg&download=true`}
                download={`breakify-${qrModalLink.shortCode}-qr.svg`}
              >
                <Button variant="outline" size="sm">
                  Download SVG
                </Button>
              </a>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

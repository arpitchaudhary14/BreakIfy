import { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Link2,
  QrCode,
  Lock,
  User,
  Sliders,
  Globe,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../../components/ui/Table';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import {
  activityApi,
  ActivityLogItem,
  ActivityFilterParams,
} from '../../services/activityApi';

export function HistoryPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<string>('newest');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Dialog states
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState<boolean>(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: ActivityFilterParams = {
        search: search.trim() || undefined,
        category: category !== 'all' ? category : undefined,
        sort,
        page,
        limit: 15,
      };

      const res = await activityApi.getActivityLogs(params);
      setLogs(res.logs || []);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
      setSelectedIds([]);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [search, category, sort, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(logs.map((l) => l._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmSingleDelete = async () => {
    if (!singleDeleteId) return;
    try {
      setActionLoading(true);
      await activityApi.deleteActivityLog(singleDeleteId);
      setSingleDeleteId(null);
      await fetchLogs();
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setActionLoading(true);
      await activityApi.bulkDeleteActivityLogs(selectedIds);
      setShowBulkDeleteDialog(false);
      setSelectedIds([]);
      await fetchLogs();
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmClearAll = async () => {
    try {
      setActionLoading(true);
      await activityApi.clearAllHistory();
      setShowClearAllDialog(false);
      setSelectedIds([]);
      await fetchLogs();
    } finally {
      setActionLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE') || action.includes('RESTORE')) {
      return <Badge variant="success" size="sm">{action}</Badge>;
    }
    if (action.includes('DELETE') || action.includes('PURGE')) {
      return <Badge variant="danger" size="sm">{action}</Badge>;
    }
    if (action.includes('SECURITY') || action.includes('PASSWORD') || action.includes('ALERT')) {
      return <Badge variant="warning" size="sm">{action}</Badge>;
    }
    return <Badge variant="neutral" size="sm">{action}</Badge>;
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'link':
        return <Link2 className="w-3.5 h-3.5 text-zinc-500" />;
      case 'qr':
        return <QrCode className="w-3.5 h-3.5 text-zinc-500" />;
      case 'security':
        return <Lock className="w-3.5 h-3.5 text-amber-500" />;
      case 'auth':
        return <User className="w-3.5 h-3.5 text-zinc-500" />;
      case 'settings':
        return <Sliders className="w-3.5 h-3.5 text-zinc-500" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-zinc-500" />;
    }
  };

  const isAllSelected = logs.length > 0 && selectedIds.length === logs.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <History className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            Activity History & Audit Logs
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time immutable audit trail for link management, authentication, and security events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              Delete Selected ({selectedIds.length})
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => fetchLogs()}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setShowClearAllDialog(true)}
            disabled={totalCount === 0 || loading}
          >
            Clear All History
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by action, description, IP address, or link URL..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg overflow-x-auto text-xs font-medium">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'link', label: 'Links' },
              { id: 'qr', label: 'QR' },
              { id: 'auth', label: 'Auth' },
              { id: 'security', label: 'Security' },
              { id: 'settings', label: 'Settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setCategory(tab.id);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  category === tab.id
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            aria-label="Sort activity records"
            className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Select all activity records"
                  className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-0"
                />
              </TableHead>
              <TableHead>Timestamp (UTC)</TableHead>
              <TableHead>Event Action</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Source IP & Device</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-zinc-400 text-xs">
                  Loading activity logs...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 space-y-2">
                  <History className="w-8 h-8 text-zinc-400 mx-auto" />
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    No activity records found
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Your actions will be recorded here automatically as you create links, generate QR codes, and update settings.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const isSelected = selectedIds.includes(log._id);
                return (
                  <TableRow
                    key={log._id}
                    className={isSelected ? 'bg-zinc-50/90 dark:bg-zinc-800/60' : undefined}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(log._id)}
                        aria-label={`Select record ${log._id}`}
                        className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-0"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(log.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-900 dark:text-zinc-100 max-w-[280px]">
                      <div className="font-medium truncate" title={log.description}>
                        {log.description}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="text-[10px] font-mono text-zinc-400 truncate">
                          {JSON.stringify(log.metadata)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 capitalize">
                        {getCategoryIcon(log.category)}
                        <span>{log.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-zinc-500">
                      <div>{log.ip}</div>
                      <div className="text-[10px] text-zinc-400 truncate max-w-[140px]" title={log.userAgent}>
                        {log.userAgent}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => setSingleDeleteId(log._id)}
                        className="p-1 rounded text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete log record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <div>
              Showing page <span className="font-semibold text-zinc-900 dark:text-zinc-100">{page}</span> of {totalPages} ({totalCount} total events)
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Single Delete Confirmation */}
      <ConfirmationDialog
        isOpen={Boolean(singleDeleteId)}
        onClose={() => setSingleDeleteId(null)}
        onConfirm={handleConfirmSingleDelete}
        title="Delete Activity Record"
        message="Are you sure you want to delete this activity log? This action is permanent."
        confirmLabel="Delete Record"
        isDestructive={true}
        isLoading={actionLoading}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Selected Records"
        message={`Are you sure you want to delete the ${selectedIds.length} selected activity records?`}
        confirmLabel="Delete Selected"
        isDestructive={true}
        isLoading={actionLoading}
      />

      {/* Clear All History Confirmation */}
      <ConfirmationDialog
        isOpen={showClearAllDialog}
        onClose={() => setShowClearAllDialog(false)}
        onConfirm={handleConfirmClearAll}
        title="Clear Entire Activity History"
        message="This action will delete all activity audit logs for your account. IMPORTANT: This will ONLY delete history logs — your user account, shortened links, and QR codes will NOT be affected."
        confirmLabel="Clear History Only"
        isDestructive={true}
        isLoading={actionLoading}
      />
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
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
import { linkApi, RecycleBinItem } from '../../services/linkApi';

export function RecycleBinPage() {
  const [links, setLinks] = useState<RecycleBinItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<string>('newest');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [retentionDays, setRetentionDays] = useState<number>(30);

  // Dialog states
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);
  const [showEmptyBinDialog, setShowEmptyBinDialog] = useState<boolean>(false);
  const [showBulkPermanentDialog, setShowBulkPermanentDialog] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchRecycleBin = useCallback(async () => {
    try {
      setLoading(true);
      const res = await linkApi.getRecycleBin({
        search: search.trim() || undefined,
        sort,
        page,
        limit: 10,
      });

      setLinks(res.links || []);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
      setRetentionDays(res.retentionDaysConfigured || 30);
      setSelectedIds([]);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [search, sort, page]);

  useEffect(() => {
    fetchRecycleBin();
  }, [fetchRecycleBin]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(links.map((l) => l._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRestore = async (id: string) => {
    try {
      setActionLoading(true);
      await linkApi.restoreLink(id);
      await fetchRecycleBin();
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    try {
      setActionLoading(true);
      await linkApi.bulkRestore(selectedIds);
      setSelectedIds([]);
      await fetchRecycleBin();
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!permanentDeleteId) return;
    try {
      setActionLoading(true);
      await linkApi.permanentDeleteLink(permanentDeleteId);
      setPermanentDeleteId(null);
      await fetchRecycleBin();
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmBulkPermanentDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setActionLoading(true);
      await linkApi.bulkPermanentDelete(selectedIds);
      setShowBulkPermanentDialog(false);
      setSelectedIds([]);
      await fetchRecycleBin();
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmEmptyBin = async () => {
    try {
      setActionLoading(true);
      await linkApi.emptyRecycleBin();
      setShowEmptyBinDialog(false);
      setSelectedIds([]);
      await fetchRecycleBin();
    } finally {
      setActionLoading(false);
    }
  };

  const isAllSelected = links.length > 0 && selectedIds.length === links.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            Recycle Bin
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Deleted links are suspended and held here for {retentionDays} days before being permanently purged.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={handleBulkRestore}
                disabled={actionLoading}
              >
                Restore Selected ({selectedIds.length})
              </Button>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => setShowBulkPermanentDialog(true)}
                disabled={actionLoading}
              >
                Permanently Delete ({selectedIds.length})
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => fetchRecycleBin()}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setShowEmptyBinDialog(true)}
            disabled={totalCount === 0 || loading}
          >
            Empty Recycle Bin
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search deleted links by title, slug, or destination..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          aria-label="Sort recycle bin links"
          className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none w-full sm:w-auto"
        >
          <option value="newest">Recently Deleted</option>
          <option value="oldest">Oldest Deleted</option>
        </select>
      </Card>

      {/* Recycle Bin Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Select all deleted links"
                  className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-0"
                />
              </TableHead>
              <TableHead>Short Link</TableHead>
              <TableHead>Destination URL</TableHead>
              <TableHead>Deletion Date</TableHead>
              <TableHead>Retention Remaining</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-zinc-400 text-xs">
                  Loading recycle bin...
                </TableCell>
              </TableRow>
            ) : links.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 space-y-2">
                  <Trash2 className="w-8 h-8 text-zinc-400 mx-auto" />
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Recycle Bin is Empty
                  </div>
                  <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                    When you delete a short link from &quot;My Links&quot;, it is safely moved here. You can restore it anytime within {retentionDays} days.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              links.map((link) => {
                const isSelected = selectedIds.includes(link._id);
                const isExpiringSoon = link.retentionDaysRemaining <= 5;
                return (
                  <TableRow
                    key={link._id}
                    className={isSelected ? 'bg-zinc-50/90 dark:bg-zinc-800/60' : undefined}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(link._id)}
                        aria-label={`Select deleted link ${link.title}`}
                        className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-0"
                      />
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]" title={link.title}>
                        {link.title}
                      </div>
                      <div className="font-mono text-[11px] text-zinc-500">
                        breakify.site/{link.shortCode}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500 font-mono max-w-[260px] truncate" title={link.originalUrl}>
                      {link.originalUrl}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {link.deletedAt ? new Date(link.deletedAt).toLocaleDateString() : 'Unknown'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={isExpiringSoon ? 'warning' : 'neutral'} size="sm">
                        <Clock className="w-3 h-3 mr-1 inline" />
                        {link.retentionDaysRemaining} day{link.retentionDaysRemaining === 1 ? '' : 's'} left
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                          onClick={() => handleRestore(link._id)}
                          disabled={actionLoading}
                          title="Restore link"
                        >
                          Restore
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => setPermanentDeleteId(link._id)}
                          disabled={actionLoading}
                          title="Delete permanently"
                        >
                          Delete
                        </Button>
                      </div>
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
              Showing page <span className="font-semibold text-zinc-900 dark:text-zinc-100">{page}</span> of {totalPages} ({totalCount} items)
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

      {/* Retention Policy Notice */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
        <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-zinc-500" />
          Recycle Bin Policy & Redirection Suspension
        </div>
        <p className="text-[11px] leading-relaxed">
          Links in the recycle bin immediately stop redirecting traffic to avoid routing confusion. If restored, their short code and routing rules become fully operational again. After {retentionDays} days, items in the recycle bin are permanently purged. Permanent deletion is irreversible and cannot be undone.
        </p>
      </div>

      {/* Single Permanent Delete Confirmation */}
      <ConfirmationDialog
        isOpen={Boolean(permanentDeleteId)}
        onClose={() => setPermanentDeleteId(null)}
        onConfirm={handleConfirmPermanentDelete}
        title="Permanently Delete Link"
        message="Are you sure you want to permanently delete this short link? This action is IRREVERSIBLE and cannot be undone. The short code will be released and telemetry historical links will be purged."
        confirmLabel="Permanently Delete"
        isDestructive={true}
        isLoading={actionLoading}
      />

      {/* Bulk Permanent Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showBulkPermanentDialog}
        onClose={() => setShowBulkPermanentDialog(false)}
        onConfirm={handleConfirmBulkPermanentDelete}
        title="Permanently Delete Selected Links"
        message={`Are you sure you want to permanently purge ${selectedIds.length} links? This action is completely IRREVERSIBLE.`}
        confirmLabel="Permanently Delete"
        isDestructive={true}
        isLoading={actionLoading}
      />

      {/* Empty Recycle Bin Confirmation */}
      <ConfirmationDialog
        isOpen={showEmptyBinDialog}
        onClose={() => setShowEmptyBinDialog(false)}
        onConfirm={handleConfirmEmptyBin}
        title="Empty Recycle Bin"
        message="Are you sure you want to empty the entire recycle bin? All deleted links will be permanently and irreversibly destroyed."
        confirmLabel="Empty Bin Completely"
        isDestructive={true}
        isLoading={actionLoading}
      />
    </div>
  );
}

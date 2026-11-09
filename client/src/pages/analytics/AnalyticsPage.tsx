import { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Link2,
  Shield,
  ExternalLink,
  Users,
  MousePointerClick,
  QrCode,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
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
import { linkApi, LinkItem } from '../../services/linkApi';
import { getShortUrl, getShortDisplay } from '../../utils/urlHelper';
import {
  analyticsApi,
  AnalyticsOverview,
  TimeSeriesPoint,
  AnalyticsBreakdowns,
  AnalyticsFilterParams,
  ClickEventItem,
} from '../../services/analyticsApi';

export function AnalyticsPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | '90d' | 'all'>('30d');
  const [includeBots, setIncludeBots] = useState(false);

  // Analytics data state
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [, setBreakdowns] = useState<AnalyticsBreakdowns | null>(null);
  const [events, setEvents] = useState<ClickEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [metricTab, setMetricTab] = useState<'clicks' | 'visitors' | 'qr'>('clicks');

  // Load links for selector
  useEffect(() => {
    linkApi
      .listLinks({ limit: 100 })
      .then((res) => {
        if (res && res.links) {
          setLinks(res.links);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch live telemetry from backend
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params: AnalyticsFilterParams = {
        linkId: selectedLinkId,
        dateRange,
        includeBots,
      };

      const [overviewData, seriesData, breakdownData, eventsData] = await Promise.all([
        analyticsApi.getOverview(params),
        analyticsApi.getTimeSeries(params),
        analyticsApi.getBreakdowns(params),
        analyticsApi.getRecentEvents(params, 50),
      ]);

      setOverview(overviewData);
      setTimeSeries(seriesData.series || []);
      setBreakdowns(breakdownData);
      setEvents(eventsData.events || []);
    } catch {
      // Graceful fallback to zero state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedLinkId, dateRange, includeBots]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      await analyticsApi.downloadCsv({
        linkId: selectedLinkId,
        dateRange,
        includeBots,
      });
    } catch {
      // Error handling
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            Analytics & Intelligence
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time redirect metrics, geographic telemetry, visitor estimations, and attribution.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCsv}
            isLoading={exporting}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <Card className="p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Link Picker */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
            <select
              value={selectedLinkId}
              onChange={(e) => setSelectedLinkId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="all">All Short Links (Aggregate)</option>
              {links.map((link) => (
                <option key={link._id} value={link._id}>
                  {link.title} ({link.shortCode})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg">
            {(['24h', '7d', '30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                  dateRange === r
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {r === '24h'
                  ? 'Today (24h)'
                  : r === '7d'
                  ? '7 Days'
                  : r === '30d'
                  ? '30 Days'
                  : r === '90d'
                  ? '90 Days'
                  : 'All Time'}
              </button>
            ))}
          </div>

          {/* Bot Exclusion Toggle */}
          <button
            type="button"
            onClick={() => setIncludeBots(!includeBots)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              !includeBots
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
            }`}
            title="Toggle automated web crawler & scraper traffic filtering"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{includeBots ? 'Bots Included' : 'Bots Filtered'}</span>
          </button>
        </div>
      </Card>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clicks */}
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
            <span>Total Clicks</span>
            <MousePointerClick className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {overview ? overview.totalClicks.toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-zinc-500">
            Redirect hits recorded in selected timeframe
          </div>
        </Card>

        {/* Unique Visitors */}
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
            <span>Estimated Unique Visitors</span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {overview ? overview.uniqueVisitors.toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-zinc-500">
            Estimated via privacy-safe daily hash
          </div>
        </Card>

        {/* QR Scans & Share */}
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
            <span>QR Traffic Attributed</span>
            <QrCode className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 flex items-baseline gap-2">
            <span>{overview ? overview.qrScans.toLocaleString() : '0'}</span>
            <span className="text-xs font-normal text-zinc-400">
              ({overview ? overview.qrShare : 0}% share)
            </span>
          </div>
          <div className="text-[11px] text-zinc-500">
            Visits initiated via physical or digital QR scan
          </div>
        </Card>

        {/* Filtered Bots */}
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
            <span>Automated Crawlers</span>
            <Shield className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {overview ? overview.botClicks.toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-zinc-500">
            {includeBots ? 'Included in stats above' : 'Isolated from genuine audience'}
          </div>
        </Card>
      </div>

      {/* Main Time Series Chart */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Click & Visitor Trends
            </h2>
            <p className="text-xs text-zinc-500">
              Activity volume over time based on actual redirection events.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setMetricTab('clicks')}
              className={`px-2.5 py-1 rounded transition-colors ${
                metricTab === 'clicks'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Total Clicks
            </button>
            <button
              onClick={() => setMetricTab('visitors')}
              className={`px-2.5 py-1 rounded transition-colors ${
                metricTab === 'visitors'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Unique Visitors
            </button>
            <button
              onClick={() => setMetricTab('qr')}
              className={`px-2.5 py-1 rounded transition-colors ${
                metricTab === 'qr'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              QR Scans
            </button>
          </div>
        </div>

        {timeSeries.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Calendar className="w-8 h-8 text-zinc-400 mx-auto" />
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              No Click Events Recorded in this Period
            </div>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              BreakIfy records events in real-time when visitors access your shortened URLs. Stats update automatically upon arrival.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="monochromeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a', opacity: 0.5 }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a', opacity: 0.5 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121214',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f4f4f5',
                  }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Area
                  type="monotone"
                  dataKey={
                    metricTab === 'clicks'
                      ? 'clicks'
                      : metricTab === 'visitors'
                      ? 'uniqueVisitors'
                      : 'qrScans'
                  }
                  name={
                    metricTab === 'clicks'
                      ? 'Clicks'
                      : metricTab === 'visitors'
                      ? 'Est. Unique Visitors'
                      : 'QR Scans'
                  }
                  stroke="#ffffff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#monochromeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Top Link Highlight (if available) */}
      {overview && overview.topLink && (
        <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Link2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                Most Active Link in Selected Window
              </div>
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {overview.topLink.title}
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                <a
                  href={getShortUrl(overview.topLink.shortCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-blue-600 dark:hover:text-blue-400 font-semibold"
                >
                  {getShortDisplay(overview.topLink.shortCode)}
                </a>{' '}
                &rarr; {overview.topLink.originalUrl}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {overview.topLink.clicksInPeriod.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400">Clicks in period</div>
            </div>
            <a
              href={getShortUrl(overview.topLink.shortCode)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </Card>
      )}

      {/* Live Click Stream & Forensic Audit Table */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Live Click Stream & Forensic Audit Logs
              </h2>
              <p className="text-[11px] text-zinc-500">
                Real-time redirection events capturing visitor public IP, anonymous session ID, and millisecond timestamps.
              </p>
            </div>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            Showing latest {events.length} events
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Raw Time (UTC)</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Session ID</TableHead>
              <TableHead>Short Link</TableHead>
              <TableHead>Device & OS</TableHead>
              <TableHead>Browser</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Referrer</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-zinc-400 text-xs">
                  No click events recorded yet for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              events.map((ev) => (
                <TableRow key={ev._id}>
                  <TableCell className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    {new Date(ev.rawTime).toISOString().replace('T', ' ').slice(0, 23)}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    {ev.ip}
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-zinc-500 max-w-[120px] truncate" title={ev.sessionId}>
                    {ev.sessionId}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]" title={ev.linkTitle}>
                      {ev.linkTitle}
                    </div>
                    <div className="font-mono text-[11px] text-zinc-500">
                      /{ev.shortCode}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                    <span className="capitalize">{ev.device}</span> ({ev.os})
                  </TableCell>
                  <TableCell className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                    {ev.browser}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    {ev.country}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-500 max-w-[120px] truncate" title={ev.referrer}>
                    {ev.referrer}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={ev.isBot ? 'warning' : ev.isQr ? 'neutral' : 'success'} size="sm">
                      {ev.isBot ? 'Crawler' : ev.isQr ? 'QR Scan' : 'Visitor'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}


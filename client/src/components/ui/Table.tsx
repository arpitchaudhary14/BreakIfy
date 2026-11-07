import React from 'react';

export function Table({
  className = '',
  children,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full text-left border-collapse text-sm ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`border-b border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-900/50 ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={`divide-y divide-zinc-200/80 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300 ${className}`}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function TableRow({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  className = '',
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({
  className = '',
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}


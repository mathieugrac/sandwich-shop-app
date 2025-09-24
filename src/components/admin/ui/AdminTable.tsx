import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

// AdminTable - Enhanced table with admin styling
const AdminTable = forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <Table
    ref={ref}
    className={cn(
      'border border-gray-200 rounded-lg overflow-hidden',
      'shadow-sm bg-white',
      className
    )}
    {...props}
  />
));
AdminTable.displayName = 'AdminTable';

// AdminTableHeader - Styled header with admin theme
const AdminTableHeader = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <TableHeader
    ref={ref}
    className={cn('bg-gray-50 border border-gray-200 px-3', className)}
    {...props}
  />
));
AdminTableHeader.displayName = 'AdminTableHeader';

// AdminTableHead - Enhanced header cells
const AdminTableHead = forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <TableHead
    ref={ref}
    className={cn(
      'font-semibold text-[#555] text-xs',
      'px-3 py-3',
      'first:pl-4 last:pr-4',
      className
    )}
    {...props}
  />
));
AdminTableHead.displayName = 'AdminTableHead';

// AdminTableBody - Enhanced body with hover effects
const AdminTableBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <TableBody
    ref={ref}
    className={cn(
      '[&_tr:hover]:bg-gray-50',
      '[&_tr]:border-b [&_tr]:border-gray-100',
      '[&_tr:last-child]:border-0',
      className
    )}
    {...props}
  />
));
AdminTableBody.displayName = 'AdminTableBody';

// AdminTableRow - Enhanced rows
const AdminTableRow = forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <TableRow
    ref={ref}
    className={cn(
      'transition-colors duration-150',
      'hover:bg-gray-50',
      className
    )}
    {...props}
  />
));
AdminTableRow.displayName = 'AdminTableRow';

// AdminTableCell - Enhanced cells with consistent padding
const AdminTableCell = forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <TableCell
    ref={ref}
    className={cn(
      'px-3 py-3 text-[14px] text-[#111] align-middle',
      'first:pl-4 last:pr-4',
      className
    )}
    {...props}
  />
));
AdminTableCell.displayName = 'AdminTableCell';

export {
  AdminTable,
  AdminTableHeader,
  AdminTableHead,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
};

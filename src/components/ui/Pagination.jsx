'use client';
// src/components/ui/Pagination.jsx
import React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

const Pagination = ({
  currentPage = 1,
  totalPages = 10,
  totalItems = 0,
  showAll = false,
  onPageChange = (page) => {}
}) => {
  if (showAll || totalPages <= 1) {
    // Show summary when all data is displayed
    return (
      <div className="flex items-center justify-center px-6 py-4 bg-gray-50 border-t border-gray-200">
        <span className="text-sm text-gray-600">
          Showing all {totalItems} {totalItems === 1 ? 'invoice' : 'invoices'}
        </span>
      </div>
    );
  }

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination with ellipsis
      if (currentPage <= 4) {
        // Near the beginning
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near the end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  const handlePageClick = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const PageButton = ({ page, isActive = false, disabled = false, children }) => (
    <button
      onClick={() => !disabled && handlePageClick(page)}
      disabled={disabled}
      className={`relative inline-flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 ${
        disabled
          ? 'text-gray-300 cursor-not-allowed'
          : isActive
          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 ring-1 ring-blue-500'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 border-gray-300'
      } border`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      {/* Mobile pagination */}
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
            currentPage <= 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          Previous
        </button>
        <span className="text-sm text-gray-700 flex items-center">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
            currentPage >= totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          Next
        </button>
      </div>

      {/* Desktop pagination */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing page{' '}
            <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span> ({' '}
            <span className="font-medium">{totalItems}</span> total invoices)
          </p>
        </div>

        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {/* First page */}
            <PageButton
              page={1}
              disabled={currentPage <= 1}
            >
              <ChevronDoubleLeftIcon className="h-4 w-4" />
              <span className="sr-only">First page</span>
            </PageButton>

            {/* Previous page */}
            <PageButton
              page={currentPage - 1}
              disabled={currentPage <= 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </PageButton>

            {/* Page numbers */}
            {pageNumbers.map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                );
              }

              return (
                <PageButton
                  key={page}
                  page={page}
                  isActive={page === currentPage}
                >
                  {page}
                </PageButton>
              );
            })}

            {/* Next page */}
            <PageButton
              page={currentPage + 1}
              disabled={currentPage >= totalPages}
            >
              <ChevronRightIcon className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </PageButton>

            {/* Last page */}
            <PageButton
              page={totalPages}
              disabled={currentPage >= totalPages}
            >
              <ChevronDoubleRightIcon className="h-4 w-4" />
              <span className="sr-only">Last page</span>
            </PageButton>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
import { useState } from 'react';

export function usePagination(initialPage = 1, initialLimit = 10) {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);

  function resetToFirstPage() {
    setPage(1);
  }

  function next(totalPages: number) {
    setPage((prev) => (prev < totalPages ? prev + 1 : prev));
  }

  function prev() {
    setPage((prev) => (prev > 1 ? prev - 1 : prev));
  }

  return { page, limit, setPage, resetToFirstPage, next, prev };
}

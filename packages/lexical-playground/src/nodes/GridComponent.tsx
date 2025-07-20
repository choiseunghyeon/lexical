/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {LexicalEditor, NodeKey} from 'lexical';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

// ============================================================================
// 타입 정의
// ============================================================================

export type GridCell = string | number;

export interface GridCellData {
  id: string;
  value: GridCell;
}

export interface GridRowData {
  id: string;
  cells: GridCellData[];
}

export type GridData = GridRowData[];

// 보이는 행 범위
interface VisibleRange {
  startIndex: number;
  endIndex: number;
}

// ============================================================================
// 가짜 서버 API (실제 환경에서는 실제 API로 교체)
// ============================================================================

// 가짜 데이터 생성 함수
function generateFakeRowData(startIndex: number, count: number): GridRowData[] {
  return Array.from({length: count}, (_, i) => {
    const rowIndex = startIndex + i;
    return {
      cells: [
        {
          id: `cell-${rowIndex}-0`,
          value: `Row ${rowIndex + 1}`,
        },
        {
          id: `cell-${rowIndex}-1`,
          value: `Data ${rowIndex + 1}`,
        },
        {
          id: `cell-${rowIndex}-2`,
          value: Math.floor(Math.random() * 1000),
        },
      ],
      id: `row-${rowIndex}`,
    };
  });
}

// 가짜 API 호출 함수
async function fetchGridData(
  pageIndex: number,
  pageSize: number,
): Promise<GridRowData[]> {
  // 네트워크 지연 시뮬레이션 (0.5~1.5초 랜덤)
  const delay = Math.random() * 1000 + 500;

  return new Promise((resolve) => {
    setTimeout(() => {
      const startIndex = pageIndex * pageSize;
      const data = generateFakeRowData(startIndex, pageSize);
      // eslint-disable-next-line no-console
      console.log(
        `📥 Fetched page ${pageIndex}: ${data.length} rows (${startIndex}-${
          startIndex + data.length - 1
        })`,
      );
      resolve(data);
    }, delay);
  });
}

// ============================================================================
// 데이터 페칭 훅
// ============================================================================

function useGridDataFetching(
  totalRows: number,
  visibleRange: VisibleRange,
  pageSize: number = 20,
) {
  const [rows, setRows] = useState<Array<GridRowData | undefined>>(
    Array(totalRows).fill(undefined),
  );
  const [fetchedPages, setFetchedPages] = useState<Set<number>>(new Set());
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());
  const [errorPages, setErrorPages] = useState<Set<number>>(new Set());

  // 미리 페칭할 페이지 수 (상위/하위 각각 2페이지씩)
  const prefetchPages = 2;

  // 필요한 페이지 계산 (미리 페칭 포함)
  const requiredPages = useMemo(() => {
    const startPage = Math.floor(visibleRange.startIndex / pageSize);
    const endPage = Math.floor(visibleRange.endIndex / pageSize);
    const pages = new Set<number>();

    // 실제 보이는 범위
    for (let page = startPage; page <= endPage; page++) {
      pages.add(page);
    }

    // 상위 미리 페칭
    for (let page = startPage - prefetchPages; page < startPage; page++) {
      if (page >= 0) {
        pages.add(page);
      }
    }

    // 하위 미리 페칭
    for (let page = endPage + 1; page <= endPage + prefetchPages; page++) {
      const maxPage = Math.floor((totalRows - 1) / pageSize);
      if (page <= maxPage) {
        pages.add(page);
      }
    }

    return pages;
  }, [
    visibleRange.startIndex,
    visibleRange.endIndex,
    pageSize,
    totalRows,
    prefetchPages,
  ]);

  // 우선순위 계산 함수
  const getPagePriority = useCallback(
    (pageIndex: number) => {
      const startPage = Math.floor(visibleRange.startIndex / pageSize);
      const endPage = Math.floor(visibleRange.endIndex / pageSize);

      // 실제 보이는 범위: 최고 우선순위 (0)
      if (pageIndex >= startPage && pageIndex <= endPage) {
        return 0;
      }

      // 바로 인접한 범위: 중간 우선순위 (1)
      if (pageIndex === startPage - 1 || pageIndex === endPage + 1) {
        return 1;
      }

      // 나머지 미리 페칭: 낮은 우선순위 (2)
      return 2;
    },
    [visibleRange.startIndex, visibleRange.endIndex, pageSize],
  );

  // 데이터 페칭 (우선순위 기반)
  useEffect(() => {
    // 페이지를 우선순위별로 정렬
    const sortedPages = Array.from(requiredPages).sort((a, b) => {
      const priorityA = getPagePriority(a);
      const priorityB = getPagePriority(b);
      return priorityA - priorityB;
    });

    sortedPages.forEach((pageIndex) => {
      // 이미 받아왔거나 로딩 중이거나 에러가 난 페이지는 건너뛰기
      if (
        fetchedPages.has(pageIndex) ||
        loadingPages.has(pageIndex) ||
        errorPages.has(pageIndex)
      ) {
        return;
      }

      // 로딩 상태 설정
      setLoadingPages((prev) => new Set(prev).add(pageIndex));

      // 데이터 요청
      fetchGridData(pageIndex, pageSize)
        .then((data) => {
          // 받아온 데이터를 전체 배열에 채우기
          setRows((prev) => {
            const next = [...prev];
            data.forEach((row, i) => {
              const globalIndex = pageIndex * pageSize + i;
              if (globalIndex < totalRows) {
                next[globalIndex] = row;
              }
            });
            return next;
          });

          // 페치 완료 상태 설정
          setFetchedPages((prev) => new Set(prev).add(pageIndex));
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error(`❌ Error fetching page ${pageIndex}:`, error);
          setErrorPages((prev) => new Set(prev).add(pageIndex));
        })
        .finally(() => {
          // 로딩 상태 해제
          setLoadingPages((prev) => {
            const next = new Set(prev);
            next.delete(pageIndex);
            return next;
          });
        });
    });
  }, [
    requiredPages,
    fetchedPages,
    loadingPages,
    errorPages,
    pageSize,
    totalRows,
    getPagePriority,
  ]);

  // 에러 페이지 재시도 함수
  const retryPage = useCallback((pageIndex: number) => {
    setErrorPages((prev) => {
      const next = new Set(prev);
      next.delete(pageIndex);
      return next;
    });
  }, []);

  return {
    errorPages,
    loadingPages,
    prefetchPages,
    retryPage,
    rows,
  };
}

// ============================================================================
// 쓰로틀링 유틸리티
// ============================================================================

function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
): T {
  const lastRun = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: unknown[]) => {
      const now = Date.now();

      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      } else {
        // 이전 타임아웃이 있다면 취소
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // 남은 시간만큼 대기 후 실행
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - (now - lastRun.current));
      }
    }) as T,
    [callback, delay],
  );
}

// ============================================================================
// 가상 스크롤 훅
// ============================================================================

function useVirtualScroll(
  totalRows: number,
  containerHeight: number,
  rowHeight: number,
  overscan: number,
) {
  const lastIndex = totalRows - 1;
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({
    endIndex: Math.min(overscan * 2, lastIndex),
    startIndex: 0,
  });

  // 보이는 행 범위 계산
  const calculateVisibleRange = useCallback(
    (currentScrollTop: number): VisibleRange => {
      const startIndex = Math.max(
        0,
        Math.floor(currentScrollTop / rowHeight) - overscan,
      );

      const endIndex = Math.min(
        lastIndex,
        Math.ceil((currentScrollTop + containerHeight) / rowHeight) + overscan,
      );

      return {endIndex, startIndex};
    },
    [containerHeight, rowHeight, overscan, lastIndex],
  );

  // 쓰로틀링된 스크롤 핸들러 (100ms 간격)
  const throttledScrollHandler = useThrottle(
    (newScrollTop: unknown) => {
      if (typeof newScrollTop === 'number') {
        setScrollTop(newScrollTop);
        const newVisibleRange = calculateVisibleRange(newScrollTop);
        setVisibleRange(newVisibleRange);
      }
    },
    100, // 100ms 쓰로틀링
  );

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = event.currentTarget.scrollTop;
      throttledScrollHandler(newScrollTop);
    },
    [throttledScrollHandler],
  );

  // 초기 visible range 설정
  useEffect(() => {
    const initialRange = calculateVisibleRange(0);
    setVisibleRange(initialRange);
  }, [calculateVisibleRange]);

  return {
    handleScroll,
    scrollTop,
    totalHeight: totalRows * rowHeight,
    visibleRange,
  };
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

/**
 * 진정한 가상 스크롤 그리드 컴포넌트
 * 보이지 않는 부분은 아예 렌더링하지 않음
 * 페이지네이션 방식으로 데이터 페칭
 */
export default function GridComponent({
  nodeKey,
  editor,
  totalRows = 1000,
}: {
  nodeKey: NodeKey;
  editor: LexicalEditor;
  totalRows?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 가상 스크롤 설정 (상수로 정의하여 불필요한 재생성 방지)
  const containerHeight = 400;
  const rowHeight = 60;
  const overscan = 5;
  const pageSize = 20;

  const {visibleRange, handleScroll, totalHeight} = useVirtualScroll(
    totalRows,
    containerHeight,
    rowHeight,
    overscan,
  );

  // 데이터 페칭
  const {rows, loadingPages, errorPages, retryPage} = useGridDataFetching(
    totalRows,
    visibleRange,
    pageSize,
  );

  // 보이는 행들만 렌더링 (useMemo로 최적화)
  const visibleRows = useMemo(() => {
    return rows
      .slice(visibleRange.startIndex, visibleRange.endIndex + 1)
      .map((rowData, index) => {
        const globalIndex = visibleRange.startIndex + index;
        const pageIndex = Math.floor(globalIndex / pageSize);
        const isLoading = loadingPages.has(pageIndex);
        const hasError = errorPages.has(pageIndex);

        return (
          <Row
            key={`row-${globalIndex}`}
            rowData={rowData}
            isLoading={isLoading}
            hasError={hasError}
            onRetry={() => retryPage(pageIndex)}
            style={{
              position: 'absolute',
              transform: `translateY(${globalIndex * rowHeight}px)`,
              width: '100%',
              willChange: 'transform', // GPU 가속 힌트
            }}
          />
        );
      });
  }, [
    rows,
    visibleRange.startIndex,
    visibleRange.endIndex,
    rowHeight,
    loadingPages,
    errorPages,
    retryPage,
    pageSize,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        border: '1px solid #ccc',
        contain: 'layout style paint',
        height: containerHeight,
        overflow: 'auto',
        padding: 8,
        position: 'relative',
        // 성능 최적화
        willChange: 'scroll-position',
      }}
      onScroll={handleScroll}>
      {/* 가상 스크롤을 위한 전체 높이 컨테이너 */}
      <div
        style={{
          height: totalHeight,
          position: 'relative',
          // GPU 가속을 위한 컨테이너 최적화
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}>
        <div style={{display: 'grid', width: '100%'}}>{visibleRows}</div>
      </div>
    </div>
  );
}

// ============================================================================
// 행 컴포넌트
// ============================================================================

interface GridRowProps {
  rowData: GridRowData | undefined;
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  style?: React.CSSProperties;
}

const Row = React.memo(function Row({
  rowData,
  isLoading,
  hasError,
  onRetry,
  style,
}: GridRowProps) {
  if (isLoading) {
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          width: '100%',
        }}>
        <div
          style={{
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            display: 'flex',
            flex: 1,
            fontSize: '14px',
            height: 60,
            justifyContent: 'center',
            textAlign: 'center',
          }}>
          ⏳ 로딩 중...
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          width: '100%',
        }}>
        <div
          style={{
            alignItems: 'center',
            backgroundColor: '#ffe6e6',
            border: '1px solid #ff6b6b',
            cursor: 'pointer',
            display: 'flex',
            flex: 1,
            fontSize: '14px',
            height: 60,
            justifyContent: 'center',
            textAlign: 'center',
          }}
          onClick={onRetry}>
          ❌ 에러 발생 (클릭하여 재시도)
        </div>
      </div>
    );
  }

  if (!rowData) {
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          width: '100%',
        }}>
        <div
          style={{
            alignItems: 'center',
            backgroundColor: '#f9f9f9',
            border: '1px solid #ddd',
            display: 'flex',
            flex: 1,
            fontSize: '14px',
            height: 60,
            justifyContent: 'center',
            textAlign: 'center',
          }}>
          📄 데이터 없음
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...style,
        display: 'flex',
        width: '100%',
      }}>
      {rowData.cells.map((cellData) => (
        <Cell key={cellData.id} cellData={cellData} />
      ))}
    </div>
  );
});

// ============================================================================
// 셀 컴포넌트
// ============================================================================

interface GridCellProps {
  cellData: GridCellData;
}

function Cell({cellData}: GridCellProps) {
  return (
    <div
      key={cellData.id}
      style={{
        alignItems: 'center',
        border: '1px solid #aaa',
        display: 'flex',
        flex: 1,
        fontSize: '16px',
        height: 60,
        justifyContent: 'center',
        textAlign: 'center',
      }}>
      {cellData.value}
    </div>
  );
}

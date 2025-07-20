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

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = event.currentTarget.scrollTop;
      setScrollTop(newScrollTop);

      const newVisibleRange = calculateVisibleRange(newScrollTop);
      setVisibleRange(newVisibleRange);
    },
    [calculateVisibleRange],
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
 */
export default function GridComponent({
  gridData,
  nodeKey,
  editor,
  totalRows = 1000,
}: {
  gridData: GridData;
  nodeKey: NodeKey;
  editor: LexicalEditor;
  totalRows?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 가상 스크롤 설정 (상수로 정의하여 불필요한 재생성 방지)
  const containerHeight = 400;
  const rowHeight = 60;
  const overscan = 5;

  const {visibleRange, handleScroll, totalHeight} = useVirtualScroll(
    gridData.length,
    containerHeight,
    rowHeight,
    overscan,
  );

  // 보이는 행들만 렌더링 (useMemo로 최적화)
  const visibleRows = useMemo(() => {
    return gridData
      .slice(visibleRange.startIndex, visibleRange.endIndex + 1)
      .map((rowData, index) => (
        <Row
          key={rowData.id}
          rowData={rowData}
          style={{
            position: 'absolute',
            transform: `translateY(${
              (visibleRange.startIndex + index) * rowHeight
            }px)`,
            width: '100%',
            willChange: 'transform', // GPU 가속 힌트
          }}
        />
      ));
  }, [gridData, visibleRange.startIndex, visibleRange.endIndex, rowHeight]);

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
        <table style={{width: '100%'}}>
          <tbody>{visibleRows}</tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 행 컴포넌트
// ============================================================================

interface GridRowProps {
  rowData: GridRowData;
  style?: React.CSSProperties;
}

const Row = React.memo(function Row({rowData, style}: GridRowProps) {
  return (
    <tr key={rowData.id} style={style}>
      {rowData.cells.map((cellData) => (
        <Cell key={cellData.id} cellData={cellData} />
      ))}
    </tr>
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
    <td
      key={cellData.id}
      style={{
        border: '1px solid #aaa',
        fontSize: '16px',
        height: 60,
        padding: 8,
        textAlign: 'center',
        verticalAlign: 'middle',
        width: '100%',
      }}>
      {cellData.value}
    </td>
  );
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {LexicalEditor, NodeKey} from 'lexical';
import React from 'react';

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

// ============================================================================
// 행 컴포넌트
// ============================================================================

interface GridRowProps {
  rowData: GridRowData;
}

function Row({rowData}: GridRowProps) {
  return (
    <tr key={rowData.id}>
      {rowData.cells.map((cellData) => (
        <Cell key={cellData.id} cellData={cellData} />
      ))}
    </tr>
  );
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

/**
 * 기본 그리드 컴포넌트
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
  return (
    <div
      style={{
        border: '1px solid #ccc',
        maxHeight: 400,
        overflow: 'auto',
        padding: 8,
      }}>
      <table style={{width: '100%'}}>
        <tbody>
          {gridData.map((rowData) => (
            <Row key={rowData.id} rowData={rowData} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

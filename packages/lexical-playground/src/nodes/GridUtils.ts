/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {GridData} from './GridComponent';

/**
 * 대용량 테이블 데이터 생성을 위한 유틸리티 함수들
 */

// 1,000행 데이터 생성 (테스트 간소화: 각 행에 셀 1개만)
export function createLargeGridData(
  rows: number = 1000,
  cols: number = 1,
): GridData {
  return Array.from({length: rows}, (_, rowIdx) => ({
    cells: [
      {
        id: `cell-${rowIdx}-0`,
        value: `Row ${rowIdx + 1}`,
      },
    ],
    id: `row-${rowIdx}`,
  }));
}

// 2,000행 데이터 생성 (테스트 간소화: 각 행에 셀 1개만)
export function createExtraLargeGridData(
  rows: number = 2000,
  cols: number = 1,
): GridData {
  return Array.from({length: rows}, (_, rowIdx) => ({
    cells: [
      {
        id: `cell-${rowIdx}-0`,
        value: `Row ${rowIdx + 1}`,
      },
    ],
    id: `row-${rowIdx}`,
  }));
}

// 랜덤 데이터 생성 (테스트용)
export function createRandomGridData(rows: number, cols: number): GridData {
  const names = [
    'Alice',
    'Bob',
    'Charlie',
    'Diana',
    'Eve',
    'Frank',
    'Grace',
    'Henry',
  ];
  const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'];

  return Array.from({length: rows}, (_, rowIdx) => {
    if (rowIdx === 0) {
      // 헤더 행
      return {
        cells: [
          'ID',
          'Name',
          'Age',
          'Department',
          'Salary',
          'Email',
          'Phone',
          'Address',
          'Start Date',
          'Status',
        ].map((value, colIdx) => ({
          id: `cell-${rowIdx}-${colIdx}`,
          value,
        })),
        id: `row-${rowIdx}`,
      };
    }

    const rowData = [
      rowIdx.toString(),
      names[Math.floor(Math.random() * names.length)],
      (20 + Math.floor(Math.random() * 50)).toString(),
      departments[Math.floor(Math.random() * departments.length)],
      (30000 + Math.floor(Math.random() * 70000)).toString(),
      `user${rowIdx}@company.com`,
      `+1-555-${String(Math.floor(Math.random() * 1000)).padStart(
        3,
        '0',
      )}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      `${Math.floor(Math.random() * 9999)} Main St`,
      `202${Math.floor(Math.random() * 4)}-${String(
        Math.floor(Math.random() * 12) + 1,
      ).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(
        2,
        '0',
      )}`,
      Math.random() > 0.5 ? 'Active' : 'Inactive',
    ];

    return {
      cells: rowData.map((value, colIdx) => ({
        id: `cell-${rowIdx}-${colIdx}`,
        value,
      })),
      id: `row-${rowIdx}`,
    };
  });
}

// 성능 테스트용 데이터 생성 (테스트 간소화: 각 행에 셀 1개만)
export function createPerformanceTestData(
  rows: number,
  cols: number,
): GridData {
  return Array.from({length: rows}, (_, rowIdx) => ({
    cells: [
      {
        id: `cell-${rowIdx}-0`,
        value: `Performance Row ${rowIdx + 1}`,
      },
    ],
    id: `row-${rowIdx}`,
  }));
}

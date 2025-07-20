/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {
  $applyNodeReplacement,
  DecoratorNode,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import React from 'react';

import {GridData} from './GridComponent';

// 2. 직렬화 타입 정의
export type SerializedGridNode = Spread<
  {
    gridData: GridData;
    type: 'grid';
    version: 1;
  },
  SerializedLexicalNode
>;

const GridComponent = React.lazy(() => import('./GridComponent'));

// 4. Node 클래스
export class GridNode extends DecoratorNode<JSX.Element> {
  __gridData: GridData;
  __totalRows: number;

  static getType(): string {
    return 'grid';
  }

  static clone(node: GridNode): GridNode {
    return new GridNode(node.__gridData, node.__totalRows, node.__key);
  }

  constructor(gridData: GridData, totalRows: number = 1000, key?: NodeKey) {
    super(key);
    this.__gridData = gridData;
    this.__totalRows = totalRows;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    return dom;
  }

  updateDOM(): false {
    return false;
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return (
      <GridComponent
        gridData={this.__gridData}
        nodeKey={this.getKey()}
        editor={editor}
        totalRows={this.__totalRows}
      />
    );
  }

  exportJSON(): SerializedGridNode {
    return {
      ...super.exportJSON(),
      gridData: this.__gridData,
      type: 'grid',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedGridNode): GridNode {
    return new GridNode(serializedNode.gridData);
  }
}

export function $createGridNode(gridData: GridData): GridNode {
  return $applyNodeReplacement(new GridNode(gridData));
}

export function $isGridNode(
  node: GridNode | LexicalNode | null | undefined,
): node is GridNode {
  return node instanceof GridNode;
}

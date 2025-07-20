/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {JSX} from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$wrapNodeInElement} from '@lexical/utils';
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  LexicalEditor,
} from 'lexical';
import * as React from 'react';
import {useEffect} from 'react';

import {GridData} from '../../nodes/GridComponent';
import {$createGridNode, GridNode} from '../../nodes/GridNode';
import Button from '../../ui/Button';

type Props = {
  hasLinkAttributes?: boolean;
};

export type InsertGridPayload = Readonly<GridData>;

export const INSERT_GRID_COMMAND: LexicalCommand<GridData> = createCommand(
  'INSERT_GRID_COMMAND',
);

export default function GridPlugin({
  hasLinkAttributes = false,
}: Props): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([GridNode])) {
      throw new Error('GridPlugin: GridNode not registered on editor');
    }
    // 커맨드 등록
    return editor.registerCommand<InsertGridPayload>(
      INSERT_GRID_COMMAND,
      (gridData) => {
        const gridNode = $createGridNode(gridData as GridData);
        $insertNodes([gridNode]);
        if ($isRootOrShadowRoot(gridNode.getParentOrThrow())) {
          $wrapNodeInElement(gridNode, $createParagraphNode).selectEnd();
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  // (선택) 삽입 버튼 등 UI 추가
  return null;
}

export function InsertGridDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const onClick = () => {
    const fakeGridData2000: GridData = Array.from(
      {length: 2000},
      (unused, rowIdx) => ({
        cells: [
          {
            id: `cell-${rowIdx}-0`,
            value: `Row ${rowIdx + 1}`,
          },
        ],
        id: `row-${rowIdx}`,
      }),
    );
    activeEditor.dispatchCommand(INSERT_GRID_COMMAND, fakeGridData2000);
    onClose();
  };

  return (
    <>
      <Button onClick={onClick}>그리드 추가</Button>
    </>
  );
}

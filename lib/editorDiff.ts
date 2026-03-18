import type * as monacoType from 'monaco-editor'

// One line in a diff
export interface DiffLine {
  type: 'unchanged' | 'removed' | 'added'
  content: string
  originalLineNumber: number | null  // null for added lines
  proposedLineNumber: number | null  // null for removed lines
}

// The pending diff waiting for user to accept/reject
export interface PendingDiff {
  originalCode: string
  proposedCode: string
  displayLines: DiffLine[]
  decorationIds: string[]
}

// ── Step 1: Compute the diff between two code strings ──────────

export function computeDiff(original: string, proposed: string): DiffLine[] {
  const origLines = original.split('\n')
  const propLines = proposed.split('\n')

  // LCS (longest common subsequence) using dynamic programming
  const m = origLines.length
  const n = propLines.length
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origLines[i - 1] === propLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to find the diff
  const result: DiffLine[] = []
  let i = m, j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === propLines[j - 1]) {
      result.unshift({
        type: 'unchanged',
        content: origLines[i - 1],
        originalLineNumber: i,
        proposedLineNumber: j
      })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: 'added',
        content: propLines[j - 1],
        originalLineNumber: null,
        proposedLineNumber: j
      })
      j--
    } else {
      result.unshift({
        type: 'removed',
        content: origLines[i - 1],
        originalLineNumber: i,
        proposedLineNumber: null
      })
      i--
    }
  }

  return result
}

// ── Step 2: Build display content for Monaco ────────────────────
// The editor shows BOTH removed and added lines at the same time
// so the user can see exactly what changed (like GitHub inline diff)

function buildDisplayContent(diffLines: DiffLine[]): string {
  return diffLines.map(line => line.content).join('\n')
}

// ── Step 3: Apply the diff to the Monaco editor ─────────────────

export function applyDiffToEditor(
  monaco: typeof monacoType,
  editor: monacoType.editor.IStandaloneCodeEditor,
  originalCode: string,
  proposedCode: string
): PendingDiff {
  const diffLines = computeDiff(originalCode, proposedCode)
  const displayContent = buildDisplayContent(diffLines)

  // Set editor content to the display version (shows both old and new)
  editor.getModel()?.setValue(displayContent)

  // Build decorations
  const decorations: monacoType.editor.IModelDeltaDecoration[] = []
  let lineNum = 1

  for (const line of diffLines) {
    if (line.type === 'removed') {
      decorations.push({
        range: new monaco.Range(lineNum, 1, lineNum, 1),
        options: {
          isWholeLine: true,
          className: 'diff-line-removed',
          linesDecorationsClassName: 'diff-gutter-removed'
        }
      })
    } else if (line.type === 'added') {
      decorations.push({
        range: new monaco.Range(lineNum, 1, lineNum, 1),
        options: {
          isWholeLine: true,
          className: 'diff-line-added',
          linesDecorationsClassName: 'diff-gutter-added'
        }
      })
    }
    lineNum++
  }

  const decorationIds = editor.deltaDecorations([], decorations)

  return {
    originalCode,
    proposedCode,
    displayLines: diffLines,
    decorationIds
  }
}

// ── Step 4: Accept — keep added lines, remove removed lines ──────

export function acceptDiff(
  editor: monacoType.editor.IStandaloneCodeEditor,
  diff: PendingDiff
): string {
  // Final code = all unchanged + all added lines (no removed)
  const finalLines = diff.displayLines
    .filter(line => line.type !== 'removed')
    .map(line => line.content)
  const finalCode = finalLines.join('\n')

  editor.getModel()?.setValue(finalCode)
  editor.deltaDecorations(diff.decorationIds, [])  // clear decorations
  return finalCode
}

// ── Step 5: Reject — restore original, clear decorations ────────

export function rejectDiff(
  editor: monacoType.editor.IStandaloneCodeEditor,
  diff: PendingDiff
): void {
  editor.getModel()?.setValue(diff.originalCode)
  editor.deltaDecorations(diff.decorationIds, [])  // clear decorations
}

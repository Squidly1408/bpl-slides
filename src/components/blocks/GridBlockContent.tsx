import type { Block } from '../../types'

/**
 * A plain data table/grid — every project theme uses the same neutral
 * grey styling (rather than reading the active theme colour) so it stays
 * legible and consistent regardless of which theme a project is in, the
 * same way FileBlockContent's preview chrome does.
 */
export default function GridBlockContent({ block, scale = 1 }: { block: Extract<Block, { type: 'grid' }>; scale?: number }) {
  return (
    <table className="h-full w-full border-collapse overflow-hidden rounded-lg bg-white" style={{ tableLayout: 'fixed' }}>
      <tbody>
        {block.cells.map((row, rowIndex) => {
          const isHeader = block.headerRow && rowIndex === 0
          return (
            <tr key={rowIndex}>
              {row.map((cellText, colIndex) => {
                const Cell = isHeader ? 'th' : 'td'
                return (
                  <Cell
                    key={colIndex}
                    className="overflow-hidden border align-top"
                    style={{
                      borderColor: 'rgba(20, 20, 30, 0.15)',
                      background: isHeader ? 'rgba(20, 20, 30, 0.06)' : undefined,
                      fontWeight: isHeader ? 700 : 400,
                      fontSize: 15 * scale,
                      lineHeight: 1.3,
                      padding: `${4 * scale}px ${8 * scale}px`,
                      textAlign: 'left',
                      color: '#211f1a',
                      wordBreak: 'break-word',
                    }}
                  >
                    {cellText}
                  </Cell>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

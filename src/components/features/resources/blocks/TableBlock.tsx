import React from 'react'
import { TableBlock as TableBlockType } from '@/payload/payload-types'

interface TableBlockProps {
  block: TableBlockType
}

export function TableBlock({ block }: TableBlockProps) {
  const { headers, rows } = block

  if (!rows || rows.length === 0) return null

  return (
    <div className="my-10 w-full overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-250">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          {headers && headers.length > 0 && (
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                {headers.map((header, i) => (
                  <th key={header.id || i} className="px-4 py-3 font-semibold text-zinc-200">
                    {header.header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-white/5">
            {rows.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} className="hover:bg-white/[0.02] transition-colors">
                {row.cells?.map((cell, cellIndex) => (
                  <td key={cell.id || cellIndex} className="px-4 py-3 text-zinc-400">
                    {cell.cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface FrontmatterPanelProps {
  frontmatter: string
  onChange: (newFrontmatter: string) => void
}

export function FrontmatterPanel({ frontmatter, onChange }: FrontmatterPanelProps) {
  const [value, setValue] = useState(frontmatter)

  useEffect(() => {
    setValue(frontmatter)
  }, [frontmatter])

  return (
    <div className='p-3 flex gap-3 items-start'>
      <div className='flex-1'>
        <label className='text-xs text-muted-foreground mb-1 block'>Resume configuration (YAML)</label>
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          className='w-full h-40 rounded border p-2 font-mono text-sm'
          spellCheck={false}
        />
      </div>

      <div className='flex flex-col gap-2'>
        <Button
          type='button'
          onClick={() => onChange(value)}
          className='whitespace-nowrap'
        >
          Save
        </Button>
      </div>
    </div>
  )
}
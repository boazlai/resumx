// @ts-nocheck
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import StyleToolbar from './style-toolbar'

describe('StyleToolbar', () => {
  it('renders MVP controls', () => {
    const props = {
      frontmatter: 'style: \"default\"\\npages: 1\\nfontSize: \"normal\"',
      onSetFrontmatter: () => {},
      onToggleMark: () => {},
      onToggleList: () => {},
      onSetFontSize: () => {},
      onClearFormatting: () => {},
    }

    render(<StyleToolbar {...props} />)

    // style preset selector
    expect(screen.getByLabelText('Select style preset')).toBeInTheDocument()
    // pages stepper (shows numeric value)
    expect(screen.getByText('1')).toBeInTheDocument()
    // font size selector
    expect(screen.getByLabelText('Font size')).toBeInTheDocument()
    // clear button
    expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument()
  })
})
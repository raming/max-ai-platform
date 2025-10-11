import React from 'react'
import { render, screen } from '@testing-library/react'
import { Label } from '@/components/ui/label'

describe('Label', () => {
    it('renders with default props', () => {
        render(<Label>Label text</Label>)
        const label = screen.getByText('Label text')
        expect(label).toBeInTheDocument()
        expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none', 'peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70')
    })

    it('supports custom className', () => {
        render(<Label className="custom-label">Custom Label</Label>)
        const label = screen.getByText('Custom Label')
        expect(label).toHaveClass('custom-label')
    })

    it('forwards other props', () => {
        render(<Label htmlFor="test-input">Test Label</Label>)
        const label = screen.getByText('Test Label')
        expect(label).toHaveAttribute('for', 'test-input')
    })

    it('renders as label element', () => {
        render(<Label>Test</Label>)
        const label = screen.getByText('Test')
        expect(label.tagName).toBe('LABEL')
    })
})
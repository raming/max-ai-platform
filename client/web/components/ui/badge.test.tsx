import React from 'react'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
    it('renders with default variant', () => {
        render(<Badge>Default</Badge>)
        const badge = screen.getByText('Default')
        expect(badge).toBeInTheDocument()
        expect(badge).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('renders with secondary variant', () => {
        render(<Badge variant="secondary">Secondary</Badge>)
        const badge = screen.getByText('Secondary')
        expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })

    it('renders with destructive variant', () => {
        render(<Badge variant="destructive">Destructive</Badge>)
        const badge = screen.getByText('Destructive')
        expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground')
    })

    it('renders with outline variant', () => {
        render(<Badge variant="outline">Outline</Badge>)
        const badge = screen.getByText('Outline')
        expect(badge).toHaveClass('text-foreground')
    })

    it('supports custom className', () => {
        render(<Badge className="custom-badge">Custom</Badge>)
        const badge = screen.getByText('Custom')
        expect(badge).toHaveClass('custom-badge')
    })

    it('forwards other props', () => {
        render(<Badge data-testid="custom-badge">Test</Badge>)
        const badge = screen.getByTestId('custom-badge')
        expect(badge).toBeInTheDocument()
    })

    it('renders with different content types', () => {
        render(<Badge>Status: Active</Badge>)
        expect(screen.getByText('Status: Active')).toBeInTheDocument()

        render(<Badge>123</Badge>)
        expect(screen.getByText('123')).toBeInTheDocument()
    })
})
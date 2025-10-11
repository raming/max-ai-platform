import React from 'react'
import { render, screen } from '@testing-library/react'
import { Skeleton } from '@/components/ui/skeleton'

describe('Skeleton', () => {
    it('renders with default props', () => {
        render(<Skeleton data-testid="skeleton" />)
        const skeleton = screen.getByTestId('skeleton')
        expect(skeleton).toBeInTheDocument()
        expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted')
    })

    it('supports custom className', () => {
        render(<Skeleton className="custom-skeleton" data-testid="skeleton" />)
        const skeleton = screen.getByTestId('skeleton')
        expect(skeleton).toHaveClass('custom-skeleton')
    })

    it('renders as div element', () => {
        render(<Skeleton data-testid="skeleton" />)
        const skeleton = screen.getByTestId('skeleton')
        expect(skeleton.tagName).toBe('DIV')
    })

    it('forwards other props', () => {
        render(<Skeleton data-testid="custom-skeleton" />)
        const skeleton = screen.getByTestId('custom-skeleton')
        expect(skeleton).toBeInTheDocument()
    })
})
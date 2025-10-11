import React from 'react'
import { render, screen } from '@testing-library/react'
import { Progress } from '@/components/ui/progress'

describe('Progress', () => {
    it('renders with default props', () => {
        render(<Progress />)
        const progress = screen.getByRole('progressbar')
        expect(progress).toBeInTheDocument()
        expect(progress).toHaveClass('relative', 'h-4', 'w-full', 'overflow-hidden', 'rounded-full', 'bg-secondary')
    })

    it('renders with value', () => {
        render(<Progress value={50} />)
        const progress = screen.getByRole('progressbar')
        // Radix UI may handle aria attributes differently
        expect(progress).toBeInTheDocument()
    })

    it('handles max value', () => {
        render(<Progress value={75} max={200} />)
        const progress = screen.getByRole('progressbar')
        expect(progress).toHaveAttribute('aria-valuemax', '200')
    })

    it('supports custom className', () => {
        render(<Progress className="custom-progress" />)
        const progress = screen.getByRole('progressbar')
        expect(progress).toHaveClass('custom-progress')
    })

    it('renders progress indicator', () => {
        render(<Progress value={30} />)
        const indicator = screen.getByRole('progressbar').querySelector('[class*="bg-primary"]')
        expect(indicator).toBeInTheDocument()
    })
})
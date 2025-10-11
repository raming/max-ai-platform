import React from 'react'
import { render, screen } from '@testing-library/react'
import { Separator } from '@/components/ui/separator'

describe('Separator', () => {
    it('renders with default props', () => {
        render(<Separator />)
        const separator = screen.getByRole('none') // decorative separators have role="none"
        expect(separator).toBeInTheDocument()
        expect(separator).toHaveClass('shrink-0', 'bg-border')
    })

    it('renders horizontal separator by default', () => {
        render(<Separator />)
        const separator = screen.getByRole('none')
        expect(separator).toHaveClass('h-[1px]', 'w-full')
    })

    it('renders vertical separator when orientation is vertical', () => {
        render(<Separator orientation="vertical" />)
        const separator = screen.getByRole('none')
        expect(separator).toHaveClass('h-full', 'w-[1px]')
    })

    it('supports custom className', () => {
        render(<Separator className="custom-separator" />)
        const separator = screen.getByRole('none')
        expect(separator).toHaveClass('custom-separator')
    })

    it('supports decorative prop', () => {
        render(<Separator decorative={false} />)
        const separator = screen.getByRole('separator') // non-decorative has role="separator"
        expect(separator).toBeInTheDocument()
    })
})
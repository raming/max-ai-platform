import React from 'react'
import { render, screen } from '@testing-library/react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

describe('Alert', () => {
    it('renders with default variant', () => {
        render(<Alert>Alert content</Alert>)
        const alert = screen.getByText('Alert content')
        expect(alert).toBeInTheDocument()
        expect(alert).toHaveClass('relative', 'w-full', 'rounded-lg', 'border', 'p-4')
    })

    it('renders AlertTitle', () => {
        render(
            <Alert>
                <AlertTitle>Alert Title</AlertTitle>
            </Alert>
        )
        const title = screen.getByRole('heading', { name: /alert title/i })
        expect(title).toHaveClass('mb-1', 'font-medium', 'leading-none', 'tracking-tight')
    })

    it('renders AlertDescription', () => {
        render(
            <Alert>
                <AlertDescription>Description text</AlertDescription>
            </Alert>
        )
        const description = screen.getByText('Description text')
        expect(description).toHaveClass('text-sm')
    })

    it('renders complete alert structure', () => {
        render(
            <Alert>
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                    Your changes have been saved successfully.
                </AlertDescription>
            </Alert>
        )

        expect(screen.getByRole('heading', { name: /success/i })).toBeInTheDocument()
        expect(screen.getByText('Your changes have been saved successfully.')).toBeInTheDocument()
    })

    it('supports custom className', () => {
        render(<Alert className="custom-alert">Content</Alert>)
        const alert = screen.getByText('Content')
        expect(alert).toHaveClass('custom-alert')
    })

    it('forwards other props', () => {
        render(<Alert data-testid="custom-alert">Test</Alert>)
        const alert = screen.getByTestId('custom-alert')
        expect(alert).toBeInTheDocument()
    })
})
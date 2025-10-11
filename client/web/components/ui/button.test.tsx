import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
    it('renders with default variant', () => {
        render(<Button>Click me</Button>)
        const button = screen.getByRole('button', { name: /click me/i })
        expect(button).toBeInTheDocument()
        expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('renders with secondary variant', () => {
        render(<Button variant="secondary">Secondary</Button>)
        const button = screen.getByRole('button', { name: /secondary/i })
        expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })

    it('renders with outline variant', () => {
        render(<Button variant="outline">Outline</Button>)
        const button = screen.getByRole('button', { name: /outline/i })
        expect(button).toHaveClass('border', 'border-input', 'bg-background')
    })

    it('renders with ghost variant', () => {
        render(<Button variant="ghost">Ghost</Button>)
        const button = screen.getByRole('button', { name: /ghost/i })
        expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground')
    })

    it('renders with destructive variant', () => {
        render(<Button variant="destructive">Destructive</Button>)
        const button = screen.getByRole('button', { name: /destructive/i })
        expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground')
    })

    it('renders with different sizes', () => {
        const { rerender } = render(<Button size="sm">Small</Button>)
        expect(screen.getByRole('button')).toHaveClass('h-9', 'px-3')

        rerender(<Button size="lg">Large</Button>)
        expect(screen.getByRole('button')).toHaveClass('h-11', 'px-8')
    })

    it('handles click events', async () => {
        const handleClick = jest.fn()
        const user = userEvent.setup()

        render(<Button onClick={handleClick}>Click me</Button>)
        const button = screen.getByRole('button', { name: /click me/i })

        await user.click(button)
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('can be disabled', () => {
        const handleClick = jest.fn()
        render(<Button disabled onClick={handleClick}>Disabled</Button>)

        const button = screen.getByRole('button', { name: /disabled/i })
        expect(button).toBeDisabled()
        expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')

        fireEvent.click(button)
        expect(handleClick).not.toHaveBeenCalled()
    })

    it('supports custom className', () => {
        render(<Button className="custom-class">Custom</Button>)
        const button = screen.getByRole('button', { name: /custom/i })
        expect(button).toHaveClass('custom-class')
    })

    it('forwards other props to button element', () => {
        render(<Button type="submit" data-testid="submit-button">Submit</Button>)
        const button = screen.getByTestId('submit-button')
        expect(button).toHaveAttribute('type', 'submit')
    })

    it('renders as child component when asChild is true', () => {
        render(
            <Button asChild>
                <a href="/test">Link Button</a>
            </Button>
        )

        const link = screen.getByRole('link', { name: /link button/i })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '/test')
        expect(link).toHaveClass('bg-primary', 'text-primary-foreground')
    })
})
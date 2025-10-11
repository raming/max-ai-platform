import React from 'react'
import { render, screen } from '@testing-library/react'
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from '@/components/ui/card'

describe('Card', () => {
    it('renders Card component', () => {
        render(<Card>Card content</Card>)
        const card = screen.getByText('Card content')
        expect(card).toBeInTheDocument()
        expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'shadow-sm')
    })

    it('renders CardHeader', () => {
        render(
            <Card>
                <CardHeader>Header content</CardHeader>
            </Card>
        )
        const header = screen.getByText('Header content')
        expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    })

    it('renders CardTitle', () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                </CardHeader>
            </Card>
        )
        const title = screen.getByRole('heading', { name: /card title/i })
        expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight')
    })

    it('renders CardDescription', () => {
        render(
            <Card>
                <CardHeader>
                    <CardDescription>Description text</CardDescription>
                </CardHeader>
            </Card>
        )
        const description = screen.getByText('Description text')
        expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })

    it('renders CardContent', () => {
        render(
            <Card>
                <CardContent>Main content</CardContent>
            </Card>
        )
        const content = screen.getByText('Main content')
        expect(content).toHaveClass('p-6', 'pt-0')
    })

    it('renders CardFooter', () => {
        render(
            <Card>
                <CardFooter>Footer content</CardFooter>
            </Card>
        )
        const footer = screen.getByText('Footer content')
        expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
    })

    it('supports custom className', () => {
        render(<Card className="custom-card">Content</Card>)
        const card = screen.getByText('Content')
        expect(card).toHaveClass('custom-card')
    })

    it('renders complete card structure', () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Test Card</CardTitle>
                    <CardDescription>A test card description</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>This is the main content of the card.</p>
                </CardContent>
                <CardFooter>
                    <button>Action Button</button>
                </CardFooter>
            </Card>
        )

        expect(screen.getByRole('heading', { name: /test card/i })).toBeInTheDocument()
        expect(screen.getByText('A test card description')).toBeInTheDocument()
        expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /action button/i })).toBeInTheDocument()
    })
})
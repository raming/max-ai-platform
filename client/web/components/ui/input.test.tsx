import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input', () => {
    it('renders with default props', () => {
        render(<Input />)
        const input = screen.getByRole('textbox')
        expect(input).toBeInTheDocument()
        expect(input).toHaveClass('flex', 'h-10', 'w-full')
    })

    it('renders with placeholder', () => {
        render(<Input placeholder="Enter text" />)
        const input = screen.getByPlaceholderText('Enter text')
        expect(input).toBeInTheDocument()
    })

    it('handles value changes', async () => {
        const user = userEvent.setup()
        render(<Input />)

        const input = screen.getByRole('textbox')
        await user.type(input, 'Hello World')

        expect(input).toHaveValue('Hello World')
    })

    it('supports different input types', () => {
        render(<Input type="email" />)
        const input = screen.getByRole('textbox')
        expect(input).toHaveAttribute('type', 'email')
    })

    it('can be disabled', () => {
        render(<Input disabled />)
        const input = screen.getByRole('textbox')
        expect(input).toBeDisabled()
        expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })

    it('supports custom className', () => {
        render(<Input className="custom-input" />)
        const input = screen.getByRole('textbox')
        expect(input).toHaveClass('custom-input')
    })

    it('forwards other props', () => {
        render(<Input data-testid="custom-input" maxLength={10} />)
        const input = screen.getByTestId('custom-input')
        expect(input).toHaveAttribute('maxLength', '10')
    })
})
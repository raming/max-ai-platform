import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '@/components/ui/checkbox'

describe('Checkbox', () => {
    it('renders with default props', () => {
        render(<Checkbox />)
        const checkbox = screen.getByRole('checkbox')
        expect(checkbox).toBeInTheDocument()
        expect(checkbox).toHaveClass('peer')
    })

    it('handles checked state', () => {
        render(<Checkbox checked />)
        const checkbox = screen.getByRole('checkbox')
        expect(checkbox).toBeChecked()
    })

    it('handles onCheckedChange', async () => {
        const handleChange = jest.fn()
        const user = userEvent.setup()

        render(<Checkbox onCheckedChange={handleChange} />)
        const checkbox = screen.getByRole('checkbox')

        await user.click(checkbox)
        expect(handleChange).toHaveBeenCalledWith(true)
    })

    it('can be disabled', () => {
        const handleChange = jest.fn()
        render(<Checkbox disabled onCheckedChange={handleChange} />)

        const checkbox = screen.getByRole('checkbox')
        expect(checkbox).toBeDisabled()

        fireEvent.click(checkbox)
        expect(handleChange).not.toHaveBeenCalled()
    })

    it('supports custom className', () => {
        render(<Checkbox className="custom-checkbox" />)
        const checkbox = screen.getByRole('checkbox')
        expect(checkbox).toHaveClass('custom-checkbox')
    })

    it('renders check indicator when checked', () => {
        render(<Checkbox checked />)
        const indicator = screen.getByTestId('check')
        expect(indicator).toBeInTheDocument()
    })

    it('forwards other props', () => {
        render(<Checkbox data-testid="custom-checkbox" />)
        const checkbox = screen.getByTestId('custom-checkbox')
        expect(checkbox).toBeInTheDocument()
    })
})
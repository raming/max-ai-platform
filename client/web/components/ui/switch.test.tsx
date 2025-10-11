import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Switch } from '@/components/ui/switch'

describe('Switch', () => {
    it('renders with default props', () => {
        render(<Switch />)
        const switchElement = screen.getByRole('switch')
        expect(switchElement).toBeInTheDocument()
        expect(switchElement).toHaveClass('peer')
    })

    it('handles checked state', () => {
        render(<Switch checked />)
        const switchElement = screen.getByRole('switch')
        expect(switchElement).toBeChecked()
    })

    it('handles onCheckedChange', async () => {
        const handleChange = jest.fn()
        const user = userEvent.setup()

        render(<Switch onCheckedChange={handleChange} />)
        const switchElement = screen.getByRole('switch')

        await user.click(switchElement)
        expect(handleChange).toHaveBeenCalledWith(true)
    })

    it('can be disabled', () => {
        const handleChange = jest.fn()
        render(<Switch disabled onCheckedChange={handleChange} />)

        const switchElement = screen.getByRole('switch')
        expect(switchElement).toBeDisabled()

        fireEvent.click(switchElement)
        expect(handleChange).not.toHaveBeenCalled()
    })

    it('supports custom className', () => {
        render(<Switch className="custom-switch" />)
        const switchElement = screen.getByRole('switch')
        expect(switchElement).toHaveClass('custom-switch')
    })

    it('forwards other props', () => {
        render(<Switch data-testid="custom-switch" />)
        const switchElement = screen.getByTestId('custom-switch')
        expect(switchElement).toBeInTheDocument()
    })
})
import '@testing-library/jest-dom'
import React from 'react'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  ChevronDown: () => React.createElement('div', { 'data-testid': 'chevron-down' }),
  ChevronUp: () => React.createElement('div', { 'data-testid': 'chevron-up' }),
  ChevronLeft: () => React.createElement('div', { 'data-testid': 'chevron-left' }),
  ChevronRight: () => React.createElement('div', { 'data-testid': 'chevron-right' }),
  Check: () => React.createElement('div', { 'data-testid': 'check' }),
  Circle: () => React.createElement('div', { 'data-testid': 'circle' }),
  X: () => React.createElement('div', { 'data-testid': 'x' }),
  Search: () => React.createElement('div', { 'data-testid': 'search' }),
  MoreHorizontal: () => React.createElement('div', { 'data-testid': 'more-horizontal' }),
  GripVertical: () => React.createElement('div', { 'data-testid': 'grip-vertical' }),
  ArrowLeft: () => React.createElement('div', { 'data-testid': 'arrow-left' }),
  ArrowRight: () => React.createElement('div', { 'data-testid': 'arrow-right' }),
  Sun: () => React.createElement('div', { 'data-testid': 'sun' }),
  Moon: () => React.createElement('div', { 'data-testid': 'moon' }),
}))

// Global test utilities
global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }
}
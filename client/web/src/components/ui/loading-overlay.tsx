import { Spinner } from './spinner'
import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
  loading: boolean
  children: React.ReactNode
  message?: string
  className?: string
}

export function LoadingOverlay({
  loading,
  children,
  message = 'Loading...',
  className
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-2">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
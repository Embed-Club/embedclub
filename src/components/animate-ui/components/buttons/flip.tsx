import type { VariantProps } from 'class-variance-authority'

import { buttonVariants } from '@/components/animate-ui/components/buttons/button'
import {
  FlipButtonBack as FlipButtonBackPrimitive,
  type FlipButtonBackProps as FlipButtonBackPrimitiveProps,
  FlipButtonFront as FlipButtonFrontPrimitive,
  type FlipButtonFrontProps as FlipButtonFrontPrimitiveProps,
  FlipButton as FlipButtonPrimitive,
  type FlipButtonProps as FlipButtonPrimitiveProps,
} from '@/components/animate-ui/primitives/buttons/flip'
import { getStrictContext } from '@/lib/get-strict-context'
import { cn } from '@/lib/utils'

type FlipButtonContextType = VariantProps<typeof buttonVariants>

const [FlipButtonProvider, useFlipButton] =
  getStrictContext<FlipButtonContextType>('FlipButtonContext')

type FlipButtonProps = FlipButtonPrimitiveProps & VariantProps<typeof buttonVariants>

function FlipButton({ variant, size, ...props }: FlipButtonProps) {
  return (
    <FlipButtonProvider value={{ variant, size }}>
      <FlipButtonPrimitive {...props} />
    </FlipButtonProvider>
  )
}

type FlipButtonFrontProps = FlipButtonFrontPrimitiveProps & VariantProps<typeof buttonVariants>

function FlipButtonFront({ variant, size, className, ...props }: FlipButtonFrontProps) {
  const { variant: buttonVariant, size: buttonSize } = useFlipButton()
  return (
    <FlipButtonFrontPrimitive
      className={cn(
        buttonVariants({
          variant: variant ?? buttonVariant,
          size: size ?? buttonSize,
          className,
        }),
      )}
      {...props}
    />
  )
}

type FlipButtonBackProps = FlipButtonBackPrimitiveProps & VariantProps<typeof buttonVariants>

function FlipButtonBack({ variant, size, className, ...props }: FlipButtonBackProps) {
  const { variant: buttonVariant, size: buttonSize } = useFlipButton()
  return (
    <FlipButtonBackPrimitive
      className={cn(
        buttonVariants({
          variant: variant ?? buttonVariant,
          size: size ?? buttonSize,
          className,
        }),
      )}
      {...props}
    />
  )
}

export {
  FlipButton,
  FlipButtonFront,
  FlipButtonBack,
  type FlipButtonProps,
  type FlipButtonFrontProps,
  type FlipButtonBackProps,
}

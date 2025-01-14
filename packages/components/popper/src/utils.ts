import { isClient } from '@vueuse/core'
import { isElement } from '@element-plus/utils'

import type { ComponentPublicInstance } from 'vue'
import type { UsePopperCoreConfigProps, Measurable } from './popper'

type ArrowProps = {
  arrowEl: HTMLElement | null
  arrowOffset: number | undefined
}

export const buildPopperOptions = (
  props: UsePopperCoreConfigProps,
  arrowProps: ArrowProps
) => {
  const { placement, strategy, popperOptions } = props
  const options = {
    placement,
    strategy,
    ...popperOptions,
    modifiers: genModifiers(props),
  }

  attachArrow(options, arrowProps)
  deriveExtraModifiers(options, popperOptions?.modifiers)
  return options
}

export const unwrapMeasurableEl = (
  $el: Measurable | null | ComponentPublicInstance
) => {
  if (!isClient) return null
  let el: HTMLElement | null = null
  if (!$el) return null

  if ('getBoundingClientRect' in $el || isElement($el)) {
    el = $el as HTMLElement
  } else {
    // refs can be Vue component
    el = ($el as any as ComponentPublicInstance).$el
  }
  return el
}

function genModifiers(options: UsePopperCoreConfigProps) {
  const { offset, gpuAcceleration, fallbackPlacements } = options
  return [
    {
      name: 'offset',
      options: {
        offset: [0, offset ?? 12],
      },
    },
    {
      name: 'preventOverflow',
      options: {
        padding: {
          top: 2,
          bottom: 2,
          left: 5,
          right: 5,
        },
      },
    },
    {
      name: 'flip',
      options: {
        padding: 5,
        fallbackPlacements: fallbackPlacements ?? [],
      },
    },
    {
      name: 'computeStyles',
      options: {
        gpuAcceleration,
        adaptive: gpuAcceleration,
      },
    },
  ]
}

function attachArrow(options: any, { arrowEl, arrowOffset }: ArrowProps) {
  options.modifiers.push({
    name: 'arrow',
    options: {
      element: arrowEl,
      padding: arrowOffset ?? 5,
    },
  } as any)
}

function deriveExtraModifiers(
  options: any,
  modifiers: UsePopperCoreConfigProps['popperOptions']['modifiers']
) {
  if (modifiers) {
    options.modifiers = [...options.modifiers, ...(modifiers ?? [])]
  }
}

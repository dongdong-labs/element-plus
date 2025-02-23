<template>
  <div
    :class="[
      ns.b(),
      ns.m(type),
      ns.is(status),
      {
        [ns.m('without-text')]: !showText,
        [ns.m('text-inside')]: textInside,
      },
    ]"
    role="progressbar"
    :aria-valuenow="percentage"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div v-if="type === 'line'" :class="ns.b('bar')">
      <div
        :class="ns.be('bar', 'outer')"
        :style="{ height: `${strokeWidth}px` }"
      >
        <div
          :class="[
            ns.be('bar', 'inner'),
            { [ns.bem('bar', 'inner', 'indeterminate')]: indeterminate },
          ]"
          :style="barStyle"
        >
          <div
            v-if="(showText || $slots.default) && textInside"
            :class="ns.be('bar', 'innerText')"
          >
            <slot v-bind="slotData">
              <span>{{ content }}</span>
            </slot>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else
      :class="ns.b('circle')"
      :style="{ height: `${width}px`, width: `${width}px` }"
    >
      <svg viewBox="0 0 100 100">
        <path
          :class="ns.be('circle', 'track')"
          :d="trackPath"
          stroke="#e5e9f2"
          :stroke-width="relativeStrokeWidth"
          fill="none"
          :style="trailPathStyle"
        />
        <path
          :class="ns.be('circle', 'path')"
          :d="trackPath"
          :stroke="stroke"
          fill="none"
          :stroke-linecap="strokeLinecap"
          :stroke-width="percentage ? relativeStrokeWidth : 0"
          :style="circlePathStyle"
        />
      </svg>
    </div>
    <div
      v-if="(showText || $slots.default) && !textInside"
      :class="ns.e('text')"
      :style="{ fontSize: `${progressTextSize}px` }"
    >
      <slot v-bind="slotData">
        <span v-if="!status">{{ content }}</span>
        <el-icon v-else><component :is="statusIcon" /></el-icon>
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { ElIcon } from '@element-plus/components/icon'
import {
  WarningFilled,
  CircleCheck,
  CircleClose,
  Check,
  Close,
} from '@element-plus/icons-vue'
import { useNamespace } from '@element-plus/hooks'
import { progressProps } from './progress'
import type { CSSProperties } from 'vue'

export default defineComponent({
  name: 'ElProgress',
  components: {
    ElIcon,
    CircleCheck,
    CircleClose,
    Check,
    Close,
    WarningFilled,
  },
  props: progressProps,

  setup(props) {
    const ns = useNamespace('progress')

    const barStyle = computed(
      (): CSSProperties => ({
        width: `${props.percentage}%`,
        animationDuration: `${props.duration}s`,
        backgroundColor: getCurrentColor(props.percentage),
      })
    )

    const relativeStrokeWidth = computed(() =>
      ((props.strokeWidth / props.width) * 100).toFixed(1)
    )

    const radius = computed(() => {
      if (props.type === 'circle' || props.type === 'dashboard') {
        return Number.parseInt(
          `${50 - Number.parseFloat(relativeStrokeWidth.value) / 2}`,
          10
        )
      } else {
        return 0
      }
    })

    const trackPath = computed(() => {
      const r = radius.value
      const isDashboard = props.type === 'dashboard'
      return `
          M 50 50
          m 0 ${isDashboard ? '' : '-'}${r}
          a ${r} ${r} 0 1 1 0 ${isDashboard ? '-' : ''}${r * 2}
          a ${r} ${r} 0 1 1 0 ${isDashboard ? '' : '-'}${r * 2}
          `
    })

    const perimeter = computed(() => 2 * Math.PI * radius.value)

    const rate = computed(() => (props.type === 'dashboard' ? 0.75 : 1))

    const strokeDashoffset = computed(() => {
      const offset = (-1 * perimeter.value * (1 - rate.value)) / 2
      return `${offset}px`
    })

    const trailPathStyle = computed(
      (): CSSProperties => ({
        strokeDasharray: `${perimeter.value * rate.value}px, ${
          perimeter.value
        }px`,
        strokeDashoffset: strokeDashoffset.value,
      })
    )

    const circlePathStyle = computed(
      (): CSSProperties => ({
        strokeDasharray: `${
          perimeter.value * rate.value * (props.percentage / 100)
        }px, ${perimeter.value}px`,
        strokeDashoffset: strokeDashoffset.value,
        transition: 'stroke-dasharray 0.6s ease 0s, stroke 0.6s ease',
      })
    )

    const stroke = computed(() => {
      let ret: string
      if (props.color) {
        ret = getCurrentColor(props.percentage)
      } else {
        switch (props.status) {
          case 'success':
            ret = '#13ce66'
            break
          case 'exception':
            ret = '#ff4949'
            break
          case 'warning':
            ret = '#e6a23c'
            break
          default:
            ret = '#20a0ff'
        }
      }
      return ret
    })

    const statusIcon = computed(() => {
      if (props.status === 'warning') {
        return WarningFilled
      }
      if (props.type === 'line') {
        return props.status === 'success' ? CircleCheck : CircleClose
      } else {
        return props.status === 'success' ? Check : Close
      }
    })

    const progressTextSize = computed(() => {
      return props.type === 'line'
        ? 12 + props.strokeWidth * 0.4
        : props.width * 0.111111 + 2
    })

    const content = computed(() => props.format(props.percentage))

    const getCurrentColor = (percentage: number) => {
      const { color } = props
      if (typeof color === 'function') {
        return color(percentage)
      } else if (typeof color === 'string') {
        return color
      } else {
        const span = 100 / color.length
        const seriesColors = color.map((seriesColor, index) => {
          if (typeof seriesColor === 'string') {
            return {
              color: seriesColor,
              percentage: (index + 1) * span,
            }
          }
          return seriesColor
        })
        const colors = seriesColors.sort((a, b) => a.percentage - b.percentage)

        for (const color of colors) {
          if (color.percentage > percentage) return color.color
        }
        return colors[colors.length - 1]?.color
      }
    }

    const slotData = computed(() => {
      return {
        percentage: props.percentage,
      }
    })

    return {
      ns,
      barStyle,
      relativeStrokeWidth,
      radius,
      trackPath,
      perimeter,
      rate,
      strokeDashoffset,
      trailPathStyle,
      circlePathStyle,
      stroke,
      statusIcon,
      progressTextSize,
      content,
      slotData,
    }
  },
})
</script>

"use client"

import * as React from "react"

interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

export function ChartContainer({ config, children, className, ...props }: ChartContainerProps) {
  const [tooltipData, setTooltipData] = React.useState<{
    name: string
    value: number
    payload: any
    dataKey: string
  } | null>(null)

  const [tooltipLeft, setTooltipLeft] = React.useState(0)
  const [tooltipTop, setTooltipTop] = React.useState(0)

  return (
    <div
      className={className}
      style={
        {
          "--color-tooltip": "255 255 255",
          "--color-tooltip-border": "226 232 240",
          "--color-tooltip-text": "15 23 42",
          ...Object.entries(config).reduce(
            (acc, [key, value]) => ({
              ...acc,
              [`--color-${key}`]: value.color,
            }),
            {},
          ),
        } as React.CSSProperties
      }
      {...props}
    >
      {React.cloneElement(children as React.ReactElement, {
        onMouseMove: (e: React.MouseEvent) => {
          if (e.activePayload?.[0]) {
            setTooltipData({
              name: e.activeLabel,
              value: e.activePayload[0].value,
              payload: e.activePayload[0].payload,
              dataKey: e.activePayload[0].dataKey,
            })
            setTooltipLeft(e.chartX)
            setTooltipTop(e.chartY)
          }
        },
        onMouseLeave: () => {
          setTooltipData(null)
        },
      })}
    </div>
  )
}

interface ChartTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  indicator?: "line" | "dashed"
}

export function ChartTooltip({ indicator = "line", className, children, ...props }: ChartTooltipProps) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        pointerEvents: "none",
        visibility: "hidden",
      }}
      {...props}
    >
      {children}
    </div>
  )
}

interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  indicator?: "line" | "dashed"
}

export function ChartTooltipContent({ indicator = "line", className, ...props }: ChartTooltipContentProps) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        pointerEvents: "none",
        visibility: "hidden",
      }}
      {...props}
    />
  )
}

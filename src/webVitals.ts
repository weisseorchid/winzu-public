import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'

function reportMetric(metric: Metric): void {
  const value =
    metric.name === 'CLS' ? metric.value.toFixed(3) : Math.round(metric.value)

  console.info(`[web-vitals] ${metric.name} ${value} ${metric.rating}`, metric)

  try {
    performance.clearMeasures(metric.name)
    // Pass a plain detail object — PerformanceEntry instances are not
    // structured-cloneable and would reject the measure call.
    performance.measure(metric.name, {
      start: 0,
      duration: metric.value,
      detail: {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
      },
    })
  } catch {
    // Ignore browsers that reject the measure call.
  }
}

export function initWebVitals(): void {
  const opts = { reportAllChanges: true }

  onCLS(reportMetric, opts)
  onFCP(reportMetric, opts)
  onINP(reportMetric, opts)
  onLCP(reportMetric, opts)
  onTTFB(reportMetric, opts)
}

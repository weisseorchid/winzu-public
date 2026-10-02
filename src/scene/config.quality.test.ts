import { describe, expect, it } from 'vitest'
import { QUALITY_PROFILES, resolveQualityProfile } from './config'

describe('resolveQualityProfile', () => {
  it('honors ?quality=high|medium|low over UA', () => {
    expect(resolveQualityProfile('?quality=high', 'iPhone').tier).toBe('high')
    expect(resolveQualityProfile('?quality=medium', 'Mozilla/5.0').tier).toBe(
      'medium',
    )
    expect(resolveQualityProfile('?quality=low', 'Mozilla/5.0').tier).toBe(
      'low',
    )
  })

  it('is case-insensitive for quality query', () => {
    expect(resolveQualityProfile('?quality=HIGH', '').tier).toBe('high')
  })

  it('falls through invalid quality to UA default', () => {
    expect(resolveQualityProfile('?quality=ultra', 'Mozilla/5.0').tier).toBe(
      'high',
    )
    expect(
      resolveQualityProfile(
        '?quality=ultra',
        'Mozilla/5.0 (Linux; Android 12)',
      ),
    ).toBe(QUALITY_PROFILES.low)
  })

  it('maps mobile UA to low when no query', () => {
    expect(
      resolveQualityProfile(
        '',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      ).tier,
    ).toBe('low')
    expect(resolveQualityProfile('', 'Something Mobi Safari').tier).toBe('low')
  })

  it('maps desktop UA to high when no query', () => {
    expect(
      resolveQualityProfile('', 'Mozilla/5.0 (Windows NT 10.0)').tier,
    ).toBe('high')
  })

  it('exposes Phase 0 budget numbers', () => {
    expect(QUALITY_PROFILES.high.oceanSegments).toBe(80)
    expect(QUALITY_PROFILES.medium.oceanSegments).toBe(48)
    expect(QUALITY_PROFILES.low.oceanSegments).toBe(32)
    expect(QUALITY_PROFILES.low.reflection).toBe('off')
    expect(QUALITY_PROFILES.low.bloom).toBe(false)
    expect(QUALITY_PROFILES.medium.reflectionEveryN).toBe(3)
  })
})

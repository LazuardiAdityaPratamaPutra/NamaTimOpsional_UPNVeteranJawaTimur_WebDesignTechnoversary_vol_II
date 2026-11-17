import { describe, it, expect } from 'vitest'
import { id as t } from '../src/i18n/id'

describe('setup', () => {
  it('memuat teks i18n dan disclaimer', () => {
    expect(t.tagline).toContain('api')
    expect(t.disclaimer).toContain('model edukatif')
  })
})

// @vitest-environment jsdom
// Adegan TORA di kuis: jawaban salah -> TORA lesu dengan awan hujan (ilustrasi "sedih" belum ada), benar -> tertawa; panggung menempel di layar lebar.
import { describe, it, expect, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import axe from 'axe-core'
import { Adegan } from '../src/components/AdeganKuis'
import { EKSPRESI, ADA_GAMBAR_SEDIH } from '../src/components/Maskot'

globalThis.IS_REACT_ACT_ENVIRONMENT = false
const tunggu = (ms = 40) => new Promise((r) => setTimeout(r, ms))
let akar, wadah
const pasang = async (el) => { wadah = document.createElement('div'); document.body.append(wadah); akar = createRoot(wadah); akar.render(el); await tunggu() }
afterEach(() => { akar?.unmount(); wadah?.remove() })

describe('Adegan TORA di kuis', () => {
  it('jawaban salah: reaksi lesu dan awan hujan dekoratif (selama belum ada ilustrasi sedih)', async () => {
    await pasang(<Adegan bubble="Hampir!" ekspresi="sedih" reaksi="lesu" kunci={1} />)
    expect(wadah.querySelector('.tora-lesu')).not.toBeNull()
    expect(wadah.querySelector('.tora-geleng')).toBeNull()
    expect(wadah.querySelector('img').getAttribute('data-ekspresi')).toBe('sedih')
    const awan = wadah.querySelector('.awan-mendung')
    if (ADA_GAMBAR_SEDIH) expect(awan).toBeNull() // ilustrasi sedih tersedia: wajahnya sendiri yang bercerita
    else { expect(awan).not.toBeNull(); expect(awan.getAttribute('aria-hidden')).toBe('true') }
  })
  it('jawaban benar atau belum menjawab: tanpa awan hujan', async () => {
    await pasang(<Adegan bubble="Tepat!" ekspresi="merayakan" reaksi="loncat" kunci={1} />)
    expect(wadah.querySelector('.awan-mendung')).toBeNull()
    expect(wadah.querySelector('.tora-loncat')).not.toBeNull()
  })
  it('kuis memakai tiga gambar berbeda: ramah (default), ceria (benar), sedih (salah)', () => {
    expect(ADA_GAMBAR_SEDIH).toBe(true)
    expect(new Set([EKSPRESI.ramah, EKSPRESI.merayakan, EKSPRESI.sedih]).size).toBe(3)
  })
  it('mode lekat: panggung sticky di layar lebar, dan tanpa lekat tidak ada pembungkus tambahan', async () => {
    await pasang(<Adegan bubble="x" lekat />)
    const panggung = wadah.querySelector('.lg\\:sticky')
    expect(panggung).not.toBeNull()
    expect(panggung.className).toContain('lg:bg-[linear-gradient') // latar sendiri (langit lalu hijau bukit) agar tidak ada garis atau warna gelap yang menyembul di tepi bawah
    akar.unmount(); wadah.remove()
    await pasang(<Adegan bubble="x" />)
    expect(wadah.querySelector('.lg\\:sticky')).toBeNull()
  })
  it('lolos axe dalam keadaan sedih', async () => {
    await pasang(<Adegan bubble="Hampir! Baca penjelasannya." ekspresi="sedih" reaksi="lesu" kunci={1} lekat />)
    const { violations } = await axe.run(wadah, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] }, rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })
    expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([])
  })
})

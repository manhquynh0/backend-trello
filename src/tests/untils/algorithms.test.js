import { pagingSkipValue } from '~/utils/algorithms'

describe('pagingSkipValue()', () => {
  // Happy path
  it('should return correct skip value for page 1', () => {
    expect(pagingSkipValue(1, 10)).toBe(0) // (1-1)*10 = 0
  })

  it('should return correct skip value for page 2', () => {
    expect(pagingSkipValue(2, 10)).toBe(10) // (2-1)*10 = 10
  })

  it('should return correct skip value for page 3', () => {
    expect(pagingSkipValue(3, 5)).toBe(10) // (3-1)*5 = 10
  })

  // Edge cases — thiếu tham số
  it('should return 0 when page is falsy', () => {
    expect(pagingSkipValue(0, 10)).toBe(0)
    expect(pagingSkipValue(null, 10)).toBe(0)
    expect(pagingSkipValue(undefined, 10)).toBe(0)
  })

  it('should return 0 when itemPerPage is falsy', () => {
    expect(pagingSkipValue(1, 0)).toBe(0)
    expect(pagingSkipValue(1, null)).toBe(0)
    expect(pagingSkipValue(1, undefined)).toBe(0)
  })

  // Edge cases — giá trị âm
  it('should return 0 when page is negative', () => {
    expect(pagingSkipValue(-1, 10)).toBe(0)
  })

  it('should return 0 when itemPerPage is negative', () => {
    expect(pagingSkipValue(1, -5)).toBe(0)
  })
})

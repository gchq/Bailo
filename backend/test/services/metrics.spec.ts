// import { describe, expect, test, vi } from 'vitest'

// import { calculateModelVolume } from '../../src/services/metrics.js'
// import { BadReq } from '../../src/utils/error.js'
// import { getTypedModelMock } from '../testUtils/setupMongooseModelMocks.js'

// const ModelModelMock = getTypedModelMock('ModelModel')

// describe('services > metrics', () => {
//   test('calculateModelVolume > basic aggregation', async () => {
//     ModelModelMock.aggregate.mockResolvedValueOnce([
//       {
//         periodStart: new Date('2026-01-01T00:00:00.000Z'),
//         periodEnd: new Date('2026-01-02T00:00:00.000Z'),
//         count: 5,
//       },
//     ])

//     const result = await calculateModelVolume('day', '2026-01-01', '2026-01-10')

//     expect(ModelModelMock.aggregate).toHaveBeenCalledOnce()
//     expect(ModelModelMock.aggregate.mock.calls).toMatchSnapshot()

//     expect(result).toEqual({
//       startDate: '2026-01-01T00:00:00.000Z',
//       endDate: '2026-01-10T00:00:00.000Z',
//       dataPoints: [
//         {
//           periodStart: '2026-01-01T00:00:00.000Z',
//           periodEnd: '2026-01-02T00:00:00.000Z',
//           count: 5,
//         },
//       ],
//     })
//   })

//   test('calculateModelVolume > with organisation filter', async () => {
//     ModelModelMock.aggregate.mockResolvedValueOnce([])

//     await calculateModelVolume('week', '2026-01-01', '2026-02-01', 'UTC', 'org-1')

//     expect(ModelModelMock.aggregate).toHaveBeenCalledOnce()
//     expect(ModelModelMock.aggregate.mock.calls).toMatchSnapshot()
//   })

//   test('calculateModelVolume > multiple results mapped correctly', async () => {
//     vi.setSystemTime(new Date('2026-03-01T00:00:00.000Z'))
//     ModelModelMock.aggregate.mockResolvedValueOnce([
//       {
//         periodStart: new Date('2026-01-01T00:00:00.000Z'),
//         periodEnd: new Date('2026-02-01T00:00:00.000Z'),
//         count: 10,
//       },
//       {
//         periodStart: new Date('2026-02-01T00:00:00.000Z'),
//         periodEnd: new Date('2026-03-01T00:00:00.000Z'),
//         count: 7,
//       },
//     ])

//     const result = await calculateModelVolume('month')

//     expect(result).toEqual({
//       startDate: '1970-01-01T00:00:00.000Z',
//       endDate: '2026-03-01T00:00:00.000Z',
//       dataPoints: [
//         {
//           periodStart: '2026-01-01T00:00:00.000Z',
//           periodEnd: '2026-02-01T00:00:00.000Z',
//           count: 10,
//         },
//         {
//           periodStart: '2026-02-01T00:00:00.000Z',
//           periodEnd: '2026-03-01T00:00:00.000Z',
//           count: 7,
//         },
//       ],
//     })
//   })

//   test('calculateModelVolume > bad timezone', async () => {
//     ModelModelMock.aggregate.mockRejectedValueOnce(new Error('bad timezone'))

//     const result = calculateModelVolume('week', '2026-01-01', '2026-02-01', 'notARealTimeZone')

//     await expect(result).rejects.toThrowError(BadReq('Invalid timezone. Must be a valid IANA timezone or UTC offset.'))
//   })
// })

import { ObjectId } from 'mongodb'


// Jest runtime đâ cung cấp describe, it, expect dưới dạng global functions ròi có thể dùng luôn
// describe : gom tất cả các test case liên quan lại với nhau
// test : hay còn gọi là it : định nghĩa 1 test case đơn lẻ
// expect : hàm dùng để assert(kiểm tra) điều kiện
// jest.fn(): mock 1 hàm
// jest.spyOn(): mock 1 method của object
// describe('object-id-to-string', () => {
//   it('should convert object id to string', () => {
//     const objectId = new ObjectId()
//     const stringId = objectIdToString(objectId)
//     expect(stringId).toBe(objectId.toString())
//   })
// })
// Stmts : số câu lệnh được test
// Branches : số nhánh (if,else,switch...) được test
// Functions : số lượng function được test
// Lines : tổng số dòng code được test

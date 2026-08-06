
export const OBJECT_ID_RULE = /^[0-9a-fA-F]{24}$/
export const OBJECT_ID_RULE_MESSAGE = 'Your string fails to match the Object Id pattern!'

export const EMAIL_RULE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
export const EMAIL_RULE_MESSAGE = 'Email không hợp lệ ( example : manhquynhdev@gmail.com) '
export const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/
export const PASSWORD_RULE_MESSAGE = 'Mật khẩu phải chứa ít nhẩt 1 ký tự đặc biệt, 1 chữ cái in hoa và có ít nhất 8 ký tự'
export const FILED_REQUIRED_MESSAGE = 'Bạn chưa nhập dữ liệu !'
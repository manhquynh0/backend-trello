import {
  roles,
  permission,
  rolePermission,
  ROLE_HIERARCHY,
  getExpandedRoles,
  getAggregatedPermissions
} from '~/config/rabcConfig'

describe('rabcConfig', () => {
  describe('Constants definition', () => {
    it('should define valid roles', () => {
      expect(roles.OWNER).toBe('owner')
      expect(roles.MEMBER).toBe('member')
      expect(roles.MEMBER_CARD).toBe('member_card')
    })

    it('should define rolePermission mapping for each role', () => {
      expect(rolePermission[roles.OWNER]).toEqual(Object.values(permission))
      expect(rolePermission[roles.MEMBER]).toContain(permission.MOVE_CARD)
      expect(rolePermission[roles.MEMBER_CARD]).toContain(permission.UPDATE_CARD)
    })

    it('should define ROLE_HIERARCHY where MEMBER_CARD inherits MEMBER', () => {
      expect(ROLE_HIERARCHY[roles.MEMBER_CARD]).toContain(roles.MEMBER)
    })
  })

  describe('getExpandedRoles', () => {
    it('should return the original role if no inheritance', () => {
      const expanded = getExpandedRoles([roles.MEMBER])
      expect(expanded).toContain(roles.MEMBER)
      expect(expanded.length).toBe(1)
    })

    it('should inherit parent roles recursively for MEMBER_CARD', () => {
      const expanded = getExpandedRoles([roles.MEMBER_CARD])
      expect(expanded).toContain(roles.MEMBER_CARD)
      expect(expanded).toContain(roles.MEMBER)
    })

    it('should handle empty input safely', () => {
      const expanded = getExpandedRoles([])
      expect(expanded).toEqual([])
    })

    it('should handle multiple input roles without duplication', () => {
      const expanded = getExpandedRoles([roles.OWNER, roles.MEMBER])
      expect(expanded).toContain(roles.OWNER)
      expect(expanded).toContain(roles.MEMBER)
      expect(expanded.length).toBe(2)
    })
  })

  describe('getAggregatedPermissions', () => {
    it('should aggregate all permissions for OWNER', () => {
      const perms = getAggregatedPermissions([roles.OWNER])
      expect(perms).toEqual(expect.arrayContaining(Object.values(permission)))
      expect(perms.length).toBe(Object.values(permission).length)
    })

    it('should aggregate MEMBER permissions correctly', () => {
      const perms = getAggregatedPermissions([roles.MEMBER])
      expect(perms).toContain(permission.MOVE_COLUMN)
      expect(perms).toContain(permission.CREATE_COLUMN)
      expect(perms).toContain(permission.MOVE_CARD)
      expect(perms).not.toContain(permission.DELETE_BOARD)
    })

    it('should aggregate permissions of MEMBER_CARD including inherited MEMBER permissions', () => {
      const perms = getAggregatedPermissions([roles.MEMBER_CARD])
      // From MEMBER_CARD:
      expect(perms).toContain(permission.UPDATE_CARD)
      expect(perms).toContain(permission.MOVE_CARD)
      // Inherited from MEMBER:
      expect(perms).toContain(permission.CREATE_COLUMN)
      expect(perms).toContain(permission.MOVE_COLUMN)
    })

    it('should return empty array for empty roles', () => {
      const perms = getAggregatedPermissions([])
      expect(perms).toEqual([])
    })
  })
})

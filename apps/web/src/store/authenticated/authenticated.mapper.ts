import { type MeDto } from '@/api/auth/entities/response.entities';
import { type AuthUser } from './authenticated.entities';

export const authUserFromMe = (me: MeDto): AuthUser => ({
  id: me.user.id,
  email: me.user.email,
  firstName: me.user.firstName,
  lastName: me.user.lastName,
  name: me.user.name,
  emailVerified: me.user.emailVerified,
  activeOrganizationId: me.session.activeOrganizationId,
});

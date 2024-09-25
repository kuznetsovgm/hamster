import { SetMetadata } from '@nestjs/common';
import { JWTRole } from '../auth.interface';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: JWTRole[]) => SetMetadata(ROLES_KEY, roles);

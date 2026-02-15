import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { ChartPieIcon } from '@phosphor-icons/react/dist/ssr/ChartPie';
import { GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { PlugsConnectedIcon } from '@phosphor-icons/react/dist/ssr/PlugsConnected';
import { UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import { XSquare } from '@phosphor-icons/react/dist/ssr/XSquare';

import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText';
import { ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { MegaphoneIcon } from '@phosphor-icons/react/dist/ssr/Megaphone';
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck';

export const navIcons = {
  'chart-pie': ChartPieIcon,
  'gear-six': GearSixIcon,
  'plugs-connected': PlugsConnectedIcon,
  'x-square': XSquare,
  user: UserIcon,
  users: UsersIcon,
  'file-text': FileTextIcon,
  clock: ClockIcon,
  megaphone: MegaphoneIcon,
  'shield-check': ShieldCheckIcon,
} as Record<string, Icon>;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PhoneContact, PhoneMessage } from '../types/game';

export const PHONE_CONTACTS: PhoneContact[] = [
  {
    id: 'marcus',
    name: 'Marcus Bell',
    avatar: '🏎️',
    status: 'Ready for wheels',
    phone: '555-0144',
    dialogue: 'Need a fast getaway ride? I can drop a tuned Pegassi Apex at your nearest corner.',
  },
  {
    id: 'leo',
    name: 'Leo Chen',
    avatar: '💼',
    status: 'Managing investments',
    phone: '555-0189',
    dialogue: 'Got clean cash waiting to be laundered. Let me know when you need heavy funding.',
  },
  {
    id: 'mechanic',
    name: 'Los Verdes Customs',
    avatar: '🔧',
    status: 'Open 24/7',
    phone: '555-0199',
    dialogue: 'Vehicle delivery on standby. We can tow or respray your ride in seconds.',
  },
  {
    id: 'emergency',
    name: 'Emergency Dispatch',
    avatar: '🚨',
    status: 'Automated Line',
    phone: '911',
    dialogue: '911 operator. What is the location of your emergency?',
  },
];

export const INITIAL_MESSAGES: PhoneMessage[] = [
  {
    id: 'msg_1',
    from: 'Marcus Bell',
    preview: 'Downtown safehouse is prepped',
    body: 'The Vinewood garage has tools and fresh plates ready. Bring any rides there to save your garage inventory.',
    timestamp: '14:15',
    read: false,
  },
  {
    id: 'msg_2',
    from: 'Horizon Bank',
    preview: 'Direct Deposit Confirmed',
    body: 'Your account balance has been updated following your recent downtown contract work.',
    timestamp: '13:50',
    read: true,
  },
  {
    id: 'msg_3',
    from: 'Leo Chen',
    preview: 'Maze Tower Access Key',
    body: 'Helipad clearance codes have been synced with your PDA. Helicopter is fueled and armed on the roof.',
    timestamp: '12:30',
    read: false,
  },
];

'use client';

import React from 'react';
import { AdminSpotlightModal, AdminSpotlightModalProps } from './layout/AdminSpotlightModal';

export interface AdminCommandPaletteProps extends AdminSpotlightModalProps {}

export function AdminCommandPalette(props: AdminCommandPaletteProps) {
  return <AdminSpotlightModal {...props} />;
}

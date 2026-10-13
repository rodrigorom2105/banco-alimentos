import { describe, expect, it } from 'vitest';

import { makeCampaign } from '../../test-support/inMemory';
import { campaignApproved, campaignRejected } from './Notification';

describe('campaignApproved', () => {
  it('dice que ya se ve en Explorar cuando quedó activa', () => {
    const n = campaignApproved(makeCampaign({ status: 'active' }));
    expect(n.type).toBe('campaign_approved');
    expect(n.body).toContain('ya aparece en Explorar');
    expect(n.data).toEqual({ campaignId: makeCampaign().id });
  });

  it('avisa que falta su fecha de inicio cuando quedó aprobada', () => {
    const n = campaignApproved(makeCampaign({ status: 'approved' }));
    expect(n.body).toContain('cuando llegue su fecha de inicio');
  });

  it('incluye el nombre de la campaña', () => {
    const n = campaignApproved(makeCampaign({ name: 'Campaña Col. Chapalita' }));
    expect(n.body).toContain('Campaña Col. Chapalita');
  });
});

describe('campaignRejected', () => {
  it('incluye el motivo, que es lo que el organizador necesita saber', () => {
    const n = campaignRejected(makeCampaign(), 'La dirección no coincide con el municipio.');
    expect(n.type).toBe('campaign_rejected');
    expect(n.body).toContain('La dirección no coincide con el municipio.');
    expect(n.data).toEqual({ campaignId: makeCampaign().id });
  });
});

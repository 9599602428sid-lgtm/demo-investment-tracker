export type InvestmentType = 'stock' | 'mutual_fund' | 'bond' | 'insurance' | 'fd' | 'unlisted_stock' | 'llp_capital' | 'llp_loan';

export interface Investment {
  id: string;
  user_name: string;
  type: InvestmentType;
  name: string;
  ticker?: string;
  scheme_code?: string;
  quantity: number;
  buy_price: number;
  buy_date: string;
  current_value?: number;   // for FD / bond / insurance (total current value)
  maturity_date?: string;
  notes?: string;
  advisor?: string;
  created_at: string;
}

export const FAMILY_MEMBERS = [
  'Ajay Khurana',
  'Vandana Khurana',
  'Aseem Khurana',
  'Prerna Khurana',
  'Ameya Khurana',
  'Ujjayi Khurana',
] as const;

export type FamilyMember = typeof FAMILY_MEMBERS[number];

export const ADVISORS = [
  'DIVINE',
  'GLOBE',
  'KOTAK',
  'ABSLI',
  'LIC',
  'NAVDEEP',
] as const;

export type Advisor = typeof ADVISORS[number];

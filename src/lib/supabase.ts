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
  'Rahul Sharma',
  'Priya Sharma',
  'Amit Sharma',
  'Neha Sharma',
  'Vikram Sharma',
  'Sonia Sharma',
] as const;

export type FamilyMember = typeof FAMILY_MEMBERS[number];

export const ADVISORS = [
  'MOTILAL',
  'ICICI',
  'KOTAK',
  'HDFC',
  'LIC',
  'ANGEL',
] as const;

export type Advisor = typeof ADVISORS[number];


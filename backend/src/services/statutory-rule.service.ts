import prisma from '../prisma/client';

interface RuleSlab {
  min: number;
  max: number;
  amount?: number;
  rate?: number;
  exceptionMonth?: number;
  exceptionAmount?: number;
}

interface DeductionResult {
  employee: number;
  employer: number;
  total: number;
}

export class StatutoryRuleService {
  static async getActiveRules(countryId: string, companyId?: string) {
    const rules = await prisma.statutoryRule.findMany({
      where: {
        countryId,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } }
        ],
        AND: [
          {
            OR: [
              { companyId: null },
              companyId ? { companyId } : { id: 'none' }
            ]
          }
        ]
      },
      orderBy: [
        { code: 'asc' },
        { effectiveFrom: 'desc' }
      ]
    });

    if (companyId) {
      const ruleMap = new Map<string, any>();
      for (const rule of rules) {
        const existing = ruleMap.get(rule.code);
        if (!existing || (rule.companyId && !existing.companyId)) {
          ruleMap.set(rule.code, rule);
        }
      }
      return Array.from(ruleMap.values());
    }

    return rules;
  }

  static async getCountryForCompany(companyId: string): Promise<string | null> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { countryId: true },
    });
    return company?.countryId || null;
  }

  static evaluateRule(rule: {
    code: string;
    category: string;
    ruleType: string;
    employeeRate?: number | string | null;
    employerRate?: number | string | null;
    wageCeiling?: number | string | null;
    slabData?: any;
  }, gross: number, basic: number, context?: { month?: number }): DeductionResult {
    const code = (rule.code || '').toLowerCase();
    const category = (rule.category || '').toLowerCase();

    // Determine the wage base: PF/Retirement uses basic; ESI/PT/Tax uses gross
    const isPFRule = code.includes('pf') || category === 'retirement';
    const wageBase = isPFRule ? (basic || gross) : gross;

    // ESI Limit check: if gross exceeds the wage ceiling, contribution is 0
    if (code.includes('esi') && rule.wageCeiling && gross > Number(rule.wageCeiling)) {
      return { employee: 0, employer: 0, total: 0 };
    }

    const wage = rule.wageCeiling && !code.includes('esi')
      ? Math.min(wageBase, Number(rule.wageCeiling))
      : wageBase;

    if (rule.ruleType === 'percentage') {
      return this.evaluatePercentage(wage, rule);
    }

    if (rule.ruleType === 'slab') {
      return this.evaluateSlab(wage, rule, context?.month);
    }

    if (rule.ruleType === 'fixed') {
      return this.evaluateFixed(rule);
    }

    return { employee: 0, employer: 0, total: 0 };
  }

  private static evaluatePercentage(wage: number, rule: {
    employeeRate?: number | string | null;
    employerRate?: number | string | null;
  }): DeductionResult {
    const employee = Math.floor(wage * (Number(rule.employeeRate || 0) / 100));
    const employer = Math.floor(wage * (Number(rule.employerRate || 0) / 100));
    return { employee, employer, total: employee + employer };
  }

  private static evaluateSlab(gross: number, rule: {
    slabData?: any;
    employeeRate?: number | string | null;
  }, targetMonth?: number): DeductionResult {
    const rawSlabs = Array.isArray(rule.slabData) ? rule.slabData : [];
    if (rawSlabs.length === 0) return { employee: 0, employer: 0, total: 0 };

    const slabs = rawSlabs.map((s: any) => {
      const min = s.min !== undefined ? Number(s.min) : (s.from !== undefined ? Number(s.from) : 0);
      const maxVal = s.max !== undefined ? s.max : (s.to !== undefined ? s.to : 999999999);
      const max = (maxVal === 'Infinity' || maxVal === 999999999 || maxVal === 999999) ? Infinity : Number(maxVal);
      const amount = s.amount !== undefined ? Number(s.amount) : (s.tax !== undefined ? Number(s.tax) : undefined);
      const rate = s.rate !== undefined ? Number(s.rate) : undefined;
      return { ...s, min, max, amount, rate };
    });

    const month = targetMonth || (new Date().getMonth() + 1);

    for (const slab of slabs) {
      if (gross >= slab.min && gross <= slab.max) {
        if (slab.amount !== undefined) {
          const amount = slab.exceptionMonth && slab.exceptionMonth === month && slab.exceptionAmount
            ? Number(slab.exceptionAmount) : Number(slab.amount);
          return { employee: amount, employer: amount, total: amount * 2 };
        }
        if (slab.rate !== undefined) {
          const amount = Math.floor(gross * (Number(slab.rate) / 100));
          return { employee: amount, employer: amount, total: amount * 2 };
        }
      }
    }
    return { employee: 0, employer: 0, total: 0 };
  }

  private static evaluateFixed(rule: { employeeRate?: number | string | null }): DeductionResult {
    const amount = Number(rule.employeeRate || 0);
    return { employee: amount, employer: 0, total: amount };
  }

  static async calculateAllDeductions(
    companyId: string,
    employee: { basicSalary: number; grossSalary: number; ptState?: string | null },
    month?: number,
    year?: number,
  ) {
    let countryId = await this.getCountryForCompany(companyId);
    if (!countryId) {
      const defaultCountry = await prisma.country.findFirst({ where: { code: 'IN' } });
      countryId = defaultCountry?.id || null;
    }
    if (!countryId) {
      return { deductions: {}, employerContributions: {}, totalDeductions: 0 };
    }

    const rules = await this.getActiveRules(countryId, companyId);
    const deductions: Record<string, number> = {};
    const employerContributions: Record<string, number> = {};
    let totalDeductions = 0;

    for (const rule of rules) {
      const result = this.evaluateRule({
        code: rule.code,
        category: rule.category,
        ruleType: rule.ruleType,
        employeeRate: rule.employeeRate ? Number(rule.employeeRate) : null,
        employerRate: rule.employerRate ? Number(rule.employerRate) : null,
        wageCeiling: rule.wageCeiling ? Number(rule.wageCeiling) : null,
        slabData: rule.slabData,
      }, employee.grossSalary, employee.basicSalary, { month });
      if (result.employee > 0 || result.employer > 0) {
        deductions[rule.code] = result.employee;
        employerContributions[rule.code] = result.employer;
        totalDeductions += result.employee;
      }
    }

    return { deductions, employerContributions, totalDeductions };
  }

  // ── India-specific helpers (legacy compatibility) ──

  static isBasic(name: string): boolean {
    const n = name.toUpperCase();
    return n === 'BASIC' || n === 'BASIC SALARY' || n === 'BASE SALARY' || n === 'BASIC PAY';
  }

  static isPF(name: string): boolean {
    const n = name.toUpperCase();
    return n.includes('PF') || n.includes('PROVIDENT FUND') || n.includes('EPF');
  }

  static isESI(name: string): boolean {
    const n = name.toUpperCase();
    return n.includes('ESI') || n.includes('ESIC');
  }

  static isPT(name: string): boolean {
    const n = name.toUpperCase();
    return n === 'PT' || n === 'PROFESSIONAL TAX';
  }

  static isTDS(name: string): boolean {
    const n = name.toUpperCase();
    return n === 'TDS' || n === 'INCOME TAX' || n.includes('TAX DEDUCTED');
  }
}

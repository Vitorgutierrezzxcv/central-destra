import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Percent, AlertCircle } from "lucide-react";
import { format, subMonths, addMonths, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatCurrency = (value, compact = false) => {
  const num = value || 0;
  if (compact && Math.abs(num) >= 1000) {
    return `R$ ${(num / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
  }
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercent = (value) => {
  return `${((value || 0) * 100).toFixed(1)}%`;
};

export default function FinanceSummary() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Fetch all financial data
  const { data: transactions } = useQuery({
    queryKey: ['all-transactions'],
    queryFn: () => base44.entities.FinancialTransaction.list(),
    initialData: [],
  });

  const { data: fixedExpenses } = useQuery({
    queryKey: ['all-fixed-expenses'],
    queryFn: () => base44.entities.FixedExpense.list(),
    initialData: [],
  });

  const { data: variableExpenses } = useQuery({
    queryKey: ['all-variable-expenses'],
    queryFn: () => base44.entities.VariableExpense.list(),
    initialData: [],
  });

  const { data: payrollEntries } = useQuery({
    queryKey: ['all-payroll'],
    queryFn: () => base44.entities.PayrollEntry.list(),
    initialData: [],
  });

  // Calculate monthly summary
  const monthlySummary = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const monthRef = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
      
      // Filter transactions by month
      const monthTransactions = transactions.filter(t => t.month_reference === monthRef);
      
      // Calculate each category from transactions
      const faturamentoBruto = monthTransactions
        .filter(t => t.category_macro === 'faturamento_bruto')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const impostoFaturamento = monthTransactions
        .filter(t => t.category_macro === 'imposto_faturamento')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const deducoes = monthTransactions
        .filter(t => t.category_macro === 'deducoes_cancelamentos')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const cmv = monthTransactions
        .filter(t => t.category_macro === 'cmv')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const despesaVariavelTrans = monthTransactions
        .filter(t => t.category_macro === 'despesa_variavel')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const despesaFixaTrans = monthTransactions
        .filter(t => t.category_macro === 'despesa_fixa')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const folhaTrans = monthTransactions
        .filter(t => t.category_macro === 'folha_pagamento')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const resultadoFinanceiro = monthTransactions
        .filter(t => t.category_macro === 'resultado_financeiro')
        .reduce((sum, t) => {
          if (t.type === 'financial_income') return sum + (t.amount || 0);
          if (t.type === 'financial_expense') return sum - (t.amount || 0);
          return sum;
        }, 0);

      const impostoLucro = monthTransactions
        .filter(t => t.category_macro === 'imposto_lucro')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Get from dedicated tables
      const monthFixed = fixedExpenses
        .filter(e => e.month_reference === monthRef)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const monthVariable = variableExpenses
        .filter(e => e.month_reference === monthRef)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const monthPayroll = payrollEntries
        .filter(e => e.month_reference === monthRef)
        .reduce((sum, e) => sum + (e.total_cost || 0), 0);

      // Use dedicated tables if available, otherwise use transactions
      const despesaFixa = monthFixed > 0 ? monthFixed : despesaFixaTrans;
      const despesaVariavel = monthVariable > 0 ? monthVariable : despesaVariavelTrans;
      const folhaPagamento = monthPayroll > 0 ? monthPayroll : folhaTrans;

      // Valores a Receber (receitas pendentes do mês)
      const valoresReceber = monthTransactions
        .filter(t => 
          (t.type === 'income' || t.category_macro === 'faturamento_bruto') && 
          t.status === 'pending'
        )
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Calculations
      const faturamentoLiquido = faturamentoBruto - impostoFaturamento - deducoes;
      const lucroBruto = faturamentoLiquido - cmv;
      const margemBruta = faturamentoLiquido > 0 ? lucroBruto / faturamentoLiquido : 0;
      
      const margemContribuicao = lucroBruto - despesaVariavel;
      const margemContribuicaoPct = faturamentoLiquido > 0 ? margemContribuicao / faturamentoLiquido : 0;
      
      const ebitda = margemContribuicao - despesaFixa - folhaPagamento;
      const margemEbitda = faturamentoLiquido > 0 ? ebitda / faturamentoLiquido : 0;
      
      const lucroAntesIR = ebitda + resultadoFinanceiro;
      const lucroLiquido = lucroAntesIR - impostoLucro;
      const margemLiquida = faturamentoLiquido > 0 ? lucroLiquido / faturamentoLiquido : 0;

      months.push({
        month: monthRef,
        monthLabel: format(parseISO(monthRef + "-01"), "MMM", { locale: ptBR }),
        faturamentoBruto,
        impostoFaturamento,
        deducoes,
        valoresReceber,
        faturamentoLiquido,
        cmv,
        lucroBruto,
        margemBruta,
        despesaVariavel,
        margemContribuicao,
        margemContribuicaoPct,
        despesaFixa,
        folhaPagamento,
        ebitda,
        margemEbitda,
        resultadoFinanceiro,
        lucroAntesIR,
        impostoLucro,
        lucroLiquido,
        margemLiquida
      });
    }
    return months;
  }, [transactions, fixedExpenses, variableExpenses, payrollEntries, selectedYear]);

  // Calculate totals
  const totals = useMemo(() => {
    return monthlySummary.reduce((acc, month) => ({
      faturamentoBruto: acc.faturamentoBruto + month.faturamentoBruto,
      impostoFaturamento: acc.impostoFaturamento + month.impostoFaturamento,
      deducoes: acc.deducoes + month.deducoes,
      valoresReceber: acc.valoresReceber + month.valoresReceber,
      faturamentoLiquido: acc.faturamentoLiquido + month.faturamentoLiquido,
      cmv: acc.cmv + month.cmv,
      lucroBruto: acc.lucroBruto + month.lucroBruto,
      despesaVariavel: acc.despesaVariavel + month.despesaVariavel,
      margemContribuicao: acc.margemContribuicao + month.margemContribuicao,
      despesaFixa: acc.despesaFixa + month.despesaFixa,
      folhaPagamento: acc.folhaPagamento + month.folhaPagamento,
      ebitda: acc.ebitda + month.ebitda,
      resultadoFinanceiro: acc.resultadoFinanceiro + month.resultadoFinanceiro,
      lucroAntesIR: acc.lucroAntesIR + month.lucroAntesIR,
      impostoLucro: acc.impostoLucro + month.impostoLucro,
      lucroLiquido: acc.lucroLiquido + month.lucroLiquido,
    }), {
      faturamentoBruto: 0,
      impostoFaturamento: 0,
      deducoes: 0,
      valoresReceber: 0,
      faturamentoLiquido: 0,
      cmv: 0,
      lucroBruto: 0,
      despesaVariavel: 0,
      margemContribuicao: 0,
      despesaFixa: 0,
      folhaPagamento: 0,
      ebitda: 0,
      resultadoFinanceiro: 0,
      lucroAntesIR: 0,
      impostoLucro: 0,
      lucroLiquido: 0,
    });
  }, [monthlySummary]);

  const years = [];
  for (let y = new Date().getFullYear() - 2; y <= new Date().getFullYear() + 1; y++) {
    years.push(y.toString());
  }

  const rows = [
    { key: 'faturamentoBruto', label: 'Faturamento Bruto', type: 'currency', section: 'receita', highlight: true },
    { key: 'impostoFaturamento', label: '(-) Impostos sobre Faturamento', type: 'currency', section: 'receita', negative: true },
    { key: 'deducoes', label: '(-) Deduções e Cancelamentos', type: 'currency', section: 'receita', negative: true },
    { key: 'valoresReceber', label: 'Valores a Receber', type: 'currency', section: 'receita', info: true },
    { key: 'faturamentoLiquido', label: '= Faturamento Líquido', type: 'currency', section: 'receita', subtotal: true },
    { key: 'cmv', label: '(-) CMV (Custos)', type: 'currency', section: 'custos', negative: true },
    { key: 'lucroBruto', label: '= Lucro Bruto', type: 'currency', section: 'custos', subtotal: true },
    { key: 'margemBruta', label: 'Margem Bruta %', type: 'percent', section: 'custos' },
    { key: 'despesaVariavel', label: '(-) Despesas Variáveis', type: 'currency', section: 'margem', negative: true },
    { key: 'margemContribuicao', label: '= Margem de Contribuição', type: 'currency', section: 'margem', subtotal: true },
    { key: 'margemContribuicaoPct', label: 'Margem de Contribuição %', type: 'percent', section: 'margem' },
    { key: 'despesaFixa', label: '(-) Despesas Fixas', type: 'currency', section: 'operacional', negative: true },
    { key: 'folhaPagamento', label: '(-) Folha de Pagamento', type: 'currency', section: 'operacional', negative: true },
    { key: 'ebitda', label: '= EBITDA', type: 'currency', section: 'operacional', subtotal: true },
    { key: 'margemEbitda', label: 'Margem EBITDA %', type: 'percent', section: 'operacional' },
    { key: 'resultadoFinanceiro', label: '(+/-) Resultado Financeiro', type: 'currency', section: 'financeiro' },
    { key: 'lucroAntesIR', label: '= Lucro antes do IR', type: 'currency', section: 'financeiro', subtotal: true },
    { key: 'impostoLucro', label: '(-) Impostos sobre Lucro', type: 'currency', section: 'financeiro', negative: true },
    { key: 'lucroLiquido', label: '= Lucro Líquido', type: 'currency', section: 'resultado', subtotal: true, highlight: true },
    { key: 'margemLiquida', label: 'Margem Líquida %', type: 'percent', section: 'resultado' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117] p-4 md:p-6 lg:p-8">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#6FA6FF] rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#131A20]">Destra Finances</h1>
              <p className="text-sm text-[#456C8D]">Resumo financeiro mensal (DRE)</p>
            </div>
          </div>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="bg-[#EAEAEA]/30 border-[#EAEAEA]">
            <CardContent className="p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-[#6FA6FF]" />
                <span className="text-xs text-[#456C8D]">Faturamento</span>
              </div>
              <p className="text-sm md:text-lg font-bold text-[#131A20] truncate">{formatCurrency(totals.faturamentoBruto)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#EAEAEA]/30 border-[#EAEAEA]">
            <CardContent className="p-3">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="w-3 h-3 text-[#6FA6FF]" />
                <span className="text-xs text-[#456C8D]">EBITDA</span>
              </div>
              <p className={`text-sm md:text-lg font-bold truncate ${totals.ebitda >= 0 ? 'text-[#131A20]' : 'text-red-500'}`}>
                {formatCurrency(totals.ebitda)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#EAEAEA]/30 border-[#EAEAEA]">
            <CardContent className="p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="w-3 h-3 text-[#6FA6FF]" />
                <span className="text-xs text-[#456C8D]">Lucro Líquido</span>
              </div>
              <p className={`text-sm md:text-lg font-bold truncate ${totals.lucroLiquido >= 0 ? 'text-[#131A20]' : 'text-red-500'}`}>
                {formatCurrency(totals.lucroLiquido)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#EAEAEA]/30 border-[#EAEAEA]">
            <CardContent className="p-3">
              <div className="flex items-center gap-1 mb-1">
                <Percent className="w-3 h-3 text-[#6FA6FF]" />
                <span className="text-xs text-[#456C8D]">Margem Líq.</span>
              </div>
              <p className={`text-sm md:text-lg font-bold ${totals.faturamentoLiquido > 0 && totals.lucroLiquido / totals.faturamentoLiquido >= 0 ? 'text-[#131A20]' : 'text-red-500'}`}>
                {formatPercent(totals.faturamentoLiquido > 0 ? totals.lucroLiquido / totals.faturamentoLiquido : 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mobile DRE Cards */}
        <div className="md:hidden space-y-4">
          {rows.filter(r => r.subtotal || r.highlight).map(row => {
            const currentMonth = monthlySummary[new Date().getMonth()];
            const value = currentMonth?.[row.key] || 0;
            const total = totals[row.key] || 0;
            const isNegative = value < 0;
            
            return (
              <Card key={row.key} className={`border-[#EAEAEA] ${row.highlight ? 'bg-[#6FA6FF]/5' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#131A20]">{row.label.replace('= ', '')}</span>
                    {row.type === 'percent' ? (
                      <Badge variant="outline" className="text-xs">
                        {formatPercent(value)}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-[#456C8D] mb-1">Este mês</p>
                      <p className={`text-lg font-bold ${isNegative ? 'text-red-500' : 'text-[#131A20]'}`}>
                        {row.type === 'percent' ? formatPercent(value) : formatCurrency(value)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#456C8D] mb-1">Total {selectedYear}</p>
                      <p className={`text-base font-semibold ${total < 0 ? 'text-red-500' : 'text-[#456C8D]'}`}>
                        {row.type === 'percent' ? '-' : formatCurrency(total)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {/* Monthly breakdown accordion */}
          <Card className="border-[#EAEAEA]">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-[#131A20] mb-3">Resumo Mensal</p>
              <div className="grid grid-cols-3 gap-2">
                {monthlySummary.map(m => {
                  const hasData = m.faturamentoBruto > 0 || m.lucroLiquido !== 0;
                  return (
                    <div 
                      key={m.month} 
                      className={`p-2 rounded-lg text-center ${hasData ? 'bg-[#EAEAEA]/50' : 'bg-gray-50'}`}
                    >
                      <p className="text-xs font-medium text-[#456C8D] uppercase mb-1">{m.monthLabel}</p>
                      <p className={`text-xs font-bold ${m.lucroLiquido < 0 ? 'text-red-500' : 'text-[#131A20]'}`}>
                        {formatCurrency(m.lucroLiquido, true)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop DRE Table */}
        <Card className="border-[#EAEAEA] overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="bg-[#EAEAEA]">
                  <TableHead className="font-bold text-[#131A20] sticky left-0 bg-[#EAEAEA] min-w-[180px] p-4">
                    Indicador
                  </TableHead>
                  {monthlySummary.map(m => (
                    <TableHead key={m.month} className="font-bold text-[#131A20] text-center capitalize min-w-[90px] p-4">
                      {m.monthLabel}
                    </TableHead>
                  ))}
                  <TableHead className="font-bold text-[#131A20] text-center bg-[#6FA6FF]/10 min-w-[100px] p-4">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <TableRow 
                    key={row.key} 
                    className={`
                      ${row.subtotal ? 'bg-[#EAEAEA]/50 font-semibold' : ''}
                      ${row.highlight ? 'bg-[#6FA6FF]/10' : ''}
                    `}
                  >
                    <TableCell className={`
                      sticky left-0 bg-white p-4
                      ${row.subtotal ? 'bg-[#EAEAEA]/50 font-semibold' : ''}
                      ${row.highlight ? 'bg-[#6FA6FF]/10 font-semibold' : ''}
                      ${row.negative ? 'text-red-600' : ''}
                      ${row.info ? 'text-[#456C8D]' : 'text-[#131A20]'}
                    `}>
                      <span className="whitespace-nowrap">{row.label}</span>
                    </TableCell>
                    {monthlySummary.map(m => {
                      const value = m[row.key];
                      const isNegative = value < 0;
                      return (
                        <TableCell 
                          key={m.month} 
                          className={`text-center p-4 ${isNegative ? 'text-red-500' : ''}`}
                        >
                          {row.type === 'percent' 
                            ? formatPercent(value)
                            : <span className="whitespace-nowrap">{formatCurrency(value)}</span>
                          }
                        </TableCell>
                      );
                    })}
                    <TableCell className={`text-center font-semibold bg-[#6FA6FF]/10 p-4 ${totals[row.key] < 0 ? 'text-red-500' : ''}`}>
                      {row.type === 'percent' 
                        ? '-'
                        : <span className="whitespace-nowrap">{formatCurrency(totals[row.key])}</span>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 border-[#EAEAEA]">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#6FA6FF] mt-0.5" />
              <div className="text-sm text-[#456C8D]">
                <p className="font-medium text-[#131A20] mb-1">Como funciona o Destra Finances</p>
                <p>Os dados são calculados automaticamente a partir dos lançamentos, gastos fixos, gastos variáveis e folha de pagamento cadastrados em cada mês. Certifique-se de categorizar corretamente cada transação para obter indicadores precisos.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Percent, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function PiermontDashboard() {
  const [period, setPeriod] = useState("month");
  const [customDate, setCustomDate] = useState({ from: null, to: null });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['ecommerce-expenses'],
    queryFn: () => base44.entities.EcommerceExpense.list('-expense_date'),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['ecommerce-goals'],
    queryFn: () => base44.entities.EcommerceGoal.filter({ active: true }),
  });

  const getDateRange = () => {
    const now = new Date();
    if (period === "day") return { start: startOfDay(now), end: endOfDay(now) };
    if (period === "week") return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
    if (period === "month") return { start: startOfMonth(now), end: endOfMonth(now) };
    if (period === "custom" && customDate.from && customDate.to) {
      return { start: startOfDay(customDate.from), end: endOfDay(customDate.to) };
    }
    return { start: startOfMonth(now), end: endOfMonth(now) };
  };

  const getComparisonRange = () => {
    const now = new Date();
    if (period === "day") return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
    if (period === "week") return { start: startOfWeek(subWeeks(now, 1), { locale: ptBR }), end: endOfWeek(subWeeks(now, 1), { locale: ptBR }) };
    if (period === "month") return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    return null;
  };

  const filterByDateRange = (items, dateField, range) => {
    return items.filter(item => {
      const date = new Date(item[dateField]);
      return date >= range.start && date <= range.end;
    });
  };

  const dateRange = getDateRange();
  const comparisonRange = getComparisonRange();

  const currentSales = filterByDateRange(sales, 'sale_date', dateRange);
  const previousSales = comparisonRange ? filterByDateRange(sales, 'sale_date', comparisonRange) : [];
  const currentExpenses = filterByDateRange(expenses, 'expense_date', dateRange);
  const previousExpenses = comparisonRange ? filterByDateRange(expenses, 'expense_date', comparisonRange) : [];

  const metrics = useMemo(() => {
    const revenue = currentSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const profit = currentSales.reduce((sum, s) => sum + (s.profit || 0), 0);
    const totalExpenses = currentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const salesCount = currentSales.length;
    const netProfit = profit - totalExpenses;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const prevRevenue = previousSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const prevProfit = previousSales.reduce((sum, s) => sum + (s.profit || 0), 0);
    const prevExpenses = previousExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const prevSalesCount = previousSales.length;

    return {
      revenue,
      profit,
      totalExpenses,
      salesCount,
      netProfit,
      profitMargin,
      changes: {
        revenue: prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0,
        profit: prevProfit > 0 ? ((profit - prevProfit) / prevProfit) * 100 : 0,
        expenses: prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0,
        sales: prevSalesCount > 0 ? ((salesCount - prevSalesCount) / prevSalesCount) * 100 : 0,
      }
    };
  }, [currentSales, previousSales, currentExpenses, previousExpenses]);

  const topSellingProducts = useMemo(() => {
    const productSales = {};
    currentSales.forEach(sale => {
      if (!productSales[sale.product_id]) {
        productSales[sale.product_id] = {
          id: sale.product_id,
          name: sale.product_name,
          quantity: 0,
          revenue: 0
        };
      }
      productSales[sale.product_id].quantity += sale.quantity || 0;
      productSales[sale.product_id].revenue += sale.total_amount || 0;
    });
    return Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [currentSales]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.active && p.stock_quantity <= (p.min_stock_alert || 0)).slice(0, 10);
  }, [products]);

  const MetricCard = ({ title, value, change, icon: Icon, format = "currency" }) => {
    const isPositive = change >= 0;
    const formatted = format === "currency" 
      ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
      : format === "number" ? value 
      : `${value.toFixed(1)}%`;

    return (
      <Card className="border-black bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-gray-600">{title}</CardTitle>
          <Icon className="h-4 w-4 text-black" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-black">{formatted}</div>
          {change !== undefined && (
            <div className={`text-xs flex items-center gap-1 mt-1 ${isPositive ? 'text-black' : 'text-gray-500'}`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}% vs período anterior
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-black pb-4">
          <h1 className="text-3xl font-bold text-black">Piermont</h1>
          
          <div className="flex flex-wrap gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32 border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {period === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="border-black">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {customDate.from && customDate.to 
                      ? `${format(customDate.from, 'dd/MM')} - ${format(customDate.to, 'dd/MM')}`
                      : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-black">
                  <Calendar
                    mode="range"
                    selected={customDate}
                    onSelect={setCustomDate}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Faturamento" 
            value={metrics.revenue} 
            change={metrics.changes.revenue}
            icon={DollarSign}
          />
          <MetricCard 
            title="Lucro Líquido" 
            value={metrics.netProfit} 
            change={metrics.changes.profit}
            icon={TrendingUp}
          />
          <MetricCard 
            title="Margem de Lucro" 
            value={metrics.profitMargin} 
            icon={Percent}
            format="percent"
          />
          <MetricCard 
            title="Vendas" 
            value={metrics.salesCount} 
            change={metrics.changes.sales}
            icon={ShoppingCart}
            format="number"
          />
        </div>

        {/* Goals Progress */}
        {goals.length > 0 && (
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black">Metas do Período</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.map(goal => {
                const currentValue = 
                  goal.metric_type === 'revenue' ? metrics.revenue :
                  goal.metric_type === 'profit' ? metrics.netProfit :
                  goal.metric_type === 'sales_count' ? metrics.salesCount :
                  goal.metric_type === 'profit_margin' ? metrics.profitMargin : 0;
                
                const progress = (currentValue / goal.target_value) * 100;
                
                return (
                  <div key={goal.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-black font-medium">{goal.metric_type}</span>
                      <span className="text-gray-600">{currentValue.toFixed(0)} / {goal.target_value}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-black transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black">Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topSellingProducts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#000" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader>
              <CardTitle className="text-black">Receita vs Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Receita</span>
                    <span className="font-bold text-black">R$ {metrics.revenue.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-full bg-black rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Gastos</span>
                    <span className="font-bold text-black">R$ {metrics.totalExpenses.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-full bg-gray-400 rounded-full" 
                      style={{ width: `${metrics.revenue > 0 ? (metrics.totalExpenses / metrics.revenue) * 100 : 0}%` }} 
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="font-bold text-black">Lucro Líquido</span>
                    <span className="font-bold text-black">R$ {metrics.netProfit.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Card className="border-black border-2">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <Package className="h-5 w-5" />
                Estoque Baixo - Comprar Urgente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0">
                    <div className="flex-1">
                      <div className="font-medium text-black">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        Estoque: {product.stock_quantity} unidades (mín: {product.min_stock_alert})
                      </div>
                    </div>
                    {product.purchase_link && (
                      <Button 
                        asChild
                        size="sm" 
                        className="bg-black hover:bg-gray-800 text-white"
                      >
                        <a href={product.purchase_link} target="_blank" rel="noopener noreferrer">
                          Comprar
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Percent, Calendar as CalendarIcon, Plus, Target } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function PiermontDashboard() {
  const [period, setPeriod] = useState("month");
  const [customDate, setCustomDate] = useState({ from: null, to: null });
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [saleFormData, setSaleFormData] = useState({ sale_date: format(new Date(), 'yyyy-MM-dd'), status: 'completed' });
  const [productFormData, setProductFormData] = useState({ active: true, stock_quantity: 0 });
  const [expenseFormData, setExpenseFormData] = useState({ expense_date: format(new Date(), 'yyyy-MM-dd') });
  const [goalFormData, setGoalFormData] = useState({ start_date: format(new Date(), 'yyyy-MM-dd'), active: true });
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkData, setBulkData] = useState({
    month: format(subMonths(new Date(), 1), 'yyyy-MM'),
    total_revenue: '',
    total_sales_count: '',
    total_expenses: '',
    avg_profit_margin: ''
  });

  const queryClient = useQueryClient();

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

  const createSaleMutation = useMutation({
    mutationFn: async (saleData) => {
      const sale = await base44.entities.Sale.create(saleData);
      const product = products.find(p => p.id === saleData.product_id);
      if (product) {
        await base44.entities.Product.update(product.id, {
          stock_quantity: (product.stock_quantity || 0) - saleData.quantity
        });
      }
      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowSaleForm(false);
      setSaleFormData({ sale_date: format(new Date(), 'yyyy-MM-dd'), status: 'completed' });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowProductForm(false);
      setProductFormData({ active: true, stock_quantity: 0 });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.EcommerceExpense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-expenses'] });
      setShowExpenseForm(false);
      setExpenseFormData({ expense_date: format(new Date(), 'yyyy-MM-dd') });
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.EcommerceGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-goals'] });
      setShowGoalForm(false);
      setGoalFormData({ start_date: format(new Date(), 'yyyy-MM-dd'), active: true });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (data) => {
      const monthDate = new Date(data.month + '-15');
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      // Criar venda consolidada
      if (data.total_revenue && data.total_sales_count) {
        const avgSaleValue = parseFloat(data.total_revenue) / parseInt(data.total_sales_count);
        await base44.entities.Sale.create({
          product_id: 'bulk_import',
          product_name: `Vendas ${format(monthDate, 'MMMM/yyyy', { locale: ptBR })}`,
          quantity: parseInt(data.total_sales_count),
          unit_price: avgSaleValue,
          total_amount: parseFloat(data.total_revenue),
          total_cost: parseFloat(data.total_revenue) * (1 - parseFloat(data.avg_profit_margin || 0) / 100),
          profit: parseFloat(data.total_revenue) * (parseFloat(data.avg_profit_margin || 0) / 100),
          profit_margin: parseFloat(data.avg_profit_margin || 0),
          sale_date: format(monthEnd, 'yyyy-MM-dd'),
          payment_method: 'credit_card',
          status: 'completed',
          notes: 'Importação em massa'
        });
      }

      // Criar gasto consolidado
      if (data.total_expenses) {
        await base44.entities.EcommerceExpense.create({
          description: `Gastos ${format(monthDate, 'MMMM/yyyy', { locale: ptBR })}`,
          category: 'other',
          amount: parseFloat(data.total_expenses),
          expense_date: format(monthEnd, 'yyyy-MM-dd'),
          recurring: false,
          notes: 'Importação em massa'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-expenses'] });
      setShowBulkImport(false);
      setBulkData({
        month: format(subMonths(new Date(), 1), 'yyyy-MM'),
        total_revenue: '',
        total_sales_count: '',
        total_expenses: '',
        avg_profit_margin: ''
      });
    },
  });

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSaleFormData({
        ...saleFormData,
        product_id: productId,
        product_name: product.name,
        unit_price: product.product_price,
      });
    }
  };

  const calculateSale = useMemo(() => {
    const quantity = saleFormData.quantity || 0;
    const unitPrice = saleFormData.unit_price || 0;
    const product = products.find(p => p.id === saleFormData.product_id);
    
    if (!product) return { total: 0, cost: 0, profit: 0, margin: 0 };

    const totalAmount = quantity * unitPrice;
    const totalCost = quantity * ((product.product_cost || 0) + (product.packaging_cost || 0) + (product.shipping_cost || 0));
    const profit = totalAmount - totalCost;
    const margin = totalAmount > 0 ? (profit / totalAmount) * 100 : 0;

    return { total: totalAmount, cost: totalCost, profit, margin };
  }, [saleFormData, products]);

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

        {/* Quick Actions */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button onClick={() => setShowSaleForm(true)} variant="outline" className="border-black hover:bg-gray-100 h-auto py-4 flex-col gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs">Nova Venda</span>
            </Button>
            <Button onClick={() => setShowProductForm(true)} variant="outline" className="border-black hover:bg-gray-100 h-auto py-4 flex-col gap-2">
              <Package className="h-5 w-5" />
              <span className="text-xs">Novo Produto</span>
            </Button>
            <Button onClick={() => setShowExpenseForm(true)} variant="outline" className="border-black hover:bg-gray-100 h-auto py-4 flex-col gap-2">
              <TrendingDown className="h-5 w-5" />
              <span className="text-xs">Novo Gasto</span>
            </Button>
            <Button onClick={() => setShowGoalForm(true)} variant="outline" className="border-black hover:bg-gray-100 h-auto py-4 flex-col gap-2">
              <Target className="h-5 w-5" />
              <span className="text-xs">Nova Meta</span>
            </Button>
          </div>
          
          <Button onClick={() => setShowBulkImport(true)} className="w-full bg-black hover:bg-gray-800 text-white h-auto py-3 flex items-center justify-center gap-2">
            <Plus className="h-5 w-5" />
            <span>Importar Mês Completo</span>
          </Button>
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

        {/* Sale Form Dialog */}
        <Dialog open={showSaleForm} onOpenChange={setShowSaleForm}>
          <DialogContent className="border-black">
            <DialogHeader>
              <DialogTitle className="text-black">Nova Venda</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createSaleMutation.mutate({ ...saleFormData, total_amount: calculateSale.total, total_cost: calculateSale.cost, profit: calculateSale.profit, profit_margin: calculateSale.margin }); }} className="space-y-4">
              <div>
                <Label className="text-black">Produto*</Label>
                <Select value={saleFormData.product_id} onValueChange={handleProductChange}>
                  <SelectTrigger className="border-black">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.filter(p => p.active).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} (Est: {p.stock_quantity})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Quantidade*</Label>
                  <Input type="number" min="1" value={saleFormData.quantity || ''} onChange={(e) => setSaleFormData({...saleFormData, quantity: parseInt(e.target.value)})} className="border-black" required />
                </div>
                <div>
                  <Label className="text-black">Preço Unitário*</Label>
                  <Input type="number" step="0.01" value={saleFormData.unit_price || ''} onChange={(e) => setSaleFormData({...saleFormData, unit_price: parseFloat(e.target.value)})} className="border-black" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Data*</Label>
                  <Input type="date" value={saleFormData.sale_date || ''} onChange={(e) => setSaleFormData({...saleFormData, sale_date: e.target.value})} className="border-black" required />
                </div>
                <div>
                  <Label className="text-black">Pagamento</Label>
                  <Select value={saleFormData.payment_method} onValueChange={(v) => setSaleFormData({...saleFormData, payment_method: v})}>
                    <SelectTrigger className="border-black">
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="credit_card">Cartão Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão Débito</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-black">Cliente</Label>
                <Input value={saleFormData.customer_name || ''} onChange={(e) => setSaleFormData({...saleFormData, customer_name: e.target.value})} className="border-black" />
              </div>
              <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total</span>
                  <span className="font-bold text-black">R$ {calculateSale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lucro</span>
                  <span className="font-bold text-black">R$ {calculateSale.profit.toFixed(2)} ({calculateSale.margin.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowSaleForm(false)} className="border-black">Cancelar</Button>
                <Button type="submit" className="bg-black hover:bg-gray-800">Registrar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Product Form Dialog */}
        <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
          <DialogContent className="border-black max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-black">Novo Produto</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createProductMutation.mutate(productFormData); }} className="space-y-4">
              <div>
                <Label className="text-black">Nome*</Label>
                <Input value={productFormData.name || ''} onChange={(e) => setProductFormData({...productFormData, name: e.target.value})} className="border-black" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Preço Venda*</Label>
                  <Input type="number" step="0.01" value={productFormData.product_price || ''} onChange={(e) => setProductFormData({...productFormData, product_price: parseFloat(e.target.value)})} className="border-black" required />
                </div>
                <div>
                  <Label className="text-black">Custo Produto*</Label>
                  <Input type="number" step="0.01" value={productFormData.product_cost || ''} onChange={(e) => setProductFormData({...productFormData, product_cost: parseFloat(e.target.value)})} className="border-black" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Embalagem</Label>
                  <Input type="number" step="0.01" value={productFormData.packaging_cost || ''} onChange={(e) => setProductFormData({...productFormData, packaging_cost: parseFloat(e.target.value)})} className="border-black" />
                </div>
                <div>
                  <Label className="text-black">Frete</Label>
                  <Input type="number" step="0.01" value={productFormData.shipping_cost || ''} onChange={(e) => setProductFormData({...productFormData, shipping_cost: parseFloat(e.target.value)})} className="border-black" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Estoque</Label>
                  <Input type="number" value={productFormData.stock_quantity || ''} onChange={(e) => setProductFormData({...productFormData, stock_quantity: parseInt(e.target.value)})} className="border-black" />
                </div>
                <div>
                  <Label className="text-black">Alerta Mínimo</Label>
                  <Input type="number" value={productFormData.min_stock_alert || ''} onChange={(e) => setProductFormData({...productFormData, min_stock_alert: parseInt(e.target.value)})} className="border-black" />
                </div>
              </div>
              <div>
                <Label className="text-black">Link Compra</Label>
                <Input type="url" value={productFormData.purchase_link || ''} onChange={(e) => setProductFormData({...productFormData, purchase_link: e.target.value})} className="border-black" placeholder="https://..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowProductForm(false)} className="border-black">Cancelar</Button>
                <Button type="submit" className="bg-black hover:bg-gray-800">Criar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Expense Form Dialog */}
        <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
          <DialogContent className="border-black">
            <DialogHeader>
              <DialogTitle className="text-black">Novo Gasto</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createExpenseMutation.mutate(expenseFormData); }} className="space-y-4">
              <div>
                <Label className="text-black">Descrição*</Label>
                <Input value={expenseFormData.description || ''} onChange={(e) => setExpenseFormData({...expenseFormData, description: e.target.value})} className="border-black" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Categoria*</Label>
                  <Select value={expenseFormData.category} onValueChange={(v) => setExpenseFormData({...expenseFormData, category: v})} required>
                    <SelectTrigger className="border-black">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="shipping">Frete</SelectItem>
                      <SelectItem value="packaging">Embalagem</SelectItem>
                      <SelectItem value="platform_fees">Taxas</SelectItem>
                      <SelectItem value="taxes">Impostos</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-black">Valor*</Label>
                  <Input type="number" step="0.01" value={expenseFormData.amount || ''} onChange={(e) => setExpenseFormData({...expenseFormData, amount: parseFloat(e.target.value)})} className="border-black" required />
                </div>
              </div>
              <div>
                <Label className="text-black">Data*</Label>
                <Input type="date" value={expenseFormData.expense_date || ''} onChange={(e) => setExpenseFormData({...expenseFormData, expense_date: e.target.value})} className="border-black" required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowExpenseForm(false)} className="border-black">Cancelar</Button>
                <Button type="submit" className="bg-black hover:bg-gray-800">Criar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Goal Form Dialog */}
        <Dialog open={showGoalForm} onOpenChange={setShowGoalForm}>
          <DialogContent className="border-black">
            <DialogHeader>
              <DialogTitle className="text-black">Nova Meta</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createGoalMutation.mutate(goalFormData); }} className="space-y-4">
              <div>
                <Label className="text-black">Métrica*</Label>
                <Select value={goalFormData.metric_type} onValueChange={(v) => setGoalFormData({...goalFormData, metric_type: v})} required>
                  <SelectTrigger className="border-black">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Faturamento (R$)</SelectItem>
                    <SelectItem value="profit">Lucro (R$)</SelectItem>
                    <SelectItem value="sales_count">Vendas (qtd)</SelectItem>
                    <SelectItem value="profit_margin">Margem (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Período*</Label>
                  <Select value={goalFormData.period} onValueChange={(v) => setGoalFormData({...goalFormData, period: v})} required>
                    <SelectTrigger className="border-black">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-black">Valor Alvo*</Label>
                  <Input type="number" step="0.01" value={goalFormData.target_value || ''} onChange={(e) => setGoalFormData({...goalFormData, target_value: parseFloat(e.target.value)})} className="border-black" required />
                </div>
              </div>
              <div>
                <Label className="text-black">Início*</Label>
                <Input type="date" value={goalFormData.start_date || ''} onChange={(e) => setGoalFormData({...goalFormData, start_date: e.target.value})} className="border-black" required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowGoalForm(false)} className="border-black">Cancelar</Button>
                <Button type="submit" className="bg-black hover:bg-gray-800">Criar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Bulk Import Dialog */}
        <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
          <DialogContent className="border-black max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-black">Importar Mês Completo</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); bulkImportMutation.mutate(bulkData); }} className="space-y-4">
              <div>
                <Label className="text-black">Mês de Referência*</Label>
                <Input type="month" value={bulkData.month} onChange={(e) => setBulkData({...bulkData, month: e.target.value})} className="border-black" required />
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-black mb-3">Vendas do Período</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-black">Faturamento Total (R$)*</Label>
                    <Input type="number" step="0.01" value={bulkData.total_revenue} onChange={(e) => setBulkData({...bulkData, total_revenue: e.target.value})} className="border-black" placeholder="0.00" required />
                  </div>
                  <div>
                    <Label className="text-black">Quantidade de Vendas*</Label>
                    <Input type="number" value={bulkData.total_sales_count} onChange={(e) => setBulkData({...bulkData, total_sales_count: e.target.value})} className="border-black" placeholder="0" required />
                  </div>
                  <div>
                    <Label className="text-black">Margem de Lucro Média (%)</Label>
                    <Input type="number" step="0.1" value={bulkData.avg_profit_margin} onChange={(e) => setBulkData({...bulkData, avg_profit_margin: e.target.value})} className="border-black" placeholder="0.0" />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-black mb-3">Gastos do Período</h3>
                <div>
                  <Label className="text-black">Total de Gastos (R$)</Label>
                  <Input type="number" step="0.01" value={bulkData.total_expenses} onChange={(e) => setBulkData({...bulkData, total_expenses: e.target.value})} className="border-black" placeholder="0.00" />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-2">
                <div className="text-sm font-semibold text-black">Resumo</div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Faturamento</span>
                  <span className="font-bold text-black">R$ {parseFloat(bulkData.total_revenue || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gastos</span>
                  <span className="font-bold text-black">R$ {parseFloat(bulkData.total_expenses || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-300 pt-2">
                  <span className="text-gray-600">Lucro Estimado</span>
                  <span className="font-bold text-black">R$ {(parseFloat(bulkData.total_revenue || 0) * (parseFloat(bulkData.avg_profit_margin || 0) / 100) - parseFloat(bulkData.total_expenses || 0)).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowBulkImport(false)} className="border-black">Cancelar</Button>
                <Button type="submit" className="bg-black hover:bg-gray-800">Importar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
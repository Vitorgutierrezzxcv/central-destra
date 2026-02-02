import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShoppingCart } from "lucide-react";
import { format } from "date-fns";

export default function PiermontSales() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    sale_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'completed'
  });

  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date'),
  });

  const createSaleMutation = useMutation({
    mutationFn: async (saleData) => {
      const sale = await base44.entities.Sale.create(saleData);
      // Baixa do estoque
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
      setShowForm(false);
      setFormData({ sale_date: format(new Date(), 'yyyy-MM-dd'), status: 'completed' });
    },
  });

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData({
        ...formData,
        product_id: productId,
        product_name: product.name,
        unit_price: product.product_price,
      });
    }
  };

  const calculateSale = useMemo(() => {
    const quantity = formData.quantity || 0;
    const unitPrice = formData.unit_price || 0;
    const product = products.find(p => p.id === formData.product_id);
    
    if (!product) return { total: 0, cost: 0, profit: 0, margin: 0 };

    const totalAmount = quantity * unitPrice;
    const totalCost = quantity * ((product.product_cost || 0) + (product.packaging_cost || 0) + (product.shipping_cost || 0));
    const profit = totalAmount - totalCost;
    const margin = totalAmount > 0 ? (profit / totalAmount) * 100 : 0;

    return { total: totalAmount, cost: totalCost, profit, margin };
  }, [formData, products]);

  const handleSubmit = (e) => {
    e.preventDefault();
    createSaleMutation.mutate({
      ...formData,
      total_amount: calculateSale.total,
      total_cost: calculateSale.cost,
      profit: calculateSale.profit,
      profit_margin: calculateSale.margin,
    });
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-black pb-4 mb-6">
          <h1 className="text-3xl font-bold text-black">Vendas</h1>
          <Button onClick={() => setShowForm(true)} className="bg-black hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Button>
        </div>

        {/* Sales List */}
        <div className="space-y-3">
          {sales.map(sale => (
            <Card key={sale.id} className="border-black">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-bold text-black">{sale.product_name}</div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(sale.sale_date), 'dd/MM/yyyy')} • {sale.quantity} un • {sale.payment_method}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 text-xs">Total</div>
                      <div className="font-bold text-black">R$ {sale.total_amount?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs">Lucro</div>
                      <div className="font-bold text-black">R$ {sale.profit?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs">Margem</div>
                      <div className="font-bold text-black">{sale.profit_margin?.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="border-black">
            <DialogHeader>
              <DialogTitle className="text-black">Nova Venda</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-black">Produto*</Label>
                <Select value={formData.product_id} onValueChange={handleProductChange}>
                  <SelectTrigger className="border-black">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.filter(p => p.active).map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (Estoque: {p.stock_quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Quantidade*</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                    className="border-black"
                    required
                  />
                </div>
                <div>
                  <Label className="text-black">Preço Unitário*</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.unit_price || ''}
                    onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value)})}
                    className="border-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Data*</Label>
                  <Input
                    type="date"
                    value={formData.sale_date || ''}
                    onChange={(e) => setFormData({...formData, sale_date: e.target.value})}
                    className="border-black"
                    required
                  />
                </div>
                <div>
                  <Label className="text-black">Pagamento</Label>
                  <Select value={formData.payment_method} onValueChange={(v) => setFormData({...formData, payment_method: v})}>
                    <SelectTrigger className="border-black">
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-black">Cliente</Label>
                <Input
                  value={formData.customer_name || ''}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="border-black"
                />
              </div>

              {/* Preview */}
              <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total</span>
                  <span className="font-bold text-black">R$ {calculateSale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Custo</span>
                  <span className="text-gray-600">R$ {calculateSale.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-300 pt-2">
                  <span className="font-bold text-black">Lucro</span>
                  <span className="font-bold text-black">R$ {calculateSale.profit.toFixed(2)} ({calculateSale.margin.toFixed(1)}%)</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-black">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-black hover:bg-gray-800">
                  Registrar Venda
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
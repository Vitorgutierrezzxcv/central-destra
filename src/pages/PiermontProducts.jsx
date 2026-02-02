import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Edit, AlertTriangle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PiermontProducts() {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({});
  const [filter, setFilter] = useState("all");

  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
      setEditingProduct(null);
      setFormData({});
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openForm = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({ active: true, stock_quantity: 0 });
    }
    setShowForm(true);
  };

  const filteredProducts = products.filter(p => {
    if (filter === "low_stock") return p.stock_quantity <= (p.min_stock_alert || 0);
    if (filter === "active") return p.active;
    if (filter === "inactive") return !p.active;
    return true;
  });

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-black pb-4 mb-6">
          <h1 className="text-3xl font-bold text-black">Produtos</h1>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40 border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="low_stock">Estoque Baixo</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => openForm()} className="bg-black hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => {
            const margin = product.product_price > 0 
              ? (((product.product_price - product.product_cost - (product.packaging_cost || 0) - (product.shipping_cost || 0)) / product.product_price) * 100)
              : 0;
            const isLowStock = product.stock_quantity <= (product.min_stock_alert || 0);

            return (
              <Card key={product.id} className="border-black">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-black text-lg">{product.name}</CardTitle>
                      {product.sku && <div className="text-xs text-gray-500 mt-1">SKU: {product.sku}</div>}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openForm(product)}
                      className="hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Preço</span>
                    <span className="font-bold text-black">R$ {product.product_price?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Custo Total</span>
                    <span className="text-black">
                      R$ {((product.product_cost || 0) + (product.packaging_cost || 0) + (product.shipping_cost || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Margem</span>
                    <span className={`font-bold ${margin > 30 ? 'text-black' : 'text-gray-500'}`}>
                      {margin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Estoque</span>
                    <div className="flex items-center gap-2">
                      {isLowStock && <AlertTriangle className="h-4 w-4 text-black" />}
                      <span className={`font-bold ${isLowStock ? 'text-black' : 'text-gray-600'}`}>
                        {product.stock_quantity} un
                      </span>
                    </div>
                  </div>
                  {product.purchase_link && (
                    <Button 
                      asChild
                      variant="outline" 
                      size="sm" 
                      className="w-full border-black hover:bg-gray-100"
                    >
                      <a href={product.purchase_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Link de Compra
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="border-black max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-black">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Nome*</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="border-black"
                    required
                  />
                </div>
                <div>
                  <Label className="text-black">SKU</Label>
                  <Input
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    className="border-black"
                  />
                </div>
              </div>

              <div>
                <Label className="text-black">Categoria</Label>
                <Input
                  value={formData.category || ''}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Preço de Venda*</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.product_price || ''}
                    onChange={(e) => setFormData({...formData, product_price: parseFloat(e.target.value)})}
                    className="border-black"
                    required
                  />
                </div>
                <div>
                  <Label className="text-black">Custo do Produto*</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.product_cost || ''}
                    onChange={(e) => setFormData({...formData, product_cost: parseFloat(e.target.value)})}
                    className="border-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Custo Embalagem</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.packaging_cost || ''}
                    onChange={(e) => setFormData({...formData, packaging_cost: parseFloat(e.target.value)})}
                    className="border-black"
                  />
                </div>
                <div>
                  <Label className="text-black">Custo Frete</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.shipping_cost || ''}
                    onChange={(e) => setFormData({...formData, shipping_cost: parseFloat(e.target.value)})}
                    className="border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Estoque Atual</Label>
                  <Input
                    type="number"
                    value={formData.stock_quantity || ''}
                    onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value)})}
                    className="border-black"
                  />
                </div>
                <div>
                  <Label className="text-black">Alerta Mínimo</Label>
                  <Input
                    type="number"
                    value={formData.min_stock_alert || ''}
                    onChange={(e) => setFormData({...formData, min_stock_alert: parseInt(e.target.value)})}
                    className="border-black"
                  />
                </div>
              </div>

              <div>
                <Label className="text-black">Link de Compra</Label>
                <Input
                  type="url"
                  value={formData.purchase_link || ''}
                  onChange={(e) => setFormData({...formData, purchase_link: e.target.value})}
                  className="border-black"
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label className="text-black">Fornecedor</Label>
                <Input
                  value={formData.supplier || ''}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  className="border-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-black">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-black hover:bg-gray-800">
                  {editingProduct ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
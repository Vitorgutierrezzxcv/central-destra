import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, Wallet, ArrowUpCircle, ArrowDownCircle, Filter, TrendingUp, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatePresence } from "framer-motion";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import TransactionForm from "../components/finance/TransactionForm";
import TransactionCard from "../components/finance/TransactionCard";

export default function Lancamentos() {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [defaultType, setDefaultType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.FinancialTransaction.list('-date'),
    initialData: []
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    initialData: []
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
    initialData: []
  });

  const createTransactionMutation = useMutation({
    mutationFn: (transactionData) => base44.entities.FinancialTransaction.create(transactionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowForm(false);
      setEditingTransaction(null);
      setDefaultType(null);
    }
  });

  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, transactionData }) => base44.entities.FinancialTransaction.update(id, transactionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowForm(false);
      setEditingTransaction(null);
      setDefaultType(null);
    }
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (id) => base44.entities.FinancialTransaction.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  const handleSubmit = (transactionData) => {
    if (editingTransaction) {
      updateTransactionMutation.mutate({ id: editingTransaction.id, transactionData });
    } else {
      createTransactionMutation.mutate(transactionData);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = (transactionId) => {
    if (window.confirm('Tem certeza que deseja excluir este lançamento?')) {
      deleteTransactionMutation.mutate(transactionId);
    }
  };

  const handleNewTransaction = (type) => {
    setDefaultType(type);
    setEditingTransaction(null);
    setShowForm(true);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const typeMatch = filterType === "all" || transaction.type === filterType;
    const categoryMatch = filterCategory === "all" || transaction.category === filterCategory;
    const statusMatch = filterStatus === "all" || transaction.status === filterStatus;
    const searchMatch = !searchTerm ||
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return typeMatch && categoryMatch && statusMatch && searchMatch;
  });

  // Calculate totals
  const totalIncome = transactions.
  filter((t) => t.type === 'income' && t.status === 'completed').
  reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = transactions.
  filter((t) => t.type === 'expense' && t.status === 'completed').
  reduce((sum, t) => sum + (t.amount || 0), 0);

  const balance = totalIncome - totalExpense;

  // Current month totals
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthTransactions = transactions.filter((t) => {
    if (!t.date) return false;
    const tDate = parseISO(t.date);
    return tDate >= monthStart && tDate <= monthEnd && t.status === 'completed';
  });

  const monthIncome = monthTransactions.
  filter((t) => t.type === 'income').
  reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthExpense = monthTransactions.
  filter((t) => t.type === 'expense').
  reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg">
              <Wallet className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">Lançamentos Financeiros</h1>
              <p className="text-sm md:text-base text-slate-600">
                {transactions.length} lançamento{transactions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
              <Input
                placeholder="Buscar lançamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 md:pl-10 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm h-10 md:h-11 text-sm md:text-base rounded-full" />

            </div>
            <Button
              onClick={() => handleNewTransaction('income')}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg rounded-full h-10 md:h-11 px-6">

              <ArrowUpCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              <span className="text-sm md:text-base font-medium">Nova Entrada</span>
            </Button>
            <Button
              onClick={() => handleNewTransaction('expense')}
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-lg rounded-full h-10 md:h-11 px-6">

              <ArrowDownCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              <span className="text-sm md:text-base font-medium">Nova Saída</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="bg-gradient-to-br from-green-100 to-emerald-200 border-none shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-2">
                <div className="bg-white/80 rounded-xl p-2 md:p-3 shadow-md">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl md:text-4xl font-bold text-green-600">
                    R$ {monthIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              <p className="text-slate-700 font-medium text-xs md:text-sm">Entradas do Mês</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-100 to-rose-200 border-none shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-2">
                <div className="bg-white/80 rounded-xl p-2 md:p-3 shadow-md">
                  <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl md:text-4xl font-bold text-red-600">
                    R$ {monthExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              <p className="text-slate-700 font-medium text-xs md:text-sm">Saídas do Mês</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-100 to-indigo-200 border-none shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-2">
                <div className="bg-white/80 rounded-xl p-2 md:p-3 shadow-md">
                  <Wallet className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-2xl md:text-4xl font-bold text-blue-600">
                    R$ {(monthIncome - monthExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              <p className="text-slate-700 font-medium text-xs md:text-sm">Saldo do Mês</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${balance >= 0 ? 'from-purple-100 to-pink-200' : 'from-orange-100 to-amber-200'} border-none shadow-lg`}>
            <CardContent className="mx-1 p-4 md:p-6">
              <div className="flex items-start justify-between mb-2">
                <div className="bg-white/80 rounded-xl p-2 md:p-3 shadow-md">
                  <Wallet className={`w-5 h-5 md:w-6 md:h-6 ${balance >= 0 ? 'text-purple-600' : 'text-orange-600'}`} />
                </div>
                <div className="text-right">
                  <div className={`text-2xl md:text-4xl font-bold ${balance >= 0 ? 'text-purple-600' : 'text-orange-600'}`}>
                    R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              <p className="text-slate-700 font-medium text-xs md:text-sm">Saldo Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Form */}
        <AnimatePresence>
          {showForm &&
          <TransactionForm
            transaction={editingTransaction}
            defaultType={defaultType}
            companies={companies}
            projects={projects}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingTransaction(null);
              setDefaultType(null);
            }}
            isLoading={createTransactionMutation.isPending || updateTransactionMutation.isPending} />

          }
        </AnimatePresence>

        {/* Filters */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-md border-slate-200 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="income">Entrada</SelectItem>
                  <SelectItem value="expense">Saída</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  <SelectItem value="sale">Venda</SelectItem>
                  <SelectItem value="service">Serviço</SelectItem>
                  <SelectItem value="transport">Transporte</SelectItem>
                  <SelectItem value="tax">Imposto</SelectItem>
                  <SelectItem value="tools">Ferramentas</SelectItem>
                  <SelectItem value="salary">Salário</SelectItem>
                  <SelectItem value="rent">Aluguel</SelectItem>
                  <SelectItem value="utilities">Utilidades</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        {isLoading ?
        <div className="text-center py-12">
            <p className="text-slate-600">Carregando lançamentos...</p>
          </div> :
        filteredTransactions.length > 0 ?
        <div className="space-y-4">
            <AnimatePresence>
              {filteredTransactions.map((transaction) =>
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              companies={companies}
              projects={projects}
              onEdit={handleEdit}
              onDelete={handleDelete} />

            )}
            </AnimatePresence>
          </div> :

        <div className="text-center py-16">
            <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {searchTerm || filterType !== "all" || filterCategory !== "all" || filterStatus !== "all" ?
            'Nenhum lançamento encontrado' :
            'Nenhum lançamento ainda'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || filterType !== "all" || filterCategory !== "all" || filterStatus !== "all" ?
            'Tente ajustar os filtros' :
            'Registre seu primeiro lançamento financeiro'}
            </p>
          </div>
        }
      </div>
    </div>);

}
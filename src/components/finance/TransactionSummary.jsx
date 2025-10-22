import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

export default function TransactionSummary({ totalIncome, totalExpense, balance }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="bg-gradient-to-br from-green-100 to-emerald-200 border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white/80 rounded-2xl p-3 shadow-md">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-green-600">
                R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <p className="text-slate-700 font-medium">Total de Entradas</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-100 to-rose-200 border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white/80 rounded-2xl p-3 shadow-md">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-red-600">
                R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <p className="text-slate-700 font-medium">Total de Saídas</p>
        </CardContent>
      </Card>

      <Card className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-100 to-indigo-200' : 'from-orange-100 to-amber-200'} border-none shadow-lg`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white/80 rounded-2xl p-3 shadow-md">
              <Wallet className={`w-6 h-6 ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <p className="text-slate-700 font-medium">Saldo</p>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from "react";
import {
  ChevronDown, ChevronUp, Lightbulb, CheckCircle2, AlertCircle,
  Users, Shield, Mail, Link2, Zap
} from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * PAINEL DE ORIENTAÇÃO INTERATIVO
 * 
 * Este componente exibe um guia passo-a-passo para o funcionário entender
 * como gerenciar acessos de clientes. Cada passo é expandível e contém
 * exemplos práticos e dicas importantes.
 */
export default function AccessGuidePanel() {
  const [expandedStep, setExpandedStep] = useState(0);

  const steps = [
    {
      num: 1,
      icon: Users,
      title: "Criar um Contato do Cliente",
      description: "Adicione uma pessoa da empresa cliente ao sistema",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            Clique no botão <strong>"Novo Contato"</strong> e preencha os dados:
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span>
              <span><strong>Nome:</strong> Nome completo da pessoa (ex: João Silva)</span>
            </li>
            <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span>
              <span><strong>Email:</strong> Email de acesso (ex: joao@empresa.com)</span>
            </li>
            <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span>
              <span><strong>Empresa:</strong> Selecione qual empresa este contato pertence</span>
            </li>
            <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span>
              <span><strong>Projetos:</strong> Escolha quais projetos ele pode acessar</span>
            </li>
            <li className="flex gap-2"><span className="text-blue-600 font-bold">•</span>
              <span><strong>Nível de Acesso:</strong> Escolha se pode apenas ver ou também aprovar</span>
            </li>
          </ul>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex gap-2">
            <Lightbulb className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700">
              <strong>Dica:</strong> O contato será criado em status "Rascunho". Você poderá editá-lo depois se precisar.
            </p>
          </div>
        </div>
      )
    },
    {
      num: 2,
      icon: Shield,
      title: "Definir Nível de Acesso",
      description: "Escolha o que cada pessoa pode fazer no portal",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            Existem <strong>2 níveis de acesso</strong>:
          </p>
          <div className="space-y-2">
            <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-1">👁️ Visualizador</p>
              <p className="text-xs text-blue-800">Pode ver projetos, tarefas, files e comentar. Ideal para gerentes e coordenadores.</p>
            </div>
            <div className="p-3 border border-purple-200 bg-purple-50 rounded-lg">
              <p className="text-sm font-semibold text-purple-900 mb-1">✅ Aprovador</p>
              <p className="text-xs text-purple-800">Pode fazer tudo do Visualizador + aprovar entregas e fazer avaliações. Ideal para gerentes sênior.</p>
            </div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              <strong>Importante:</strong> Só aprove acesso de aprovação para pessoas autorizadas da empresa cliente.
            </p>
          </div>
        </div>
      )
    },
    {
      num: 3,
      icon: Mail,
      title: "Enviar Convite de Ativação",
      description: "O cliente receberá um link para ativar sua conta",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            Após criar o contato, clique em <strong>"Enviar Convite"</strong>:
          </p>
          <ul className="space-y-2 text-sm text-slate-600 ml-2">
            <li>1️⃣ Um email será enviado para o cliente com um link de ativação</li>
            <li>2️⃣ O cliente clica no link e cria uma senha</li>
            <li>3️⃣ A conta fica ativa e o cliente pode acessar o portal</li>
          </ul>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700 font-mono bg-white p-2 rounded border border-blue-100 break-all">
              Nome do contato → Status "Ativo" ✓
            </p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              <strong>Atenção:</strong> Só envie convite se todos os projetos já estiverem vinculados ao contato.
            </p>
          </div>
        </div>
      )
    },
    {
      num: 4,
      icon: Zap,
      title: "Gerenciar Acessos Ativos",
      description: "Ativar, desativar ou modificar acessos em tempo real",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            Você pode gerenciar acessos mesmo após criar:
          </p>
          <ul className="space-y-2 text-sm text-slate-600 ml-2">
            <li>✏️ <strong>Editar:</strong> Clique no ícone de editar para mudar dados do contato</li>
            <li>🔄 <strong>Ativar/Desativar:</strong> Use o botão ativa/desativa para bloquear acesso sem apagar</li>
            <li>➕ <strong>Adicionar Projeto:</strong> Expanda o contato e clique "Adicionar" para liberar novo projeto</li>
            <li>❌ <strong>Remover Acesso:</strong> Clique na lixeira para remover acesso a um projeto específico</li>
            <li>🗑️ <strong>Apagar Tudo:</strong> Delete o contato completamente (será pedida confirmação)</li>
          </ul>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex gap-2">
            <Lightbulb className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700">
              <strong>Dica:</strong> Prefira desativar a apagar. Assim você mantém o histórico e pode reativar depois.
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50/50">
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Guia de Gestão de Acessos</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Siga estes passos para adicionar e gerenciar clientes no portal
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {steps.map((step, idx) => {
            const StepIcon = step.icon;
            const isExpanded = expandedStep === idx;
            return (
              <button
                key={idx}
                onClick={() => setExpandedStep(isExpanded ? -1 : idx)}
                className="w-full text-left"
              >
                <div className="flex items-center gap-3 p-3 bg-white border border-blue-100 rounded-xl hover:bg-blue-50/50 transition-colors">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex-shrink-0">
                    {step.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{step.title}</p>
                    <p className="text-xs text-slate-500 truncate">{step.description}</p>
                  </div>
                  <StepIcon className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-2 p-4 bg-white border border-t-0 border-blue-100 rounded-b-xl text-slate-700">
                    {step.content}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600">
            <strong>Dúvidas?</strong> Cada campo tem um ícone ℹ️ que explica o que fazer. Passe o mouse para aprender mais.
          </p>
        </div>
      </div>
    </Card>
  );
}
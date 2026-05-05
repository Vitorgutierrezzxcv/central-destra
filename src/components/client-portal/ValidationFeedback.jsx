import React from "react";
import {
  AlertCircle, CheckCircle2, Lightbulb, Info, AlertTriangle, XCircle
} from "lucide-react";

/**
 * COMPONENTE DE FEEDBACK DE VALIDAÇÃO
 * 
 * Mostra mensagens educativas quando há problemas ou quando o usuário
 * está fazendo algo certo. Não é só um "erro", é uma oportunidade de aprender.
 */
export const ValidationMessage = ({ type = "error", title, description, suggestion }) => {
  const configs = {
    error: {
      icon: AlertTriangle,
      bg: "bg-red-50",
      border: "border-red-200",
      textTitle: "text-red-900",
      textDesc: "text-red-700",
      iconColor: "text-red-600"
    },
    warning: {
      icon: AlertCircle,
      bg: "bg-amber-50",
      border: "border-amber-200",
      textTitle: "text-amber-900",
      textDesc: "text-amber-700",
      iconColor: "text-amber-600"
    },
    success: {
      icon: CheckCircle2,
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      textTitle: "text-emerald-900",
      textDesc: "text-emerald-700",
      iconColor: "text-emerald-600"
    },
    info: {
      icon: Info,
      bg: "bg-blue-50",
      border: "border-blue-200",
      textTitle: "text-blue-900",
      textDesc: "text-blue-700",
      iconColor: "text-blue-600"
    },
    tip: {
      icon: Lightbulb,
      bg: "bg-purple-50",
      border: "border-purple-200",
      textTitle: "text-purple-900",
      textDesc: "text-purple-700",
      iconColor: "text-purple-600"
    }
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <div className={`${config.bg} border ${config.border} rounded-xl p-3 flex gap-3`}>
      <Icon className={`w-4 h-4 ${config.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {title && <p className={`text-sm font-semibold ${config.textTitle}`}>{title}</p>}
        {description && <p className={`text-xs ${config.textDesc} mt-${title ? "1" : "0"}`}>{description}</p>}
        {suggestion && (
          <div className={`text-xs ${config.textDesc} mt-2 pl-3 border-l-2 ${config.border.replace("border-", "border-l-")}`}>
            <strong>💡 Como resolver:</strong> {suggestion}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * VALIDADOR DE FORMULÁRIO EDUCATIVO
 * 
 * Analisa os dados preenchidos e retorna feedback educativo
 * sobre o que está certo ou errado.
 */
export const getFormValidationFeedback = (form, selectedProjects, contactAccess) => {
  const issues = [];
  const tips = [];

  // ---- VALIDAÇÕES COM FEEDBACK EDUCATIVO ----

  if (!form.name || form.name.trim() === "") {
    issues.push({
      type: "error",
      field: "name",
      title: "Nome é obrigatório",
      description: "Todo contato precisa ter um nome para identificação.",
      suggestion: "Digite o nome completo da pessoa (ex: João Silva da Silva)"
    });
  }

  if (!form.email || form.email.trim() === "") {
    issues.push({
      type: "error",
      field: "email",
      title: "Email é obrigatório",
      description: "O email é como o cliente fará login no portal.",
      suggestion: "Digite um email válido no formato: usuario@empresa.com"
    });
  } else if (!form.email.includes("@") || !form.email.includes(".")) {
    issues.push({
      type: "error",
      field: "email",
      title: "Email inválido",
      description: "O email não tem o formato correto.",
      suggestion: "Use o formato correto: usuario@empresa.com ou usuario@empresa.com.br"
    });
  }

  if (!form.company_id) {
    issues.push({
      type: "error",
      field: "company_id",
      title: "Empresa não selecionada",
      description: "Você precisa informar qual empresa este contato pertence.",
      suggestion: "Clique no campo 'Empresa' e escolha uma da lista"
    });
  }

  if (form.company_id && selectedProjects.length === 0) {
    issues.push({
      type: "error",
      field: "projects",
      title: "Nenhum projeto selecionado",
      description: "O contato precisa ter acesso a pelo menos um projeto para usar o portal.",
      suggestion: "Marque a caixa ao lado de pelo menos um projeto na seção 'Projetos Liberados'"
    });
  }

  // ---- TIPS (DICAS) ----

  if (form.name && form.name.length < 3) {
    tips.push({
      type: "warning",
      title: "Nome muito curto",
      description: "Considere usar o nome completo para melhor identificação.",
      suggestion: "Ex: 'João Silva' em vez de apenas 'João'"
    });
  }

  if (form.phone && form.phone.length < 8) {
    tips.push({
      type: "info",
      title: "Telefone incompleto?",
      description: "O campo de telefone parece incompleto.",
      suggestion: "Use o formato (XX) 9XXXX-XXXX ou apenas deixe em branco se não souber"
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    tips,
    hasErrors: issues.filter(i => i.type === "error").length > 0
  };
};

/**
 * COMPONENTE QUE MOSTRA VALIDAÇÕES
 */
export const FormValidationDisplay = ({ validation }) => {
  if (!validation) return null;

  return (
    <div className="space-y-2">
      {validation.issues.map((issue, idx) => (
        <ValidationMessage
          key={`issue-${idx}`}
          type={issue.type}
          title={issue.title}
          description={issue.description}
          suggestion={issue.suggestion}
        />
      ))}
      {validation.tips.map((tip, idx) => (
        <ValidationMessage
          key={`tip-${idx}`}
          type={tip.type}
          title={tip.title}
          description={tip.description}
          suggestion={tip.suggestion}
        />
      ))}
    </div>
  );
};
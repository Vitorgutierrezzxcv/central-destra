import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, X, Upload, Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const segments = [
  "Tecnologia",
  "Varejo",
  "Serviços",
  "Indústria",
  "Saúde",
  "Educação",
  "Financeiro",
  "Construção",
  "Alimentação",
  "Transporte",
  "Agronegócio",
  "Outro"
];

export default function CompanyForm({ company, onSubmit, onCancel, isLoading }) {
  const [currentCompany, setCurrentCompany] = useState(company || {
    name: "",
    segment: "",
    logo_url: "",
    average_revenue: "",
    founded_year: new Date().getFullYear(),
    phone: "",
    email: "",
    address: "",
    status: "lead"
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentCompany.name.trim()) {
      const dataToSubmit = {
        ...currentCompany,
        average_revenue: currentCompany.average_revenue ? parseFloat(currentCompany.average_revenue) : null,
        founded_year: currentCompany.founded_year ? parseInt(currentCompany.founded_year) : null
      };
      onSubmit(dataToSubmit);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCurrentCompany({...currentCompany, logo_url: file_url});
    } catch (error) {
      alert('Erro ao fazer upload do logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const companyAge = currentCompany.founded_year ? new Date().getFullYear() - parseInt(currentCompany.founded_year) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl p-4 md:p-6 mb-6 md:mb-8 border border-[#EAEAEA]"
    >
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-semibold text-[#131A20]">
          {company ? 'Editar Empresa' : 'Nova Empresa'}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Logo Upload */}
        <div className="flex flex-col items-center gap-4 p-4 bg-[#EAEAEA] rounded-xl">
          <div className="relative">
            {currentCompany.logo_url ? (
              <img 
                src={currentCompany.logo_url} 
                alt="Logo" 
                className="w-24 h-24 md:w-32 md:h-32 rounded-xl object-cover border-4 border-white"
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-white flex items-center justify-center border-4 border-white">
                <Building2 className="w-12 h-12 md:w-16 md:h-16 text-[#456C8D]" />
              </div>
            )}
          </div>
          <Label
            htmlFor="logo-upload"
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#EAEAEA] text-[#131A20] rounded-lg transition-colors text-sm font-medium border border-[#EAEAEA]"
          >
            {uploadingLogo ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Logo
              </>
            )}
          </Label>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
            disabled={uploadingLogo}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name" className="text-sm font-medium">Nome da Empresa *</Label>
            <Input
              id="name"
              placeholder="Ex: Empresa XYZ Ltda"
              value={currentCompany.name}
              onChange={(e) => setCurrentCompany({...currentCompany, name: e.target.value})}
              required
              className="h-10 md:h-11 border-[#EAEAEA] focus:border-[#6FA6FF]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="segment" className="text-sm font-medium">Segmento *</Label>
            <Select
              value={currentCompany.segment}
              onValueChange={(value) => setCurrentCompany({...currentCompany, segment: value})}
            >
              <SelectTrigger id="segment" className="h-10 md:h-11 border-[#EAEAEA] focus:border-[#6FA6FF]">
                <SelectValue placeholder="Selecione o segmento" />
              </SelectTrigger>
              <SelectContent>
                {segments.map(seg => (
                  <SelectItem key={seg} value={seg}>{seg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">Status</Label>
            <Select
              value={currentCompany.status}
              onValueChange={(value) => setCurrentCompany({...currentCompany, status: value})}
            >
              <SelectTrigger id="status" className="h-10 md:h-11 border-[#EAEAEA] focus:border-[#6FA6FF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="average_revenue" className="text-sm font-medium">Faturamento Médio (R$)</Label>
            <Input
              id="average_revenue"
              type="number"
              step="0.01"
              placeholder="Ex: 50000.00"
              value={currentCompany.average_revenue}
              onChange={(e) => setCurrentCompany({...currentCompany, average_revenue: e.target.value})}
              className="h-10 md:h-11 border-[#EAEAEA] focus:border-[#6FA6FF]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="founded_year" className="text-sm font-medium">
              Ano de Fundação {companyAge > 0 && <span className="text-slate-500">({companyAge} anos)</span>}
            </Label>
            <Input
              id="founded_year"
              type="number"
              min="1800"
              max={new Date().getFullYear()}
              placeholder="Ex: 2020"
              value={currentCompany.founded_year}
              onChange={(e) => setCurrentCompany({...currentCompany, founded_year: e.target.value})}
              className="h-10 md:h-11 border-[#EAEAEA] focus:border-[#6FA6FF]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(11) 98765-4321"
              value={currentCompany.phone}
              onChange={(e) => setCurrentCompany({...currentCompany, phone: e.target.value})}
              className="h-10 md:h-11 border-[#EAEAEA] focus:border-[#6FA6FF]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="contato@empresa.com"
              value={currentCompany.email}
              onChange={(e) => setCurrentCompany({...currentCompany, email: e.target.value})}
              className="h-10 md:h-11 border-[#EAEAEA] focus:border-[#6FA6FF]"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address" className="text-sm font-medium">Endereço</Label>
            <Textarea
              id="address"
              placeholder="Rua, número, bairro, cidade - UF"
              value={currentCompany.address}
              onChange={(e) => setCurrentCompany({...currentCompany, address: e.target.value})}
              className="min-h-[80px] resize-none border-[#EAEAEA] focus:border-[#6FA6FF]"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto h-10 md:h-11"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading || uploadingLogo}
            className="w-full sm:w-auto bg-[#456C8D] hover:bg-[#131A20] text-white h-10 md:h-11"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {company ? 'Salvando...' : 'Criando...'}
              </>
            ) : (
              <>
                {company ? 'Salvar' : 'Criar Empresa'}
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Upload, LogOut, Loader2 } from "lucide-react";

export default function UserProfile() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    profile_photo_url: ""
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData) => {
      // Update user data
      await base44.auth.updateMe(userData);
      
      // Sync to UserProfile entity for public access
      const userProfiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      const profileData = {
        user_email: user.email,
        display_name: userData.display_name,
        full_name: user.full_name,
        profile_photo_url: userData.profile_photo_url || "",
        bio: userData.bio || ""
      };
      
      if (userProfiles.length > 0) {
        await base44.entities.UserProfile.update(userProfiles[0].id, profileData);
      } else {
        await base44.entities.UserProfile.create(profileData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
      setIsEditDialogOpen(false);
    },
  });

  const handleEditClick = () => {
    if (user) {
      setFormData({
        display_name: user.display_name || user.full_name || "",
        bio: user.bio || "",
        profile_photo_url: user.profile_photo_url || ""
      });
      setIsEditDialogOpen(true);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, profile_photo_url: file_url });
    } catch (error) {
      alert('Erro ao fazer upload da foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateUserMutation.mutate({
      display_name: formData.display_name.trim(),
      bio: formData.bio || "",
      profile_photo_url: formData.profile_photo_url || ""
    });
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (isLoading) {
    return (
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-24 mb-2 animate-pulse" />
            <div className="h-3 bg-slate-200 rounded w-32 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.display_name || user.full_name || "Usuário";
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="p-4 border-t border-slate-200 mt-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <Avatar className="w-10 h-10 border-2 border-slate-200">
              {user.profile_photo_url ? (
                <AvatarImage src={user.profile_photo_url} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate text-sm">
              {displayName}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEditClick}
            className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full text-slate-600 hover:text-red-600 hover:border-red-300"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Personalize seu nome de exibição, foto e biografia
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24 border-4 border-slate-200">
                  {formData.profile_photo_url ? (
                    <AvatarImage src={formData.profile_photo_url} alt="Preview" />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex flex-col items-center gap-2">
                  <Label
                    htmlFor="photo-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    {uploadingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Alterar Foto
                      </>
                    )}
                  </Label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  <p className="text-xs text-slate-500">
                    JPG, PNG ou GIF (máx. 5MB)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Nome de Exibição *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Como você quer ser chamado"
                  required
                />
                <p className="text-xs text-slate-500">
                  Este é o nome que aparecerá no sistema
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-600">
                  <strong>Email:</strong> {user.email}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  <strong>Nome Real:</strong> {user.full_name}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Email e nome real não podem ser alterados
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updateUserMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending || uploadingPhoto || !formData.display_name.trim()}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {updateUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
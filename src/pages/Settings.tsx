import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { api } from '../services/api';
import type { LLMConfig } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Settings as SettingsIcon, Trash2, Pencil, Check, Loader2, AlertCircle } from 'lucide-react';

interface FormState {
  name: string;
  base_url: string;
  api_key: string;
  model: string;
}

const emptyForm: FormState = {
  name: '',
  base_url: '',
  api_key: '',
  model: '',
};

export function Settings() {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<LLMConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const fetchConfigs = async () => {
    try {
      setError(null);
      const data = await api.listLLMConfigs();
      setConfigs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (config: LLMConfig) => {
    setEditingId(config.id);
    setForm({
      name: config.name,
      base_url: config.base_url,
      api_key: '',
      model: config.model,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.base_url.trim() || !form.model.trim()) return;

    setSaving(true);
    try {
      if (editingId) {
        const updateData: Partial<Omit<LLMConfig, 'id' | 'is_active' | 'created_at' | 'updated_at'>> = {
          name: form.name,
          base_url: form.base_url,
          model: form.model,
        };
        if (form.api_key.trim()) {
          updateData.api_key = form.api_key;
        }
        await api.updateLLMConfig(editingId, updateData);
      } else {
        await api.createLLMConfig({
          name: form.name,
          base_url: form.base_url,
          api_key: form.api_key,
          model: form.model,
        });
      }
      resetForm();
      await fetchConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      setError(null);
      await api.activateLLMConfig(id);
      await fetchConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('settings.confirmDelete'))) return;
    try {
      setError(null);
      await api.deleteLLMConfig(id);
      if (editingId === id) resetForm();
      await fetchConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="animate-fadeIn space-y-6 md:space-y-8">
      <div className="pb-4 border-b border-border-subtle">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary font-heading flex items-center gap-3">
          <SettingsIcon size={28} className="text-accent" />
          {t('settings.title')}
        </h1>
        <p className="text-text-tertiary text-sm mt-1">{t('settings.subtitle')}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-danger">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <Card hover={false}>
        <h2 className="text-base md:text-lg font-semibold text-text-secondary mb-5 font-heading">
          {editingId ? t('settings.editConfig') : t('settings.addConfig')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('settings.name')}</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t('settings.namePlaceholder')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('settings.model')}</label>
              <Input
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                placeholder={t('settings.modelPlaceholder')}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('settings.baseUrl')}</label>
              <Input
                value={form.base_url}
                onChange={(e) => setForm((f) => ({ ...f, base_url: e.target.value }))}
                placeholder={t('settings.baseUrlPlaceholder')}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('settings.apiKey')}</label>
              <Input
                type="password"
                value={form.api_key}
                onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                placeholder={t('settings.apiKeyPlaceholder')}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
              {t('settings.save')}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                {t('settings.cancel')}
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-text-secondary mb-5 font-heading">{t('settings.llmConfigs')}</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-text-tertiary py-8">
            <Loader2 className="animate-spin" size={18} />
            {t('settings.loading')}
          </div>
        ) : configs.length === 0 ? (
          <p className="text-text-tertiary py-8">{t('settings.empty')}</p>
        ) : (
          <div className="space-y-3">
            {configs.map((config) => (
              <Card key={config.id} hover={false} className={config.is_active ? 'ring-1 ring-accent/40' : ''}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-text-primary">{config.name}</span>
                      {config.is_active ? (
                        <Badge variant="accent">{t('settings.active')}</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-text-tertiary">{config.base_url}</p>
                    <p className="text-sm text-text-tertiary">{config.model}</p>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    {!config.is_active && (
                      <Button variant="secondary" size="sm" onClick={() => handleActivate(config.id)}>
                        <Check size={14} />
                        {t('settings.activate')}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleEdit(config)}>
                      <Pencil size={14} />
                      {t('settings.edit')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(config.id)}>
                      <Trash2 size={14} />
                      {t('settings.delete')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <p className="text-text-tertiary text-sm">{t('settings.fallbackNotice')}</p>
    </div>
  );
}

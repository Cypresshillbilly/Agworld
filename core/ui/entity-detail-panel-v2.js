(function (global) {
  'use strict';

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  class EntityDetailPanelV2 {
    constructor(options) {
      this.container = typeof options.container === 'string'
        ? document.querySelector(options.container)
        : options.container;
      this.relationshipRepository = options.relationshipRepository || null;
      this.entity = null;
      this.activeTab = 'overview';
      this.boundSelection = e => this.open(e.detail.entity);
      global.addEventListener('agworld:v2-entity-selected', this.boundSelection);
    }

    destroy() {
      global.removeEventListener('agworld:v2-entity-selected', this.boundSelection);
      if (this.container) this.container.innerHTML = '';
    }

    open(entity) {
      this.entity = entity;
      this.activeTab = 'overview';
      this.render();
    }

    close() {
      this.entity = null;
      if (this.container) this.container.innerHTML = '';
      global.dispatchEvent(new CustomEvent('agworld:v2-entity-panel-closed'));
    }

    tabs() {
      return [
        ['overview', 'Overview'],
        ['details', 'Details'],
        ['relationships', 'Relationships'],
        ['activity', 'Activity'],
        ['documents', 'Documents'],
        ['media', 'Media'],
        ['notes', 'Notes']
      ];
    }

    render() {
      if (!this.container || !this.entity) return;
      const entity = this.entity;
      this.container.innerHTML = `
        <section class="agworld-v2-detail-panel" data-entity-id="${esc(entity.id)}">
          <header class="agworld-v2-detail-header">
            <div>
              <div class="agworld-v2-entity-type">${esc(global.AGWorldV2.EntityTypes?.[entity.type]?.label || entity.type)}</div>
              <h2>${esc(entity.name)}</h2>
              <div class="agworld-v2-status">${esc(entity.status)}</div>
            </div>
            <button type="button" data-action="close" aria-label="Close">×</button>
          </header>
          <nav class="agworld-v2-detail-tabs">
            ${this.tabs().map(([key,label]) => `<button type="button" data-tab="${key}" class="${this.activeTab === key ? 'is-active' : ''}">${label}</button>`).join('')}
          </nav>
          <div class="agworld-v2-detail-content"></div>
        </section>`;

      this.container.querySelector('[data-action="close"]').addEventListener('click', () => this.close());
      this.container.querySelectorAll('[data-tab]').forEach(button => {
        button.addEventListener('click', () => {
          this.activeTab = button.dataset.tab;
          this.render();
        });
      });
      this.renderContent();

      // Runtime verification: make the active panel state observable without
      // showing a diagnostic window.
      global.__AGWORLD_ENTITY_PANEL_RUNTIME__ = {
        entityId: String(entity.id || ''),
        entityType: String(entity.type || ''),
        tabs: this.tabs().map(([key]) => key),
        activeTab: this.activeTab,
        renderedAt: Date.now()
      };
      global.dispatchEvent(new CustomEvent('agworld:entity-panel-rendered', {
        detail: global.__AGWORLD_ENTITY_PANEL_RUNTIME__
      }));
    }

    managementKey() {
      return 'agworld.entity-intelligence.' + String(this.entity?.type || 'entity') + '.' + String(this.entity?.id || 'unknown');
    }

    managementData() {
      let stored = {};
      try { stored = JSON.parse(localStorage.getItem(this.managementKey()) || '{}') || {}; } catch (_) {}
      const metadata = this.entity?.metadata || {};
      return {
        activity: Array.isArray(stored.activity) ? stored.activity : (Array.isArray(metadata.activity) ? metadata.activity : []),
        documents: Array.isArray(stored.documents) ? stored.documents : (Array.isArray(metadata.documents) ? metadata.documents : []),
        media: Array.isArray(stored.media) ? stored.media : (Array.isArray(metadata.media) ? metadata.media : []),
        notes: Array.isArray(stored.notes) ? stored.notes : (Array.isArray(metadata.notes) ? metadata.notes : []),
        metrics: stored.metrics || metadata.metrics || {}
      };
    }

    saveManagementData(data) {
      localStorage.setItem(this.managementKey(), JSON.stringify(data));
      global.dispatchEvent(new CustomEvent('agworld:entity-intelligence-updated', {
        detail: { entity: this.entity, data }
      }));
    }

    metricValues() {
      const data = this.managementData();
      const custom = data.metrics || {};
      const relationships = Number(custom.relationship ?? 0);
      const activity = Number(custom.activity ?? Math.min(100, data.activity.length * 15));
      const intelligence = Number(custom.intelligence ?? Math.min(100, (data.notes.length + data.documents.length + data.media.length) * 12));
      const opportunity = Number(custom.opportunity ?? 50);
      const risk = Number(custom.risk ?? 20);
      return {
        relationship: Math.max(0, Math.min(100, relationships)),
        activity: Math.max(0, Math.min(100, activity)),
        intelligence: Math.max(0, Math.min(100, intelligence)),
        opportunity: Math.max(0, Math.min(100, opportunity)),
        risk: Math.max(0, Math.min(100, risk))
      };
    }

    renderMetrics(target) {
      const metrics = this.metricValues();
      const labels = [['relationship','Relationship'],['activity','Activity'],['intelligence','Intelligence'],['opportunity','Opportunity'],['risk','Risk']];
      target.innerHTML = '<div class="agworld-intelligence-metrics">' +
        labels.map(([key,label]) => '<div class="agworld-metric-row"><div class="agworld-metric-head"><span>' + esc(label) + '</span><strong>' + metrics[key] + '%</strong></div><div class="agworld-metric-bar"><i style="width:' + metrics[key] + '%"></i></div></div>').join('') +
        '<button type="button" data-intel-action="edit-metrics">Edit metrics</button></div>';
      target.querySelector('[data-intel-action="edit-metrics"]')?.addEventListener('click', () => {
        target.innerHTML = '<form class="agworld-intelligence-form">' + labels.map(([key,label]) =>
          '<label>' + label + ' <input name="' + key + '" type="number" min="0" max="100" value="' + metrics[key] + '"></label>'
        ).join('') + '<div><button type="submit">Save metrics</button> <button type="button" data-intel-action="cancel">Cancel</button></div></form>';
        target.querySelector('[data-intel-action="cancel"]')?.addEventListener('click', () => this.renderMetrics(target));
        target.querySelector('form')?.addEventListener('submit', event => {
          event.preventDefault();
          const data = this.managementData();
          const form = new FormData(event.currentTarget);
          data.metrics = {};
          labels.forEach(([key]) => data.metrics[key] = Math.max(0, Math.min(100, Number(form.get(key) || 0))));
          this.saveManagementData(data);
          this.renderMetrics(target);
        });
      });
    }

    renderManagedCollection(target, key, emptyMessage, title) {
      const data = this.managementData();
      const items = Array.isArray(data[key]) ? data[key] : [];
      const label = title || key;
      target.innerHTML =
        '<div class="agworld-intelligence-toolbar"><strong>' + esc(label.toUpperCase()) + '</strong><button type="button" data-intel-action="add">+ Add</button></div>' +
        (items.length
          ? '<div class="agworld-intelligence-list">' + items.map((item, index) => {
              const text = typeof item === 'string' ? item : (item.text || item.title || item.name || JSON.stringify(item));
              const when = typeof item === 'object' && item.createdAt ? new Date(item.createdAt).toLocaleString() : '';
              return '<article class="agworld-intelligence-item"><div>' + esc(text) + '</div>' + (when ? '<small>' + esc(when) + '</small>' : '') + '<button type="button" data-intel-remove="' + index + '">Remove</button></article>';
            }).join('') + '</div>'
          : '<p>' + esc(emptyMessage) + '</p>');

      target.querySelector('[data-intel-action="add"]')?.addEventListener('click', () => {
        const placeholder = key === 'activity' ? 'Describe the activity…' : key === 'notes' ? 'Add an intelligence note…' : 'Enter title or description…';
        const existing = target.innerHTML;
        target.innerHTML = existing + '<form class="agworld-intelligence-add"><textarea name="text" rows="3" placeholder="' + esc(placeholder) + '" required></textarea><div><button type="submit">Save</button> <button type="button" data-intel-action="cancel-add">Cancel</button></div></form>';
        target.querySelector('[data-intel-action="cancel-add"]')?.addEventListener('click', () => this.renderManagedCollection(target, key, emptyMessage, title));
        target.querySelector('.agworld-intelligence-add')?.addEventListener('submit', event => {
          event.preventDefault();
          const text = String(new FormData(event.currentTarget).get('text') || '').trim();
          if (!text) return;
          const next = this.managementData();
          next[key] = [...(next[key] || []), { text, createdAt: new Date().toISOString() }];
          this.saveManagementData(next);
          this.renderManagedCollection(target, key, emptyMessage, title);
        });
      });

      target.querySelectorAll('[data-intel-remove]').forEach(button => button.addEventListener('click', () => {
        const index = Number(button.dataset.intelRemove);
        const next = this.managementData();
        next[key] = (next[key] || []).filter((_, i) => i !== index);
        this.saveManagementData(next);
        this.renderManagedCollection(target, key, emptyMessage, title);
      }));
    }

    renderContent() {
      const target = this.container.querySelector('.agworld-v2-detail-content');
      if (!target) return;
      const entity = this.entity;
      const metadata = entity.metadata || {};

      if (this.activeTab === 'overview') {
        target.innerHTML = `
          <p>${esc(entity.description || 'No overview has been added yet.')}</p>
          <dl>
            <dt>Territory</dt><dd>${esc((entity.territoryIds || []).join(', ') || 'Not assigned')}</dd>
            <dt>Status</dt><dd>${esc(entity.status)}</dd>
            <dt>Geometry</dt><dd>${esc(entity.geometry?.type || 'Not mapped')}</dd>
          </dl>`;
      } else if (this.activeTab === 'details') {
        const entries = Object.entries(metadata).filter(([key]) => !['documents','media','notes','activity'].includes(key));
        target.innerHTML = entries.length
          ? '<dl>' + entries.map(([key,value]) => `<dt>${esc(key.replace(/([A-Z])/g, ' $1'))}</dt><dd>${esc(Array.isArray(value) ? value.join(', ') : value)}</dd>`).join('') + '</dl>'
          : '<p>No additional details have been added yet.</p>';
      } else if (this.activeTab === 'relationships') {
        target.innerHTML = '<p>Loading relationships…</p>';
        this.loadRelationships(target);
      } else if (this.activeTab === 'activity') {
        this.renderManagedCollection(target, 'activity', 'No activity recorded yet.', 'Activity timeline');
      } else if (this.activeTab === 'documents') {
        this.renderManagedCollection(target, 'documents', 'No documents attached yet.', 'Documents');
      } else if (this.activeTab === 'media') {
        this.renderManagedCollection(target, 'media', 'No media attached yet.', 'Media');
      } else if (this.activeTab === 'notes') {
        this.renderManagedCollection(target, 'notes', 'No notes added yet.', 'Intelligence notes');
      }
    }

    renderCollection(target, collection, emptyMessage) {
      const items = Array.isArray(collection) ? collection : [];
      target.innerHTML = items.length
        ? '<ul>' + items.map(item => '<li>' + esc(typeof item === 'string' ? item : item.name || item.title || JSON.stringify(item)) + '</li>').join('') + '</ul>'
        : '<p>' + esc(emptyMessage) + '</p>';
    }

    relationshipValue(relationship, camel, snake) {
      return relationship?.[camel] ?? relationship?.[snake];
    }

    collectEntityOptions() {
      const options = [];
      const add = (id, type, name, raw) => {
        if (!id || String(id) === String(this.entity?.id)) return;
        options.push({ id: String(id), type, name: name || 'Unnamed entity', raw });
      };

      const world = global.AG_WORLD_WORLD || {};
      const farms = global.__AG_WORLD_FARMS || world.farms || world.getFarms?.() || [];
      (Array.isArray(farms) ? farms : []).forEach(farm => add(farm.id, 'farm', farm.name, farm));

      const dynamicSources = [
        ['contractor', world.getContractors?.()],
        ['competitor', world.getCompetitors?.()],
        ['company_facility', world.getCompanyFacilities?.()]
      ];
      dynamicSources.forEach(([type, items]) => {
        (Array.isArray(items) ? items : []).forEach(item => add(item.id, type, item.name, item));
      });

      const seen = new Set();
      return options.filter(option => {
        const key = option.type + ':' + option.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).sort((a, b) => a.name.localeCompare(b.name));
    }

    relatedInfo(relationship) {
      const sourceId = this.relationshipValue(relationship, 'sourceEntityId', 'source_entity_id');
      const sourceType = this.relationshipValue(relationship, 'sourceEntityType', 'source_entity_type');
      const targetId = this.relationshipValue(relationship, 'targetEntityId', 'target_entity_id');
      const targetType = this.relationshipValue(relationship, 'targetEntityType', 'target_entity_type');
      const metadata = relationship.metadata || {};
      const isSource = String(sourceId) === String(this.entity.id);
      return {
        id: String(isSource ? targetId : sourceId),
        type: isSource ? targetType : sourceType,
        name: isSource
          ? (relationship.targetEntityName || metadata.targetEntityName || targetId)
          : (relationship.sourceEntityName || metadata.sourceEntityName || sourceId),
        relationshipType: this.relationshipValue(relationship, 'relationshipType', 'relationship_type') || '',
        status: relationship.status || 'active',
        metadata
      };
    }

    openRelatedEntity(info) {
      const option = this.collectEntityOptions().find(item =>
        String(item.id) === String(info.id) && String(item.type) === String(info.type)
      );
      if (!option) return;

      if (option.type === 'farm') {
        global.dispatchEvent(new CustomEvent('agworld:farm-selected', { detail: { farm: option.raw } }));
      } else {
        global.dispatchEvent(new CustomEvent('agworld:dynamic-entity-selected', { detail: { entity: option.raw } }));
      }
    }

    relationshipForm(target, relationships, editing) {
      const options = this.collectEntityOptions();
      const current = editing ? this.relatedInfo(editing) : null;
      const selectedKey = current ? current.type + ':' + current.id : '';
      const relationshipType = editing
        ? this.relationshipValue(editing, 'relationshipType', 'relationship_type')
        : 'works_with';
      const purpose = editing ? (editing.metadata?.purpose || editing.metadata?.note || '') : '';
      const status = editing?.status || 'active';

      target.innerHTML = `
        <div class="agworld-relationship-manager">
          <div class="agworld-relationship-toolbar">
            <strong>${editing ? 'EDIT RELATIONSHIP' : 'CREATE RELATIONSHIP'}</strong>
            <button type="button" data-rm-action="cancel">Cancel</button>
          </div>
          <form class="agworld-relationship-form">
            <label>Connected entity
              <select name="target" required>
                <option value="">Select an entity…</option>
                ${options.map(option => {
                  const key = option.type + ':' + option.id;
                  const label = (global.AGWorldV2.EntityTypes?.[option.type]?.label || option.type) + ' · ' + option.name;
                  return '<option value="' + esc(key) + '" ' + (key === selectedKey ? 'selected' : '') + '>' + esc(label) + '</option>';
                }).join('')}
              </select>
            </label>
            <label>Relationship type
              <select name="relationshipType" required>
                ${[
                  ['works_with','Works with'],
                  ['supported_by','Supported by'],
                  ['supplies','Supplies'],
                  ['serves','Serves'],
                  ['competes_with','Competes with'],
                  ['owned_by','Owned by'],
                  ['manages','Manages'],
                  ['partnered_with','Partnered with'],
                  ['other','Other']
                ].map(([value,label]) => '<option value="' + value + '" ' + (value === relationshipType ? 'selected' : '') + '>' + label + '</option>').join('')}
              </select>
            </label>
            <label>Status
              <select name="status">
                ${['active','inactive','planned'].map(value => '<option value="' + value + '" ' + (value === status ? 'selected' : '') + '>' + value[0].toUpperCase() + value.slice(1) + '</option>').join('')}
              </select>
            </label>
            <label>Purpose / description
              <textarea name="purpose" rows="3" placeholder="Why are these entities connected?">${esc(purpose)}</textarea>
            </label>
            <div class="agworld-relationship-form-actions">
              <button type="submit">${editing ? 'Save changes' : 'Create relationship'}</button>
            </div>
          </form>
        </div>`;

      target.querySelector('[data-rm-action="cancel"]').addEventListener('click', () => this.renderRelationshipManager(target, relationships));
      target.querySelector('form').addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const key = String(new FormData(form).get('target') || '');
        const splitAt = key.indexOf(':');
        const targetType = key.slice(0, splitAt);
        const targetId = key.slice(splitAt + 1);
        const selected = options.find(option => option.type === targetType && option.id === targetId);
        if (!selected) return;

        const sourceName = this.entity.name || this.entity.id;
        const input = {
          sourceEntityId: String(this.entity.id),
          sourceEntityType: this.entity.type || 'farm',
          relationshipType: String(new FormData(form).get('relationshipType') || 'works_with'),
          targetEntityId: selected.id,
          targetEntityType: selected.type,
          status: String(new FormData(form).get('status') || 'active'),
          metadata: {
            ...(editing?.metadata || {}),
            purpose: String(new FormData(form).get('purpose') || '').trim(),
            sourceEntityName: sourceName,
            targetEntityName: selected.name
          }
        };

        const submit = form.querySelector('[type="submit"]');
        submit.disabled = true;
        submit.textContent = editing ? 'Saving…' : 'Creating…';
        try {
          if (editing?.id) await this.relationshipRepository.replace(editing.id, input);
          else await this.relationshipRepository.create(input);
          await this.loadRelationships(target);
        } catch (error) {
          submit.disabled = false;
          submit.textContent = 'Could not save · try again';
        }
      });
    }

    renderRelationshipManager(target, relationships) {
      const rows = Array.isArray(relationships) ? relationships : [];
      target.innerHTML = `
        <div class="agworld-relationship-manager">
          <div class="agworld-relationship-toolbar">
            <strong>ENTITY RELATIONSHIPS</strong>
            <button type="button" data-rm-action="create">+ Add relationship</button>
          </div>
          <div class="agworld-relationship-list">
            ${rows.length ? rows.map((relationship, index) => {
              const info = this.relatedInfo(relationship);
              const purpose = info.metadata?.purpose || info.metadata?.note || '';
              return `
                <article class="agworld-relationship-card" data-rm-index="${index}">
                  <button type="button" class="agworld-relationship-open" data-rm-action="open">${esc(info.name)}</button>
                  <div class="agworld-relationship-meta">${esc(global.AGWorldV2.EntityTypes?.[info.type]?.label || info.type || 'Entity')} · ${esc(info.relationshipType)} · ${esc(info.status)}</div>
                  ${purpose ? '<div class="agworld-relationship-purpose">' + esc(purpose) + '</div>' : ''}
                  <div class="agworld-relationship-actions">
                    <button type="button" data-rm-action="edit">Edit</button>
                    <button type="button" data-rm-action="remove">Remove</button>
                  </div>
                </article>`;
            }).join('') : '<p>No relationships recorded yet. Create the first connection for this entity.</p>'}
          </div>
        </div>`;

      target.querySelector('[data-rm-action="create"]').addEventListener('click', () => this.relationshipForm(target, rows, null));
      target.querySelectorAll('[data-rm-index]').forEach(card => {
        const relationship = rows[Number(card.dataset.rmIndex)];
        card.querySelector('[data-rm-action="open"]').addEventListener('click', () => this.openRelatedEntity(this.relatedInfo(relationship)));
        card.querySelector('[data-rm-action="edit"]').addEventListener('click', () => this.relationshipForm(target, rows, relationship));
        card.querySelector('[data-rm-action="remove"]').addEventListener('click', async () => {
          if (!relationship?.id || !global.confirm('Remove this relationship?')) return;
          const button = card.querySelector('[data-rm-action="remove"]');
          button.disabled = true;
          try {
            await this.relationshipRepository.remove(relationship.id);
            await this.loadRelationships(target);
          } catch (error) {
            button.disabled = false;
            button.textContent = 'Could not remove';
          }
        });
      });
    }

    async loadRelationships(target) {
      if (!this.relationshipRepository) {
        target.innerHTML = '<p>Relationships will be connected to the V2 Relationship Engine next.</p>';
        return;
      }
      try {
        const relationships = await this.relationshipRepository.list(this.entity.id);
        this.renderRelationshipManager(target, relationships);
      } catch (error) {
        target.innerHTML = '<p>Relationships could not be loaded.</p>';
      }
    }
  }

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.EntityDetailPanelV2 = EntityDetailPanelV2;
})(window);
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
        this.renderCollection(target, metadata.activity, 'No activity recorded yet.');
      } else if (this.activeTab === 'documents') {
        this.renderCollection(target, metadata.documents, 'No documents attached yet.');
      } else if (this.activeTab === 'media') {
        this.renderCollection(target, metadata.media, 'No media attached yet.');
      } else if (this.activeTab === 'notes') {
        this.renderCollection(target, metadata.notes, 'No notes added yet.');
      }
    }

    renderCollection(target, collection, emptyMessage) {
      const items = Array.isArray(collection) ? collection : [];
      target.innerHTML = items.length
        ? '<ul>' + items.map(item => '<li>' + esc(typeof item === 'string' ? item : item.name || item.title || JSON.stringify(item)) + '</li>').join('') + '</ul>'
        : '<p>' + esc(emptyMessage) + '</p>';
    }

    async loadRelationships(target) {
      if (!this.relationshipRepository) {
        target.innerHTML = '<p>Relationships will be connected to the V2 Relationship Engine next.</p>';
        return;
      }
      try {
        const relationships = await this.relationshipRepository.list(this.entity.id);
        target.innerHTML = relationships.length
          ? '<ul>' + relationships.map(r => { const relatedId = String(r.sourceEntityId) === String(this.entity.id) ? r.targetEntityId : r.sourceEntityId; const relatedName = String(r.sourceEntityId) === String(this.entity.id) ? (r.targetEntityName || r.metadata?.targetEntityName) : (r.sourceEntityName || r.metadata?.sourceEntityName); return '<li>' + esc(r.relationshipType) + ': ' + esc(relatedName || relatedId) + '</li>'; }).join('') + '</ul>'
          : '<p>No relationships recorded yet.</p>';
      } catch (error) {
        target.innerHTML = '<p>Relationships could not be loaded.</p>';
      }
    }
  }

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.EntityDetailPanelV2 = EntityDetailPanelV2;
})(window);
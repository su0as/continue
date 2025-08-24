import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  SortAsc, 
  SortDesc, 
  Folder, 
  FolderOpen,
  ExternalLink,
  Star,
  Clock,
  Hash,
  X,
  Plus,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface DocItem {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  category?: string;
  tags?: string[];
  dateAdded: Date;
  lastUsed?: Date;
  useCount: number;
  isPinned?: boolean;
}

interface DocCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  expanded: boolean;
  docs: DocItem[];
}

type SortOption = 'name-asc' | 'name-desc' | 'url' | 'date-added' | 'frequency' | 'last-used';
type ViewMode = 'list' | 'compact' | 'grid';

interface DocsPanelProps {
  docs: DocItem[];
  categories?: DocCategory[];
  onDocSelect: (doc: DocItem) => void;
  onDocDelete?: (docId: string) => void;
  onDocEdit?: (doc: DocItem) => void;
  onDocRefresh?: (docId: string) => void;
  onCategoryCreate?: (name: string) => void;
  onDocMove?: (docId: string, categoryId: string) => void;
}

export const DocsPanel: React.FC<DocsPanelProps> = ({
  docs,
  categories = [],
  onDocSelect,
  onDocDelete,
  onDocEdit,
  onDocRefresh,
  onCategoryCreate,
  onDocMove
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [pinnedDocs, setPinnedDocs] = useState<Set<string>>(new Set());
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Load pinned docs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('pinnedDocs');
    if (stored) {
      setPinnedDocs(new Set(JSON.parse(stored)));
    }
  }, []);

  // Save pinned docs to localStorage
  useEffect(() => {
    localStorage.setItem('pinnedDocs', JSON.stringify(Array.from(pinnedDocs)));
  }, [pinnedDocs]);

  // Filter docs based on search query and category
  const filteredDocs = useMemo(() => {
    let filtered = docs;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.url.toLowerCase().includes(query) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    return filtered;
  }, [docs, searchQuery, selectedCategory]);

  // Sort docs
  const sortedDocs = useMemo(() => {
    const sorted = [...filteredDocs];

    switch (sortOption) {
      case 'name-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'url':
        sorted.sort((a, b) => a.url.localeCompare(b.url));
        break;
      case 'date-added':
        sorted.sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
        break;
      case 'frequency':
        sorted.sort((a, b) => b.useCount - a.useCount);
        break;
      case 'last-used':
        sorted.sort((a, b) => {
          if (!a.lastUsed) return 1;
          if (!b.lastUsed) return -1;
          return b.lastUsed.getTime() - a.lastUsed.getTime();
        });
        break;
    }

    // Always put pinned items at the top
    const pinned = sorted.filter(doc => pinnedDocs.has(doc.id));
    const unpinned = sorted.filter(doc => !pinnedDocs.has(doc.id));
    
    return [...pinned, ...unpinned];
  }, [filteredDocs, sortOption, pinnedDocs]);

  // Group docs by category
  const groupedDocs = useMemo(() => {
    const groups = new Map<string, DocItem[]>();
    
    // Add uncategorized group
    groups.set('uncategorized', []);
    
    // Add custom categories
    categories.forEach(cat => {
      groups.set(cat.id, []);
    });
    
    // Group docs
    sortedDocs.forEach(doc => {
      const category = doc.category || 'uncategorized';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(doc);
    });
    
    return groups;
  }, [sortedDocs, categories]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const togglePin = (docId: string) => {
    setPinnedDocs(prev => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() && onCategoryCreate) {
      onCategoryCreate(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  const renderDocItem = (doc: DocItem) => {
    const isPinned = pinnedDocs.has(doc.id);
    const isRecent = doc.lastUsed && 
      (new Date().getTime() - doc.lastUsed.getTime()) < 24 * 60 * 60 * 1000;

    return (
      <div
        key={doc.id}
        className={`group flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer ${
          viewMode === 'compact' ? 'py-1' : ''
        }`}
        onClick={() => onDocSelect(doc)}
      >
        {/* Favicon */}
        {doc.favicon ? (
          <img src={doc.favicon} alt="" className="w-4 h-4" />
        ) : (
          <ExternalLink size={16} className="text-gray-400" />
        )}

        {/* Title and URL */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium truncate ${viewMode === 'compact' ? 'text-sm' : ''}`}>
              {doc.title}
            </span>
            {isPinned && <Star size={14} className="text-yellow-500 fill-current" />}
            {isRecent && <Clock size={14} className="text-green-500" />}
          </div>
          {viewMode === 'list' && (
            <div className="text-xs text-gray-500 truncate">{doc.url}</div>
          )}
        </div>

        {/* Actions */}
        <div className="hidden group-hover:flex items-center gap-1">
          <button
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            onClick={(e) => {
              e.stopPropagation();
              togglePin(doc.id);
            }}
          >
            <Star size={14} className={isPinned ? 'text-yellow-500 fill-current' : 'text-gray-400'} />
          </button>
          {onDocEdit && (
            <button
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onDocEdit(doc);
              }}
            >
              <Edit size={14} className="text-gray-400" />
            </button>
          )}
          {onDocRefresh && (
            <button
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onDocRefresh(doc.id);
              }}
            >
              <RefreshCw size={14} className="text-gray-400" />
            </button>
          )}
          {onDocDelete && (
            <button
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onDocDelete(doc.id);
              }}
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          )}
        </div>

        {/* Use count badge */}
        {doc.useCount > 0 && viewMode === 'list' && (
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {doc.useCount}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-3">Documentation</h2>
        
        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search docs by name, URL, or tags..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              onClick={() => setSearchQuery('')}
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Sort options */}
          <select
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="url">URL</option>
            <option value="date-added">Recently Added</option>
            <option value="frequency">Most Used</option>
            <option value="last-used">Recently Used</option>
          </select>

          {/* View mode toggles */}
          <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded">
            <button
              className={`px-2 py-1 text-xs ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              className={`px-2 py-1 text-xs ${viewMode === 'compact' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
              onClick={() => setViewMode('compact')}
            >
              Compact
            </button>
            <button
              className={`px-2 py-1 text-xs ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Categories sidebar */}
      {categories.length > 0 && (
        <div className="flex">
          <div className="w-48 border-r border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</h3>
              <button
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                onClick={() => setShowAddCategory(true)}
              >
                <Plus size={14} />
              </button>
            </div>
            
            {showAddCategory && (
              <div className="mb-2">
                <input
                  type="text"
                  placeholder="Category name"
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  onBlur={handleAddCategory}
                  autoFocus
                />
              </div>
            )}

            <div className="space-y-1">
              <button
                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  selectedCategory === null ? 'bg-blue-50 dark:bg-blue-900' : ''
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                All Docs
              </button>
              
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    selectedCategory === cat.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                  }`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <div className="flex items-center gap-2">
                    <Folder size={14} className={cat.color || 'text-gray-400'} />
                    <span className="flex-1 truncate">{cat.name}</span>
                    <span className="text-xs text-gray-400">
                      {groupedDocs.get(cat.id)?.length || 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Docs list */}
          <div className="flex-1 overflow-y-auto p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-3">
                {sortedDocs.map(doc => (
                  <div
                    key={doc.id}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md cursor-pointer"
                    onClick={() => onDocSelect(doc)}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {doc.favicon ? (
                        <img src={doc.favicon} alt="" className="w-5 h-5 mt-1" />
                      ) : (
                        <ExternalLink size={20} className="text-gray-400 mt-1" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-sm truncate">{doc.title}</div>
                        <div className="text-xs text-gray-500 truncate">{new URL(doc.url).hostname}</div>
                      </div>
                    </div>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {sortedDocs.map(renderDocItem)}
              </div>
            )}
            
            {sortedDocs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <ExternalLink size={48} className="mb-3 text-gray-300" />
                <p>No documentation found</p>
                {searchQuery && (
                  <p className="text-sm mt-2">Try adjusting your search query</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

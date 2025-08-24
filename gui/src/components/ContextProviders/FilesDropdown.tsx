import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, File, Folder, Search, Check, Clock, Star } from 'lucide-react';

interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface FilesDropdownProps {
  onSelect: (files: string[]) => void;
  position: { x: number; y: number };
  onClose: () => void;
  allowMultiple?: boolean;
  currentPath?: string;
}

export const FilesDropdown: React.FC<FilesDropdownProps> = ({
  onSelect,
  position,
  onClose,
  allowMultiple = true,
  currentPath = ''
}) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [pinnedFiles, setPinnedFiles] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent and pinned files
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentFiles') || '[]');
    const pinned = JSON.parse(localStorage.getItem('pinnedFiles') || '[]');
    setRecentFiles(recent.slice(0, 5));
    setPinnedFiles(pinned);
  }, []);

  // Fetch file tree
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await window.ide.listWorkspaceContents(currentPath || '.');
        setFileTree(buildFileTree(response));
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    };

    fetchFiles();
  }, [currentPath]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const buildFileTree = (files: string[]): FileNode[] => {
    const root: { [key: string]: FileNode } = {};
    
    files.forEach(filePath => {
      const parts = filePath.split('/');
      let current = root;
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            path: parts.slice(0, index + 1).join('/'),
            name: part,
            type: index === parts.length - 1 ? 'file' : 'folder',
            children: index === parts.length - 1 ? undefined : {}
          };
        }
        
        if (index < parts.length - 1) {
          if (!current[part].children) {
            current[part].children = {};
          }
          current = current[part].children as any;
        }
      });
    });

    return Object.values(root);
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const toggleFileSelection = (path: string) => {
    if (!allowMultiple) {
      onSelect([path]);
      // Save to recent files
      const recent = [path, ...recentFiles.filter(f => f !== path)].slice(0, 10);
      localStorage.setItem('recentFiles', JSON.stringify(recent));
      onClose();
    } else {
      setSelectedFiles(prev => {
        const next = new Set(prev);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
        return next;
      });
    }
  };

  const handleConfirm = () => {
    const files = Array.from(selectedFiles);
    if (files.length > 0) {
      onSelect(files);
      // Save to recent files
      const recent = [...files, ...recentFiles.filter(f => !files.includes(f))].slice(0, 10);
      localStorage.setItem('recentFiles', JSON.stringify(recent));
      onClose();
    }
  };

  const filterNodes = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;
    
    return nodes.reduce((acc: FileNode[], node) => {
      const matches = node.name.toLowerCase().includes(query.toLowerCase());
      
      if (node.type === 'folder' && node.children) {
        const filteredChildren = filterNodes(node.children, query);
        if (filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren,
            expanded: true
          });
        }
      } else if (matches) {
        acc.push(node);
      }
      
      return acc;
    }, []);
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFiles.has(node.path);
    const isPinned = pinnedFiles.includes(node.path);
    
    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path);
            } else {
              toggleFileSelection(node.path);
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Folder size={14} className="text-yellow-600" />
            </>
          ) : (
            <>
              <div className="w-3.5" />
              <File size={14} className="text-gray-600" />
            </>
          )}
          <span className="flex-1 truncate">{node.name}</span>
          <div className="flex items-center gap-1">
            {isPinned && <Star size={12} className="text-yellow-500 fill-current" />}
            {isSelected && <Check size={14} className="text-blue-600" />}
          </div>
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredTree = filterNodes(fileTree, searchQuery);

  return (
    <div
      ref={dropdownRef}
      className="fixed bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-96 max-h-[500px] flex flex-col z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        maxHeight: `${window.innerHeight - position.y - 20}px`
      }}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Select Files</h3>
          {allowMultiple && (
            <span className="text-xs text-gray-500">
              {selectedFiles.size} selected
            </span>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search files..."
            className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {/* Quick access */}
      {!searchQuery && (pinnedFiles.length > 0 || recentFiles.length > 0) && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          {pinnedFiles.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Pinned</div>
              <div className="space-y-0.5">
                {pinnedFiles.map(file => (
                  <div
                    key={file}
                    className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded text-sm ${
                      selectedFiles.has(file) ? 'bg-blue-50 dark:bg-blue-900' : ''
                    }`}
                    onClick={() => toggleFileSelection(file)}
                  >
                    <Star size={12} className="text-yellow-500 fill-current" />
                    <File size={12} className="text-gray-600" />
                    <span className="flex-1 truncate">{file.split('/').pop()}</span>
                    {selectedFiles.has(file) && <Check size={12} className="text-blue-600" />}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {recentFiles.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Recent</div>
              <div className="space-y-0.5">
                {recentFiles.map(file => (
                  <div
                    key={file}
                    className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded text-sm ${
                      selectedFiles.has(file) ? 'bg-blue-50 dark:bg-blue-900' : ''
                    }`}
                    onClick={() => toggleFileSelection(file)}
                  >
                    <Clock size={12} className="text-gray-400" />
                    <File size={12} className="text-gray-600" />
                    <span className="flex-1 truncate">{file.split('/').pop()}</span>
                    {selectedFiles.has(file) && <Check size={12} className="text-blue-600" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredTree.length > 0 ? (
          <div className="space-y-0.5">
            {filteredTree.map(node => renderNode(node))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 text-gray-500 text-sm">
            {searchQuery ? 'No files found' : 'Loading...'}
          </div>
        )}
      </div>

      {/* Footer */}
      {allowMultiple && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={selectedFiles.size === 0}
            onClick={handleConfirm}
          >
            Add Files
          </button>
        </div>
      )}
    </div>
  );
};
